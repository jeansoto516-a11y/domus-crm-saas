const axios = require('axios');
const pool = require('../config/db');
const { decrypt } = require('./cryptoService');

const GRAPH_URL = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v25.0'}`;

async function getMetaSpend(companyId, startDate, endDate) {
    const result = await pool.query(
        `SELECT meta_ad_account_id, meta_access_token FROM companies WHERE id = $1`,
        [companyId]
    );

    const company = result.rows[0];

    if (!company?.meta_ad_account_id || !company?.meta_access_token) {
        return { connected: false, total: 0, error: null };
    }

    try {
        const { data } = await axios.get(`${GRAPH_URL}/act_${company.meta_ad_account_id}/insights`, {
            params: {
                fields: 'spend',
                time_range: JSON.stringify({ since: startDate, until: endDate })
            },
            headers: { Authorization: `Bearer ${decrypt(company.meta_access_token)}` },
            timeout: 20000
        });

        const total = (data.data || []).reduce((sum, row) => sum + Number(row.spend || 0), 0);

        return { connected: true, total: Math.round(total * 100) / 100, error: null };
    } catch (err) {
        const message = err.response?.data?.error?.message || 'Nao foi possivel buscar o investimento no Meta.';
        return { connected: true, total: 0, error: message };
    }
}

module.exports = { getMetaSpend };