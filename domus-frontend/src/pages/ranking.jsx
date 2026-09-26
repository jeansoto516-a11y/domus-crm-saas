import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
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

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function Ranking() {
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [allLeads, setAllLeads] = useState([]);
    const [leadsLoading, setLeadsLoading] = useState(true);

    const [selectedBroker, setSelectedBroker] = useState(null);
    const [selectedLead, setSelectedLead] = useState(null);

    const [historyByLead, setHistoryByLead] = useState({});
    const [historyLoading, setHistoryLoading] = useState(false);
    const [profileByLead, setProfileByLead] = useState({});
    const [profileLoading, setProfileLoading] = useState(false);
    const [noteText, setNoteText] = useState('');

    useEffect(() => {
        api.get('/leads/ranking')
        .then((response) => setRanking(response.data))
        .catch((err) => setError(err.response?.data?.error || 'Nao foi possivel carregar o ranking.'))
        .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        setLeadsLoading(true);
        Promise.all([
            api.get('/leads', { params: { lead_type: 'venda' } }),
            api.get('/leads', { params: { lead_type: 'aluguel' } })
    ])
        .then(([vendaRes, aluguelRes]) => {
        setAllLeads([...vendaRes.data, ...aluguelRes.data]);
        })
        .catch(() => {})
        .finally(() => setLeadsLoading(false));
    }, []);

    const medals = ['🥇', '🥈', '🥉'];

    const openBrokerModal = (broker) => setSelectedBroker(broker);
    const closeBrokerModal = () => setSelectedBroker(null);

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
    setSelectedBroker(null);
    setSelectedLead(lead);
    setNoteText('');

    if (!historyByLead[lead.id]) loadHistory(lead.id);
    if (!profileByLead[lead.id]) loadProfile(lead.id);
    };

    const closeLeadModal = () => setSelectedLead(null);

    const changeStatus = async (lead, direction) => {
    const currentIndex = flow.indexOf(lead.status);
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= flow.length) return;

    try {
        const { data } = await api.put(`/leads/${lead.id}`, { status: flow[nextIndex] });
        setAllLeads((current) => current.map((item) => (item.id === lead.id ? data : item)));
        setSelectedLead((current) => (current && current.id === lead.id ? data : current));
    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel atualizar o lead.');
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

    const brokerLeads = selectedBroker
    ? allLeads.filter((lead) => lead.user_id === selectedBroker.id)
    : [];

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
            <button onClick={() => navigate('/leads')}>
            <Icon name="users" /> Leads
            </button>
            <button onClick={() => navigate('/leads/novo')}>
            <Icon name="userPlus" /> Novo lead
            </button>
            <button onClick={() => navigate('/brokers')}>
            <Icon name="users" /> Corretores
            </button>
            <button className="active" onClick={() => navigate('/ranking')}>
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
            </button>
        </nav>
        </aside>

        <section className="dd-main">
        <header className="dd-header">
            <div>
            <h1 className="dd-title">Ranking de corretores</h1>
            <p className="dd-subtitle">Fechamentos registrados no mes atual.</p>
            </div>
        </header>

        {error && <div className="dd-alert-error">{error}</div>}

        <section className="dd-panel">
            {loading ? (
            <div className="dd-empty">Carregando ranking...</div>
            ) : ranking.length === 0 ? (
            <div className="dd-empty">
                <h2>Nenhum corretor cadastrado</h2>
                <p>Cadastre corretores para acompanhar o desempenho da equipe.</p>
            </div>
            ) : (
            <div className="dd-ranking-grid">
                {ranking.map((broker, index) => {
                const taxa = broker.total_leads > 0
                  ? ((broker.fechados_mes / broker.total_leads) * 100).toFixed(0)
                    : 0;

                return (
                    <article
                    key={broker.id}
                    className={`dd-ranking-card rank-${index + 1 <= 3 ? index + 1 : 'default'}`}
                    onClick={() => openBrokerModal(broker)}
                    >
                    <div className="dd-ranking-medal">{medals[index] || `${index + 1}º`}</div>

                    <div className="dd-ranking-avatar">{getInitials(broker.name)}</div>

                    <strong className="dd-ranking-name">{broker.name}</strong>

                    <div className="dd-ranking-stats">
                        <div>
                        <span>{broker.fechados_mes}</span>
                        <small>Fechados/mes</small>
                        </div>
                        <div>
                        <span>{broker.total_leads}</span>
                        <small>Total leads</small>
                        </div>
                        <div>
                        <span>{taxa}%</span>
                        <small>Conversao</small>
                        </div>
                    </div>

                    <button className="dd-btn-small dd-ranking-view">Ver leads</button>
                    </article>
                );
                })}
            </div>
            )}
        </section>
        </section>

        {selectedBroker && (
        <div className="dd-modal-overlay" onClick={closeBrokerModal}>
            <div className="dd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dd-modal-header">
                <h2>Leads de {selectedBroker.name}</h2>
                <button className="dd-modal-close" onClick={closeBrokerModal}>×</button>
            </div>

            <div className="dd-modal-body">
                {leadsLoading ? (
                <p style={{ color: 'var(--dd-muted)' }}>Carregando leads...</p>
                ) : brokerLeads.length === 0 ? (
                <p style={{ color: 'var(--dd-muted)' }}>Nenhum lead com este corretor.</p>
                ) : (
                <ul className="dd-broker-lead-list">
                    {brokerLeads.map((lead) => (
                    <li key={lead.id}>
                        <div>
                        <strong>{lead.name}</strong>
                        <span className="dd-pill">{statusLabels[lead.status] || lead.status}</span>
                        </div>
                        <button className="dd-btn-small" onClick={() => openLeadModal(lead)}>
                        Ver lead
                        </button>
                    </li>
                    ))}
                </ul>
                )}
            </div>
            </div>
        </div>
        )}

        {selectedLead && (
        <div className="dd-modal-overlay" onClick={closeLeadModal}>
            <div className="dd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dd-modal-header">
                <h2>{selectedLead.name}</h2>
                <button className="dd-modal-close" onClick={closeLeadModal}>×</button>
            </div>

            <div className="dd-modal-body">
                <div className="dd-row-actions" style={{ marginBottom: 12 }}>
                <button
                    className="dd-btn-small"
                    disabled={flow.indexOf(selectedLead.status) <= 0}
                    onClick={() => changeStatus(selectedLead, -1)}
                >
                    Voltar
                </button>
                <button
                    className="dd-btn-small"
                    disabled={flow.indexOf(selectedLead.status) >= flow.length - 1}
                    onClick={() => changeStatus(selectedLead, 1)}
                >
                    Avancar
                </button>
                {selectedLead.phone && (
                    <button className="dd-btn-small dd-btn-whatsapp" onClick={() => openWhatsApp(selectedLead)}>
                    WhatsApp
                    </button>
                )}
                </div>

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
                <button className="dd-btn-small" onClick={() => submitNote(selectedLead.id)}>
                    Adicionar
                </button>
                </div>
            </div>
            </div>
        </div>
        )}

        <RemindersWidget />
    </main>
    );
}

export default Ranking;