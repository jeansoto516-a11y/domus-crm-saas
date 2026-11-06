const pool = require('../config/db');
const supabase = require('../config/supabase');

const BUCKET = 'properties';
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTOS = 8;
const SALE_STATUS = ['venda', 'aluguel', 'reservado', 'vendido'];
const PROJECT_TYPES = ['predio', 'apartamento', 'outro'];

const PROJECT_SELECT = `
    SELECT
        p.*,
        COALESCE(
            (
                SELECT json_agg(json_build_object('id', ph.id, 'url', ph.url) ORDER BY ph.position ASC, ph.id ASC)
                FROM project_3d_photos ph
                WHERE ph.project_id = p.id
            ),
            '[]'
        ) AS photos
    FROM projects_3d p
`;

const toNumber = (value) => (
    value === undefined || value === null || value === '' ? null : Number(value)
);

const toInt = (value) => {
    const number = toNumber(value);
    return number === null ? null : Math.round(number);
};

const pathFromUrl = (url) => (url ? url.split(`/${BUCKET}/`)[1] : null);

function readFields(body) {
    return {
        title: body.title,
        description: body.description || null,
        project_type: PROJECT_TYPES.includes(body.project_type) ? body.project_type : 'predio',
        sale_status: SALE_STATUS.includes(body.sale_status) ? body.sale_status : 'venda',
        address: body.address || null,
        price: toNumber(body.price),
        condo_fee: toNumber(body.condo_fee),
        iptu: toNumber(body.iptu),
        bedrooms: toInt(body.bedrooms),
        bathrooms: toInt(body.bathrooms),
        parking_spots: toInt(body.parking_spots),
        area: toNumber(body.area),
        highlights: body.highlights || null
    };
}

async function uploadImage(file, prefix) {
    if (!file || !IMAGE_TYPES.includes(file.mimetype)) return null;

    const ext = file.mimetype.split('/')[1];
    const path = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000000)}.${ext}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });

    if (error) {
        console.error('Erro ao enviar imagem:', error);
        return null;
    }

    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function savePhotos(projectId, files, startPosition) {
    for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i], `project3d-photo-${projectId}`);

        if (url) {
            await pool.query(
                `INSERT INTO project_3d_photos (project_id, url, position) VALUES ($1, $2, $3)`,
                [projectId, url, startPosition + i]
            );
        }
    }
}

exports.getProjects = async (req, res) => {
    try {
        const result = await pool.query(
            `${PROJECT_SELECT} WHERE p.company_id = $1 ORDER BY p.created_at DESC`,
            [req.user.company_id]
        );

        return res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar projetos 3D:', err);
        return res.status(500).json({ error: 'Erro ao buscar projetos 3D.' });
    }
};

exports.createProject = async (req, res) => {
    const fields = readFields(req.body);
    const modelFile = req.files?.model?.[0];
    const photoFiles = req.files?.photos || [];

    if (!fields.title || !modelFile) {
        return res.status(400).json({ error: 'Informe o titulo e o arquivo .glb.' });
    }

    const looksLikeGlb =
        modelFile.originalname.toLowerCase().endsWith('.glb') &&
        modelFile.buffer.slice(0, 4).toString('ascii') === 'glTF';

    if (!looksLikeGlb) {
        return res.status(400).json({ error: 'Envie um arquivo .glb valido.' });
    }

    if (photoFiles.length > MAX_PHOTOS) {
        return res.status(400).json({ error: `Envie no maximo ${MAX_PHOTOS} fotos.` });
    }

    try {
        const companyId = req.user.company_id;
        const modelPath = `project3d-${companyId}-${Date.now()}.glb`;

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
        const coverUrl = await uploadImage(req.files?.cover?.[0], `project3d-cover-${companyId}`);
        const floorPlanUrl = await uploadImage(req.files?.floor_plan?.[0], `project3d-plan-${companyId}`);

        const result = await pool.query(
            `
            INSERT INTO projects_3d
            (company_id, created_by, title, description, project_type, sale_status, address,
             price, condo_fee, iptu, bedrooms, bathrooms, parking_spots, area, highlights,
             model_url, cover_url, floor_plan_url)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
            RETURNING id
            `,
            [
                companyId, req.user.id, fields.title, fields.description, fields.project_type,
                fields.sale_status, fields.address, fields.price, fields.condo_fee, fields.iptu,
                fields.bedrooms, fields.bathrooms, fields.parking_spots, fields.area,
                fields.highlights, modelUrl, coverUrl, floorPlanUrl
            ]
        );

        const projectId = result.rows[0].id;

        await savePhotos(projectId, photoFiles, 0);

        const created = await pool.query(`${PROJECT_SELECT} WHERE p.id = $1`, [projectId]);

        return res.status(201).json(created.rows[0]);
    } catch (err) {
        console.error('Erro ao criar projeto 3D:', err);
        return res.status(500).json({ error: 'Erro ao criar projeto 3D.' });
    }
};

