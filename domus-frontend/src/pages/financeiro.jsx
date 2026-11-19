import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import RemindersWidget from '../components/RemindersWidget';
import ChartCard from '../components/ChartCard';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';

const brl = (value) =>
    Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const pct = (value) =>
    value === null || value === undefined ? '—' : `${Number(value).toFixed(1)}%`;

function pad(n) {
    return String(n).padStart(2, '0');
}

function fmtLocal(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayStr() {
    return fmtLocal(new Date());
}

function toDateStr(value) {
    if (!value) return '';
    const s = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return fmtLocal(d);
}

function fmtDate(value) {
    const s = toDateStr(value);
    if (!s) return '-';
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
}

function monthLabel(value) {
    const [y, m] = String(value).split('-');
    return `${m}/${y}`;
}

function getPeriod(kind) {
    const now = new Date();

    if (kind === 'prev') {
        return {
            start: fmtLocal(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
            end: fmtLocal(new Date(now.getFullYear(), now.getMonth(), 0))
        };
    }

    if (kind === 'year') {
        return { start: `${now.getFullYear()}-01-01`, end: `${now.getFullYear()}-12-31` };
    }

    return {
        start: fmtLocal(new Date(now.getFullYear(), now.getMonth(), 1)),
        end: fmtLocal(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    };
}

function getFuturePeriod() {
    const now = new Date();

    return {
        start: fmtLocal(now),
        end: fmtLocal(new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()))
    };
}

const statusLabels = {
    pendente: 'Pendente',
    pago: 'Pago',
    atrasado: 'Atrasado'
};

const targetLabels = {
    geral: 'Geral',
    venda: 'Vendas',
    aluguel: 'Aluguéis'
};

const emptySale = {
    lead_id: '',
    broker_id: '',
    property_id: '',
    description: '',
    sale_value: '',
    commission_percent: '',
    broker_percent: '50',
    sale_date: '',
    notes: ''
};

const emptyInvestment = {
    channel: '',
    description: '',
    amount: '',
    target: 'geral',
    invest_date: ''
};

function openPicker(e) {
    try {
        if (e.target.showPicker) e.target.showPicker();
    } catch (err) {
        // navegador sem suporte: o ícone do calendário continua funcionando
    }
}
function Stat({ label, value, hint }) {
    return (
        <div className="dd-card">
            <span style={{ color: 'var(--dd-muted)', fontSize: 13 }}>{label}</span>
            <strong style={{ display: 'block', fontSize: 22, marginTop: 6 }}>{value}</strong>
            {hint && <small style={{ color: 'var(--dd-muted)' }}>{hint}</small>}
        </div>
    );
}

const chartsGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 16,
    marginTop: 16
};

function Financeiro() {
    const navigate = useNavigate();

    const [newLeadsCount, setNewLeadsCount] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);

    const [tab, setTab] = useState('consolidado');
    const [period, setPeriod] = useState(getPeriod('month'));
    const [draft, setDraft] = useState(getPeriod('month'));

    const [summary, setSummary] = useState(null);
    const [sales, setSales] = useState([]);
    const [invSummary, setInvSummary] = useState(null);
    const [investments, setInvestments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showSale, setShowSale] = useState(false);
    const [saleForm, setSaleForm] = useState(emptySale);
    const [saleOptions, setSaleOptions] = useState({ loaded: false, leads: [], brokers: [], properties: [] });
    const [saleError, setSaleError] = useState('');

    const [showInvestment, setShowInvestment] = useState(false);
    const [invForm, setInvForm] = useState(emptyInvestment);
    const [invError, setInvError] = useState('');

    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [future, setFuture] = useState(null);
    const [futurePeriod, setFuturePeriod] = useState(getFuturePeriod());
    const [futureDraft, setFutureDraft] = useState(getFuturePeriod());
    const [futureLoading, setFutureLoading] = useState(false);
    const [futureError, setFutureError] = useState('');
    const [deposits, setDeposits] = useState(null);

    useEffect(() => {
        const check = () => {
            api.get('/leads/new-count')
                .then((res) => setNewLeadsCount(res.data.count))
                .catch(() => {});
            api.get('/messages/unread-count')
                .then((res) => setUnreadCount(res.data.count))
                .catch(() => {});
        };

        check();
        const interval = setInterval(check, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const params = { startDate: period.start, endDate: period.end };

            const [summaryRes, salesRes, invSummaryRes, invListRes] = await Promise.all([
                api.get('/finance/summary', { params }),
                api.get('/sales', { params }),
                api.get('/investments/summary', { params }),
                api.get('/investments')
            ]);

            setSummary(summaryRes.data);
            setSales(Array.isArray(salesRes.data) ? salesRes.data : []);
            setInvSummary(invSummaryRes.data);
            setInvestments(
                Array.isArray(invListRes.data)
                    ? invListRes.data.filter((item) => {
                        const d = toDateStr(item.invest_date);
                        return d >= period.start && d <= period.end;
                    })
                    : []
            );
        } catch (err) {
            setError(err.response?.data?.error || 'Nao foi possivel carregar o financeiro.');
        } finally {
            setLoading(false);
        }
    }, [period.start, period.end]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

        const loadFuture = useCallback(async () => {
        try {
            setFutureLoading(true);
            setFutureError('');

            const res = await api.get('/finance/future-rentals', {
                params: { startDate: futurePeriod.start, endDate: futurePeriod.end }
            });

            setFuture(res.data);
        } catch (err) {
            setFutureError(err.response?.data?.error || 'Nao foi possivel calcular os alugueis futuros.');
        } finally {
            setFutureLoading(false);
        }
    }, [futurePeriod.start, futurePeriod.end]);

    useEffect(() => {
        loadFuture();
    }, [loadFuture]);

    const loadDeposits = useCallback(async () => {
        try {
            const res = await api.get('/finance/deposits');
            setDeposits(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Nao foi possivel carregar as cauções.');
        }
    }, []);

    useEffect(() => {
        loadDeposits();
    }, [loadDeposits]);

    const applyDraft = () => {
        if (!draft.start || !draft.end || draft.start > draft.end) {
            setError('Periodo invalido.');
            return;
        }
        setPeriod({ ...draft });
    };

    const applyPreset = (kind) => {
        const p = getPeriod(kind);
        setDraft(p);
        setPeriod(p);
    };

        const applyFutureDraft = () => {
        if (!futureDraft.start || !futureDraft.end || futureDraft.start > futureDraft.end) {
            setFutureError('Periodo invalido.');
            return;
        }

        setFuturePeriod({ ...futureDraft });
    };

    const applyFuturePreset = (months) => {
        const now = new Date();
        const p = {
            start: fmtLocal(now),
            end: fmtLocal(new Date(now.getFullYear(), now.getMonth() + months, now.getDate()))
        };

        setFutureDraft(p);
        setFuturePeriod(p);
    };

    // ---------- Venda manual ----------
    const loadSaleOptions = async () => {
        if (saleOptions.loaded) return;

        const [leadsRes, brokersRes, propsRes] = await Promise.allSettled([
            api.get('/leads', { params: { lead_type: 'venda' } }),
            api.get('/leads/ranking'),
            api.get('/properties')
        ]);

        const toArray = (result) =>
            result.status === 'fulfilled' && Array.isArray(result.value.data) ? result.value.data : [];

        setSaleOptions({
            loaded: true,
            leads: toArray(leadsRes),
            brokers: toArray(brokersRes),
            properties: toArray(propsRes)
        });
    };

    const openSaleModal = () => {
        setSaleForm({ ...emptySale, sale_date: todayStr() });
        setSaleError('');
        setShowSale(true);
        loadSaleOptions();
    };

    const updateSale = (field, value) => setSaleForm((cur) => ({ ...cur, [field]: value }));

    const selectSaleLead = (leadId) => {
        const lead = saleOptions.leads.find((item) => String(item.id) === String(leadId));
        setSaleForm((cur) => ({
            ...cur,
            lead_id: leadId,
            broker_id: lead && lead.user_id ? String(lead.user_id) : cur.broker_id
        }));
    };

    const submitSale = async () => {
        if (!saleForm.lead_id || !saleForm.sale_value || !saleForm.commission_percent) {
            setSaleError('Informe o lead, o valor da venda e o % de comissão.');
            return;
        }

        try {
            setSaving(true);
            setSaleError('');

            await api.post('/sales', {
                lead_id: saleForm.lead_id,
                property_id: saleForm.property_id || null,
                broker_id: saleForm.broker_id || null,
                description: saleForm.description || null,
                sale_value: Number(saleForm.sale_value),
                commission_percent: Number(saleForm.commission_percent),
                broker_percent: saleForm.broker_percent === '' ? 50 : Number(saleForm.broker_percent),
                sale_date: saleForm.sale_date || todayStr(),
                notes: saleForm.notes || null
            });

            setShowSale(false);
            loadAll();
        } catch (err) {
            setSaleError(err.response?.data?.error || 'Nao foi possivel registrar a venda.');
        } finally {
            setSaving(false);
        }
    };

    const deleteSale = async (id) => {
        if (!window.confirm('Excluir esta venda?')) return;

        try {
            await api.delete(`/sales/${id}`);
            loadAll();
        } catch (err) {
            setError(err.response?.data?.error || 'Nao foi possivel excluir a venda.');
        }
    };

    // ---------- Investimento manual ----------
    const openInvestmentModal = () => {
        setInvForm({ ...emptyInvestment, invest_date: todayStr() });
        setInvError('');
        setShowInvestment(true);
    };

    const updateInv = (field, value) => setInvForm((cur) => ({ ...cur, [field]: value }));

    const submitInvestment = async () => {
        if (!invForm.channel.trim() || !invForm.amount) {
            setInvError('Informe o canal e o valor.');
            return;
        }

        try {
            setSaving(true);
            setInvError('');

            await api.post('/investments', {
                channel: invForm.channel.trim(),
                description: invForm.description || null,
                amount: Number(invForm.amount),
                target: invForm.target,
                invest_date: invForm.invest_date || todayStr()
            });

            setShowInvestment(false);
            loadAll();
        } catch (err) {
            setInvError(err.response?.data?.error || 'Nao foi possivel salvar o investimento.');
        } finally {
            setSaving(false);
        }
    };

    const deleteInvestment = async (id) => {
        if (!window.confirm('Excluir este investimento?')) return;

        try {
            await api.delete(`/investments/${id}`);
            loadAll();
        } catch (err) {
            setError(err.response?.data?.error || 'Nao foi possivel excluir o investimento.');
        }
    };

    // ---------- Previa da comissao ----------
    const saleValueNum = Number(saleForm.sale_value) || 0;
    const commissionTotal = (saleValueNum * (Number(saleForm.commission_percent) || 0)) / 100;
    const brokerPart = (commissionTotal * (saleForm.broker_percent === '' ? 50 : Number(saleForm.broker_percent) || 0)) / 100;
    const agencyPart = commissionTotal - brokerPart;

    // ---------- Abas ----------
    const renderScenario = (title, hint, data) => (
        <>
            <h3 style={{ margin: '20px 0 4px' }}>{title}</h3>
            <p style={{ color: 'var(--dd-muted)', margin: '0 0 12px', fontSize: 13 }}>{hint}</p>
            <div className="dd-grid-3">
                <Stat label="Receita de vendas" value={brl(data.receita_vendas)} hint="Parte da imobiliária" />
                <Stat label="Receita de aluguéis" value={brl(data.receita_alugueis)} hint="Taxa adm. menos comissão do corretor" />
                <Stat label="Receita total" value={brl(data.receita_total)} />
                <Stat label="Investimento" value={brl(data.investimento)} />
                <Stat label="Lucro" value={brl(data.lucro)} hint="Receita total menos investimento" />
                <Stat label="ROI" value={pct(data.roi)} hint={data.roi === null ? 'Sem investimento no período' : ''} />
            </div>
        </>
    );

    const renderConsolidado = () => {
        const c = summary.consolidado;

        return (
            <>
                {renderScenario(
                    'Previsto',
                    'Considera todos os aluguéis gerados no período (pendentes, pagos e atrasados).',
                    c.previsto
                )}
                {renderScenario(
                    'Caixa',
                    'Considera apenas os aluguéis já marcados como pagos.',
                    c.caixa
                )}

                <h3 style={{ margin: '24px 0 12px' }}>Eficiência do investimento</h3>
                <div className="dd-grid-3">
                    <Stat label="Vendas no período" value={summary.vendas.quantidade} />
                    <Stat
                        label="Custo por venda"
                        value={c.custo_por_venda === null ? '—' : brl(c.custo_por_venda)}
                    />
                    <Stat
                        label="Custo por lead"
                        value={c.custo_por_lead === null ? '—' : brl(c.custo_por_lead)}
                        hint={c.leads === null ? 'Leads do período indisponíveis' : `${c.leads} lead(s) no período`}
                    />
                </div>
                <p style={{ color: 'var(--dd-muted)', fontSize: 13, marginTop: 12 }}>
                    O ROI é geral: os leads não guardam a origem ou campanha.
                </p>
            </>
        );
    };

    const renderVendas = () => {
        const v = summary.vendas;

        return (
            <>
                <div className="dd-grid-3">
                    <Stat label="VGV (valor vendido)" value={brl(v.vgv)} />
                    <Stat label="Comissão total" value={brl(v.comissao_total)} />
                    <Stat label="Parte dos corretores" value={brl(v.comissao_corretores)} />
                    <Stat label="Parte da imobiliária" value={brl(v.comissao_imobiliaria)} />
                    <Stat label="Ticket médio" value={brl(v.ticket_medio)} />
                    <Stat label="Quantidade de vendas" value={v.quantidade} />
                </div>

                <div style={chartsGrid}>
                    <ChartCard
                        title="VGV por mês"
                        data={v.evolucao.map((row) => ({ label: monthLabel(row.month), value: row.vgv }))}
                        availableTypes={['bar', 'line', 'area']}
                        valueLabel="VGV"
                    />
                    <ChartCard
                        title="VGV por corretor"
                        data={v.ranking.map((row) => ({ label: row.name, value: row.vgv }))}
                        availableTypes={['bar', 'pie']}
                        valueLabel="VGV"
                    />
                </div>

                <div className="dd-row-actions" style={{ margin: '24px 0 12px', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0 }}>Ranking por corretor</h3>
                </div>

                {v.ranking.length === 0 ? (
                    <div className="dd-empty">Nenhuma venda no período.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="dd-table">
                            <thead>
                                <tr>
                                    <th>Corretor</th>
                                    <th>Vendas</th>
                                    <th>VGV</th>
                                    <th>Comissão do corretor</th>
                                    <th>Comissão da imobiliária</th>
                                </tr>
                            </thead>
                            <tbody>
                                {v.ranking.map((row) => (
                                    <tr key={`${row.broker_id}-${row.name}`}>
                                        <td>{row.name}</td>
                                        <td>{row.quantidade}</td>
                                        <td>{brl(row.vgv)}</td>
                                        <td>{brl(row.comissao_corretor)}</td>
                                        <td>{brl(row.comissao_imobiliaria)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="dd-row-actions" style={{ margin: '24px 0 12px', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0 }}>Vendas do período</h3>
                    <button className="dd-btn-small" onClick={openSaleModal}>+ Registrar venda</button>
                </div>

                {sales.length === 0 ? (
                    <div className="dd-empty">Nenhuma venda registrada no período.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="dd-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Lead</th>
                                    <th>Imóvel</th>
                                    <th>Corretor</th>
                                    <th>Valor</th>
                                    <th>Comissão</th>
                                    <th>Corretor</th>
                                    <th>Imobiliária</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map((sale) => (
                                    <tr key={sale.id}>
                                        <td>{fmtDate(sale.sale_date)}</td>
                                        <td>{sale.lead_name || '-'}</td>
                                        <td>{sale.property_title || sale.description || '-'}</td>
                                        <td>{sale.broker_name || '-'}</td>
                                        <td>{brl(sale.sale_value)}</td>
                                        <td>{brl(sale.commission_value)}</td>
                                        <td>{brl(sale.broker_commission_value)}</td>
                                        <td>{brl(sale.agency_commission_value)}</td>
                                        <td>
                                            <button className="dd-btn-small" onClick={() => deleteSale(sale.id)}>
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </>
        );
    };

    const renderAlugueis = () => {
        const a = summary.alugueis;

        return (
            <>
                <div className="dd-grid-3">
                    <Stat label="Registros no período" value={a.registros} />
                    <Stat label="Taxa de administração" value={brl(a.previsto.taxa_adm)} hint="Todos os registros" />
                    <Stat label="Comissões dos corretores" value={brl(a.previsto.comissao_corretores)} hint="Todos os registros" />
                    <Stat label="Receita da imobiliária (prevista)" value={brl(a.previsto.receita_imobiliaria)} hint="Todos os registros" />
                    <Stat label="Receita da imobiliária (paga)" value={brl(a.pago.receita_imobiliaria)} hint="Somente pagos" />
                    <Stat label="Comissões já pagas" value={brl(a.pago.comissao_corretores)} hint="Somente pagos" />
                </div>

                <h3 style={{ margin: '24px 0 12px' }}>Por situação do pagamento</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table className="dd-table">
                        <thead>
                            <tr>
                                <th>Situação</th>
                                <th>Registros</th>
                                <th>Valor dos aluguéis</th>
                                <th>Taxa de administração</th>
                                <th>Comissão dos corretores</th>
                            </tr>
                        </thead>
                        <tbody>
                            {['pendente', 'pago', 'atrasado'].map((key) => (
                                <tr key={key}>
                                    <td>{statusLabels[key]}</td>
                                    <td>{a.por_status[key].qtd}</td>
                                    <td>{brl(a.por_status[key].valor_aluguel)}</td>
                                    <td>{brl(a.por_status[key].taxa_adm)}</td>
                                    <td>{brl(a.por_status[key].comissao)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={chartsGrid}>
                    <ChartCard
                        title="Receita de aluguéis por mês (prevista)"
                        data={a.evolucao.map((row) => ({ label: monthLabel(row.month), value: row.previsto }))}
                        availableTypes={['bar', 'line', 'area']}
                        valueLabel="Receita"
                    />
                    <ChartCard
                        title="Receita de aluguéis por mês (paga)"
                        data={a.evolucao.map((row) => ({ label: monthLabel(row.month), value: row.pago }))}
                        availableTypes={['bar', 'line', 'area']}
                        valueLabel="Receita"
                    />
                </div>

                                <p style={{ color: 'var(--dd-muted)', fontSize: 13, marginTop: 12 }}>
                    Para gerar os registros do mês e marcar pagamentos, use a página Aluguéis.
                </p>

                {renderFuturos()}
                {renderCaucoes()}
            </>
        );
    };

    const renderInvestimentos = () => {
        const inv = summary.investimentos;
        const channelData = (invSummary?.manual?.by_channel || []).map((row) => ({
            label: row.channel,
            value: Number(row.total)
        }));

        if (inv.meta.connected && inv.meta.total > 0) {
            channelData.push({ label: 'Meta Ads', value: inv.meta.total });
        }

        return (
            <>
                <div className="dd-grid-3">
                    <Stat label="Meta Ads (automático)" value={brl(inv.meta.total)} />
                    <Stat label="Outros canais (manual)" value={brl(inv.manual)} />
                    <Stat label="Investimento total" value={brl(inv.total)} />
                </div>

                {!inv.meta.connected && (
                    <p style={{ color: 'var(--dd-muted)', fontSize: 13, marginTop: 12 }}>
                        Meta Ads não está conectado. Conecte na página Meta Ads para somar o gasto automaticamente.
                    </p>
                )}

                {inv.meta.error && <div className="dd-alert-error" style={{ marginTop: 12 }}>{inv.meta.error}</div>}

                <div style={chartsGrid}>
                    <ChartCard
                        title="Investimento por canal"
                        data={channelData}
                        availableTypes={['bar', 'pie']}
                        valueLabel="Investido"
                    />
                </div>

                <div className="dd-row-actions" style={{ margin: '24px 0 12px', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0 }}>Lançamentos manuais</h3>
                    <button className="dd-btn-small" onClick={openInvestmentModal}>+ Novo investimento</button>
                </div>

                {investments.length === 0 ? (
                    <div className="dd-empty">Nenhum lançamento manual no período.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="dd-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Canal</th>
                                    <th>Descrição</th>
                                    <th>Destino</th>
                                    <th>Valor</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {investments.map((item) => (
                                    <tr key={item.id}>
                                        <td>{fmtDate(item.invest_date)}</td>
                                        <td>{item.channel}</td>
                                        <td>{item.description || '-'}</td>
                                        <td>{targetLabels[item.target] || item.target}</td>
                                        <td>{brl(item.amount)}</td>
                                        <td>
                                            <button className="dd-btn-small" onClick={() => deleteInvestment(item.id)}>
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </>
        );
    };

        const renderFuturos = () => (
        <>
            <h3 style={{ margin: '32px 0 4px' }}>Aluguéis futuros</h3>
            <p style={{ color: 'var(--dd-muted)', margin: '0 0 12px', fontSize: 13 }}>
                Projeção dos contratos ativos: mês cheio em cada mês de vigência, com o valor atual do aluguel e sem previsão de reajuste.
            </p>

            <div className="dd-analytics-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <input
                    type="date"
                    className="dd-input"
                    style={{ colorScheme: 'dark', cursor: 'pointer' }}
                    onClick={openPicker}
                    value={futureDraft.start}
                    onChange={(e) => setFutureDraft((cur) => ({ ...cur, start: e.target.value }))}
                />
                <span style={{ color: 'var(--dd-muted)' }}>até</span>
                <input
                    type="date"
                    className="dd-input"
                    style={{ colorScheme: 'dark', cursor: 'pointer' }}
                    onClick={openPicker}
                    value={futureDraft.end}
                    onChange={(e) => setFutureDraft((cur) => ({ ...cur, end: e.target.value }))}
                />
                <button className="dd-btn-small" onClick={applyFutureDraft}>Calcular</button>
                <button className="dd-btn-small" onClick={() => applyFuturePreset(6)}>6 meses</button>
                <button className="dd-btn-small" onClick={() => applyFuturePreset(12)}>12 meses</button>
                <button className="dd-btn-small" onClick={() => applyFuturePreset(24)}>24 meses</button>
            </div>

            {futureError && <div className="dd-alert-error" style={{ marginTop: 12 }}>{futureError}</div>}

            {futureLoading && !future ? (
                <div className="dd-empty">Calculando aluguéis futuros...</div>
            ) : !future ? null : (
                <>
                    <p style={{ color: 'var(--dd-muted)', fontSize: 13, margin: '12px 0' }}>
                        Período: {fmtDate(future.period.start)} a {fmtDate(future.period.end)} ({future.period.months} meses)
                    </p>

                    <div className="dd-grid-3">
                        <Stat label="Contratos no período" value={future.consolidado.contratos} />
                        <Stat label="Aluguéis (soma)" value={brl(future.consolidado.aluguel_total)} hint="Valor bruto dos aluguéis" />
                        <Stat label="Taxa de administração" value={brl(future.consolidado.taxa_adm)} />
                        <Stat label="Comissão dos corretores" value={brl(future.consolidado.comissao_corretores)} hint="Parte dos corretores na taxa" />
                        <Stat label="Receita da imobiliária" value={brl(future.consolidado.receita_imobiliaria)} hint="Taxa menos comissão dos corretores" />
                        <Stat label="Repasse aos proprietários" value={brl(future.consolidado.repasse_proprietarios)} hint="Aluguel menos taxa de administração" />
                    </div>

                    <div style={chartsGrid}>
                        <ChartCard
                            title="Receita da imobiliária por mês"
                            data={future.meses.map((row) => ({ label: monthLabel(row.month), value: row.receita_imobiliaria }))}
                            availableTypes={['bar', 'line', 'area']}
                            valueLabel="Receita"
                        />
                        <ChartCard
                            title="Comissão dos corretores por mês"
                            data={future.meses.map((row) => ({ label: monthLabel(row.month), value: row.comissao_corretores }))}
                            availableTypes={['bar', 'line', 'area']}
                            valueLabel="Comissão"
                        />
                        <ChartCard
                            title="Aluguéis por mês"
                            data={future.meses.map((row) => ({ label: monthLabel(row.month), value: row.aluguel_total }))}
                            availableTypes={['bar', 'line', 'area']}
                            valueLabel="Aluguéis"
                        />
                    </div>

                    <h3 style={{ margin: '24px 0 12px' }}>Mês a mês</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="dd-table">
                            <thead>
                                <tr>
                                    <th>Mês</th>
                                    <th>Contratos</th>
                                    <th>Aluguéis</th>
                                    <th>Taxa de administração</th>
                                    <th>Comissão dos corretores</th>
                                    <th>Receita da imobiliária</th>
                                    <th>Repasse aos proprietários</th>
                                </tr>
                            </thead>
                            <tbody>
                                {future.meses.map((row) => (
                                    <tr key={row.month}>
                                        <td>{monthLabel(row.month)}</td>
                                        <td>{row.contratos}</td>
                                        <td>{brl(row.aluguel_total)}</td>
                                        <td>{brl(row.taxa_adm)}</td>
                                        <td>{brl(row.comissao_corretores)}</td>
                                        <td>{brl(row.receita_imobiliaria)}</td>
                                        <td>{brl(row.repasse_proprietarios)}</td>
                                    </tr>
                                ))}
                                <tr style={{ fontWeight: 700 }}>
                                    <td>Total do período</td>
                                    <td>{future.consolidado.contratos}</td>
                                    <td>{brl(future.consolidado.aluguel_total)}</td>
                                    <td>{brl(future.consolidado.taxa_adm)}</td>
                                    <td>{brl(future.consolidado.comissao_corretores)}</td>
                                    <td>{brl(future.consolidado.receita_imobiliaria)}</td>
                                    <td>{brl(future.consolidado.repasse_proprietarios)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {future.por_corretor.length > 0 && (
                        <>
                            <h3 style={{ margin: '24px 0 12px' }}>Comissões por corretor</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="dd-table">
                                    <thead>
                                        <tr>
                                            <th>Corretor</th>
                                            <th>Contratos</th>
                                            <th>Comissão no período</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {future.por_corretor.map((row) => (
                                            <tr key={`${row.broker_id}-${row.name}`}>
                                                <td>{row.name}</td>
                                                <td>{row.contratos}</td>
                                                <td>{brl(row.comissao)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {future.contratos.length > 0 && (
                        <>
                            <h3 style={{ margin: '24px 0 12px' }}>Contratos considerados</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="dd-table">
                                    <thead>
                                        <tr>
                                            <th>Imóvel</th>
                                            <th>Inquilino</th>
                                            <th>Corretor</th>
                                            <th>Aluguel</th>
                                            <th>Início</th>
                                            <th>Fim</th>
                                            <th>Meses no período</th>
                                            <th>Taxa adm. no período</th>
                                            <th>Comissão do corretor</th>
                                            <th>Receita da imobiliária</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {future.contratos.map((contract) => (
                                            <tr key={contract.id}>
                                                <td>{contract.address}</td>
                                                <td>{contract.tenant_name || '-'}</td>
                                                <td>{contract.broker_name || '-'}</td>
                                                <td>{brl(contract.rent_value)}</td>
                                                <td>{fmtDate(contract.contract_start)}</td>
                                                <td>{contract.contract_end ? fmtDate(contract.contract_end) : 'Sem data'}</td>
                                                <td>{contract.meses_no_periodo}</td>
                                                <td>{brl(contract.taxa_adm_total)}</td>
                                                <td>{brl(contract.comissao_corretor_total)}</td>
                                                <td>{brl(contract.receita_imobiliaria_total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </>
            )}
        </>
    );

    const renderCaucoes = () => (
        <>
            <h3 style={{ margin: '32px 0 4px' }}>Controle de cauções</h3>
            <p style={{ color: 'var(--dd-muted)', margin: '0 0 12px', fontSize: 13 }}>
                Controle administrativo apartado. As cauções não entram em receita, lucro, ROI nem comissões.
            </p>

            {!deposits ? (
                <div className="dd-empty">Carregando cauções...</div>
            ) : (
                <>
                    <div className="dd-grid-3">
                        <Stat
                            label="Cauções ativas"
                            value={deposits.quantidade_ativas}
                            hint={`${deposits.quantidade_total} registrada(s) no total`}
                        />
                        <Stat
                            label="Valor sob custódia"
                            value={brl(deposits.total_ativas)}
                            hint="Soma das cauções de contratos ativos"
                        />
                    </div>

                    {deposits.itens.length === 0 ? (
                        <div className="dd-empty" style={{ marginTop: 12 }}>Nenhuma caução registrada.</div>
                    ) : (
                        <div style={{ overflowX: 'auto', marginTop: 12 }}>
                            <table className="dd-table">
                                <thead>
                                    <tr>
                                        <th>Lead</th>
                                        <th>Contato</th>
                                        <th>Imóvel</th>
                                        <th>Corretor</th>
                                        <th>Aluguel</th>
                                        <th>Caução</th>
                                        <th>Início</th>
                                        <th>Fim</th>
                                        <th>Situação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deposits.itens.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.lead_name || '-'}</td>
                                            <td>{item.contact || '-'}</td>
                                            <td>{item.address}</td>
                                            <td>{item.broker_name || '-'}</td>
                                            <td>{brl(item.rent_value)}</td>
                                            <td>{brl(item.deposit_value)}</td>
                                            <td>{item.contract_start ? fmtDate(item.contract_start) : '-'}</td>
                                            <td>{item.contract_end ? fmtDate(item.contract_end) : '-'}</td>
                                            <td>{item.status === 'ativo' ? 'Ativo' : item.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </>
    );

        const exportExcel = async () => {
        if (!summary) return;

        try {
            setExporting(true);

            const mod = await import('exceljs');
            const ExcelJS = mod.default || mod;

            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Domus CRM';
            workbook.created = new Date();

            const MONEY = '"R$" #,##0.00';
            const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D2A4A' } };
            const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' } };

            const styleHeader = (row) => {
                row.eachCell((cell) => {
                    cell.fill = HEADER_FILL;
                    cell.font = HEADER_FONT;
                });
            };

            const setWidths = (sheet, widths) => {
                widths.forEach((width, index) => {
                    sheet.getColumn(index + 1).width = width;
                });
            };

            const addTitle = (sheet, title) => {
                sheet.addRow([title]).font = { bold: true, size: 14 };
                sheet.addRow([`Período: ${fmtDate(period.start)} a ${fmtDate(period.end)}`]);
                sheet.addRow([]);
            };

            const addSection = (sheet, text) => {
                sheet.addRow([text]).font = { bold: true, size: 12 };
            };

            const addTable = (sheet, headers, rows, moneyCols = []) => {
                styleHeader(sheet.addRow(headers));
                rows.forEach((row) => {
                    const added = sheet.addRow(row);
                    moneyCols.forEach((col) => {
                        added.getCell(col).numFmt = MONEY;
                    });
                });
                sheet.addRow([]);
            };

            const addKpis = (sheet, rows) => {
                styleHeader(sheet.addRow(['Indicador', 'Valor']));
                rows.forEach(([label, value, type]) => {
                    const added = sheet.addRow([label, value]);
                    if (type === 'money') added.getCell(2).numFmt = MONEY;
                    added.getCell(2).alignment = { horizontal: 'right' };
                });
                sheet.addRow([]);
            };

            const c = summary.consolidado;
            const v = summary.vendas;
            const a = summary.alugueis;
            const inv = summary.investimentos;

            // ---------- Consolidado ----------
            const sheetC = workbook.addWorksheet('Consolidado');
            setWidths(sheetC, [58, 22, 22]);
            addTitle(sheetC, 'Financeiro - Consolidado');
            addTable(
                sheetC,
                ['Indicador', 'Previsto', 'Caixa'],
                [
                    ['Receita de vendas (parte da imobiliária)', c.previsto.receita_vendas, c.caixa.receita_vendas],
                    ['Receita de aluguéis (taxa adm. menos comissão do corretor)', c.previsto.receita_alugueis, c.caixa.receita_alugueis],
                    ['Receita total', c.previsto.receita_total, c.caixa.receita_total],
                    ['Investimento', c.previsto.investimento, c.caixa.investimento],
                    ['Lucro', c.previsto.lucro, c.caixa.lucro],
                    ['ROI', pct(c.previsto.roi), pct(c.caixa.roi)]
                ],
                [2, 3]
            );
            addKpis(sheetC, [
                ['Vendas no período', v.quantidade, 'number'],
                ['Custo por venda', c.custo_por_venda === null ? '—' : c.custo_por_venda, 'money'],
                ['Leads no período', c.leads === null ? '—' : c.leads, 'number'],
                ['Custo por lead', c.custo_por_lead === null ? '—' : c.custo_por_lead, 'money']
            ]);

            // ---------- Vendas ----------
            const sheetV = workbook.addWorksheet('Vendas');
            setWidths(sheetV, [30, 24, 30, 24, 22, 22, 22, 22]);
            addTitle(sheetV, 'Financeiro - Vendas');
            addKpis(sheetV, [
                ['VGV (valor vendido)', v.vgv, 'money'],
                ['Comissão total', v.comissao_total, 'money'],
                ['Parte dos corretores', v.comissao_corretores, 'money'],
                ['Parte da imobiliária', v.comissao_imobiliaria, 'money'],
                ['Ticket médio', v.ticket_medio, 'money'],
                ['Quantidade de vendas', v.quantidade, 'number']
            ]);

            addSection(sheetV, 'Ranking por corretor');
            addTable(
                sheetV,
                ['Corretor', 'Vendas', 'VGV', 'Comissão do corretor', 'Comissão da imobiliária'],
                v.ranking.map((row) => [row.name, row.quantidade, row.vgv, row.comissao_corretor, row.comissao_imobiliaria]),
                [3, 4, 5]
            );

            addSection(sheetV, 'Evolução mensal');
            addTable(
                sheetV,
                ['Mês', 'Vendas', 'VGV', 'Comissão da imobiliária'],
                v.evolucao.map((row) => [monthLabel(row.month), row.quantidade, row.vgv, row.comissao_imobiliaria]),
                [3, 4]
            );

            addSection(sheetV, 'Vendas do período');
            addTable(
                sheetV,
                ['Data', 'Lead', 'Imóvel / descrição', 'Corretor', 'Valor da venda', 'Comissão total', 'Parte do corretor', 'Parte da imobiliária'],
                sales.map((sale) => [
                    fmtDate(sale.sale_date),
                    sale.lead_name || '',
                    sale.property_title || sale.description || '',
                    sale.broker_name || '',
                    Number(sale.sale_value),
                    Number(sale.commission_value),
                    Number(sale.broker_commission_value),
                    Number(sale.agency_commission_value)
                ]),
                [5, 6, 7, 8]
            );

            // ---------- Aluguéis ----------
            const sheetA = workbook.addWorksheet('Aluguéis');
            setWidths(sheetA, [42, 22, 24, 24, 26]);
            addTitle(sheetA, 'Financeiro - Aluguéis');
            addKpis(sheetA, [
                ['Registros no período', a.registros, 'number'],
                ['Taxa de administração (todos)', a.previsto.taxa_adm, 'money'],
                ['Comissões dos corretores (todos)', a.previsto.comissao_corretores, 'money'],
                ['Receita da imobiliária - prevista', a.previsto.receita_imobiliaria, 'money'],
                ['Receita da imobiliária - paga', a.pago.receita_imobiliaria, 'money'],
                ['Comissões já pagas', a.pago.comissao_corretores, 'money']
            ]);

            addSection(sheetA, 'Por situação do pagamento');
            addTable(
                sheetA,
                ['Situação', 'Registros', 'Valor dos aluguéis', 'Taxa de administração', 'Comissão dos corretores'],
                ['pendente', 'pago', 'atrasado'].map((key) => [
                    statusLabels[key],
                    a.por_status[key].qtd,
                    a.por_status[key].valor_aluguel,
                    a.por_status[key].taxa_adm,
                    a.por_status[key].comissao
                ]),
                [3, 4, 5]
            );

            addSection(sheetA, 'Receita por mês');
            addTable(
                sheetA,
                ['Mês', 'Prevista', 'Paga'],
                a.evolucao.map((row) => [monthLabel(row.month), row.previsto, row.pago]),
                [2, 3]
            );

            // ---------- Investimentos ----------
            const sheetI = workbook.addWorksheet('Investimentos');
            setWidths(sheetI, [30, 26, 30, 18, 22]);
            addTitle(sheetI, 'Financeiro - Investimentos');
            addKpis(sheetI, [
                ['Meta Ads (automático)', inv.meta.total, 'money'],
                ['Outros canais (manual)', inv.manual, 'money'],
                ['Investimento total', inv.total, 'money'],
                ['Meta Ads conectado', inv.meta.connected ? 'Sim' : 'Não', 'text']
            ]);

            addSection(sheetI, 'Lançamentos manuais');
            addTable(
                sheetI,
                ['Data', 'Canal', 'Descrição', 'Destino', 'Valor'],
                investments.map((item) => [
                    fmtDate(item.invest_date),
                    item.channel,
                    item.description || '',
                    targetLabels[item.target] || item.target,
                    Number(item.amount)
                ]),
                [5]
            );

                        // ---------- Aluguéis futuros ----------
            if (future) {
                const sheetF = workbook.addWorksheet('Aluguéis futuros');
                setWidths(sheetF, [34, 22, 22, 24, 22, 22, 24, 22, 22, 24]);

                sheetF.addRow(['Financeiro - Aluguéis futuros']).font = { bold: true, size: 14 };
                sheetF.addRow([`Período: ${fmtDate(future.period.start)} a ${fmtDate(future.period.end)} (${future.period.months} meses)`]);
                sheetF.addRow(['Mês cheio em cada mês de vigência, com o valor atual do aluguel e sem previsão de reajuste.']);
                sheetF.addRow([]);

                const fc = future.consolidado;

                addKpis(sheetF, [
                    ['Contratos no período', fc.contratos, 'number'],
                    ['Aluguéis (soma)', fc.aluguel_total, 'money'],
                    ['Taxa de administração', fc.taxa_adm, 'money'],
                    ['Comissão dos corretores', fc.comissao_corretores, 'money'],
                    ['Receita da imobiliária', fc.receita_imobiliaria, 'money'],
                    ['Repasse aos proprietários', fc.repasse_proprietarios, 'money']
                ]);

                addSection(sheetF, 'Mês a mês');
                styleHeader(sheetF.addRow([
                    'Mês',
                    'Contratos',
                    'Aluguéis',
                    'Taxa de administração',
                    'Comissão dos corretores',
                    'Receita da imobiliária',
                    'Repasse aos proprietários'
                ]));

                future.meses.forEach((row) => {
                    const added = sheetF.addRow([
                        monthLabel(row.month),
                        row.contratos,
                        row.aluguel_total,
                        row.taxa_adm,
                        row.comissao_corretores,
                        row.receita_imobiliaria,
                        row.repasse_proprietarios
                    ]);

                    [3, 4, 5, 6, 7].forEach((col) => {
                        added.getCell(col).numFmt = MONEY;
                    });
                });

                const totalRow = sheetF.addRow([
                    'Total do período',
                    fc.contratos,
                    fc.aluguel_total,
                    fc.taxa_adm,
                    fc.comissao_corretores,
                    fc.receita_imobiliaria,
                    fc.repasse_proprietarios
                ]);

                [3, 4, 5, 6, 7].forEach((col) => {
                    totalRow.getCell(col).numFmt = MONEY;
                });

                totalRow.font = { bold: true };
                sheetF.addRow([]);

                addSection(sheetF, 'Comissões por corretor');
                addTable(
                    sheetF,
                    ['Corretor', 'Contratos', 'Comissão no período'],
                    future.por_corretor.map((row) => [row.name, row.contratos, row.comissao]),
                    [3]
                );

                addSection(sheetF, 'Contratos considerados');
                addTable(
                    sheetF,
                    ['Imóvel', 'Inquilino', 'Corretor', 'Aluguel', 'Início', 'Fim', 'Meses no período', 'Taxa adm. no período', 'Comissão do corretor', 'Receita da imobiliária'],
                    future.contratos.map((contract) => [
                        contract.address,
                        contract.tenant_name || '',
                        contract.broker_name || '',
                        contract.rent_value,
                        contract.contract_start ? fmtDate(contract.contract_start) : '',
                        contract.contract_end ? fmtDate(contract.contract_end) : 'Sem data',
                        contract.meses_no_periodo,
                        contract.taxa_adm_total,
                        contract.comissao_corretor_total,
                        contract.receita_imobiliaria_total
                    ]),
                    [4, 8, 9, 10]
                );
            }

            // ---------- Cauções ----------
            if (deposits) {
                const sheetD = workbook.addWorksheet('Cauções');
                setWidths(sheetD, [28, 24, 34, 24, 20, 20, 16, 16, 14]);

                sheetD.addRow(['Financeiro - Controle de cauções']).font = { bold: true, size: 14 };
                sheetD.addRow([`Posição em ${fmtDate(todayStr())}`]);
                sheetD.addRow(['Controle administrativo apartado. As cauções não entram em receita, lucro, ROI nem comissões.']);
                sheetD.addRow([]);

                addKpis(sheetD, [
                    ['Cauções ativas', deposits.quantidade_ativas, 'number'],
                    ['Valor sob custódia (contratos ativos)', deposits.total_ativas, 'money'],
                    ['Cauções registradas no total', deposits.quantidade_total, 'number']
                ]);

                addSection(sheetD, 'Cauções');
                addTable(
                    sheetD,
                    ['Lead', 'Contato', 'Imóvel', 'Corretor', 'Aluguel', 'Caução', 'Início', 'Fim', 'Situação'],
                    deposits.itens.map((item) => [
                        item.lead_name || '',
                        item.contact || '',
                        item.address,
                        item.broker_name || '',
                        item.rent_value,
                        item.deposit_value,
                        item.contract_start ? fmtDate(item.contract_start) : '',
                        item.contract_end ? fmtDate(item.contract_end) : '',
                        item.status === 'ativo' ? 'Ativo' : item.status
                    ]),
                    [5, 6]
                );
            }

            // ---------- Download ----------
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `financeiro-domus_${period.start}_a_${period.end}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Erro ao exportar Excel:', err);
            setError('Nao foi possivel exportar o arquivo Excel.');
        } finally {
            setExporting(false);
        }
    };
        const renderDashboard = () => {
        const v = summary.vendas;
        const a = summary.alugueis;
        const c = summary.consolidado;
        const inv = summary.investimentos;

        const round2 = (n) => Math.round(n * 100) / 100;

        const monthMap = {};

        v.evolucao.forEach((row) => {
            monthMap[row.month] = (monthMap[row.month] || 0) + row.comissao_imobiliaria;
        });

        a.evolucao.forEach((row) => {
            monthMap[row.month] = (monthMap[row.month] || 0) + row.previsto;
        });

        const revenueByMonth = Object.keys(monthMap)
            .sort()
            .map((month) => ({ label: monthLabel(month), value: round2(monthMap[month]) }));

        const resultData = [
            { label: 'Receita', value: c.previsto.receita_total },
            { label: 'Investimento', value: c.previsto.investimento },
            { label: 'Lucro', value: c.previsto.lucro }
        ];

        const brokerData = v.ranking.map((row) => ({ label: row.name, value: row.vgv }));

        const commissionSplit = [
            { label: 'Corretores', value: round2(v.comissao_corretores + a.previsto.comissao_corretores) },
            { label: 'Imobiliária', value: round2(v.comissao_imobiliaria + a.previsto.receita_imobiliaria) }
        ].filter((item) => item.value > 0);

        const rentalStatus = ['pendente', 'pago', 'atrasado']
            .map((key) => ({ label: statusLabels[key], value: a.por_status[key].valor_aluguel }))
            .filter((item) => item.value > 0);

        const channelData = (invSummary?.manual?.by_channel || []).map((row) => ({
            label: row.channel,
            value: Number(row.total)
        }));

        if (inv.meta.connected && inv.meta.total > 0) {
            channelData.push({ label: 'Meta Ads', value: inv.meta.total });
        }

        return (
            <section className="dd-panel" style={{ marginTop: 24 }}>
                <h2 style={{ margin: '0 0 4px' }}>Dashboard de indicadores</h2>
                <p style={{ color: 'var(--dd-muted)', margin: 0, fontSize: 13 }}>
                    Período: {fmtDate(period.start)} a {fmtDate(period.end)}. Aluguéis considerados pelo cenário previsto.
                </p>

                <div style={chartsGrid}>
                    <ChartCard
                        title="Receita da imobiliária por mês"
                        data={revenueByMonth}
                        availableTypes={['bar', 'line', 'area']}
                        valueLabel="Receita"
                    />
                    <ChartCard
                        title="Receita, investimento e lucro"
                        data={resultData}
                        availableTypes={['bar']}
                        valueLabel="Valor"
                    />
                    <ChartCard
                        title="VGV por corretor"
                        data={brokerData}
                        availableTypes={['bar', 'pie']}
                        valueLabel="VGV"
                    />
                    <ChartCard
                        title="Divisão das comissões"
                        data={commissionSplit}
                        availableTypes={['pie', 'bar']}
                        valueLabel="Comissão"
                    />
                    <ChartCard
                        title="Aluguéis por situação"
                        data={rentalStatus}
                        availableTypes={['pie', 'bar']}
                        valueLabel="Valor dos aluguéis"
                    />
                    <ChartCard
                        title="Investimento por canal"
                        data={channelData}
                        availableTypes={['bar', 'pie']}
                        valueLabel="Investido"
                    />
                </div>
            </section>
        );
    };
    const tabs = [
        { key: 'consolidado', label: 'Consolidado' },
        { key: 'vendas', label: 'Vendas' },
        { key: 'alugueis', label: 'Aluguéis' },
        { key: 'investimentos', label: 'Investimentos' }
    ];

    return (
        <main className="dd-shell app-shell">
            <aside className="dd-sidebar">
                <div className="dd-brand">
                    <span className="dd-brand-mark">D</span>
                    <span className="dd-brand-name">Domus <span>CRM</span></span>
                </div>
                <nav className="dd-nav">
                    <button onClick={() => navigate('/dashboard')}>
                        <Icon name="calendar" /> Dashboard
                    </button>
                    <button onClick={() => navigate('/alugueis')}>
                        <Icon name="file" /> Alugueis
                    </button>
                    <button onClick={() => navigate('/financeiro')}>
                        <Icon name="money" /> Financeiro
                    </button>
                    <button onClick={() => navigate('/leads')}>
                        <Icon name="users" /> Leads
                        {newLeadsCount > 0 && <span className="dd-badge">{newLeadsCount}</span>}
                    </button>
                    <button onClick={() => navigate('/leads/novo')}>
                        <Icon name="userPlus" /> Novo lead
                    </button>
                    <button onClick={() => navigate('/catalogo')}>
                        <Icon name="file" /> Catalogo de imoveis
                    </button>
                    <button onClick={() => navigate('/tour-360')}>
                        <Icon name="vr" /> Tour Virtual 360°
                    </button>
                    <button onClick={() => navigate('/projetos-3d')}>
                        <Icon name="cube" /> Projetos 3D
                    </button>
                    <button onClick={() => navigate('/brokers')}>
                        <Icon name="users" /> Corretores
                    </button>
                    <button onClick={() => navigate('/ranking')}>
                        <Icon name="check" /> Ranking
                    </button>
                    <button onClick={() => navigate('/metas')}>
                        <Icon name="filter" /> Metas
                    </button>
                    <button onClick={() => navigate('/meta-ads')}>
                        <Icon name="facebook" /> Meta Ads
                    </button>
                    <button onClick={() => navigate('/perfil')}>
                        <Icon name="users" /> Perfil
                    </button>
                    <button onClick={() => navigate('/mensagens')}>
                        <Icon name="chat" /> Mensagens
                        {unreadCount > 0 && <span className="dd-badge">{unreadCount}</span>}
                    </button>
                </nav>
            </aside>

            <section className="dd-main">
                <header className="dd-header">
                    <div>
                        <h1 className="dd-title">Financeiro</h1>
                        <p className="dd-subtitle">
                            Período: {fmtDate(period.start)} a {fmtDate(period.end)}
                        </p>
                    </div>
                </header>

                {error && <div className="dd-alert-error">{error}</div>}

                <section className="dd-panel">
                    <div className="dd-analytics-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        <input
                            type="date"
                            className="dd-input"
                            style={{ colorScheme: 'dark', cursor: 'pointer' }}
                            onClick={openPicker}
                            value={draft.start}
                            onChange={(e) => setDraft((cur) => ({ ...cur, start: e.target.value }))}
                        />
                        <span style={{ color: 'var(--dd-muted)' }}>até</span>
                        <input
                            type="date"
                            className="dd-input"
                            style={{ colorScheme: 'dark', cursor: 'pointer' }}
                            onClick={openPicker}
                            value={draft.end}
                            onChange={(e) => setDraft((cur) => ({ ...cur, end: e.target.value }))}
                        />
                        <button className="dd-btn-small" onClick={applyDraft}>Aplicar</button>
                        <button className="dd-btn-small" onClick={() => applyPreset('month')}>Mês atual</button>
                        <button className="dd-btn-small" onClick={() => applyPreset('prev')}>Mês anterior</button>
                        <button className="dd-btn-small" onClick={() => applyPreset('year')}>Ano atual</button>
                        <button className="dd-btn-small" disabled={exporting || !summary} onClick={exportExcel}>
                        {exporting ? 'Exportando...' : 'Exportar Excel'}
                        </button>
                    </div>

                    <div className="dd-tabs" style={{ marginTop: 16 }}>
                        {tabs.map((item) => (
                            <button
                                key={item.key}
                                className={`dd-tab${tab === item.key ? ' active' : ''}`}
                                onClick={() => setTab(item.key)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ marginTop: 16 }}>
                        {loading && !summary ? (
                            <div className="dd-empty">Carregando financeiro...</div>
                        ) : !summary ? null : (
                            <>
                                {tab === 'consolidado' && renderConsolidado()}
                                {tab === 'vendas' && renderVendas()}
                                {tab === 'alugueis' && renderAlugueis()}
                                {tab === 'investimentos' && renderInvestimentos()}
                            </>
                        )}
                    </div>
                </section>

                {summary && renderDashboard()}
            </section>

            {showSale && (
                <div className="dd-modal-overlay" onClick={() => setShowSale(false)}>
                    <div className="dd-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dd-modal-header">
                            <h2>Registrar venda</h2>
                            <button className="dd-modal-close" onClick={() => setShowSale(false)}>×</button>
                        </div>

                        <div className="dd-modal-body" style={{ display: 'grid', gap: 10 }}>
                            {saleError && <div className="dd-alert-error">{saleError}</div>}

                            <select className="dd-input" value={saleForm.lead_id} onChange={(e) => selectSaleLead(e.target.value)}>
                                <option value="">Lead da venda *</option>
                                {saleOptions.leads.map((lead) => (
                                    <option key={lead.id} value={lead.id}>{lead.name}</option>
                                ))}
                            </select>

                            <select className="dd-input" value={saleForm.broker_id} onChange={(e) => updateSale('broker_id', e.target.value)}>
                                <option value="">Corretor</option>
                                {saleOptions.brokers.map((broker) => (
                                    <option key={broker.id} value={broker.id}>{broker.name}</option>
                                ))}
                            </select>

                            <select className="dd-input" value={saleForm.property_id} onChange={(e) => updateSale('property_id', e.target.value)}>
                                <option value="">Imóvel (opcional)</option>
                                {saleOptions.properties.map((property) => (
                                    <option key={property.id} value={property.id}>
                                        {property.title || property.name || `Imóvel ${property.id}`}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="text"
                                className="dd-input"
                                placeholder="Descrição"
                                value={saleForm.description}
                                onChange={(e) => updateSale('description', e.target.value)}
                            />

                            <input
                                type="number"
                                className="dd-input"
                                placeholder="Valor da venda (R$) *"
                                value={saleForm.sale_value}
                                onChange={(e) => updateSale('sale_value', e.target.value)}
                            />

                            <input
                                type="number"
                                className="dd-input"
                                placeholder="% de comissão da venda *"
                                value={saleForm.commission_percent}
                                onChange={(e) => updateSale('commission_percent', e.target.value)}
                            />

                            <input
                                type="number"
                                className="dd-input"
                                placeholder="% do corretor (padrão 50)"
                                value={saleForm.broker_percent}
                                onChange={(e) => updateSale('broker_percent', e.target.value)}
                            />

                            <input
                                type="date"
                                className="dd-input"
                                value={saleForm.sale_date}
                                onChange={(e) => updateSale('sale_date', e.target.value)}
                            />

                            <input
                                type="text"
                                className="dd-input"
                                placeholder="Observações"
                                value={saleForm.notes}
                                onChange={(e) => updateSale('notes', e.target.value)}
                            />

                            <div style={{ color: 'var(--dd-muted)', fontSize: 13 }}>
                                Comissão total: {brl(commissionTotal)} | Corretor: {brl(brokerPart)} | Imobiliária: {brl(agencyPart)}
                            </div>

                            <div className="dd-row-actions">
                                <button className="dd-btn-small" disabled={saving} onClick={submitSale}>
                                    {saving ? 'Salvando...' : 'Salvar venda'}
                                </button>
                                <button className="dd-btn-small" onClick={() => setShowSale(false)}>Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showInvestment && (
                <div className="dd-modal-overlay" onClick={() => setShowInvestment(false)}>
                    <div className="dd-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dd-modal-header">
                            <h2>Novo investimento</h2>
                            <button className="dd-modal-close" onClick={() => setShowInvestment(false)}>×</button>
                        </div>

                        <div className="dd-modal-body" style={{ display: 'grid', gap: 10 }}>
                            {invError && <div className="dd-alert-error">{invError}</div>}

                            <input
                                type="text"
                                className="dd-input"
                                list="dd-channel-options"
                                placeholder="Canal (ex.: Google Ads) *"
                                value={invForm.channel}
                                onChange={(e) => updateInv('channel', e.target.value)}
                            />
                            <datalist id="dd-channel-options">
                                <option value="Google Ads" />
                                <option value="TikTok Ads" />
                                <option value="Portais imobiliários" />
                                <option value="Panfletos" />
                                <option value="Outdoor" />
                                <option value="Eventos" />
                                <option value="Outros" />
                            </datalist>

                            <input
                                type="text"
                                className="dd-input"
                                placeholder="Descrição"
                                value={invForm.description}
                                onChange={(e) => updateInv('description', e.target.value)}
                            />

                            <input
                                type="number"
                                className="dd-input"
                                placeholder="Valor (R$) *"
                                value={invForm.amount}
                                onChange={(e) => updateInv('amount', e.target.value)}
                            />

                            <select className="dd-input" value={invForm.target} onChange={(e) => updateInv('target', e.target.value)}>
                                <option value="geral">Destino: Geral</option>
                                <option value="venda">Destino: Vendas</option>
                                <option value="aluguel">Destino: Aluguéis</option>
                            </select>

                            <input
                                type="date"
                                className="dd-input"
                                value={invForm.invest_date}
                                onChange={(e) => updateInv('invest_date', e.target.value)}
                            />

                            <div className="dd-row-actions">
                                <button className="dd-btn-small" disabled={saving} onClick={submitInvestment}>
                                    {saving ? 'Salvando...' : 'Salvar investimento'}
                                </button>
                                <button className="dd-btn-small" onClick={() => setShowInvestment(false)}>Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <RemindersWidget />
        </main>
    );
}

export default Financeiro;