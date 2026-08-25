import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';
import RemindersWidget from '../components/RemindersWidget';

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedLeadId, setExpandedLeadId] = useState(null);
  const [historyByLead, setHistoryByLead] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
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

  const loadHistory = async (leadId) => {
    try {
      setHistoryLoading(true);
      const { data } = await api.get(`/leads/${leadId}/history`);
      setHistoryByLead((current) => ({ ...current, [leadId]: data }));
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel carregar o historico.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleHistory = (leadId) => {
    if (expandedLeadId === leadId) {
      setExpandedLeadId(null);
      return;
    }

    setExpandedLeadId(leadId);
    setNoteText('');

    if (!historyByLead[leadId]) {
      loadHistory(leadId);
    }
  };

  const openWhatsApp = (lead) => {
    if (!lead.phone) return;

    const digits = lead.phone.replace(/\D/g, '');
    const phoneWithCountry = digits.startsWith('55') ? digits : `55${digits}`;
    const message = encodeURIComponent(
      `Ola ${lead.name}, aqui e da imobiliaria! Tudo bem? Vi seu interesse e gostaria de conversar sobre o imovel.`
    );

    window.open(`https://wa.me/${phoneWithCountry}?text=${message}`, '_blank');
  };

  const submitNote = async (leadId) => {
    if (!noteText.trim()) return;

    try {
      await api.post(`/leads/${leadId}/history`, { content: noteText });
      setNoteText('');
      loadHistory(leadId);
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel adicionar a anotacao.');
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
            <button onClick={() => navigate('/brokers')}>Corretores</button>
            <button onClick={() => navigate('/ranking')}>Ranking</button>
            <button onClick={() => navigate('/metas')}>Metas</button>
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
            <span className="eyebrow">Operacao comercial</span>
            <h1>Leads</h1>
            <p>Priorize contatos quentes e mova oportunidades pelo funil.</p>
          </div>

          
            <a className="secondary-button"
            href={`${import.meta.env.VITE_API_URL}/leads/export`}>
            target="_blank"
            rel="noreferrer"
            onClick={(e) => {
              e.preventDefault();
              const token = localStorage.getItem('token');
              fetch(`${import.meta.env.VITE_API_URL}/leads/export`, {
                headers: { Authorization: `Bearer ${token}` }
              })
                .then((res) => res.blob())
                .then((blob) => {
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'leads-domus.csv';
                  link.click();
                  window.URL.revokeObjectURL(url);
                });
            }}
          
            Exportar CSV
          </a>

          <button className="primary-button" onClick={() => navigate('/leads/novo')}>
            Novo lead
          </button>
        </header>

        <TrialBanner />

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
                      <React.Fragment key={lead.id}>
                      <tr onClick={() => toggleHistory(lead.id)} style={{ cursor: 'pointer' }}>
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
                              onClick={(e) => { e.stopPropagation(); changeStatus(lead, -1); }}
                            >
                              Voltar
                            </button>
                            <button
                              className="small-button"
                              disabled={currentIndex >= flow.length - 1}
                              onClick={(e) => { e.stopPropagation(); changeStatus(lead, 1); }}
                            >
                              Avancar
                            </button>
                            {lead.phone && (
                              <button
                                className="small-button"
                                style={{ background: '#25D366', color: '#fff', borderColor: '#25D366' }}
                                onClick={(e) => { e.stopPropagation(); openWhatsApp(lead); }}
                              >
                                WhatsApp
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {expandedLeadId === lead.id && (
                        <tr>
                          <td colSpan={6} style={{ background: '#F9FAFB' }}>
                            <div style={{ padding: '12px 16px' }}>
                              <strong>Historico do lead</strong>

                              {historyLoading && !historyByLead[lead.id] ? (
                                <p>Carregando historico...</p>
                              ) : (
                                <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0' }}>
                                  {(historyByLead[lead.id] || []).length === 0 && (
                                    <li style={{ color: '#6B7280' }}>Nenhum registro ainda.</li>
                                  )}
                                  {(historyByLead[lead.id] || []).map((item) => (
                                    <li key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #E5E7EB' }}>
                                      <div style={{ fontSize: 13, color: '#1F2937' }}>
                                        {item.type === 'status' ? '🔄 ' : '📝 '}
                                        {item.content}
                                      </div>
                                      <div style={{ fontSize: 11, color: '#6B7280' }}>
                                        {item.autor || 'Sistema'} - {new Date(item.created_at).toLocaleString('pt-BR')}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}

                              <div style={{ display: 'flex', gap: 8, marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  placeholder="Adicionar anotacao..."
                                  value={noteText}
                                  onChange={(e) => setNoteText(e.target.value)}
                                  style={{ flex: 1 }}
                                />
                                <button
                                  className="secondary-button"
                                  onClick={() => submitNote(lead.id)}
                                >
                                  Adicionar
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
      <RemindersWidget />
    </main>
  );
}

export default Leads;