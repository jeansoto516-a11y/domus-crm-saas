const pool = require('../config/db');
const supabase = require('../config/supabase');

/**
 * Listar imoveis da empresa
 */
exports.getProperties = async (req, res) => {

    const values = [req.user.company_id];
    let where = `WHERE properties.company_id = $1`;

    if (req.query.lead_type) {
        where += ` AND (properties.lead_type = $${values.length + 1} OR properties.lead_type = 'ambos')`;
        values.push(req.query.lead_type);
    }

    if (req.query.status) {
        where += ` AND properties.status = $${values.length + 1}`;
        values.push(req.query.status);
    }

    try {

        const result = await pool.query(
            `
            SELECT
                properties.*,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object('id', pp.id, 'url', pp.url) ORDER BY pp.position ASC)
                        FROM property_photos pp
                        WHERE pp.property_id = properties.id
                    ),
                    '[]'
                ) AS photos
            FROM properties
            ${where}
            ORDER BY properties.created_at DESC
            `,
            values
        );

        return res.json(result.rows);

    } catch (err) {

        console.error('Erro ao buscar imoveis:', err);

        return res.status(500).json({
            error: 'Erro ao buscar imoveis.'
        });

    }

};

/**
 * Buscar um imovel especifico
 */
exports.getPropertyById = async (req, res) => {

    const { id } = req.params;

    try {

        const result = await pool.query(
            `
            SELECT
                properties.*,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object('id', pp.id, 'url', pp.url) ORDER BY pp.position ASC)
                        FROM property_photos pp
                        WHERE pp.property_id = properties.id
                    ),
                    '[]'
                ) AS photos
            FROM properties
            WHERE properties.id = $1 AND properties.company_id = $2
            `,
            [id, req.user.company_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Imovel nao encontrado.' });
        }

        return res.json(result.rows[0]);

    } catch (err) {

        console.error('Erro ao buscar imovel:', err);

        return res.status(500).json({
            error: 'Erro ao buscar imovel.'
        });

    }

};

/**
 * Criar imovel
 */
exports.createProperty = async (req, res) => {

    const {
        title, description, lead_type, property_type, region, city,
        bedrooms, suites, bathrooms, garage_spots, area, land_area,
        floor, has_elevator, price, rent_price, status,
        owner_name, owner_contact
    } = req.body;

    if (!title || !property_type || !region || !city) {
        return res.status(400).json({
            error: 'Informe titulo, tipo de imovel, regiao e cidade.'
        });
    }

    const leadTypeToSave = ['venda', 'aluguel', 'ambos'].includes(lead_type) ? lead_type : 'venda';

    try {

                const result = await pool.query(
            `
            INSERT INTO properties
            (company_id, created_by, title, description, lead_type, property_type, region, city,
            bedrooms, suites, bathrooms, garage_spots, area, land_area, floor, has_elevator,
            price, rent_price, status, owner_name, owner_contact)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
            RETURNING *
            `,
            [
                req.user.company_id, req.user.id, title, description || null, leadTypeToSave,
                property_type, region, city,
                bedrooms || null, suites || null, bathrooms || null, garage_spots || null,
                area || null, land_area || null, floor || null,
                has_elevator === true || has_elevator === 'true',
                price || null, rent_price || null,
                status || 'disponivel',
                owner_name || null, owner_contact || null
            ]
        );

        return res.status(201).json(result.rows[0]);

    } catch (err) {

        console.error('Erro ao criar imovel:', err);

        return res.status(500).json({
            error: 'Erro ao criar imovel.'
        });

    }

};

/**
 * Atualizar imovel
 */
exports.updateProperty = async (req, res) => {

    const { id } = req.params;

    const {
        title, description, lead_type, property_type, region, city,
        bedrooms, suites, bathrooms, garage_spots, area, land_area,
        floor, has_elevator, price, rent_price, status,
        owner_name, owner_contact
    } = req.body;

    if (!title || !property_type || !region || !city) {
        return res.status(400).json({
            error: 'Informe titulo, tipo de imovel, regiao e cidade.'
        });
    }

    const leadTypeToSave = ['venda', 'aluguel', 'ambos'].includes(lead_type) ? lead_type : 'venda';

    try {

        const existing = await pool.query(
            `SELECT id FROM properties WHERE id = $1 AND company_id = $2`,
            [id, req.user.company_id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Imovel nao encontrado.' });
        }

                const result = await pool.query(
            `
            UPDATE properties SET
                title = $1, description = $2, lead_type = $3, property_type = $4,
                region = $5, city = $6, bedrooms = $7, suites = $8, bathrooms = $9,
                garage_spots = $10, area = $11, land_area = $12, floor = $13,
                has_elevator = $14, price = $15, rent_price = $16, status = $17,
                owner_name = $18, owner_contact = $19,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $20 AND company_id = $21
            RETURNING *
            `,
            [
                title, description || null, leadTypeToSave, property_type, region, city,
                bedrooms || null, suites || null, bathrooms || null, garage_spots || null,
                area || null, land_area || null, floor || null,
                has_elevator === true || has_elevator === 'true',
                price || null, rent_price || null, status || 'disponivel',
                owner_name || null, owner_contact || null,
                id, req.user.company_id
            ]
        );

        return res.json(result.rows[0]);

    } catch (err) {

        console.error('Erro ao atualizar imovel:', err);

        return res.status(500).json({
            error: 'Erro ao atualizar imovel.'
        });

    }

};

/**
 * Excluir imovel
 */
exports.deleteProperty = async (req, res) => {

    const { id } = req.params;

    try {

        const existing = await pool.query(
            `SELECT id FROM properties WHERE id = $1 AND company_id = $2`,
            [id, req.user.company_id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Imovel nao encontrado.' });
        }

        const photos = await pool.query(
            `SELECT url FROM property_photos WHERE property_id = $1`,
            [id]
        );

        const pathsToRemove = photos.rows.map((p) => p.url.split('/properties/')[1]).filter(Boolean);

        if (pathsToRemove.length > 0) {
            await supabase.storage.from('properties').remove(pathsToRemove);
        }

        await pool.query(`DELETE FROM properties WHERE id = $1`, [id]);

        return res.json({ message: 'Imovel excluido com sucesso.' });

    } catch (err) {

        console.error('Erro ao excluir imovel:', err);

        return res.status(500).json({
            error: 'Erro ao excluir imovel.'
        });

    }

};

/**
 * Upload de fotos do imovel (ate 10 no total)
 */
exports.uploadPropertyPhotos = async (req, res) => {

    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    try {

        const propertyCheck = await pool.query(
            `SELECT id FROM properties WHERE id = $1 AND company_id = $2`,
            [id, req.user.company_id]
        );

        if (propertyCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Imovel nao encontrado.' });
        }

        const currentCountResult = await pool.query(
            `SELECT COUNT(*) FROM property_photos WHERE property_id = $1`,
            [id]
        );

        const currentCount = Number(currentCountResult.rows[0].count);

        if (currentCount + req.files.length > 10) {
            return res.status(400).json({
                error: `Este imovel ja tem ${currentCount} foto(s). Voce pode adicionar no maximo ${10 - currentCount}.`
            });
        }

        const uploadedUrls = [];

        for (let i = 0; i < req.files.length; i++) {

            const file = req.files[i];

            if (!allowedTypes.includes(file.mimetype)) {
                continue;
            }

            const fileExt = file.mimetype.split('/')[1];
            const filePath = `property-${id}-${Date.now()}-${i}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('properties')
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (uploadError) {
                console.error('Erro ao enviar foto do imovel:', uploadError);
                continue;
            }

            const { data: publicUrlData } = supabase.storage
                .from('properties')
                .getPublicUrl(filePath);

            uploadedUrls.push(publicUrlData.publicUrl);
        }

        if (uploadedUrls.length === 0) {
            return res.status(400).json({ error: 'Nenhuma imagem valida foi enviada.' });
        }

        const insertedPhotos = [];

        for (let i = 0; i < uploadedUrls.length; i++) {
            const result = await pool.query(
                `INSERT INTO property_photos (property_id, url, position) VALUES ($1, $2, $3) RETURNING *`,
                [id, uploadedUrls[i], currentCount + i]
            );
            insertedPhotos.push(result.rows[0]);
        }

        return res.status(201).json(insertedPhotos);

    } catch (err) {

        console.error('Erro ao processar upload de fotos:', err);

        return res.status(500).json({
            error: 'Erro ao processar upload de fotos.'
        });

    }

};

/**
 * Vitrine publica: listar imoveis disponiveis de uma imobiliaria pelo slug
 * Nao exige login. Nunca retorna dados do proprietario.
 */
exports.getPublicCatalog = async (req, res) => {

    const { slug } = req.params;

    try {

        const companyResult = await pool.query(
            `SELECT id, name, whatsapp FROM companies WHERE public_slug = $1`,
            [slug]
        );

        if (companyResult.rows.length === 0) {
            return res.status(404).json({ error: 'Catalogo nao encontrado.' });
        }

        const company = companyResult.rows[0];

        const propertiesResult = await pool.query(
            `
            SELECT
                properties.id, properties.title, properties.description, properties.lead_type,
                properties.property_type, properties.region, properties.city,
                properties.bedrooms, properties.suites, properties.bathrooms, properties.garage_spots,
                properties.area, properties.land_area, properties.floor, properties.has_elevator,
                properties.price, properties.rent_price, properties.status,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object('id', pp.id, 'url', pp.url) ORDER BY pp.position ASC)
                        FROM property_photos pp
                        WHERE pp.property_id = properties.id
                    ),
                    '[]'
                ) AS photos
            FROM properties
            WHERE properties.company_id = $1 AND properties.status = 'disponivel'
            ORDER BY properties.created_at DESC
            `,
            [company.id]
        );

        return res.json({
            company: {
                name: company.name,
                whatsapp: company.whatsapp
            },
            properties: propertiesResult.rows
        });

    } catch (err) {

        console.error('Erro ao buscar catalogo publico:', err);

        return res.status(500).json({
            error: 'Erro ao buscar catalogo.'
        });

    }

};


/**
 * Excluir uma foto especifica do imovel
 */
exports.deletePropertyPhoto = async (req, res) => {

    const { id, photoId } = req.params;

    try {

        const propertyCheck = await pool.query(
            `SELECT id FROM properties WHERE id = $1 AND company_id = $2`,
            [id, req.user.company_id]
        );

        if (propertyCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Imovel nao encontrado.' });
        }

        const photo = await pool.query(
            `SELECT url FROM property_photos WHERE id = $1 AND property_id = $2`,
            [photoId, id]
        );

        if (photo.rows.length === 0) {
            return res.status(404).json({ error: 'Foto nao encontrada.' });
        }

        const path = photo.rows[0].url.split('/properties/')[1];

        if (path) {
            await supabase.storage.from('properties').remove([path]);
        }

        await pool.query(`DELETE FROM property_photos WHERE id = $1`, [photoId]);

        return res.json({ message: 'Foto excluida com sucesso.' });

    } catch (err) {

        console.error('Erro ao excluir foto:', err);

        return res.status(500).json({
            error: 'Erro ao excluir foto.'
        });

    }

};

