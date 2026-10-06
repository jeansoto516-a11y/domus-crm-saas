import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';
import RemindersWidget from '../components/RemindersWidget';
import '../styles/dark-theme.css';
import Icon from '../components/Icon';
import ChartCard from '../components/ChartCard';
import OnboardingTour from '../components/OnboardingTour';

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

function Dashboard() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [error, setError] = useState('');

  const [analyticsFilters, setAnalyticsFilters] = useState({ startDate: '', endDate: '' });
  const [analyticsData, setAnalyticsData] = useState({ timeseries: [], byStatus: {}, byTemperature: {} });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [showTour, setShowTour] = useState(false);

  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }, [navigate]);

    useEffect(() => {
    if (user?.role === 'super_admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  useEffect(() => {
    api.get('/users/me')
      .then((res) => {
        if (!res.data.user.onboarding_completed_at) {
          setShowTour(true);
        }
      })
      .catch(() => {});
  }, []);

  const finishTour = () => {
    setShowTour(false);
    api.put('/users/me/onboarding-complete').catch(() => {});
  };

  const adminTourSteps = [
    { selector: '[data-tour="nav-dashboard"]', title: 'Dashboard', text: 'Aqui voce acompanha os indicadores gerais: leads, conversao, imoveis e analises com graficos.' },
    { selector: '[data-tour="nav-leads"]', title: 'Leads', text: 'Veja todos os leads da imobiliaria em cards, com historico, mapeamento e sugestoes de imoveis.' },
    { selector: '[data-tour="nav-leads-novo"]', title: 'Novo lead', text: 'Cadastre um lead manualmente preenchendo o mapeamento completo de busca.' },
    { selector: '[data-tour="nav-catalogo"]', title: 'Catalogo de imoveis', text: 'Cadastre imoveis com fotos. Eles alimentam o matching automatico com os leads e a vitrine publica.' },
    { selector: '[data-tour="nav-brokers"]', title: 'Corretores', text: 'Cadastre e gerencie os corretores da sua equipe, definindo o acesso de cada um (vendas, alugueis ou ambos).' },
    { selector: '[data-tour="nav-ranking"]', title: 'Ranking', text: 'Acompanhe o desempenho de cada corretor: fechamentos, leads e imoveis cadastrados.' },
    { selector: '[data-tour="nav-metas"]', title: 'Metas', text: 'Defina metas mensais para a equipe e acompanhe o progresso de cada corretor.' },
    { selector: '[data-tour="nav-metaads"]', title: 'Meta Ads', text: 'Em breve: conecte sua conta do Meta Ads para ver o desempenho das campanhas direto aqui.' },
    { selector: '[data-tour="nav-perfil"]', title: 'Perfil', text: 'Aqui ficam seus dados, o link do catalogo publico da imobiliaria e o plano contratado.' },
    { selector: '[data-tour="nav-mensagens"]', title: 'Mensagens', text: 'Fale diretamente com a equipe do Domus por aqui.' }
  ];

  const brokerTourSteps = [
    { selector: '[data-tour="nav-dashboard"]', title: 'Dashboard', text: 'Aqui voce acompanha seus indicadores: seus leads, conversao e analises.' },
    { selector: '[data-tour="nav-leads"]', title: 'Leads', text: 'Veja seus leads em cards, com historico, mapeamento de busca e sugestoes automaticas de imoveis compativeis.' },
    { selector: '[data-tour="nav-leads-novo"]', title: 'Novo lead', text: 'Cadastre um lead manualmente preenchendo o mapeamento completo de busca.' },
    { selector: '[data-tour="nav-catalogo"]', title: 'Catalogo de imoveis', text: 'Veja e cadastre imoveis. Eles sao usados no matching automatico com seus leads.' },
    { selector: '[data-tour="nav-ranking"]', title: 'Ranking', text: 'Veja sua posicao no ranking da equipe e seus numeros do mes.' },
    { selector: '[data-tour="nav-perfil"]', title: 'Perfil', text: 'Aqui fica seu link pessoal de divulgacao do catalogo — leads que vierem por ele caem direto na sua lista.' },
    { selector: '[data-tour="nav-mensagens"]', title: 'Mensagens', text: 'Fale diretamente com a equipe do Domus por aqui.' }
  ];

  const tourSteps = user.role === 'admin' ? adminTourSteps : brokerTourSteps;

  useEffect(() => {
    let active = true;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/leads/dashboard', { params: filters });
        if (active) setData(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          logout();
          return;
        }
        if (active) {
          setError(err.response?.data?.error || 'Nao foi possivel carregar o dashboard.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDashboard();

    return () => {
      active = false;
    };
    }, [filters, logout]);

  useEffect(() => {
    let active = true;

    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        const [timeseriesRes, dashboardRes] = await Promise.all([
          api.get('/leads/timeseries', { params: analyticsFilters }),
          api.get('/leads/dashboard', { params: analyticsFilters })
        ]);

        if (!active) return;

        setAnalyticsData({
          timeseries: timeseriesRes.data.map((item) => ({
            label: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value: item.total
          })),
          byStatus: dashboardRes.data.por_status || {},
          byTemperature: dashboardRes.data.por_temperatura || {}
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
  }, [analyticsFilters]);

  const updateAnalyticsFilter = (event) => {
    const { name, value } = event.target;
    setAnalyticsFilters((current) => ({ ...current, [name]: value }));
  };

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

  const total = data?.total || 0;
  const conversion = data?.conversao || '0%';
  const byStatus = data?.por_status || {};
  const byTemperature = data?.por_temperatura || {};
  const properties = data?.imoveis || { total: 0, por_status: {} };

  const roleLabel = user.role === 'admin' ? 'Gestor(a)' : 'Corretor(a)';
  const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';

    const todayLabel = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const tempLabels = { frio: 'Frio', morno: 'Morno', quente: 'Quente' };

  const statusChartData = Object.entries(statusLabels).map(([key, label]) => ({
    label,
    value: analyticsData.byStatus[key] || 0
  }));

  const temperatureChartData = Object.entries(tempLabels).map(([key, label]) => ({
    label,
    value: analyticsData.byTemperature[key] || 0
  }));

  return (
    <main className="dd-shell app-shell">
      <aside className="dd-sidebar">
        <div className="dd-brand">
          <span className="dd-brand-mark">D</span>
          <span className="dd-brand-name">Domus <span>CRM</span></span>
        </div>

                <nav className="dd-nav">
          <button className="active" data-tour="nav-dashboard" onClick={() => navigate('/dashboard')}>
            <Icon name="calendar" /> Dashboard
          </button>
          <button onClick={() => navigate('/alugueis')}>
            <Icon name="file" /> Alugueis
          </button>
          <button data-tour="nav-leads" onClick={() => navigate('/leads')}>
            <Icon name="users" /> Leads
            {newLeadsCount > 0 && <span className="dd-badge">{newLeadsCount}</span>}
          </button>
          <button data-tour="nav-leads-novo" onClick={() => navigate('/leads/novo')}>
            <Icon name="userPlus" /> Novo lead
          </button>
          <button data-tour="nav-catalogo" onClick={() => navigate('/catalogo')}>
            <Icon name="file" /> Catalogo de imoveis
          </button>
          <button data-tour="nav-brokers" onClick={() => navigate('/brokers')}>
            <Icon name="users" /> Corretores
          </button>
          <button data-tour="nav-ranking" onClick={() => navigate('/ranking')}>
            <Icon name="check" /> Ranking
          </button>
          <button data-tour="nav-metas" onClick={() => navigate('/metas')}>
            <Icon name="filter" /> Metas
          </button>
          <button data-tour="nav-metaads" onClick={() => navigate('/meta-ads')}>
          <Icon name="facebook" /> Meta Ads
          </button>
          <button data-tour="nav-perfil" onClick={() => navigate('/perfil')}>
            <Icon name="users" /> Perfil
          </button>
          <button data-tour="nav-mensagens" onClick={() => navigate('/mensagens')}>
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
            <h1 className="dd-title">Dashboard</h1>
            <p className="dd-subtitle">Acompanhe o desempenho da sua equipe e o progresso dos seus leads.</p>
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
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

        {error && <div className="alert error">{error}</div>}

        {loading ? (
          <div className="dd-panel">Carregando indicadores...</div>
        ) : (
          <>
            <section className="dd-grid-3">
              <article className="dd-card">
                <div className="dd-card-top">
                  <span className="dd-icon-badge" style={{ background: '#2F6FED' }}><Icon name="users" /></span>
                </div>
                <span className="dd-card-label">Total de leads</span>
                <strong className="dd-card-value">{total}</strong>
                <p className="dd-card-desc">Leads cadastrados no periodo selecionado.</p>
              </article>

              <article className="dd-card">
                <div className="dd-card-top">
                  <span className="dd-icon-badge" style={{ background: '#0D9488' }}><Icon name="chat" /></span>
                </div>
                <span className="dd-card-label">Conversao</span>
                <strong className="dd-card-value">{conversion}</strong>
                <p className="dd-card-desc">Percentual de leads que finalizaram em fechado.</p>
              </article>

                            <article className="dd-card">
                <div className="dd-card-top">
                  <span className="dd-icon-badge" style={{ background: '#4C4FE0' }}><Icon name="calendar" /></span>
                </div>
                <span className="dd-card-label">Em negociacao</span>
                <strong className="dd-card-value">{(byStatus.visita || 0) + (byStatus.proposta || 0)}</strong>
                <p className="dd-card-desc">Oportunidades em visita ou proposta.</p>
              </article>

              <article className="dd-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/meta-ads')}>
                <div className="dd-card-top">
                  <span className="dd-icon-badge" style={{ background: '#1877F2' }}>f</span>
                </div>
                <span className="dd-card-label">Meta Ads</span>
                <strong className="dd-card-value">Ver campanhas</strong>
                <p className="dd-card-desc">Desempenho do trafego pago no Facebook e Instagram.</p>
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
                  <h2><Icon name="filter" /> Funil de vendas</h2>
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
                  <p>Classificacao dos leads pelo Lead Scoring.</p>
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
                  <h2>Imoveis no catalogo</h2>
                  <p>Distribuicao dos imoveis cadastrados por status.</p>
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
                  <strong className="dd-card-value">{properties.total}</strong>
                </article>
              </section>

              <div className="dd-temp-grid">
                <div className="dd-temp-card" style={{ borderColor: '#0D9488' }}>
                  <div>
                    <div className="dd-temp-value">{properties.por_status.disponivel || 0}</div>
                    <p className="dd-temp-label">Disponiveis.</p>
                  </div>
                </div>

                <div className="dd-temp-card" style={{ borderColor: '#D97706' }}>
                  <div>
                    <div className="dd-temp-value">{properties.por_status.reservado || 0}</div>
                    <p className="dd-temp-label">Reservados.</p>
                  </div>
                </div>

                <div className="dd-temp-card" style={{ borderColor: '#7f1d1d' }}>
                  <div>
                    <div className="dd-temp-value">{properties.por_status.vendido || 0}</div>
                    <p className="dd-temp-label">Vendidos.</p>
                  </div>
                </div>

                <div className="dd-temp-card" style={{ borderColor: '#7f1d1d' }}>
                  <div>
                    <div className="dd-temp-value">{properties.por_status.alugado || 0}</div>
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
                    title="Leads registrados no periodo"
                    data={analyticsData.timeseries}
                    availableTypes={['line', 'bar', 'area']}
                    valueLabel="Leads"
                  />
                  <ChartCard
                    title="Leads por status"
                    data={statusChartData}
                    availableTypes={['bar', 'pie', 'line']}
                    valueLabel="Leads"
                  />
                  <ChartCard
                    title="Leads por temperatura"
                    data={temperatureChartData}
                    availableTypes={['pie', 'bar']}
                    valueLabel="Leads"
                    colors={['#3498db', '#f1c40f', '#e74c3c']}
                  />
                </div>
              )}
            </section>
          </>
        )}
      </section>
      {showTour && <OnboardingTour steps={tourSteps} onFinish={finishTour} />}
      <RemindersWidget />
    </main>
  );
}

export default Dashboard;