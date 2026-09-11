import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';
import RemindersWidget from '../components/RemindersWidget';
import '../styles/dark-theme.css';
import Icon from '../components/Icon';

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
  const [error, setError] = useState('');
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
    const checkUnread = () => {
      api.get('/messages/unread-count')
        .then((res) => setUnreadCount(res.data.unread))
        .catch(() => {});
    };

    checkUnread();
    const interval = setInterval(checkUnread, 10000);
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

  const roleLabel = user.role === 'admin' ? 'Gestor(a)' : 'Corretor(a)';
  const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';

  const todayLabel = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <main className="dd-shell app-shell">
      <aside className="dd-sidebar">
        <div className="dd-brand">
          <span className="dd-brand-mark">D</span>
          <span className="dd-brand-name">Domus <span>CRM</span></span>
        </div>

        <nav className="dd-nav">
          <button className="active" onClick={() => navigate('/dashboard')}>
            <Icon name="calendar" /> Dashboard
          </button>
          <button onClick={() => navigate('/alugueis')}>
            <Icon name="file" /> Alugueis
          </button>
          <button onClick={() => navigate('/leads')}>
            <Icon name="users" /> Leads
          </button>
          <button onClick={() => navigate('/leads/novo')}>
            <Icon name="userPlus" /> Novo lead
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
            <h1 className="dd-title">Dashboard</h1>
            <p className="dd-subtitle">Acompanhe o desempenho da sua equipe e o progresso dos seus leads.</p>
          </div>

          <div className="dd-header-right">
            <div className="dd-date-pill">
              <Icon name="calendar" />
              Hoje, {todayLabel}
            </div>
            <div className="dd-user-pill">
              <span className="dd-avatar">{initial}</span>
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
          </>
        )}
      </section>
      <RemindersWidget />
    </main>
  );
}

export default Dashboard;