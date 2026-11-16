const pool = require('../config/db');
const { getMetaSpend } = require('../services/metaSpendService');

function pad(n) {
    return String(n).padStart(2, '0');
}

function formatDate(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function resolvePeriod(startDate, endDate) {
    const now = new Date();
    const start = startDate || formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const end = endDate || formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    return { start, end };
}

function money(v) {
    return Math.round((Number(v) || 0) * 100) / 100;
}

function buildScenario(receitaVendas, receitaAlugueis, investimento) {
    const receitaTotal = receitaVendas + receitaAlugueis;
    const lucro = receitaTotal - investimento;
    const roi = investimento > 0 ? (lucro / investimento) * 100 : null;

    return {
        receita_vendas: money(receitaVendas),
        receita_alugueis: money(receitaAlugueis),
        receita_total: money(receitaTotal),
        investimento: money(investimento),
        lucro: money(lucro),
        roi: roi === null ? null : money(roi)
    };
}

/**
 * Resumo financeiro por periodo (somente admin)
 * GET /finance/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
exports.getSummary = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const { start, end } = resolvePeriod(req.query.startDate, req.query.endDate);

        // ---------- VENDAS ----------
        const salesTotals = await pool.query(
            `
            SELECT
                COUNT(*) AS quantidade,
                COALESCE(SUM(sale_value), 0) AS vgv,
                COALESCE(SUM(commission_value), 0) AS comissao_total,
                COALESCE(SUM(broker_commission_value), 0) AS comissao_corretores,
                COALESCE(SUM(agency_commission_value), 0) AS comissao_imobiliaria
            FROM sales
            WHERE company_id = $1 AND sale_date >= $2 AND sale_date <= $3
            `,
            [companyId, start, end]
        );

        const salesRanking = await pool.query(
            `
            SELECT
                sales.broker_id,
                COALESCE(users.name, 'Sem corretor') AS name,
                COUNT(*) AS quantidade,
                COALESCE(SUM(sales.sale_value), 0) AS vgv,
                COALESCE(SUM(sales.broker_commission_value), 0) AS comissao_corretor,
                COALESCE(SUM(sales.agency_commission_value), 0) AS comissao_imobiliaria
            FROM sales
            LEFT JOIN users ON users.id = sales.broker_id
            WHERE sales.company_id = $1 AND sales.sale_date >= $2 AND sales.sale_date <= $3
            GROUP BY sales.broker_id, users.name
            ORDER BY vgv DESC
            `,
            [companyId, start, end]
        );

        const salesMonthly = await pool.query(
            `
            SELECT
                to_char(date_trunc('month', sale_date), 'YYYY-MM') AS month,
                COUNT(*) AS quantidade,
                COALESCE(SUM(sale_value), 0) AS vgv,
                COALESCE(SUM(agency_commission_value), 0) AS comissao_imobiliaria
            FROM sales
            WHERE company_id = $1 AND sale_date >= $2 AND sale_date <= $3
            GROUP BY 1
            ORDER BY 1
            `,
            [companyId, start, end]
        );

        const s = salesTotals.rows[0];
        const salesCount = Number(s.quantidade);
        const salesVgv = Number(s.vgv);
        const salesAgency = Number(s.comissao_imobiliaria);

        const vendas = {
            quantidade: salesCount,
            vgv: money(salesVgv),
            comissao_total: money(s.comissao_total),
            comissao_corretores: money(s.comissao_corretores),
            comissao_imobiliaria: money(salesAgency),
            ticket_medio: salesCount > 0 ? money(salesVgv / salesCount) : 0,
            ranking: salesRanking.rows.map((row) => ({
                broker_id: row.broker_id,
                name: row.name,
                quantidade: Number(row.quantidade),
                vgv: money(row.vgv),
                comissao_corretor: money(row.comissao_corretor),
                comissao_imobiliaria: money(row.comissao_imobiliaria)
            })),
            evolucao: salesMonthly.rows.map((row) => ({
                month: row.month,
                quantidade: Number(row.quantidade),
                vgv: money(row.vgv),
                comissao_imobiliaria: money(row.comissao_imobiliaria)
            }))
        };

        // ---------- ALUGUEIS ----------
        const rentalFilter = `
            rental_properties.company_id = $1
            AND rental_payments.reference_month >= date_trunc('month', $2::date)::date
            AND rental_payments.reference_month <= $3::date
        `;

        const rentalByStatus = await pool.query(
            `
            SELECT
                rental_payments.status,
                COUNT(*) AS qtd,
                COALESCE(SUM(rental_payments.rent_value), 0) AS valor_aluguel,
                COALESCE(SUM(rental_payments.admin_fee_value), 0) AS taxa_adm,
                COALESCE(SUM(rental_payments.broker_commission_value), 0) AS comissao
            FROM rental_payments
            JOIN rental_properties ON rental_properties.id = rental_payments.property_id
            WHERE ${rentalFilter}
            GROUP BY rental_payments.status
            `,
            [companyId, start, end]
        );

        const rentalMonthly = await pool.query(
            `
            SELECT
                to_char(rental_payments.reference_month, 'YYYY-MM') AS month,
                COALESCE(SUM(rental_payments.admin_fee_value - rental_payments.broker_commission_value), 0) AS previsto,
                COALESCE(SUM(rental_payments.admin_fee_value - rental_payments.broker_commission_value)
                    FILTER (WHERE rental_payments.status = 'pago'), 0) AS pago
            FROM rental_payments
            JOIN rental_properties ON rental_properties.id = rental_payments.property_id
            WHERE ${rentalFilter}
            GROUP BY 1
            ORDER BY 1
            `,
            [companyId, start, end]
        );

        const porStatus = {
            pendente: { qtd: 0, valor_aluguel: 0, taxa_adm: 0, comissao: 0 },
            pago: { qtd: 0, valor_aluguel: 0, taxa_adm: 0, comissao: 0 },
            atrasado: { qtd: 0, valor_aluguel: 0, taxa_adm: 0, comissao: 0 }
        };

        let totalRegistros = 0;
        let totalTaxaAdm = 0;
        let totalComissao = 0;

        rentalByStatus.rows.forEach((row) => {
            porStatus[row.status] = {
                qtd: Number(row.qtd),
                valor_aluguel: money(row.valor_aluguel),
                taxa_adm: money(row.taxa_adm),
                comissao: money(row.comissao)
            };
            totalRegistros += Number(row.qtd);
            totalTaxaAdm += Number(row.taxa_adm);
            totalComissao += Number(row.comissao);
        });

        const rentalPrevistoLiquido = totalTaxaAdm - totalComissao;
        const rentalPagoLiquido = porStatus.pago.taxa_adm - porStatus.pago.comissao;

        const alugueis = {
            registros: totalRegistros,
            previsto: {
                taxa_adm: money(totalTaxaAdm),
                comissao_corretores: money(totalComissao),
                receita_imobiliaria: money(rentalPrevistoLiquido)
            },
            pago: {
                taxa_adm: money(porStatus.pago.taxa_adm),
                comissao_corretores: money(porStatus.pago.comissao),
                receita_imobiliaria: money(rentalPagoLiquido)
            },
            por_status: porStatus,
            evolucao: rentalMonthly.rows.map((row) => ({
                month: row.month,
                previsto: money(row.previsto),
                pago: money(row.pago)
            }))
        };

        // ---------- INVESTIMENTOS ----------
        const manualResult = await pool.query(
            `
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM ad_investments
            WHERE company_id = $1 AND invest_date >= $2 AND invest_date <= $3
            `,
            [companyId, start, end]
        );

        let meta = { connected: false, total: 0, error: null };

        try {
            meta = await getMetaSpend(companyId, start, end);
        } catch (err) {
            console.error('Erro ao consultar gasto do Meta Ads:', err);
            meta = { connected: false, total: 0, error: 'Erro ao consultar Meta Ads.' };
        }

        const manualTotal = Number(manualResult.rows[0].total);
        const metaTotal = meta && meta.connected ? Number(meta.total) || 0 : 0;
        const investimentoTotal = manualTotal + metaTotal;

        const investimentos = {
            manual: money(manualTotal),
            meta: {
                connected: Boolean(meta && meta.connected),
                total: money(metaTotal),
                error: (meta && meta.error) || null
            },
            total: money(investimentoTotal)
        };

        // ---------- LEADS (para custo por lead) ----------
        let leadsTotal = null;

        try {
            const leadsResult = await pool.query(
                `
                SELECT COUNT(*) AS total
                FROM leads
                WHERE company_id = $1
                AND created_at >= $2::date
                AND created_at < ($3::date + 1)
                `,
                [companyId, start, end]
            );
            leadsTotal = Number(leadsResult.rows[0].total);
        } catch (err) {
            console.error('Aviso: nao foi possivel contar leads do periodo:', err.message);
        }

        // ---------- CONSOLIDADO ----------
        const consolidado = {
            previsto: buildScenario(salesAgency, rentalPrevistoLiquido, investimentoTotal),
            caixa: buildScenario(salesAgency, rentalPagoLiquido, investimentoTotal),
            leads: leadsTotal,
            custo_por_venda: salesCount > 0 ? money(investimentoTotal / salesCount) : null,
            custo_por_lead: leadsTotal && leadsTotal > 0 ? money(investimentoTotal / leadsTotal) : null
        };

        return res.json({
            period: { start, end },
            vendas,
            alugueis,
            investimentos,
            consolidado
        });

    } catch (err) {
        console.error('Erro ao gerar resumo financeiro:', err);
        return res.status(500).json({ error: 'Erro ao gerar resumo financeiro.' });
    }
};