const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const supabase = require('../config/supabase');
const { ALLOWED_TYPES } = require('../middlewares/messageUpload');

const BUCKET = 'properties';

const ATTACHMENTS_SELECT = `
    COALESCE(
        (
            SELECT json_agg(
                json_build_object('id', a.id, 'url', a.url, 'name', a.file_name, 'type', a.mime_type, 'size', a.file_size)
                ORDER BY a.id ASC
            )
            FROM message_attachments a
            WHERE a.message_id = messages.id
        ),
        '[]'
    ) AS attachments
`;

// O navegador envia o nome do arquivo em latin1; isso devolve os acentos
function fixFileName(name) {
    const fixed = Buffer.from(name, 'latin1').toString('utf8');
    return fixed.includes('\uFFFD') ? name : fixed;
}

function hasValidSignature(ext, header) {
    const hex = header.toString('hex');

    if (ext === '.jpg' || ext === '.jpeg') return hex.startsWith('ffd8ff');
    if (ext === '.png') return hex.startsWith('89504e47');
    if (ext === '.webp') {
        return header.slice(0, 4).toString('ascii') === 'RIFF' && header.slice(8, 12).toString('ascii') === 'WEBP';
    }
    if (ext === '.pdf') return header.slice(0, 4).toString('ascii') === '%PDF';
    if (ext === '.docx' || ext === '.xlsx') return hex.startsWith('504b');
    if (ext === '.doc' || ext === '.xls') return hex.startsWith('d0cf11e0');

    return true;
}

async function removeTempFiles(files) {
    await Promise.all(
        (files || []).map((file) => fs.promises.unlink(file.path).catch(() => {}))
    );
}

function httpError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

/**
 * Envia os arquivos ao armazenamento e grava a mensagem com os anexos
 */
async function createMessageWithFiles({ companyId, senderRole, userId, content, files }) {
    const uploaded = [];

    try {
        for (const file of files) {
            const ext = path.extname(file.originalname).toLowerCase();
            const contentType = ALLOWED_TYPES[ext];
            const displayName = fixFileName(file.originalname);

            const header = Buffer.alloc(12);
            const handle = await fs.promises.open(file.path, 'r');

            try {
                await handle.read(header, 0, 12, 0);
            } finally {
                await handle.close();
            }

            if (!hasValidSignature(ext, header)) {
                throw httpError(400, `O arquivo "${displayName}" nao parece ser um ${ext.slice(1).toUpperCase()} valido.`);
            }

            const storagePath = `message-${companyId}-${Date.now()}-${Math.floor(Math.random() * 1000000)}${ext}`;
            const buffer = await fs.promises.readFile(file.path);

            const { error: uploadError } = await supabase.storage
                .from(BUCKET)
                .upload(storagePath, buffer, { contentType, upsert: true });

            if (uploadError) {
                console.error('Erro ao enviar anexo:', uploadError);
                throw httpError(
                    400,
                    `Nao foi possivel enviar "${displayName}". O armazenamento recusou o arquivo (confira o limite de tamanho do plano).`
                );
            }

            const url = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;

            uploaded.push({
                storagePath,
                url,
                name: displayName,
                type: contentType,
                size: file.size
            });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const messageResult = await client.query(
                `INSERT INTO messages (company_id, sender_role, sender_user_id, content) VALUES ($1, $2, $3, $4) RETURNING *`,
                [companyId, senderRole, userId, content]
            );

            const message = messageResult.rows[0];

            for (const item of uploaded) {
                await client.query(
                    `INSERT INTO message_attachments (message_id, url, file_name, mime_type, file_size) VALUES ($1, $2, $3, $4, $5)`,
                    [message.id, item.url, item.name, item.type, item.size]
                );
            }

            await client.query('COMMIT');

            return {
                ...message,
                attachments: uploaded.map((item) => ({
                    url: item.url,
                    name: item.name,
                    type: item.type,
                    size: item.size
                }))
            };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        if (uploaded.length > 0) {
            await supabase.storage
                .from(BUCKET)
                .remove(uploaded.map((item) => item.storagePath))
                .catch(() => {});
        }

        throw err;
    }
}

/**
 * Lado da imobiliaria: listar mensagens da propria empresa
 */
exports.getMyMessages = async (req, res) => {
    try {
        await pool.query(
            `UPDATE messages SET read_at = NOW() WHERE company_id = $1 AND sender_role = 'admin' AND read_at IS NULL`,
            [req.user.company_id]
        );

        const result = await pool.query(
            `
            SELECT
                messages.id,
                messages.sender_role,
                messages.content,
                messages.created_at,
                users.name AS autor,
                ${ATTACHMENTS_SELECT}
            FROM messages
            LEFT JOIN users ON users.id = messages.sender_user_id
            WHERE messages.company_id = $1
            ORDER BY messages.created_at ASC
            `,
            [req.user.company_id]
        );

        return res.json(result.rows);

    } catch (err) {
        console.error('Erro ao buscar mensagens:', err);
        return res.status(500).json({ error: 'Erro ao buscar mensagens.' });
    }
};

/**
 * Lado da imobiliaria: enviar mensagem para o Domus (com ou sem anexos)
 */
exports.sendMyMessage = async (req, res) => {
    const content = (req.body.content || '').trim();
    const files = req.files || [];

    if (!content && files.length === 0) {
        await removeTempFiles(files);
        return res.status(400).json({ error: 'Escreva uma mensagem ou anexe um arquivo.' });
    }

    try {
        const message = await createMessageWithFiles({
            companyId: req.user.company_id,
            senderRole: 'company',
            userId: req.user.id,
            content,
            files
        });

        return res.status(201).json(message);

    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({ error: err.message });
        }

        console.error('Erro ao enviar mensagem:', err);
        return res.status(500).json({ error: 'Erro ao enviar mensagem.' });
    } finally {
        await removeTempFiles(files);
    }
};

