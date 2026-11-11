const axios = require('axios');
const pool = require('../config/db');
const { encrypt, decrypt } = require('../services/cryptoService');

const GRAPH_URL = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v25.0'}`;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PAGES = 5;

const LEAD_ACTIONS = ['lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead'];
const CONVERSATION_ACTION = 'onsite_conversion.messaging_conversation_started_7d';

const RATE_LIMIT_CODES = [4, 17, 32, 613];

const round2 = (value) => Math.round(value * 100) / 100;

const normalizeAccountId = (raw) => String(raw || '').replace(/^act_/i, '').replace(/\D/g, '');

function metaGet(path, token, params) {
    return axios.get(`${GRAPH_URL}${path}`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        timeout: 20000
    });
}

function translateMetaError(err) {
    const metaError = err.response?.data?.error;

    if (!metaError) {
        return { status: 502, message: 'Nao foi possivel falar com o Meta. Tente novamente.' };
    }

    if (metaError.code === 190) {
        return {
            status: 400,
            message: 'Token invalido ou expirado. Gere um novo token e conecte de novo.',
            reconnect: true
        };
    }

    if (RATE_LIMIT_CODES.includes(metaError.code)) {
        return { status: 429, message: 'Limite de consultas do Meta atingido. Tente de novo em alguns minutos.' };
    }

    return { status: 400, message: metaError.message || 'O Meta recusou a consulta.' };
}

function readActions(actions) {
    const value = (type) => Number((actions || []).find((a) => a.action_type === type)?.value || 0);

    return {
        leads: Math.max(...LEAD_ACTIONS.map(value)),
        conversations: value(CONVERSATION_ACTION)
    };
}

exports.getStatus = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT meta_ad_account_id, meta_connected_at FROM companies WHERE id = $1`,
            [req.user.company_id]
        );

        const company = result.rows[0] || {};

        return res.json({
            connected: Boolean(company.meta_ad_account_id),
            ad_account_id: company.meta_ad_account_id || null,
            connected_at: company.meta_connected_at || null,
            can_manage: req.user.role === 'admin'
        });
    } catch (err) {
        console.error('Erro ao buscar status do Meta Ads:', err);
        return res.status(500).json({ error: 'Erro ao buscar status do Meta Ads.' });
    }
};

exports.connect = async (req, res) => {
    const accountId = normalizeAccountId(req.body.ad_account_id);
    const token = String(req.body.access_token || '').trim();

    if (!accountId || !token) {
        return res.status(400).json({ error: 'Informe o ID da conta de anuncios e o token.' });
    }

    try {
        const { data } = await metaGet(`/act_${accountId}`, token, {
            fields: 'name,currency,account_status'
        });

        await pool.query(
            `
            UPDATE companies
            SET meta_ad_account_id = $1, meta_access_token = $2, meta_connected_at = CURRENT_TIMESTAMP
            WHERE id = $3
            `,
            [accountId, encrypt(token), req.user.company_id]
        );

        return res.json({ connected: true, account_name: data.name, currency: data.currency });
    } catch (err) {
        if (err.isAxiosError) {
            const translated = translateMetaError(err);
            return res.status(translated.status).json({ error: translated.message, reconnect: translated.reconnect });
        }

        console.error('Erro ao conectar Meta Ads:', err);
        return res.status(500).json({ error: 'Erro ao conectar Meta Ads.' });
    }
};

exports.disconnect = async (req, res) => {
    try {
        await pool.query(
            `
            UPDATE companies
            SET meta_ad_account_id = NULL, meta_access_token = NULL, meta_connected_at = NULL
            WHERE id = $1
            `,
            [req.user.company_id]
        );

        return res.json({ message: 'Meta Ads desconectado.' });
    } catch (err) {
        console.error('Erro ao desconectar Meta Ads:', err);
        return res.status(500).json({ error: 'Erro ao desconectar Meta Ads.' });
    }
};

exports.getInsights = async (req, res) => {
    const { startDate, endDate } = req.query;

    const params = {
        level: 'campaign',
        fields: 'campaign_id,campaign_name,spend,impressions,clicks,cpc,actions',
        limit: 100
    };

    if (startDate && endDate) {
        if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
            return res.status(400).json({ error: 'Datas invalidas.' });
        }

        params.time_range = JSON.stringify({ since: startDate, until: endDate });
    } else {
        params.date_preset = 'last_30d';
    }

    try {
        const result = await pool.query(
            `SELECT meta_ad_account_id, meta_access_token FROM companies WHERE id = $1`,
            [req.user.company_id]
        );

        const company = result.rows[0];

        if (!company?.meta_ad_account_id || !company?.meta_access_token) {
            return res.status(400).json({ error: 'Conta do Meta Ads nao conectada.', not_connected: true });
        }

        const token = decrypt(company.meta_access_token);

        const rows = [];
        let after = null;

        for (let page = 0; page < MAX_PAGES; page++) {
            const { data } = await metaGet(
                `/act_${company.meta_ad_account_id}/insights`,
                token,
                after ? { ...params, after } : params
            );

            rows.push(...(data.data || []));
            after = data.paging?.cursors?.after;

            if (!data.paging?.next || !after) break;
        }

        const campaigns = rows.map((row) => {
            const spend = Number(row.spend || 0);
            const clicks = Number(row.clicks || 0);
            const { leads, conversations } = readActions(row.actions);
            const results = leads + conversations;

            return {
                id: row.campaign_id,
                name: row.campaign_name,
                spend: round2(spend),
                impressions: Number(row.impressions || 0),
                clicks,
                cpc: row.cpc ? round2(Number(row.cpc)) : (clicks > 0 ? round2(spend / clicks) : null),
                leads,
                conversations,
                results,
                cost_per_result: results > 0 ? round2(spend / results) : null
            };
        }).sort((a, b) => b.spend - a.spend);

        const totals = campaigns.reduce(
            (acc, c) => ({
                spend: acc.spend + c.spend,
                impressions: acc.impressions + c.impressions,
                clicks: acc.clicks + c.clicks,
                leads: acc.leads + c.leads,
                conversations: acc.conversations + c.conversations,
                results: acc.results + c.results
            }),
            { spend: 0, impressions: 0, clicks: 0, leads: 0, conversations: 0, results: 0 }
        );

        totals.spend = round2(totals.spend);
        totals.cost_per_result = totals.results > 0 ? round2(totals.spend / totals.results) : null;

        return res.json({
            period: startDate && endDate ? { since: startDate, until: endDate } : { preset: 'last_30d' },
            totals,
            campaigns
        });
    } catch (err) {
        if (err.isAxiosError) {
            const translated = translateMetaError(err);
            return res.status(translated.status).json({ error: translated.message, reconnect: translated.reconnect });
        }

        console.error('Erro ao buscar insights do Meta Ads:', err);
        return res.status(500).json({ error: 'Erro ao buscar dados do Meta Ads.' });
    }
};