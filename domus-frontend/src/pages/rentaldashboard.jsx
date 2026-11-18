import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';
import RemindersWidget from '../components/RemindersWidget';
import Icon from '../components/Icon';
import ChartCard from '../components/ChartCard';
import '../styles/dark-theme.css';

const statusLabels = {
    novo: 'Novos',
    contato: 'Em contato',
    visita: 'Visitas',
    proposta: 'Propostas',
    fechado: 'Fechados'
};

const funnelColors = {
    novo: '#2F6FED',
    contato: '#4C4FE0',
    visita: '#7C3AED',
    proposta: '#B0389E',
    fechado: '#0D9488'
};

const tempLabels = { frio: 'Frio', morno: 'Morno', quente: 'Quente' };

const paymentLabels = { pendente: 'Pendentes', pago: 'Pagos', atrasado: 'Atrasados' };

const formatCurrency = (value) =>
    Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const pad = (n) => String(n).padStart(2, '0');

const localDateKey = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const monthKey = (value) => String(value || '').slice(0, 7);

const monthLabel = (key) => {
    const [y, m] = key.split('-');
    return `${m}/${y}`;
};

const round2 = (n) => Math.round(n * 100) / 100;

function countBy(list, field) {
    return list.reduce((acc, item) => {
    const key = item[field];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
    }, {});
}

function buildTimeseries(leads) {
    const map = {};

    leads.forEach((lead) => {
    const key = localDateKey(lead.created_at);
    if (key) map[key] = (map[key] || 0) + 1;
    });

    return Object.keys(map)
    .sort()
    .map((key) => {
        const [, m, d] = key.split('-');
        return { label: `${d}/${m}`, value: map[key] };
    });
}

function filterPaymentsByPeriod(payments, startDate, endDate) {
    const startKey = startDate ? startDate.slice(0, 7) : '';
    const endKey = endDate ? endDate.slice(0, 7) : '';

    return payments.filter((payment) => {
    const key = monthKey(payment.reference_month);
    if (startKey && key < startKey) return false;
    if (endKey && key > endKey) return false;
    return true;
    });
}

