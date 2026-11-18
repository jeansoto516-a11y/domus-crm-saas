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


// ---------- ALUGUEIS FUTUROS E CAUCOES ----------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_FUTURE_MONTHS = 60;

function lastDayOfMonth(key) {
    const [y, m] = key.split('-').map(Number);
    const day = new Date(y, m, 0).getDate();
    return `${key}-${pad(day)}`;
}

function listMonthKeys(start, end) {
    const keys = [];
    let [y, m] = start.slice(0, 7).split('-').map(Number);
    const [endY, endM] = end.slice(0, 7).split('-').map(Number);

    while (y < endY || (y === endY && m <= endM)) {
        keys.push(`${y}-${pad(m)}`);
        m += 1;

        if (m > 12) {
            m = 1;
            y += 1;
        }
    }

    return keys;
}

/**
 * Projecao dos alugueis futuros (somente admin)
 * GET /finance/future-rentals?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Considera os contratos ativos, mes cheio em cada mes de vigencia.
 */
exports.getFutureRentals = async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!DATE_RE.test(startDate || '') || !DATE_RE.test(endDate || '')) {
        return res.status(400).json({ error: 'Informe a data inicial e a data final.' });
    }

    if (endDate < startDate) {
        return res.status(400).json({ error: 'A data final deve ser depois da data inicial.' });
    }

    const monthKeys = listMonthKeys(startDate, endDate);

    if (monthKeys.length > MAX_FUTURE_MONTHS) {
        return res.status(400).json({ error: `O periodo maximo e de ${MAX_FUTURE_MONTHS} meses.` });
    }

    try {
        const contractsResult = await pool.query(
            `
            SELECT
                rental_properties.id,
                rental_properties.address,
                rental_properties.tenant_name,
                rental_properties.rent_value,
                rental_properties.admin_fee_percent,
                rental_properties.broker_commission_percent,
                rental_properties.broker_id,
                to_char(rental_properties.contract_start, 'YYYY-MM-DD') AS contract_start,
                to_char(rental_properties.contract_end, 'YYYY-MM-DD') AS contract_end,
                users.name AS broker_name
            FROM rental_properties
            LEFT JOIN users ON users.id = rental_properties.broker_id
            WHERE rental_properties.company_id = $1
            AND rental_properties.status = 'ativo'
            AND (
                rental_properties.contract_start IS NULL
                OR rental_properties.contract_start <= (date_trunc('month', $3::date) + INTERVAL '1 month - 1 day')::date
            )
            AND (
                rental_properties.contract_end IS NULL
                OR rental_properties.contract_end >= date_trunc('month', $2::date)::date
            )
            ORDER BY rental_properties.address ASC
            `,
            [req.user.company_id, startDate, endDate]
        );

        const monthly = {};

        monthKeys.forEach((key) => {
            monthly[key] = {
                month: key,
                contratos: 0,
                aluguel_total: 0,
                taxa_adm: 0,
                comissao_corretores: 0,
                receita_imobiliaria: 0,
                repasse_proprietarios: 0
            };
        });

        const brokers = {};
        const contracts = [];

        contractsResult.rows.forEach((c) => {
            const rent = Number(c.rent_value);
            const adminFee = rent * (Number(c.admin_fee_percent) / 100);
            const brokerComm = adminFee * (Number(c.broker_commission_percent) / 100);
            const agency = adminFee - brokerComm;
            const owner = rent - adminFee;

            let monthsCount = 0;

            monthKeys.forEach((key) => {
                const first = `${key}-01`;
                const last = lastDayOfMonth(key);

                const active =
                    (!c.contract_start || c.contract_start <= last) &&
                    (!c.contract_end || c.contract_end >= first);

                if (!active) return;

                monthsCount += 1;

                const row = monthly[key];
                row.contratos += 1;
                row.aluguel_total += rent;
                row.taxa_adm += adminFee;
                row.comissao_corretores += brokerComm;
                row.receita_imobiliaria += agency;
                row.repasse_proprietarios += owner;
            });

            if (monthsCount === 0) return;

            const brokerKey = c.broker_id || 0;

            if (!brokers[brokerKey]) {
                brokers[brokerKey] = {
                    broker_id: c.broker_id || null,
                    name: c.broker_name || 'Sem corretor',
                    contratos: 0,
                    comissao: 0
                };
            }

            brokers[brokerKey].contratos += 1;
            brokers[brokerKey].comissao += brokerComm * monthsCount;

            contracts.push({
                id: c.id,
                address: c.address,
                tenant_name: c.tenant_name,
                broker_name: c.broker_name || null,
                rent_value: money(rent),
                contract_start: c.contract_start,
                contract_end: c.contract_end,
                meses_no_periodo: monthsCount,
                taxa_adm_total: money(adminFee * monthsCount),
                comissao_corretor_total: money(brokerComm * monthsCount),
                receita_imobiliaria_total: money(agency * monthsCount)
            });
        });

        const months = monthKeys.map((key) => {
            const row = monthly[key];

            return {
                month: row.month,
                contratos: row.contratos,
                aluguel_total: money(row.aluguel_total),
                taxa_adm: money(row.taxa_adm),
                comissao_corretores: money(row.comissao_corretores),
                receita_imobiliaria: money(row.receita_imobiliaria),
                repasse_proprietarios: money(row.repasse_proprietarios)
            };
        });

        const total = months.reduce(
            (acc, row) => ({
                aluguel_total: acc.aluguel_total + row.aluguel_total,
                taxa_adm: acc.taxa_adm + row.taxa_adm,
                comissao_corretores: acc.comissao_corretores + row.comissao_corretores,
                receita_imobiliaria: acc.receita_imobiliaria + row.receita_imobiliaria,
                repasse_proprietarios: acc.repasse_proprietarios + row.repasse_proprietarios
            }),
            { aluguel_total: 0, taxa_adm: 0, comissao_corretores: 0, receita_imobiliaria: 0, repasse_proprietarios: 0 }
        );

        return res.json({
            period: { start: startDate, end: endDate, months: monthKeys.length },
            meses: months,
            consolidado: {
                contratos: contracts.length,
                meses: monthKeys.length,
                aluguel_total: money(total.aluguel_total),
                taxa_adm: money(total.taxa_adm),
                comissao_corretores: money(total.comissao_corretores),
                receita_imobiliaria: money(total.receita_imobiliaria),
                repasse_proprietarios: money(total.repasse_proprietarios)
            },
            por_corretor: Object.values(brokers)
                .map((b) => ({ ...b, comissao: money(b.comissao) }))
                .sort((a, b) => b.comissao - a.comissao),
            contratos: contracts
        });

    } catch (err) {
        console.error('Erro ao calcular alugueis futuros:', err);
        return res.status(500).json({ error: 'Erro ao calcular alugueis futuros.' });
    }
};

