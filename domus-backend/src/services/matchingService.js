const pool = require('../config/db');

const MIN_MATCH_PERCENT = 40;
const ALERT_MIN_PERCENT = 70;

const normalize = (text) => (text || '').toString().trim().toLowerCase();

function calculateMatch(profile, leadType, property) {
    if (!profile) return null;

    let score = 0;
    let maxScore = 0;

    maxScore += 3;
    if (profile.property_type && normalize(profile.property_type) === normalize(property.property_type)) {
        score += 3;
    }

    maxScore += 2;
    if (profile.city && normalize(profile.city) === normalize(property.city)) {
        score += 2;
    }

    maxScore += 2;
    if (profile.region && normalize(profile.region) === normalize(property.region)) {
        score += 2;
    }

    if (profile.bedrooms) {
        maxScore += 1;
        if (property.bedrooms && Number(property.bedrooms) >= Number(profile.bedrooms)) {
            score += 1;
        }
    }

    if (profile.garage_spots) {
        maxScore += 1;
        if (property.garage_spots && Number(property.garage_spots) >= Number(profile.garage_spots)) {
            score += 1;
        }
    }

    const relevantPrice = leadType === 'aluguel' ? property.rent_price : property.price;

    if (profile.budget_max && relevantPrice) {
        maxScore += 3;
        if (Number(relevantPrice) <= Number(profile.budget_max) * 1.15) {
            score += 3;
        }
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : null;
}

async function notifyMatchingLeads(property) {
    if (property.status !== 'disponivel') return 0;

    const values = [property.company_id];
    let where = `WHERE leads.company_id = $1 AND leads.status != 'fechado' AND leads.user_id IS NOT NULL`;

    if (property.lead_type !== 'ambos') {
        where += ` AND leads.lead_type = $2`;
        values.push(property.lead_type);
    }

    const result = await pool.query(
        `
        SELECT
            leads.id, leads.name, leads.user_id, leads.lead_type,
            lp.property_type, lp.city, lp.region, lp.bedrooms, lp.garage_spots, lp.budget_max
        FROM leads
        JOIN lead_profiles lp ON lp.lead_id = leads.id
        ${where}
        `,
        values
    );

    let created = 0;

    for (const row of result.rows) {
        const percent = calculateMatch(row, row.lead_type, property);

        if (percent === null || percent < ALERT_MIN_PERCENT) continue;

        await pool.query(
            `
            INSERT INTO reminders (user_id, company_id, lead_id, note, due_date)
            VALUES ($1, $2, $3, $4, CURRENT_DATE)
            `,
            [
                row.user_id,
                property.company_id,
                row.id,
                `Novo imóvel combina com ${row.name} (${percent}%): ${property.title}`
            ]
        );

        created++;
    }

    return created;
}

module.exports = { calculateMatch, notifyMatchingLeads, MIN_MATCH_PERCENT, ALERT_MIN_PERCENT };