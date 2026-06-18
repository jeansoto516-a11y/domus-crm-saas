import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const flow = ['novo', 'contato', 'visita', 'proposta', 'fechado'];

const statusLabels = {
  novo: 'Novo',
  contato: 'Contato',
  visita: 'Visita',
  proposta: 'Proposta',
  fechado: 'Fechado'
};

const temperatureLabels = {
  quente: 'Quente',
  morno: 'Morno',
  frio: 'Frio'
};

function Leads() {
  const [leads, setLeads] = useState([]);
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const totals = useMemo(() => {
    return leads.reduce(
      (acc, lead) => {
        acc.total += 1;
        acc[lead.temperature] = (acc[lead.temperature] || 0) + 1;
        return acc;
      },
      { total: 0, quente: 0, morno: 0, frio: 0 }
    );
  }, [leads]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    let active = true;

    const fetchLeads = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get('/leads', { params: filters });
        if (active) setLeads(data);
      } catch (err) {
        if (err.response?.status === 401) {
          logout();
          return;
        }
        if (active) {
          setError(err.response?.data?.error || 'Nao foi possivel buscar os leads.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchLeads();

    return () => {
      active = false;
    };
  }, [filters, logout]);

  const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const changeStatus = async (lead, direction) => {
    const currentIndex = flow.indexOf(lead.status);
    const nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= flow.length) return;

    try {
      const { data } = await api.put(`/leads/${lead.id}`, { status: flow[nextIndex] });
      setLeads((current) => current.map((item) => (item.id === lead.id ? data : item)));
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel atualizar o lead.');
    }
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">D</span>
          <span>Domus CRM</span>
        </div>
        <nav className="side-nav">
          <button onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className="active" onClick={() => navigate('/leads')}>Leads</button>
          <button onClick={() => navigate('/leads/novo')}>Novo lead</button>
        </nav>
        <button className="ghost-button full" onClick={logout}>Sair</button>
      </aside>

      <section className="workspace">
        <header className="workspace-header">
          <div>
            <span className="eyebrow">Operacao comercial</span>
            <h1>Leads</h1>
            <p>Priorize contatos quentes e mova oportunidades pelo funil.</p>
          </div>
          <button className="primary-button" onClick={() => navigate('/leads/novo')}>
            Novo lead
          </button>
        </header>

        <section className="summary-strip">
          <article><span>Total</span><strong>{totals.total}</strong></article>
          <article><span>Quentes</span><strong>{totals.quente}</strong></article>
          <article><span>Mornos</span><strong>{totals.morno}</strong></article>
          <article><span>Frios</span><strong>{totals.frio}</strong></article>
        </section>

        <section className="filters-bar">
          <label>
            Status
            <select name="status" onChange={updateFilter} value={filters.status}>
              <option value="">Todos</option>
              {flow.map((status) => (
                <option key={status} value={status}>{statusLabels[status]}</option>
              ))}
            </select>
          </label>
          <label>
            Inicio
            <input name="startDate" onChange={updateFilter} type="date" value={filters.startDate} />
          </label>
          <label>
            Fim
            <input name="endDate" onChange={updateFilter} type="date" value={filters.endDate} />
          </label>
          <button className="secondary-button" onClick={() => setFilters({ status: '', startDate: '', endDate: '' })}>
            Limpar
          </button>
        </section>

        {error && <div className="alert error">{error}</div>}

        <section className="panel">
          {loading ? (
            <div className="empty-state">Carregando leads...</div>
          ) : leads.length === 0 ? (
            <div className="empty-state">
              <h2>Nenhum lead encontrado</h2>
              <p>Cadastre o primeiro lead ou ajuste os filtros.</p>
              <button className="primary-button" onClick={() => navigate('/leads/novo')}>Cadastrar lead</button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>Contato</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Temperatura</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => {
                    const currentIndex = flow.indexOf(lead.status);
                    return (
                      <tr key={lead.id}>
                        <td>
                          <strong>{lead.name}</strong>
                          <span>{new Date(lead.created_at).toLocaleDateString('pt-BR')}</span>
                        </td>
                        <td>
                          <span>{lead.email || 'Sem email'}</span>
                          <span>{lead.phone || 'Sem telefone'}</span>
                        </td>
                        <td><span className="status-pill">{statusLabels[lead.status] || lead.status}</span></td>
                        <td><strong>{lead.score || 0}</strong></td>
                        <td>
                          <span className={`temperature ${lead.temperature || 'frio'}`}>
                            {temperatureLabels[lead.temperature] || 'Frio'}
                          </span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="small-button"
                              disabled={currentIndex <= 0}
                              onClick={() => changeStatus(lead, -1)}
                            >
                              Voltar
                            </button>
                            <button
                              className="small-button"
                              disabled={currentIndex >= flow.length - 1}
                              onClick={() => changeStatus(lead, 1)}
                            >
                              Avancar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default Leads;