/**
 * Controle de caucoes (somente admin) - nao entra em nenhum total financeiro da imobiliaria
 * GET /finance/deposits
 */
exports.getDeposits = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                rental_properties.id,
                rental_properties.address,
                rental_properties.tenant_name,
                rental_properties.tenant_contact,
                rental_properties.rent_value,
                rental_properties.deposit_value,
                rental_properties.status,
                rental_properties.lead_id,
                to_char(rental_properties.contract_start, 'YYYY-MM-DD') AS contract_start,
                to_char(rental_properties.contract_end, 'YYYY-MM-DD') AS contract_end,
                leads.name AS lead_name,
                leads.phone AS lead_phone,
                leads.email AS lead_email,
                users.name AS broker_name
            FROM rental_properties
            LEFT JOIN leads ON leads.id = rental_properties.lead_id
            LEFT JOIN users ON users.id = rental_properties.broker_id
            WHERE rental_properties.company_id = $1
            AND rental_properties.guarantee_type = 'caucao'
            AND rental_properties.deposit_value IS NOT NULL
            ORDER BY rental_properties.contract_start DESC NULLS LAST, rental_properties.id DESC
            `,
            [req.user.company_id]
        );

        const items = result.rows.map((row) => ({
            id: row.id,
            lead_id: row.lead_id,
            lead_name: row.lead_name || row.tenant_name,
            contact: row.lead_phone || row.lead_email || row.tenant_contact || null,
            address: row.address,
            broker_name: row.broker_name || null,
            rent_value: money(row.rent_value),
            deposit_value: money(row.deposit_value),
            contract_start: row.contract_start,
            contract_end: row.contract_end,
            status: row.status
        }));

        const active = items.filter((item) => item.status === 'ativo');

        return res.json({
            quantidade_ativas: active.length,
            total_ativas: money(active.reduce((sum, item) => sum + item.deposit_value, 0)),
            quantidade_total: items.length,
            itens: items
        });

    } catch (err) {
        console.error('Erro ao buscar caucoes:', err);
        return res.status(500).json({ error: 'Erro ao buscar caucoes.' });
    }
};