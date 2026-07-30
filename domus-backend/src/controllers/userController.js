const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { sendMail } = require('../services/mailService');

/**
 * Listar corretores da empresa
 */
exports.getBrokers = async (req, res) => {
    try {

        const result = await pool.query(
            `
            SELECT
                id,
                name,
                email,
                role,
                company_id,
                created_at
            FROM users
            WHERE company_id = $1
            ORDER BY created_at DESC
            `,
            [req.user.company_id]
        );

        return res.json(result.rows);

    } catch (err) {

        console.error('Erro ao buscar corretores:', err);

        return res.status(500).json({
            error: 'Erro ao buscar corretores.'
        });

    }
};

/**
 * Criar corretor
 */
exports.createBroker = async (req, res) => {

    const { name, email, password } = req.body;

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Apenas administradores podem criar corretores.'
        });
    }

    if (!name || !email || !password) {
        return res.status(400).json({
            error: 'Preencha todos os campos.'
        });
    }

    try {

        const userExists = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({
                error: 'Email já cadastrado.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `
            INSERT INTO users
            (
                name,
                email,
                password,
                role,
                company_id
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5
            )
            RETURNING
                id,
                name,
                email,
                role,
                company_id
            `,
            [
                name,
                email,
                hashedPassword,
                'user',
                req.user.company_id
            ]
        );

   const appUrl = process.env.APP_URL || 'http://localhost:5173';

        await sendMail({
            to: email,
            subject: 'Bem-vindo ao Domus',
            html: `
                <p>Ola, ${name}.</p>
                <p>Voce foi cadastrado como corretor no Domus CRM.</p>
                <p>Acesse com os dados abaixo:</p>
                <p><strong>E-mail:</strong> ${email}<br/>
                <strong>Senha:</strong> ${password}</p>
                <p><a href="${appUrl}/login">Clique aqui para acessar o Domus</a></p>
                <p>Recomendamos alterar sua senha apos o primeiro acesso.</p>
            `
        });

        return res.status(201).json({
            message: 'Corretor criado com sucesso.',
            user: result.rows[0]
        });

    } catch (err) {

        console.error('Erro ao criar corretor:', err);

        return res.status(500).json({
            error: 'Erro ao criar corretor.'
        });

    }

};

/**
 * Excluir corretor
 */
exports.deleteBroker = async (req, res) => {

    const { id } = req.params;

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Apenas administradores podem excluir corretores.'
        });
    }

    if (Number(id) === req.user.id) {
        return res.status(400).json({
            error: 'Você não pode excluir seu próprio usuário.'
        });
    }

    try {

        const broker = await pool.query(
            `
            SELECT
                id,
                role
            FROM users
            WHERE id = $1
            AND company_id = $2
            `,
            [
                id,
                req.user.company_id
            ]
        );

        if (broker.rows.length === 0) {
            return res.status(404).json({
                error: 'Corretor não encontrado.'
            });
        }

        if (broker.rows[0].role === 'admin') {
            return res.status(403).json({
                error: 'Administradores não podem ser excluídos.'
            });
        }

        await pool.query(
            `
            DELETE FROM users
            WHERE id = $1
            AND company_id = $2
            `,
            [
                id,
                req.user.company_id
            ]
        );

        return res.json({
            message: 'Corretor excluído com sucesso.'
        });

    } catch (err) {

        console.error('Erro ao excluir corretor:', err);

        return res.status(500).json({
            error: 'Erro ao excluir corretor.'
        });

    }

};

/**
 * Editar corretor
 */
exports.updateBroker = async (req, res) => {

    const { id } = req.params;
    const { name, email, password } = req.body;

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Apenas administradores podem editar corretores.'
        });
    }

    if (!name || !email) {
        return res.status(400).json({
            error: 'Nome e e-mail são obrigatórios.'
        });
    }

    try {

        // Verifica se o corretor existe
        const broker = await pool.query(
            `
            SELECT
                id,
                role
            FROM users
            WHERE id = $1
            AND company_id = $2
            `,
            [
                id,
                req.user.company_id
            ]
        );

        if (broker.rows.length === 0) {
            return res.status(404).json({
                error: 'Corretor não encontrado.'
            });
        }

        // Nunca editar administradores
        if (broker.rows[0].role === 'admin') {
            return res.status(403).json({
                error: 'Administradores não podem ser editados.'
            });
        }

        // Verifica e-mail duplicado
        const emailExists = await pool.query(
            `
            SELECT id
            FROM users
            WHERE email = $1
            AND id <> $2
            `,
            [
                email,
                id
            ]
        );

        if (emailExists.rows.length > 0) {
            return res.status(400).json({
                error: 'Este e-mail já está sendo utilizado.'
            });
        }

        if (password && password.trim() !== '') {

            const hashedPassword = await bcrypt.hash(password, 10);

            await pool.query(
                `
                UPDATE users
                SET
                    name = $1,
                    email = $2,
                    password = $3
                WHERE id = $4
                AND company_id = $5
                `,
                [
                    name,
                    email,
                    hashedPassword,
                    id,
                    req.user.company_id
                ]
            );

        } else {

            await pool.query(
                `
                UPDATE users
                SET
                    name = $1,
                    email = $2
                WHERE id = $3
                AND company_id = $4
                `,
                [
                    name,
                    email,
                    id,
                    req.user.company_id
                ]
            );

        }

        return res.json({
            message: 'Corretor atualizado com sucesso.'
        });

    } catch (err) {

        console.error('Erro ao atualizar corretor:', err);

        return res.status(500).json({
            error: 'Erro ao atualizar corretor.'
        });

    }

};

/**
 * Ver meus dados (usuario logado)
 */
exports.getMe = async (req, res) => {
    try {
        const userResult = await pool.query(
            `SELECT id, name, email, role, company_id FROM users WHERE id = $1`,
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario nao encontrado.' });
        }

        const user = userResult.rows[0];

        const companyResult = await pool.query(
            `SELECT id, name FROM companies WHERE id = $1`,
            [user.company_id]
        );

        return res.json({
            user,
            company: companyResult.rows[0] || null
        });

    } catch (err) {
        console.error('Erro ao buscar perfil:', err);
        return res.status(500).json({ error: 'Erro ao buscar perfil.' });
    }
};

/**
 * Atualizar meus dados (nome e, opcionalmente, senha)
 */
exports.updateMe = async (req, res) => {
    const { name, current_password, new_password } = req.body;

    try {
        if (new_password) {
            if (!current_password) {
                return res.status(400).json({ error: 'Informe a senha atual para definir uma nova senha.' });
            }

            const userResult = await pool.query(
                `SELECT password FROM users WHERE id = $1`,
                [req.user.id]
            );

            const validPassword = await bcrypt.compare(current_password, userResult.rows[0].password);

            if (!validPassword) {
                return res.status(400).json({ error: 'Senha atual incorreta.' });
            }

            if (new_password.length < 6) {
                return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
            }

            const hashedPassword = await bcrypt.hash(new_password, 10);

            await pool.query(
                `UPDATE users SET password = $1 WHERE id = $2`,
                [hashedPassword, req.user.id]
            );
        }

        if (name) {
            await pool.query(
                `UPDATE users SET name = $1 WHERE id = $2`,
                [name, req.user.id]
            );
        }

        return res.json({ message: 'Perfil atualizado com sucesso.' });

    } catch (err) {
        console.error('Erro ao atualizar perfil:', err);
        return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
    }
};

/**
 * Atualizar nome da imobiliaria (somente admin)
 */
exports.updateCompany = async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Informe o nome da imobiliaria.' });
    }

    try {
        await pool.query(
            `UPDATE companies SET name = $1 WHERE id = $2`,
            [name, req.user.company_id]
        );

        return res.json({ message: 'Imobiliaria atualizada com sucesso.' });

    } catch (err) {
        console.error('Erro ao atualizar imobiliaria:', err);
        return res.status(500).json({ error: 'Erro ao atualizar imobiliaria.' });
    }
};