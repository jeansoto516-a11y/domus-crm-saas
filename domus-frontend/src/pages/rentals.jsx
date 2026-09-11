import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';
import RemindersWidget from '../components/RemindersWidget';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';

const statusLabels = {
    ativo: 'Ativo',
    encerrado: 'Encerrado'
};

function getContractAlert(contractEnd) {
    if (!contractEnd) return null;

    const end = new Date(contractEnd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Vencido', level: 'vencido', diffDays };
    if (diffDays <= 30) return { label: `Vence em ${diffDays} dia(s)`, level: '30', diffDays };
    if (diffDays <= 60) return { label: `Vence em ${diffDays} dia(s)`, level: '60', diffDays };
    if (diffDays <= 90) return { label: `Vence em ${diffDays} dia(s)`, level: '90', diffDays };
    return null;
}

function alertBackground(level) {
    if (level === 'vencido' || level === '30') return 'rgba(225, 29, 72, 0.1)';
    if (level === '60') return 'rgba(217, 119, 6, 0.1)';
    if (level === '90') return 'rgba(217, 119, 6, 0.06)';
    return undefined;
}

function alertColor(level) {
    if (level === 'vencido' || level === '30') return '#FCA5B1';
    if (level === '60' || level === '90') return '#FBBF6D';
    return undefined;
}

function Rentals() {
    const navigate = useNavigate();

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = currentUser.role === 'admin';

    const [formData, setFormData] = useState({
    address: '',
    tenant_name: '',
    tenant_contact: '',
    owner_name: '',
    owner_contact: '',
    rent_value: '',
    due_day: '10',
    contract_start: '',
    contract_end: ''
    });

    const [editingProperty, setEditingProperty] = useState(null);
    const [editData, setEditData] = useState({
    admin_fee_percent: '',
    broker_commission_percent: '',
    status: 'ativo'
    });

    const [adjustingProperty, setAdjustingProperty] = useState(null);
    const [newRentValue, setNewRentValue] = useState('');

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);

    const loadProperties = async () => {
    setLoading(true);

    try {
        const response = await api.get('/rentals/properties');
        setProperties(response.data);
    } catch (err) {
        setError(err.response?.data?.error || 'Erro ao buscar imoveis.');
    } finally {
        setLoading(false);
    }
    };

    useEffect(() => {
    loadProperties();
    }, []);

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

    const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage('');
    setError('');

    try {
        const response = await api.post('/rentals/properties', formData);

        setMessage(response.data.message || 'Imovel cadastrado com sucesso.');

        setFormData({
        address: '',
        tenant_name: '',
        tenant_contact: '',
        owner_name: '',
        owner_contact: '',
        rent_value: '',
        due_day: '10',
        contract_start: '',
        contract_end: ''
        });

        loadProperties();

        setTimeout(() => setMessage(''), 3000);

    } catch (err) {
        setError(err.response?.data?.error || 'Erro ao cadastrar imovel.');
    }
    };

    const handleEditClick = (property) => {
    setEditingProperty(property);
    setEditData({
        admin_fee_percent: property.admin_fee_percent,
        broker_commission_percent: property.broker_commission_percent,
        status: property.status
    });
    setMessage('');
    setError('');
    };

    const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditData((current) => ({ ...current, [name]: value }));
    };

    const handleEditSubmit = async (event) => {
    event.preventDefault();

    try {
        const response = await api.put(`/rentals/properties/${editingProperty.id}`, editData);

        setMessage('Imovel atualizado com sucesso.');
        setEditingProperty(null);
        loadProperties();

        setTimeout(() => setMessage(''), 3000);

    } catch (err) {
        setError(err.response?.data?.error || 'Erro ao atualizar imovel.');
    }
    };

    const handleAdjustClick = (property) => {
    setAdjustingProperty(property);
    setNewRentValue(property.rent_value);
    setMessage('');
    setError('');
    };

    const handleAdjustSubmit = async (event) => {
    event.preventDefault();

    try {
        await api.post(`/rentals/properties/${adjustingProperty.id}/adjust-rent`, {
        new_value: newRentValue
        });

        setMessage('Reajuste aplicado com sucesso.');
        setAdjustingProperty(null);
        loadProperties();

        setTimeout(() => setMessage(''), 3000);

    } catch (err) {
        setError(err.response?.data?.error || 'Erro ao reajustar aluguel.');
    }
    };

    const handleCreateReminder = async (property) => {
    const note = window.prompt(`Lembrete sobre o imovel "${property.address}":`);
    if (!note || !note.trim()) return;

    try {
        await api.post('/reminders', {
        note: note.trim(),
        rental_property_id: property.id
        });

        setMessage('Lembrete criado com sucesso.');
        setTimeout(() => setMessage(''), 3000);
    } catch (err) {
        setError(err.response?.data?.error || 'Erro ao criar lembrete.');
    }
    };

    const handleDelete = async (id, address) => {
    const confirmDelete = window.confirm(`Deseja realmente excluir o imovel "${address}"?`);
    if (!confirmDelete) return;

    try {
        await api.delete(`/rentals/properties/${id}`);
        setMessage('Imovel excluido com sucesso.');
        loadProperties();
        setTimeout(() => setMessage(''), 3000);
    } catch (err) {
        setError(err.response?.data?.error || 'Erro ao excluir imovel.');
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
            <button className="active" onClick={() => navigate('/alugueis')}>
                <Icon name="file" /> Alugueis
            </button>
            <button onClick={() => navigate('/leads')}>
                <Icon name="users" /> Leads
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
        </aside>

        <section className="dd-main">
        <header className="dd-header">
            <div>
            <h1 className="dd-title">Imoveis alugados</h1>
            <p className="dd-subtitle">Cadastre e acompanhe os imoveis administrados pela imobiliaria.</p>
            </div>

            
            <a className="dd-btn-secondary"
            href={`${import.meta.env.VITE_API_URL}/rentals/export`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => {
                e.preventDefault();
                const token = localStorage.getItem('token');
                fetch(`${import.meta.env.VITE_API_URL}/rentals/export`, {
                headers: { Authorization: `Bearer ${token}` }
                })
                .then((res) => res.blob())
                .then((blob) => {
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'alugueis-domus.csv';
                    link.click();
                    window.URL.revokeObjectURL(url);
                });
            }}
            >
            <Icon name="download" /> Exportar CSV
            </a>
        </header>

        <TrialBanner />

        {message && <div className="dd-alert-success">{message}</div>}
        {error && <div className="dd-alert-error">{error}</div>}

        <section className="dd-panel dd-panel-narrow">
            <h2 style={{ marginTop: 0 }}>Cadastrar imovel alugado</h2>

            <form className="dd-form" onSubmit={handleSubmit}>
            <label className="dd-field">
                Endereco do imovel
                <input
                className="dd-input"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                />
            </label>

            <label className="dd-field">
                Nome do inquilino
                <input
                className="dd-input"
                type="text"
                name="tenant_name"
                value={formData.tenant_name}
                onChange={handleChange}
                />
            </label>

            <label className="dd-field">
                Contato do inquilino
                <input
                className="dd-input"
                type="text"
                name="tenant_contact"
                value={formData.tenant_contact}
                onChange={handleChange}
                />
            </label>

            <label className="dd-field">
                Nome do proprietario
                <input
                className="dd-input"
                type="text"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleChange}
                />
            </label>

            <label className="dd-field">
                Contato do proprietario
                <input
                className="dd-input"
                type="text"
                name="owner_contact"
                value={formData.owner_contact}
                onChange={handleChange}
                />
            </label>

            <label className="dd-field">
                Valor do aluguel (R$)
                <input
                className="dd-input"
                type="number"
                name="rent_value"
                value={formData.rent_value}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                />
            </label>

            <label className="dd-field">
                Dia de vencimento
                <input
                className="dd-input"
                type="number"
                name="due_day"
                value={formData.due_day}
                onChange={handleChange}
                min="1"
                max="31"
                />
            </label>

            <label className="dd-field">
                Inicio do contrato
                <input
                className="dd-input"
                type="date"
                name="contract_start"
                value={formData.contract_start}
                onChange={handleChange}
                />
            </label>

            <label className="dd-field">
                Fim do contrato
                <input
                className="dd-input"
                type="date"
                name="contract_end"
                value={formData.contract_end}
                onChange={handleChange}
                />
            </label>

            <div className="dd-form-actions" style={{ justifyContent: 'flex-start' }}>
                <button type="submit" className="dd-btn-primary">
                Cadastrar imovel
                </button>
            </div>
            </form>
        </section>

        {adjustingProperty && (
            <section className="dd-panel dd-panel-narrow">
            <h2 style={{ marginTop: 0 }}>Reajustar aluguel: {adjustingProperty.address}</h2>

            <form className="dd-form" onSubmit={handleAdjustSubmit}>
                <p style={{ color: 'var(--dd-muted)', margin: 0 }}>
                Valor atual: {Number(adjustingProperty.rent_value).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                })}
                </p>

                <label className="dd-field">
                Novo valor do aluguel (R$)
                <input
                    className="dd-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newRentValue}
                    onChange={(event) => setNewRentValue(event.target.value)}
                    required
                />
                </label>

                <div className="dd-form-actions">
                <button
                    type="button"
                    className="dd-btn-secondary"
                    onClick={() => setAdjustingProperty(null)}
                >
                    Cancelar
                </button>
                <button type="submit" className="dd-btn-primary">
                    Confirmar reajuste
                </button>
                </div>
            </form>
            </section>
        )}

        {editingProperty && (
            <section className="dd-panel dd-panel-narrow">
            <h2 style={{ marginTop: 0 }}>Editar imovel: {editingProperty.address}</h2>

            <form className="dd-form" onSubmit={handleEditSubmit}>
                <label className="dd-field">
                % de administracao (sobre o aluguel)
                <input
                    className="dd-input"
                    type="number"
                    name="admin_fee_percent"
                    value={editData.admin_fee_percent}
                    onChange={handleEditChange}
                    step="0.01"
                    min="0"
                    max="100"
                />
                </label>

                <label className="dd-field">
                % de comissao do corretor (sobre a administracao)
                <input
                    className="dd-input"
                    type="number"
                    name="broker_commission_percent"
                    value={editData.broker_commission_percent}
                    onChange={handleEditChange}
                    step="0.01"
                    min="0"
                    max="100"
                />
                </label>

                <label className="dd-field">
                Status
                <select className="dd-select" name="status" value={editData.status} onChange={handleEditChange}>
                    <option value="ativo">Ativo</option>
                    <option value="encerrado">Encerrado</option>
                </select>
                </label>

                <div className="dd-form-actions">
                <button
                    type="button"
                    className="dd-btn-secondary"
                    onClick={() => setEditingProperty(null)}
                >
                    Cancelar
                </button>
                <button type="submit" className="dd-btn-primary">
                    Salvar alteracoes
                </button>
                </div>
            </form>
            </section>
        )}

        <section className="dd-panel">
            <h2 style={{ marginTop: 0 }}>Imoveis cadastrados</h2>

            {(() => {
                const expiringCount = properties.filter((p) => getContractAlert(p.contract_end)).length;
                if (expiringCount === 0) return null;
                return (
                <div className="dd-banner-warning">
                    {expiringCount} contrato(s) vencendo nos proximos 90 dias.
                </div>
                );
            })()}

            <div className="dd-table-wrap">
                {loading ? (
                <div className="dd-empty">Carregando imoveis...</div>
                ) : properties.length === 0 ? (
                <div className="dd-empty">
                    <h2>Nenhum imovel cadastrado</h2>
                    <p>Cadastre o primeiro imovel administrado acima.</p>
                </div>
                ) : (
                <table className="dd-table">
                    <thead>
                    <tr>
                        <th>Endereco</th>
                        <th>Inquilino</th>
                        <th>Corretor</th>
                        <th>Aluguel</th>
                        <th>Adm. %</th>
                        <th>Comissao %</th>
                        <th>Vencimento</th>
                        <th>Status</th>
                        <th>Acoes</th>
                    </tr>
                    </thead>

                    <tbody>
                    {properties.map((property) => {
                        const alert = getContractAlert(property.contract_end);

                        return (
                        <tr key={property.id} style={{ background: alertBackground(alert?.level) }}>
                            <td>{property.address}</td>
                            <td>{property.tenant_name || 'Nao informado'}</td>
                            <td>{property.corretor || 'Nao informado'}</td>
                            <td>
                            {Number(property.rent_value).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                            })}
                            </td>
                            <td>{property.admin_fee_percent}%</td>
                            <td>{property.broker_commission_percent}%</td>
                            <td>
                                {property.contract_end
                                ? new Date(property.contract_end).toLocaleDateString('pt-BR')
                                : 'Nao informado'}
                                {alert && (
                                <span className="dd-tag-inline" style={{ color: alertColor(alert.level) }}>
                                    {alert.label}
                                </span>
                                )}
                            </td>
                            <td><span className="dd-pill">{statusLabels[property.status] || property.status}</span></td>

                            <td>
                                <div className="dd-row-actions">
                                <button
                                    className="dd-btn-small"
                                    onClick={() => navigate(`/alugueis/imoveis/${property.id}/historico`)}
                                >
                                    Historico
                                </button>
                                <button
                                    className="dd-btn-small"
                                    onClick={() => handleCreateReminder(property)}
                                >
                                    Lembrete
                                </button>
                                {isAdmin && (
                                    <>
                                    <button
                                        className="dd-btn-small"
                                        onClick={() => handleAdjustClick(property)}
                                    >
                                        Reajustar
                                    </button>
                                    <button
                                        className="dd-btn-small"
                                        onClick={() => handleEditClick(property)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="dd-btn-small"
                                        onClick={() => handleDelete(property.id, property.address)}
                                    >
                                        Excluir
                                    </button>
                                    </>
                                )}
                                </div>
                            </td>
                        </tr>
                        );
                    })}
                    </tbody>
                </table>
                )}
            </div>
        </section>
        </section>
        <RemindersWidget />
    </main>
    );
}

export default Rentals;