function RentalDashboard() {
    const [data, setData] = useState(null);
    const [leads, setLeads] = useState([]);
    const [properties, setProperties] = useState([]);
    const [filters, setFilters] = useState({ startDate: '', endDate: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [newLeadsCount, setNewLeadsCount] = useState(0);

    const [analyticsFilters, setAnalyticsFilters] = useState({ startDate: '', endDate: '' });
    const [analyticsData, setAnalyticsData] = useState({ leads: [], payments: [], ranking: [] });
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    const navigate = useNavigate();

    const user = useMemo(() => {
    try {
        return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
        return {};
    }
    }, []);

    const isAdmin = user.role === 'admin';

    const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    }, [navigate]);

    useEffect(() => {
    let active = true;

    const fetchMain = async () => {
        try {
        setLoading(true);
        setError('');

        const [rentalRes, leadsRes, propertiesRes] = await Promise.all([
            api.get('/rentals/dashboard'),
            api.get('/leads', { params: { lead_type: 'aluguel', ...filters } }),
            api.get('/properties', { params: { lead_type: 'aluguel' } }).catch(() => ({ data: [] }))
        ]);

        if (!active) return;

        setData(rentalRes.data);
        setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : []);
        setProperties(Array.isArray(propertiesRes.data) ? propertiesRes.data : []);
        } catch (err) {
        if (err.response?.status === 401) {
            logout();
            return;
        }

        if (active) {
            setError(err.response?.data?.error || 'Nao foi possivel carregar o dashboard de alugueis.');
        }
        } finally {
        if (active) setLoading(false);
        }
    };

    fetchMain();

    return () => {
        active = false;
    };
    }, [filters, logout]);

    useEffect(() => {
    let active = true;

    const fetchAnalytics = async () => {
        try {
        setAnalyticsLoading(true);

        const [leadsRes, paymentsRes, rankingRes] = await Promise.all([
            api.get('/leads', { params: { lead_type: 'aluguel', ...analyticsFilters } }),
            api.get('/rentals/payments').catch(() => ({ data: [] })),
            isAdmin
            ? api.get('/rentals/ranking').catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] })
        ]);

        if (!active) return;

        setAnalyticsData({
            leads: Array.isArray(leadsRes.data) ? leadsRes.data : [],
            payments: Array.isArray(paymentsRes.data) ? paymentsRes.data : [],
            ranking: Array.isArray(rankingRes.data) ? rankingRes.data : []
        });
        } catch (err) {
        if (active) {
            setError(err.response?.data?.error || 'Nao foi possivel carregar a analise.');
        }
        } finally {
        if (active) setAnalyticsLoading(false);
        }
    };

    fetchAnalytics();

    return () => {
        active = false;
    };
    }, [analyticsFilters, isAdmin]);

    useEffect(() => {
    const checkUnread = () => {
        api.get('/messages/unread-count')
        .then((res) => setUnreadCount(res.data.unread))
        .catch(() => {});
    };

    checkUnread();
    const interval = setInterval(checkUnread, 10000);
    return () => clearInterval(interval);
    }, []);

    useEffect(() => {
    const checkNewLeads = () => {
        api.get('/leads/new-count')
        .then((res) => setNewLeadsCount(res.data.count))
        .catch(() => {});
    };

    checkNewLeads();
    const interval = setInterval(checkNewLeads, 10000);
    return () => clearInterval(interval);
    }, []);

    const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
    };

    const updateAnalyticsFilter = (event) => {
    const { name, value } = event.target;
    setAnalyticsFilters((current) => ({ ...current, [name]: value }));
    };

  // ---------- Dados do topo ----------
    const total = leads.length;
    const byStatus = useMemo(() => countBy(leads, 'status'), [leads]);
    const byTemperature = useMemo(() => countBy(leads, 'temperature'), [leads]);
    const propertyStatus = useMemo(() => countBy(properties, 'status'), [properties]);

    const conversion = total > 0
    ? `${(((byStatus.fechado || 0) / total) * 100).toFixed(2)}%`
    : '0%';

    const totalImoveis = data?.total_imoveis || 0;
    const imoveisAtivos = data?.imoveis_ativos || 0;
    const somaAlugueis = data?.soma_alugueis || 0;
    const mesAtual = data?.mes_atual || {
    pendente: 0,
    pago: 0,
    atrasado: 0,
    receita_administracao_mes: 0,
    total_comissao_corretores_mes: 0
    };

    const roleLabel = isAdmin ? 'Gestor(a)' : 'Corretor(a)';
    const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';

    const todayLabel = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
    });

  // ---------- Dados da analise ----------
    const analyticsStatus = countBy(analyticsData.leads, 'status');
    const analyticsTemperature = countBy(analyticsData.leads, 'temperature');

    const timeseriesData = buildTimeseries(analyticsData.leads);

    const statusChartData = Object.entries(statusLabels).map(([key, label]) => ({
    label,
    value: analyticsStatus[key] || 0
    }));

    const temperatureChartData = Object.entries(tempLabels).map(([key, label]) => ({
    label,
    value: analyticsTemperature[key] || 0
    }));

    const periodPayments = filterPaymentsByPeriod(
    analyticsData.payments,
    analyticsFilters.startDate,
    analyticsFilters.endDate
    );

    const paymentStatusData = Object.entries(paymentLabels).map(([key, label]) => ({
    label,
    value: periodPayments.filter((payment) => payment.status === key).length
    }));

    const adminRevenueMap = {};

    periodPayments.forEach((payment) => {
    const key = monthKey(payment.reference_month);
    if (key) adminRevenueMap[key] = (adminRevenueMap[key] || 0) + Number(payment.admin_fee_value || 0);
    });

    const adminRevenueData = Object.keys(adminRevenueMap)
    .sort()
    .map((key) => ({ label: monthLabel(key), value: round2(adminRevenueMap[key]) }));

    const brokerRankingData = analyticsData.ranking.map((row) => ({
    label: row.name,
    value: Number(row.imoveis_ativos) || 0
    }));

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
            <button className="active" onClick={() => navigate('/alugueis')}>
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
        <button className="dd-logout" onClick={logout}>Sair</button>
        </aside>

        <section className="dd-main">
        <header className="dd-header">
            <div>
            <p className="dd-greeting">Ola, {user.name || 'bem-vindo(a)'}.</p>
            <h1 className="dd-title">Dashboard de Alugueis</h1>
            <p className="dd-subtitle">Acompanhe os leads de aluguel e os imoveis administrados.</p>
            </div>

            <div className="dd-header-right">
            <div className="dd-date-pill">
                <Icon name="calendar" />
                Hoje, {todayLabel}
            </div>
            <div className="dd-user-pill">
                <span className="dd-avatar">
                {user.avatar_url ? <img src={user.avatar_url} alt={user.name} /> : initial}
                </span>
                <div>
                <div className="dd-user-name">{user.name || 'Usuario'}</div>
                <div className="dd-user-role">{roleLabel}</div>
                </div>
            </div>
            </div>
        </header>

        <TrialBanner />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button className="dd-btn-primary" onClick={() => navigate('/alugueis/imoveis')}>
                Ver imoveis
            </button>
            <button className="dd-btn-secondary" onClick={() => navigate('/alugueis/pagamentos')}>
                Ver pagamentos
            </button>
            <button className="dd-btn-secondary" onClick={() => navigate('/alugueis/ranking')}>
                Ver ranking
            </button>
            </div>

            <button className="dd-filter-toggle" onClick={() => setShowFilters((v) => !v)}>
            <Icon name="filter" /> Filtros
            </button>
        </div>

        {showFilters && (
            <div className="dd-filters-panel">
            <label>
                Inicio
                <input name="startDate" onChange={updateFilter} type="date" value={filters.startDate} />
            </label>
            <label>
                Fim
                <input name="endDate" onChange={updateFilter} type="date" value={filters.endDate} />
            </label>
            <button onClick={() => setFilters({ startDate: '', endDate: '' })}>
                Limpar filtros
            </button>
            </div>
        )}

        {error && <div className="dd-alert-error">{error}</div>}

        {loading ? (
            <div className="dd-panel">Carregando indicadores...</div>
        ) : (
            <>
            <section className="dd-grid-3">
                <article className="dd-card">
                <div className="dd-card-top">
                    <span className="dd-icon-badge" style={{ background: '#2F6FED' }}><Icon name="users" /></span>
                </div>
                <span className="dd-card-label">Total de leads de aluguel</span>
                <strong className="dd-card-value">{total}</strong>
                <p className="dd-card-desc">Leads de aluguel no periodo selecionado.</p>
                </article>

                <article className="dd-card">
                <div className="dd-card-top">
                    <span className="dd-icon-badge" style={{ background: '#0D9488' }}><Icon name="chat" /></span>
                </div>
                <span className="dd-card-label">Conversao</span>
                <strong className="dd-card-value">{conversion}</strong>
                <p className="dd-card-desc">Percentual de leads de aluguel que finalizaram em fechado.</p>
                </article>

                <article className="dd-card">
                <div className="dd-card-top">
                    <span className="dd-icon-badge" style={{ background: '#4C4FE0' }}><Icon name="calendar" /></span>
                </div>
                <span className="dd-card-label">Em negociacao</span>
                <strong className="dd-card-value">{(byStatus.visita || 0) + (byStatus.proposta || 0)}</strong>
                <p className="dd-card-desc">Oportunidades em visita ou proposta.</p>
                </article>

                <article className="dd-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/alugueis/imoveis')}>
                <div className="dd-card-top">
                    <span className="dd-icon-badge" style={{ background: '#7C3AED' }}><Icon name="file" /></span>
                </div>
                <span className="dd-card-label">Imoveis ativos</span>
                <strong className="dd-card-value">{imoveisAtivos}</strong>
                <p className="dd-card-desc">Contratos em andamento. Clique para ver os imoveis.</p>
                </article>
            </section>

            <section className="dd-grid-5">
                <article className="dd-card">
                <div className="dd-card-top">
                    <span className="dd-icon-badge" style={{ background: '#2F6FED' }}><Icon name="userPlus" /></span>
                </div>
                <span className="dd-card-label">Novos</span>
                <strong className="dd-card-value">{byStatus.novo || 0}</strong>
                <p className="dd-card-desc">Leads aguardando primeiro contato.</p>
                </article>

                <article className="dd-card">
                <div className="dd-card-top">
                    <span className="dd-icon-badge" style={{ background: '#4C4FE0' }}><Icon name="phone" /></span>
                </div>
                <span className="dd-card-label">Em contato</span>
                <strong className="dd-card-value">{byStatus.contato || 0}</strong>
                <p className="dd-card-desc">Leads em atendimento.</p>
                </article>

                <article className="dd-card">
                <div className="dd-card-top">
                    <span className="dd-icon-badge" style={{ background: '#7C3AED' }}><Icon name="calendar" /></span>
                </div>
                <span className="dd-card-label">Visitas</span>
                <strong className="dd-card-value">{byStatus.visita || 0}</strong>
                <p className="dd-card-desc">Leads em visitas.</p>
                </article>

                <article className="dd-card">
                <div className="dd-card-top">
                    <span className="dd-icon-badge" style={{ background: '#B0389E' }}><Icon name="file" /></span>
                </div>
                <span className="dd-card-label">Propostas</span>
                <strong className="dd-card-value">{byStatus.proposta || 0}</strong>
                <p className="dd-card-desc">Leads em proposta.</p>
                </article>

                <article className="dd-card">
                <div className="dd-card-top">
                    <span className="dd-icon-badge" style={{ background: '#0D9488' }}><Icon name="check" /></span>
                </div>
                <span className="dd-card-label">Fechados</span>
                <strong className="dd-card-value">{byStatus.fechado || 0}</strong>
                <p className="dd-card-desc">Leads convertidos.</p>
                </article>
            </section>

            <section className="dd-panel">
                <div className="dd-panel-head">
                <div>
                    <h2><Icon name="filter" /> Funil de alugueis</h2>
                    <p>Distribuicao atual por etapa.</p>
                </div>
                <button className="dd-link-button" onClick={() => navigate('/leads')}>
                    Ver todos os leads
                </button>
                </div>

                <div className="dd-funnel-row">
                {Object.entries(statusLabels).map(([status, label]) => {
                    const count = byStatus[status] || 0;
                  const pct = total ? Math.round((count / total) * 100) : 0;
                    return (
                    <div className="dd-funnel-seg" key={status} style={{ background: funnelColors[status] }}>
                        <span className="dd-icon-badge">
                        <Icon name={status === 'fechado' ? 'check' : status === 'proposta' ? 'file' : status === 'visita' ? 'calendar' : status === 'contato' ? 'phone' : 'userPlus'} />
                        </span>
                        <span className="dd-funnel-label">{label}</span>
                        <span className="dd-funnel-value">{count}</span>
                        <span className="dd-funnel-pct">{pct}%</span>
                    </div>
                    );
                })}
                </div>
            </section>

            <section className="dd-panel">
                <div className="dd-panel-head">
                <div>
                    <h2>Temperatura dos leads</h2>
                    <p>Classificacao dos leads de aluguel pelo Lead Scoring.</p>
                </div>
                <button className="dd-link-button" onClick={() => navigate('/leads')}>
                    Ver todos os leads
                </button>
                </div>

                <div className="dd-temp-grid">
                <div className="dd-temp-card" style={{ borderColor: '#2F6FED' }}>
                    <span className="dd-icon-badge" style={{ background: '#2F6FED' }}><Icon name="snow" /></span>
                    <div>
                    <div className="dd-temp-value">{byTemperature.frio || 0}</div>
                    <p className="dd-temp-label">Leads frios.</p>
                    </div>
                </div>

                <div className="dd-temp-card" style={{ borderColor: '#D97706' }}>
                    <span className="dd-icon-badge" style={{ background: '#D97706' }}><Icon name="sun" /></span>
                    <div>
                    <div className="dd-temp-value">{byTemperature.morno || 0}</div>
                    <p className="dd-temp-label">Leads mornos.</p>
                    </div>
                </div>

                <div className="dd-temp-card" style={{ borderColor: '#E11D48' }}>
                    <span className="dd-icon-badge" style={{ background: '#E11D48' }}><Icon name="flame" /></span>
                    <div>
                    <div className="dd-temp-value">{byTemperature.quente || 0}</div>
                    <p className="dd-temp-label">Leads quentes.</p>
                    </div>
                </div>
                </div>
            </section>

            <section className="dd-panel">
                <div className="dd-panel-head">
                <div>
                    <h2>Administracao de imoveis</h2>
                    <p>Imoveis administrados e pagamentos do mes atual.</p>
                </div>
                <button className="dd-link-button" onClick={() => navigate('/alugueis/pagamentos')}>
                    Ver pagamentos
                </button>
                </div>

                <section className="dd-grid-3" style={{ marginBottom: 16 }}>
                <article className="dd-card">
                    <div className="dd-card-top">
                    <span className="dd-icon-badge" style={{ background: '#2F6FED' }}><Icon name="file" /></span>
                    </div>
                    <span className="dd-card-label">Total de imoveis</span>
                    <strong className="dd-card-value">{totalImoveis}</strong>
                    <p className="dd-card-desc">Imoveis cadastrados no sistema.</p>
                </article>

                <article className="dd-card">
                    <div className="dd-card-top">
                    <span className="dd-icon-badge" style={{ background: '#0D9488' }}><Icon name="check" /></span>
                    </div>
                    <span className="dd-card-label">Imoveis ativos</span>
                    <strong className="dd-card-value">{imoveisAtivos}</strong>
                    <p className="dd-card-desc">Contratos em andamento.</p>
                </article>

                <article className="dd-card">
                    <div className="dd-card-top">
                    <span className="dd-icon-badge" style={{ background: '#7C3AED' }}><Icon name="money" /></span>
                    </div>
                    <span className="dd-card-label">Soma dos alugueis</span>
                    <strong className="dd-card-value">{formatCurrency(somaAlugueis)}</strong>
                    <p className="dd-card-desc">Valor total dos alugueis ativos.</p>
                </article>
                </section>

                <section className="dd-grid-3">
                <article className="dd-card">
                    <div className="dd-card-top">
                    <span className="dd-icon-badge" style={{ background: '#D97706' }}><Icon name="calendar" /></span>
                    </div>
                    <span className="dd-card-label">Pendentes (mes)</span>
                    <strong className="dd-card-value">{mesAtual.pendente}</strong>
                    <p className="dd-card-desc">Pagamentos ainda nao confirmados.</p>
                </article>

                <article className="dd-card">
                    <div className="dd-card-top">
                    <span className="dd-icon-badge" style={{ background: '#0D9488' }}><Icon name="check" /></span>
                    </div>
                    <span className="dd-card-label">Pagos (mes)</span>
                    <strong className="dd-card-value">{mesAtual.pago}</strong>
                    <p className="dd-card-desc">Pagamentos confirmados no mes.</p>
                </article>

                <article className="dd-card">
                    <div className="dd-card-top">
                    <span className="dd-icon-badge" style={{ background: '#E11D48' }}><Icon name="flame" /></span>
                    </div>
                    <span className="dd-card-label">Atrasados (mes)</span>
                    <strong className="dd-card-value">{mesAtual.atrasado}</strong>
                    <p className="dd-card-desc">Pagamentos em atraso.</p>
                </article>
                </section>
            </section>

            <section className="dd-panel">
                <div className="dd-panel-head">
                <div>
                    <h2>Financeiro do mes</h2>
                    <p>Receita de administracao e comissoes geradas neste mes.</p>
                </div>
                <button className="dd-link-button" onClick={() => navigate('/financeiro')}>
                    Ver financeiro
                </button>
                </div>

                <section className="dd-grid-3" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <article className="dd-card">
                    <span className="dd-card-label">Receita de administracao</span>
                    <strong className="dd-card-value">{formatCurrency(mesAtual.receita_administracao_mes)}</strong>
                    <p className="dd-card-desc">Ganho da imobiliaria no mes atual.</p>
                </article>

                <article className="dd-card">
                    <span className="dd-card-label">Comissao dos corretores</span>
                    <strong className="dd-card-value">{formatCurrency(mesAtual.total_comissao_corretores_mes)}</strong>
                    <p className="dd-card-desc">Total a pagar aos corretores no mes atual.</p>
                </article>
                </section>
            </section>

            <section className="dd-panel">
                <div className="dd-panel-head">
                <div>
                    <h2>Imoveis para aluguel no catalogo</h2>
                    <p>Distribuicao dos imoveis de aluguel por status.</p>
                </div>
                <button className="dd-link-button" onClick={() => navigate('/catalogo')}>
                    Ver catalogo
                </button>
                </div>

                <section className="dd-grid-3" style={{ marginBottom: 16 }}>
                <article className="dd-card">
                    <div className="dd-card-top">
                    <span className="dd-icon-badge" style={{ background: '#2F6FED' }}><Icon name="file" /></span>
                    </div>
                    <span className="dd-card-label">Total de imoveis</span>
                    <strong className="dd-card-value">{properties.length}</strong>
                </article>
                </section>

                <div className="dd-temp-grid">
                <div className="dd-temp-card" style={{ borderColor: '#0D9488' }}>
                    <div>
                    <div className="dd-temp-value">{propertyStatus.disponivel || 0}</div>
                    <p className="dd-temp-label">Disponiveis.</p>
                    </div>
                </div>

                <div className="dd-temp-card" style={{ borderColor: '#D97706' }}>
                    <div>
                    <div className="dd-temp-value">{propertyStatus.reservado || 0}</div>
                    <p className="dd-temp-label">Reservados.</p>
                    </div>
                </div>

                <div className="dd-temp-card" style={{ borderColor: '#7f1d1d' }}>
                    <div>
                    <div className="dd-temp-value">{propertyStatus.alugado || 0}</div>
                    <p className="dd-temp-label">Alugados.</p>
                    </div>
                </div>
                </div>
            </section>

            <section className="dd-panel">
                <div className="dd-panel-head">
                <div>
                    <h2>Analise geral</h2>
                    <p>Filtre por periodo.</p>
                </div>
                </div>

                <div className="dd-analytics-filters">
                <label>
                    Inicio
                    <input className="dd-input" name="startDate" onChange={updateAnalyticsFilter} type="date" value={analyticsFilters.startDate} />
                </label>
                <label>
                    Fim
                    <input className="dd-input" name="endDate" onChange={updateAnalyticsFilter} type="date" value={analyticsFilters.endDate} />
                </label>
                <button className="dd-btn-secondary" onClick={() => setAnalyticsFilters({ startDate: '', endDate: '' })}>
                    Limpar
                </button>
                </div>

                {analyticsLoading ? (
                <p style={{ color: 'var(--dd-muted)' }}>Carregando analise...</p>
                ) : (
                <div className="dd-charts-grid">
                    <ChartCard
                    title="Leads de aluguel registrados no periodo"
                    data={timeseriesData}
                    availableTypes={['line', 'bar', 'area']}
                    valueLabel="Leads"
                    />
                    <ChartCard
                    title="Leads de aluguel por status"
                    data={statusChartData}
                    availableTypes={['bar', 'pie', 'line']}
                    valueLabel="Leads"
                    />
                    <ChartCard
                    title="Leads de aluguel por temperatura"
                    data={temperatureChartData}
                    availableTypes={['pie', 'bar']}
                    valueLabel="Leads"
                    colors={['#3498db', '#f1c40f', '#e74c3c']}
                    />
                    <ChartCard
                    title="Pagamentos por situacao"
                    data={paymentStatusData}
                    availableTypes={['pie', 'bar']}
                    valueLabel="Pagamentos"
                    colors={['#f1c40f', '#0D9488', '#e74c3c']}
                    />
                    <ChartCard
                    title="Receita de administracao por mes"
                    data={adminRevenueData}
                    availableTypes={['bar', 'line', 'area']}
                    valueLabel="Receita"
                    />
                    {isAdmin && (
                    <ChartCard
                        title="Imoveis ativos por corretor"
                        data={brokerRankingData}
                        availableTypes={['bar', 'pie']}
                        valueLabel="Imoveis"
                    />
                    )}
                </div>
                )}
            </section>
            </>
        )}
        </section>
        <RemindersWidget />
    </main>
    );
}

export default RentalDashboard;