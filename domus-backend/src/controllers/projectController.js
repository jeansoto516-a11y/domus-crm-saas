const pool = require('../config/db');
const supabase = require('../config/supabase');

const BUCKET = 'properties';

exports.getProjects = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT id, title, description, project_type, model_url, cover_url, created_at
            FROM projects_3d
            WHERE company_id = $1
            ORDER BY created_at DESC
            `,
            [req.user.company_id]
        );

        return res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar projetos 3D:', err);
        return res.status(500).json({ error: 'Erro ao buscar projetos 3D.' });
    }
};

exports.createProject = async (req, res) => {
    const { title, description, project_type } = req.body;
    const modelFile = req.files?.model?.[0];
    const coverFile = req.files?.cover?.[0];

    if (!title || !modelFile) {
        return res.status(400).json({ error: 'Informe o titulo e o arquivo .glb.' });
    }

    const looksLikeGlb =
        modelFile.originalname.toLowerCase().endsWith('.glb') &&
        modelFile.buffer.slice(0, 4).toString('ascii') === 'glTF';

    if (!looksLikeGlb) {
        return res.status(400).json({ error: 'Envie um arquivo .glb valido.' });
    }

    const allowedCover = ['image/jpeg', 'image/png', 'image/webp'];

    if (coverFile && !allowedCover.includes(coverFile.mimetype)) {
        return res.status(400).json({ error: 'A capa deve ser JPG, PNG ou WEBP.' });
    }

    const typeToSave = ['predio', 'apartamento', 'outro'].includes(project_type) ? project_type : 'predio';

    try {
        const stamp = Date.now();
        const modelPath = `project3d-${req.user.company_id}-${stamp}.glb`;

        const { error: modelError } = await supabase.storage
            .from(BUCKET)
            .upload(modelPath, modelFile.buffer, {
                contentType: 'model/gltf-binary',
                upsert: true
            });

        if (modelError) {
            console.error('Erro ao enviar modelo 3D:', modelError);
            return res.status(500).json({ error: 'Erro ao enviar o modelo 3D.' });
        }

        const modelUrl = supabase.storage.from(BUCKET).getPublicUrl(modelPath).data.publicUrl;

        let coverUrl = null;

        if (coverFile) {
            const coverExt = coverFile.mimetype.split('/')[1];
            const coverPath = `project3d-cover-${req.user.company_id}-${stamp}.${coverExt}`;

            const { error: coverError } = await supabase.storage
                .from(BUCKET)
                .upload(coverPath, coverFile.buffer, {
                    contentType: coverFile.mimetype,
                    upsert: true
                });

            if (!coverError) {
                coverUrl = supabase.storage.from(BUCKET).getPublicUrl(coverPath).data.publicUrl;
            }
        }

        const result = await pool.query(
            `
            INSERT INTO projects_3d (company_id, created_by, title, description, project_type, model_url, cover_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            `,
            [req.user.company_id, req.user.id, title, description || null, typeToSave, modelUrl, coverUrl]
        );

        return res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao criar projeto 3D:', err);
        return res.status(500).json({ error: 'Erro ao criar projeto 3D.' });
    }
};

exports.deleteProject = async (req, res) => {
    const { id } = req.params;

    try {
        const existing = await pool.query(
            `SELECT model_url, cover_url FROM projects_3d WHERE id = $1 AND company_id = $2`,
            [id, req.user.company_id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Projeto nao encontrado.' });
        }

        const paths = [existing.rows[0].model_url, existing.rows[0].cover_url]
            .filter(Boolean)
            .map((url) => url.split(`/${BUCKET}/`)[1])
            .filter(Boolean);

        if (paths.length > 0) {
            await supabase.storage.from(BUCKET).remove(paths);
        }

        await pool.query(`DELETE FROM projects_3d WHERE id = $1`, [id]);

        return res.json({ message: 'Projeto excluido com sucesso.' });
    } catch (err) {
        console.error('Erro ao excluir projeto 3D:', err);
        return res.status(500).json({ error: 'Erro ao excluir projeto 3D.' });
    }
};