const pool = require('../config/db');

const TYPE_LABELS = {
    predio: 'Prédio / Condomínio',
    apartamento: 'Apartamento',
    outro: 'Outro'
};

function mapSaleStatus(saleStatus) {
    const value = saleStatus || 'venda';

    return {
        leadType: value === 'aluguel' ? 'aluguel' : 'venda',
        status: value === 'reservado' ? 'reservado' : value === 'vendido' ? 'vendido' : 'disponivel'
    };
}

/**
 * Cria ou atualiza o imovel do catalogo ligado a um projeto 3D.
 * Retorna o id do imovel (ou null se o projeto nao existir).
 */
async function syncProjectToCatalog(projectId) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const projectResult = await client.query(`SELECT * FROM projects_3d WHERE id = $1`, [projectId]);

        if (projectResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        const project = projectResult.rows[0];

        const photosResult = await client.query(
            `SELECT url FROM project_3d_photos WHERE project_id = $1 ORDER BY position ASC, id ASC`,
            [projectId]
        );

        const urls = [];

        if (project.cover_url) urls.push(project.cover_url);

        photosResult.rows.forEach((row) => {
            if (row.url && !urls.includes(row.url)) urls.push(row.url);
        });

        const { leadType, status } = mapSaleStatus(project.sale_status);
        const isRent = leadType === 'aluguel';
        const price = isRent ? null : (project.price ?? null);
        const rentPrice = isRent ? (project.price ?? null) : null;
        const propertyType = TYPE_LABELS[project.project_type] || project.project_type || null;

        const existing = await client.query(`SELECT id FROM properties WHERE project_3d_id = $1`, [projectId]);

        let propertyId;

        if (existing.rows.length === 0) {
            const inserted = await client.query(
                `
                INSERT INTO properties
                (company_id, created_by, title, description, lead_type, property_type, region,
                 bedrooms, bathrooms, garage_spots, area, price, rent_price, status, project_3d_id)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
                RETURNING id
                `,
                [
                    project.company_id,
                    project.created_by,
                    project.title,
                    project.description || null,
                    leadType,
                    propertyType,
                    project.address || null,
                    project.bedrooms ?? null,
                    project.bathrooms ?? null,
                    project.parking_spots ?? null,
                    project.area ?? null,
                    price,
                    rentPrice,
                    status,
                    projectId
                ]
            );

            propertyId = inserted.rows[0].id;
        } else {
            propertyId = existing.rows[0].id;

            await client.query(
                `
                UPDATE properties
                SET
                    title = $1,
                    description = $2,
                    lead_type = $3,
                    property_type = $4,
                    bedrooms = $5,
                    bathrooms = $6,
                    garage_spots = $7,
                    area = $8,
                    price = $9,
                    rent_price = $10,
                    status = CASE
                        WHEN $11::text = 'disponivel' AND status IN ('vendido', 'alugado') THEN status
                        ELSE $11::text
                    END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $12
                `,
                [
                    project.title,
                    project.description || null,
                    leadType,
                    propertyType,
                    project.bedrooms ?? null,
                    project.bathrooms ?? null,
                    project.parking_spots ?? null,
                    project.area ?? null,
                    price,
                    rentPrice,
                    status,
                    propertyId
                ]
            );
        }

        await client.query(`DELETE FROM property_photos WHERE property_id = $1`, [propertyId]);

        for (let index = 0; index < urls.length; index += 1) {
            await client.query(
                `INSERT INTO property_photos (property_id, url, position) VALUES ($1, $2, $3)`,
                [propertyId, urls[index], index]
            );
        }

        await client.query('COMMIT');

        return propertyId;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

module.exports = { syncProjectToCatalog };