import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';
import RemindersWidget from '../components/RemindersWidget';

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
    if (level === 'vencido' || level === '30') return '#FEF2F2';
    if (level === '60') return '#FFF7ED';
    if (level === '90') return '#FFFBEB';
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
    <main className="app-shell">
        <aside className="sidebar">
        <div className="brand">
            <span className="brand-mark">D</span>
            <span>Domus CRM</span>
        </div>

        <nav className="side-nav">
            <button onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button onClick={() => navigate('/alugueis')}>Alugueis</button>
            <button onClick={() => navigate('/leads')}>Leads</button>
            <button onClick={() => navigate('/brokers')}>Corretores</button>
            <button onClick={() => navigate('/ranking')}>Ranking</button>
            <button onClick={() => navigate('/metas')}>Metas</button>
            <button onClick={() => navigate('/perfil')}>Perfil</button>
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
        </aside>

        <section className="workspace">
        <header className="workspace-header">
            <div>
            <span className="eyebrow">Gestao de imoveis</span>
            <h1>Alugueis</h1>
            <p>Cadastre e acompanhe os imoveis administrados pela imobiliaria.</p>
            </div>
        </header>

        <TrialBanner />

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        <section className="panel">
            <h2>Cadastrar imovel alugado</h2>

            <form onSubmit={handleSubmit}>
            <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Endereco do imovel"
            />

            <input
                type="text"
                name="tenant_name"
                value={formData.tenant_name}
                onChange={handleChange}
                placeholder="Nome do inquilino"
            />

            <input
                type="text"
                name="tenant_contact"
                value={formData.tenant_contact}
                onChange={handleChange}
                placeholder="Contato do inquilino"
            />

            <input
                type="text"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleChange}
                placeholder="Nome do proprietario"
            />

            <input
                type="text"
                name="owner_contact"
                value={formData.owner_contact}
                onChange={handleChange}
                placeholder="Contato do proprietario"
            />

            <input
                type="number"
                name="rent_value"
                value={formData.rent_value}
                onChange={handleChange}
                required
                placeholder="Valor do aluguel (R$)"
                step="0.01"
                min="0"
            />

            <label style={{ display: 'block', marginBottom: '4px' }}>
                Dia de vencimento
            </label>
            <input
                type="number"
                name="due_day"
                value={formData.due_day}
                onChange={handleChange}
                min="1"
                max="31"
            />

            <label style={{ display: 'block', marginBottom: '4px' }}>
                Inicio do contrato
            </label>
            <input
                type="date"
                name="contract_start"
                value={formData.contract_start}
                onChange={handleChange}
            />

            <label style={{ display: 'block', marginBottom: '4px' }}>
                Fim do contrato
            </label>
            <input
                type="date"
                name="contract_end"
                value={formData.contract_end}
                onChange={handleChange}
            />

            <button type="submit" className="primary-button">
                Cadastrar imovel
            </button>
            </form>
        </section>

                {adjustingProperty && (
            <section className="panel">
            <h2>Reajustar aluguel: {adjustingProperty.address}</h2>

            <form onSubmit={handleAdjustSubmit}>
                <p>
                Valor atual: {Number(adjustingProperty.rent_value).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                })}
                </p>

                <label style={{ display: 'block', marginBottom: '4px' }}>
                Novo valor do aluguel (R$)
                </label>
                <input
                type="number"
                step="0.01"
                min="0"
                value={newRentValue}
                onChange={(event) => setNewRentValue(event.target.value)}
                required
                />

                <button type="submit" className="primary-button">
                Confirmar reajuste
                </button>

                <button
                type="button"
                className="secondary-button"
                onClick={() => setAdjustingProperty(null)}
                >
                Cancelar
                </button>
            </form>
            </section>
        )}

        {editingProperty && (
            <section className="panel">
            <h2>Editar imovel: {editingProperty.address}</h2>

            <form onSubmit={handleEditSubmit}>
                <label style={{ display: 'block', marginBottom: '4px' }}>
                % de administracao (sobre o aluguel)
                </label>
                <input
                type="number"
                name="admin_fee_percent"
                value={editData.admin_fee_percent}
                onChange={handleEditChange}
                step="0.01"
                min="0"
                max="100"
                />

                <label style={{ display: 'block', marginBottom: '4px' }}>
                % de comissao do corretor (sobre a administracao)
                </label>
                <input
                type="number"
                name="broker_commission_percent"
                value={editData.broker_commission_percent}
                onChange={handleEditChange}
                step="0.01"
                min="0"
                max="100"
                />

                <label style={{ display: 'block', marginBottom: '4px' }}>
                Status
                </label>
                <select name="status" value={editData.status} onChange={handleEditChange}>
                <option value="ativo">Ativo</option>
                <option value="encerrado">Encerrado</option>
                </select>

                <button type="submit" className="primary-button">
                Salvar alteracoes
                </button>

                <button
                type="button"
                className="secondary-button"
                onClick={() => setEditingProperty(null)}
                >
                Cancelar
                </button>
            </form>
            </section>
        )}

        <section className="panel">
            <h2>Imoveis cadastrados</h2>

            {(() => {
                const expiringCount = properties.filter((p) => getContractAlert(p.contract_end)).length;
                if (expiringCount === 0) return null;
                return (
                <div style={{
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '12px'
                }}>
                    {expiringCount} contrato(s) vencendo nos proximos 90 dias.
                </div>
                );
            })()}

            {loading ? (
            <div className="empty-state">Carregando imoveis...</div>
            ) : properties.length === 0 ? (
            <div className="empty-state">
                <h2>Nenhum imovel cadastrado</h2>
                <p>Cadastre o primeiro imovel administrado acima.</p>
            </div>
            ) : (
            <div className="table-wrap">
                <table>
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
                            <div style={{ fontSize: 12, marginTop: 2, fontWeight: 600 }}>
                                {alert.label}
                            </div>
                            )}
                        </td>
                        <td><span className="status-pill">{statusLabels[property.status] || property.status}</span></td>

                                                                        <td>
                            <div className="row-actions">
                            <button
                                className="small-button"
                                onClick={() => navigate(`/alugueis/imoveis/${property.id}/historico`)}
                            >
                                Historico
                            </button>
                            {isAdmin && (
                                <>
                                <button
                                    className="small-button"
                                    onClick={() => handleAdjustClick(property)}
                                >
                                    Reajustar
                                </button>
                                <button
                                    className="small-button"
                                    onClick={() => handleEditClick(property)}
                                >
                                    Editar
                                </button>
                                <button
                                    className="small-button"
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
            </div>
            )}
        </section>
        </section>
        <RemindersWidget />
    </main>
    );
}

export default Rentals;