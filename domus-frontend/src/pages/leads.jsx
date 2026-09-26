import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';
import RemindersWidget from '../components/RemindersWidget';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';

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
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '', lead_type: 'venda' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedLead, setSelectedLead] = useState(null);
  const [historyByLead, setHistoryByLead] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [profileByLead, setProfileByLead] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
  const navigate = useNavigate();
  const [staleLeadIds, setStaleLeadIds] = useState(new Set());

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
    api.get('/leads/stale')
      .then((res) => setStaleLeadIds(new Set(res.data.map((l) => l.id))))
      .catch(() => {});
  }, [leads]);

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

    const loadProfile = async (leadId) => {
    try {
      setProfileLoading(true);
      const { data } = await api.get(`/leads/${leadId}/profile`);
      setProfileByLead((current) => ({ ...current, [leadId]: data }));
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel carregar o mapeamento.');
    } finally {
      setProfileLoading(false);
    }
  };

  const openLeadModal = (lead) => {
    setSelectedLead(lead);
    setNoteText('');

    if (!historyByLead[lead.id]) {
      loadHistory(lead.id);
    }

    if (!profileByLead[lead.id]) {
      loadProfile(lead.id);
    }
  };

  const closeLeadModal = () => {
    setSelectedLead(null);
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
          <button className="active" onClick={() => navigate('/leads')}>
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
            <h1 className="dd-title">Leads</h1>
            <p className="dd-subtitle">Priorize contatos quentes e mova oportunidades pelo funil.</p>
          </div>

          <div className="dd-header-right">
            
              <a className="dd-btn-secondary"
              href={`${import.meta.env.VITE_API_URL}/leads/export`}
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
            >
              <Icon name="download" /> Exportar CSV
            </a>

            <button className="dd-btn-primary" onClick={() => navigate('/leads/novo')}>
              <Icon name="userPlus" /> Novo lead
            </button>
          </div>
        </header>

        <TrialBanner />

        <div className="dd-tabs">
          <button
            className={`dd-tab ${filters.lead_type === 'venda' ? 'active' : ''}`}
            onClick={() => setFilters((current) => ({ ...current, lead_type: 'venda' }))}
          >
            Vendas
          </button>
          <button
            className={`dd-tab ${filters.lead_type === 'aluguel' ? 'active' : ''}`}
            onClick={() => setFilters((current) => ({ ...current, lead_type: 'aluguel' }))}
          >
            Aluguel
          </button>
        </div>

        <section className="dd-summary">
          <article className="dd-summary-item"><span>Total</span><strong>{totals.total}</strong></article>
          <article className="dd-summary-item"><span>Quentes</span><strong>{totals.quente}</strong></article>
          <article className="dd-summary-item"><span>Mornos</span><strong>{totals.morno}</strong></article>
          <article className="dd-summary-item"><span>Frios</span><strong>{totals.frio}</strong></article>
          <article className="dd-summary-item"><span>Esfriando</span><strong>{staleLeadIds.size}</strong></article>
        </section>

        <section className="dd-filters-row">
          <label>
            Status
            <select className="dd-select" name="status" onChange={updateFilter} value={filters.status}>
              <option value="">Todos</option>
              {flow.map((status) => (
                <option key={status} value={status}>{statusLabels[status]}</option>
              ))}
            </select>
          </label>
          <label>
            Inicio
            <input className="dd-input" name="startDate" onChange={updateFilter} type="date" value={filters.startDate} />
          </label>
          <label>
            Fim
            <input className="dd-input" name="endDate" onChange={updateFilter} type="date" value={filters.endDate} />
          </label>
          <button className="dd-btn-secondary" onClick={() => setFilters({ status: '', startDate: '', endDate: '', lead_type: filters.lead_type })}>
            Limpar
          </button>
        </section>

        {error && <div className="dd-alert-error">{error}</div>}

                <section className="dd-leads-grid">
          {loading ? (
            <div className="dd-empty">Carregando leads...</div>
          ) : leads.length === 0 ? (
            <div className="dd-empty">
              <h2>Nenhum lead encontrado</h2>
              <p>Cadastre o primeiro lead ou ajuste os filtros.</p>
              <button className="dd-btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/leads/novo')}>Cadastrar lead</button>
            </div>
          ) : (
            leads.map((lead) => {
              const currentIndex = flow.indexOf(lead.status);
              const isStale = staleLeadIds.has(lead.id);

              return (
                <article
                  key={lead.id}
                  className={`dd-lead-card${isStale ? ' stale' : ''}`}
                  onClick={() => openLeadModal(lead)}
                >
                  <div className="dd-lead-card-top">
                    <strong>{lead.name}</strong>
                    <span className={`dd-temp-tag ${lead.temperature || 'frio'}`}>
                      {temperatureLabels[lead.temperature] || 'Frio'}
                    </span>
                  </div>

                  {isStale && <span className="dd-stale-tag">Parado ha mais de 5 dias</span>}

                  <div className="dd-lead-card-contact">
                    <div>{lead.email || 'Sem email'}</div>
                    <div style={{ color: 'var(--dd-muted)', fontSize: 12 }}>{lead.phone || 'Sem telefone'}</div>
                  </div>

                  <div className="dd-lead-card-meta">
                    <span className="dd-pill">{statusLabels[lead.status] || lead.status}</span>
                    <strong>Score: {lead.score || 0}</strong>
                  </div>

                  <div style={{ color: 'var(--dd-muted)', fontSize: 12 }}>
                    {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                  </div>

                  <div className="dd-row-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="dd-btn-small"
                      disabled={currentIndex <= 0}
                      onClick={() => changeStatus(lead, -1)}
                    >
                      Voltar
                    </button>
                    <button
                      className="dd-btn-small"
                      disabled={currentIndex >= flow.length - 1}
                      onClick={() => changeStatus(lead, 1)}
                    >
                      Avancar
                    </button>
                    {lead.phone && (
                      <button
                        className="dd-btn-small dd-btn-whatsapp"
                        onClick={() => openWhatsApp(lead)}
                      >
                        WhatsApp
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>

        {selectedLead && (
          <div className="dd-modal-overlay" onClick={closeLeadModal}>
            <div className="dd-modal" onClick={(e) => e.stopPropagation()}>
              <div className="dd-modal-header">
                <h2>{selectedLead.name}</h2>
                <button className="dd-modal-close" onClick={closeLeadModal}>×</button>
              </div>

              <div className="dd-modal-body">
                <h3>Mapeamento do lead</h3>

                {profileLoading && !profileByLead[selectedLead.id] ? (
                  <p style={{ color: 'var(--dd-muted)' }}>Carregando mapeamento...</p>
                ) : (
                  (() => {
                    const profile = profileByLead[selectedLead.id];

                    if (!profile) {
                      return <p style={{ color: 'var(--dd-muted)' }}>Nenhum mapeamento preenchido.</p>;
                    }

                    const profileFields = [
                      { key: 'acquisition_type', label: 'Tipo de aquisição' },
                      { key: 'property_type', label: 'Tipo de imóvel' },
                      { key: 'region', label: 'Região' },
                      { key: 'city', label: 'Cidade' },
                      { key: 'bedrooms', label: 'Dormitórios' },
                      { key: 'suites', label: 'Suítes' },
                      { key: 'bathrooms', label: 'Banheiros' },
                      { key: 'garage_spots', label: 'Vagas de garagem' },
                      { key: 'min_area', label: 'Área mínima (m²)' },
                      { key: 'land_area', label: 'Área do terreno (m²)' },
                      { key: 'floor_preference', label: 'Preferência de andar' },
                      { key: 'has_elevator', label: 'Elevador' },
                      { key: 'budget_min', label: 'Orçamento mínimo' },
                      { key: 'budget_max', label: 'Orçamento máximo' },
                      { key: 'down_payment', label: 'Valor de entrada' },
                      { key: 'trade_value', label: 'Valor do imóvel na troca' },
                      { key: 'urgency', label: 'Urgência' }
                    ];

                    return (
                      <>
                        <div className="dd-profile-grid">
                          {profileFields.map(({ key, label }) => {
                            let value = profile[key];

                            if (key === 'has_elevator') {
                              value = value === true ? 'Sim' : value === false ? 'Não' : null;
                            }

                            if (value === null || value === undefined || value === '') return null;

                            return (
                              <div className="dd-profile-item" key={key}>
                                <span>{label}</span>
                                <strong>{value}</strong>
                              </div>
                            );
                          })}
                        </div>

                        {profile.notes && (
                          <div className="dd-profile-notes">
                            <span>Observações</span>
                            <p>{profile.notes}</p>
                          </div>
                        )}
                      </>
                    );
                  })()
                )}

                <h3 style={{ marginTop: 20 }}>Historico do lead</h3>

                {historyLoading && !historyByLead[selectedLead.id] ? (
                  <p style={{ color: 'var(--dd-muted)' }}>Carregando historico...</p>
                ) : (
                  <ul className="dd-history-list">
                    {(historyByLead[selectedLead.id] || []).length === 0 && (
                      <li style={{ color: 'var(--dd-muted)' }}>Nenhum registro ainda.</li>
                    )}
                    {(historyByLead[selectedLead.id] || []).map((item) => (
                      <li key={item.id}>
                        <div style={{ fontSize: 13 }}>
                          {item.type === 'status' ? '🔄 ' : '📝 '}
                          {item.content}
                        </div>
                        <div className="dd-history-meta">
                          {item.autor || 'Sistema'} - {new Date(item.created_at).toLocaleString('pt-BR')}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input
                    type="text"
                    className="dd-input"
                    placeholder="Adicionar anotacao..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    className="dd-btn-small"
                    onClick={() => submitNote(selectedLead.id)}
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
      <RemindersWidget />
    </main>
  );
}

export default Leads;