exports.updateProject = async (req, res) => {
    const { id } = req.params;
    const fields = readFields(req.body);
    const photoFiles = req.files?.photos || [];

    if (!fields.title) {
        return res.status(400).json({ error: 'Informe o titulo.' });
    }

    try {
        const existing = await pool.query(
            `SELECT id FROM projects_3d WHERE id = $1 AND company_id = $2`,
            [id, req.user.company_id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Projeto nao encontrado.' });
        }

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM project_3d_photos WHERE project_id = $1`,
            [id]
        );

        const currentCount = Number(countResult.rows[0].count);

        if (currentCount + photoFiles.length > MAX_PHOTOS) {
            return res.status(400).json({
                error: `Este projeto ja tem ${currentCount} foto(s). Voce pode adicionar no maximo ${MAX_PHOTOS - currentCount}.`
            });
        }

        const companyId = req.user.company_id;
        const coverUrl = await uploadImage(req.files?.cover?.[0], `project3d-cover-${companyId}`);
        const floorPlanUrl = await uploadImage(req.files?.floor_plan?.[0], `project3d-plan-${companyId}`);

        await pool.query(
            `
            UPDATE projects_3d SET
                title = $1, description = $2, project_type = $3, sale_status = $4, address = $5,
                price = $6, condo_fee = $7, iptu = $8, bedrooms = $9, bathrooms = $10,
                parking_spots = $11, area = $12, highlights = $13,
                cover_url = COALESCE($14, cover_url),
                floor_plan_url = COALESCE($15, floor_plan_url)
            WHERE id = $16 AND company_id = $17
            `,
            [
                fields.title, fields.description, fields.project_type, fields.sale_status,
                fields.address, fields.price, fields.condo_fee, fields.iptu, fields.bedrooms,
                fields.bathrooms, fields.parking_spots, fields.area, fields.highlights,
                coverUrl, floorPlanUrl, id, companyId
            ]
        );

        await savePhotos(id, photoFiles, currentCount);

        const updated = await pool.query(`${PROJECT_SELECT} WHERE p.id = $1`, [id]);

        return res.json(updated.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar projeto 3D:', err);
        return res.status(500).json({ error: 'Erro ao atualizar projeto 3D.' });
    }
};

exports.deleteProjectPhoto = async (req, res) => {
    const { id, photoId } = req.params;

    try {
        const project = await pool.query(
            `SELECT id FROM projects_3d WHERE id = $1 AND company_id = $2`,
            [id, req.user.company_id]
        );

        if (project.rows.length === 0) {
            return res.status(404).json({ error: 'Projeto nao encontrado.' });
        }

        const photo = await pool.query(
            `SELECT url FROM project_3d_photos WHERE id = $1 AND project_id = $2`,
            [photoId, id]
        );

        if (photo.rows.length === 0) {
            return res.status(404).json({ error: 'Foto nao encontrada.' });
        }

        const path = pathFromUrl(photo.rows[0].url);

        if (path) {
            await supabase.storage.from(BUCKET).remove([path]);
        }

        await pool.query(`DELETE FROM project_3d_photos WHERE id = $1`, [photoId]);

        return res.json({ message: 'Foto excluida com sucesso.' });
    } catch (err) {
        console.error('Erro ao excluir foto do projeto 3D:', err);
        return res.status(500).json({ error: 'Erro ao excluir foto.' });
    }
};

exports.deleteProject = async (req, res) => {
    const { id } = req.params;

    try {
        const existing = await pool.query(
            `SELECT model_url, cover_url, floor_plan_url FROM projects_3d WHERE id = $1 AND company_id = $2`,
            [id, req.user.company_id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Projeto nao encontrado.' });
        }

        const photos = await pool.query(
            `SELECT url FROM project_3d_photos WHERE project_id = $1`,
            [id]
        );

        const row = existing.rows[0];

        const paths = [row.model_url, row.cover_url, row.floor_plan_url, ...photos.rows.map((p) => p.url)]
            .map(pathFromUrl)
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