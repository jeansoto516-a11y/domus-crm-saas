import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';



const statusLabels = {
  novo: 'Novos',
  contato: 'Em contato',
  visita: 'Visitas',
  proposta: 'Propostas',
  fechado: 'Fechados'
};

function Dashboard() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
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

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">D</span>
          <span>Domus CRM</span>
        </div>
        <nav className="side-nav">
            <button className="active" onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button onClick={() => navigate('/leads')}>Leads</button>
            <button onClick={() => navigate('/leads/novo')}>Novo lead</button>
            <button onClick={() => navigate('/brokers')}>Corretores</button>
            <button onClick={() => navigate('/mensagens')}>
            Mensagens
            {unreadCount > 0 && (
              <span style={{
                background: '#DC2626',
                color: '#fff',
                borderRadius: '999px',
                fontSize: 11,
                padding: '1px 7px',
                marginLeft: 6
              }}>
                {unreadCount}
              </span>
            )}
          </button>
        </nav>
        <button className="ghost-button full" onClick={logout}>Sair</button>
      </aside>

      <section className="workspace">
        <header className="workspace-header">
          <div>
            <span className="eyebrow">Visao comercial</span>
            <h1>Dashboard</h1>
            <p>{user.name ? `Ola, ${user.name}.` : 'Acompanhe a saude do funil.'}</p>
          </div>
          {user?.role === 'super_admin' && (
            <Link className="secondary-button" to="/admin">
              Painel do sistema
            </Link>
          )}
          <button className="primary-button" onClick={() => navigate('/leads/novo')}>
            Novo lead
          </button>
        </header>

        <TrialBanner />

        <section className="filters-bar">
          <label>
            Inicio
            <input name="startDate" onChange={updateFilter} type="date" value={filters.startDate} />
          </label>
          <label>
            Fim
            <input name="endDate" onChange={updateFilter} type="date" value={filters.endDate} />
          </label>
          <button className="secondary-button" onClick={() => setFilters({ startDate: '', endDate: '' })}>
            Limpar filtros
          </button>
        </section>

        {error && <div className="alert error">{error}</div>}

        {loading ? (
          <div className="empty-state">Carregando indicadores...</div>
        ) : (
          <>
            <section className="metrics-grid">
              <article className="metric-card">
                <span>Total de leads</span>
                <strong>{total}</strong>
                <p>Leads cadastrados no periodo selecionado.</p>
              </article>
              <article className="metric-card">
                <span>Conversao</span>
                <strong>{conversion}</strong>
                <p>Percentual de leads que chegaram em fechado.</p>
              </article>
              <article className="metric-card">
                <span>Em negociacao</span>
                <strong>{(byStatus.visita || 0) + (byStatus.proposta || 0)}</strong>
                <p>Oportunidades em visita ou proposta.</p>
              </article>
              <article className="metric-card">
                <span>Novos</span>
                <strong>{byStatus.novo || 0}</strong>
                <p>Leads aguardando primeiro contato.</p>
                </article>
                <article className="metric-card">
                  <span>Contato</span>
                  <strong>{byStatus.contato || 0}</strong>
                  <p>Leads em atendimento</p>
                </article>
                <article className="metric-card">
                  <span>Visitas</span>
                  <strong>{byStatus.visita || 0}</strong>
                  <p>Leads em visitas</p>
                </article>
            </section>

            <section className="panel">

              <div className="panel-header">
                <div>
                <h2>Temperatura dos Leads</h2>
                <p>Classificação dos leads pelo Lead Scoring.</p>
                </div>
              </div>
              
              <section className="metrics-card">
                
                <article className="metric-card">
                  <span>Fria</span>
                  <strong>{byTemperature.frio || 0}</strong>
                  <p>Leads frios.</p>
                </article>
                
                <article className="metric-card">
                <span>Morna</span>
                <strong>{byTemperature.morno || 0}</strong>
                <p>Leads mornos.</p>
                </article>
                
                <article className="metric-card">
                <span>Quente</span>
                <strong>{byTemperature.quente || 0}</strong>
                <p>Leads quentes.</p>
                </article>
              
              </section>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Funil de vendas</h2>
                  <p>Distribuicao atual por etapa.</p>
                </div>
                <button className="secondary-button" onClick={() => navigate('/leads')}>
                  Ver leads
                </button>
              </div>
              <div className="funnel-grid">
                {Object.entries(statusLabels).map(([status, label]) => {
                  const count = byStatus[status] || 0;
                  const width = total ? Math.max(8, (count / total) * 100) : 8;
                  return (
                    <div className="funnel-row" key={status}>
                      <div>
                        <span>{label}</span>
                        <strong>{count}</strong>
                      </div>
                      <div className="progress-track">
                        <span style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

export default Dashboard;