/**
 * Lado do super admin: listar mensagens de uma imobiliaria especifica
 */
exports.getCompanyMessages = async (req, res) => {
    const { companyId } = req.params;

    try {
        await pool.query(
            `UPDATE messages SET read_at = NOW() WHERE company_id = $1 AND sender_role = 'company' AND read_at IS NULL`,
            [companyId]
        );

        const result = await pool.query(
            `
            SELECT
                messages.id,
                messages.sender_role,
                messages.content,
                messages.created_at,
                users.name AS autor,
                ${ATTACHMENTS_SELECT}
            FROM messages
            LEFT JOIN users ON users.id = messages.sender_user_id
            WHERE messages.company_id = $1
            ORDER BY messages.created_at ASC
            `,
            [companyId]
        );

        return res.json(result.rows);

    } catch (err) {
        console.error('Erro ao buscar mensagens:', err);
        return res.status(500).json({ error: 'Erro ao buscar mensagens.' });
    }
};

/**
 * Lado do super admin: enviar mensagem para uma imobiliaria especifica (com ou sem anexos)
 */
exports.sendCompanyMessage = async (req, res) => {
    const { companyId } = req.params;
    const content = (req.body.content || '').trim();
    const files = req.files || [];

    if (!content && files.length === 0) {
        await removeTempFiles(files);
        return res.status(400).json({ error: 'Escreva uma mensagem ou anexe um arquivo.' });
    }

    try {
        const message = await createMessageWithFiles({
            companyId,
            senderRole: 'admin',
            userId: req.user.id,
            content,
            files
        });

        return res.status(201).json(message);

    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({ error: err.message });
        }

        console.error('Erro ao enviar mensagem:', err);
        return res.status(500).json({ error: 'Erro ao enviar mensagem.' });
    } finally {
        await removeTempFiles(files);
    }
};

/**
 * Lado da imobiliaria: contar mensagens nao lidas do Domus
 */
exports.getMyUnreadCount = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT COUNT(*) AS total FROM messages WHERE company_id = $1 AND sender_role = 'admin' AND read_at IS NULL`,
            [req.user.company_id]
        );

        return res.json({ unread: Number(result.rows[0].total) });

    } catch (err) {
        console.error('Erro ao contar mensagens:', err);
        return res.status(500).json({ error: 'Erro ao contar mensagens.' });
    }
};

/**
 * Lado do super admin: contar mensagens nao lidas por imobiliaria
 */
exports.getUnreadCountsBySuperAdmin = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT company_id, COUNT(*) AS total
            FROM messages
            WHERE sender_role = 'company' AND read_at IS NULL
            GROUP BY company_id
            `
        );

        const counts = {};
        result.rows.forEach((row) => {
            counts[row.company_id] = Number(row.total);
        });

        return res.json(counts);

    } catch (err) {
        console.error('Erro ao contar mensagens:', err);
        return res.status(500).json({ error: 'Erro ao contar mensagens.' });
    }
};