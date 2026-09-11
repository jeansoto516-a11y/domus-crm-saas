import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';
import RemindersWidget from '../components/RemindersWidget';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';

function Brokers() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        access_scope: 'vendas'
    });

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [brokers, setBrokers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const [editingBroker, setEditingBroker] = useState(null);

    const loadBrokers = async () => {
        setLoading(true);

        try {
            const response = await api.get('/users');
            setBrokers(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBrokers();
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

        setFormData((current) => ({
            ...current,
            [name]: value
        }));
    };

    const handleDelete = async (id, name) => {
        const confirmDelete = window.confirm(
            `Deseja realmente excluir o corretor "${name}"?`
        );

        if (!confirmDelete) return;

        try {
            const response = await api.delete(`/users/${id}`);

            setMessage(response.data.message);
            setError('');

            loadBrokers();

            setTimeout(() => setMessage(''), 3000);

        } catch (err) {
            setError(
                err.response?.data?.error ||
                'Erro ao excluir corretor.'
            );
        }
    };

    const handleEdit = (broker) => {
        setEditingBroker(broker);

        setFormData({
            name: broker.name,
            email: broker.email,
            password: '',
            access_scope: broker.access_scope || 'vendas'
        });

        setMessage('');
        setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage('');
        setError('');

        try {
            let response;

            if (editingBroker) {
                const dataToSend = { ...formData };

                if (!dataToSend.password) {
                    delete dataToSend.password;
                }

                response = await api.put(
                    `/users/${editingBroker.id}`,
                    dataToSend
                );
            } else {
                response = await api.post('/users', formData);
            }

            setMessage(response.data.message);

            await loadBrokers();

            setEditingBroker(null);

            setFormData({
                name: '',
                email: '',
                password: '',
                access_scope: 'vendas'
            });

            setTimeout(() => setMessage(''), 3000);

        } catch (err) {
            setError(
                err.response?.data?.error ||
                'Erro ao salvar corretor.'
            );
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
                    <button onClick={() => navigate('/leads')}>
                        <Icon name="users" /> Leads
                    </button>
                    <button onClick={() => navigate('/leads/novo')}>
                        <Icon name="userPlus" /> Novo lead
                    </button>
                    <button className="active">
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
                        <h1 className="dd-title">Corretores</h1>
                        <p className="dd-subtitle">Cadastre corretores e defina o acesso de cada um.</p>
                    </div>
                </header>

                <TrialBanner />

                {message && <div style={{ background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.4)', color: '#5EEAD4', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>{message}</div>}
                {error && <div className="dd-alert-error">{error}</div>}

                <section className="dd-panel dd-panel-narrow">
                    <h2 style={{ marginTop: 0 }}>
                        {editingBroker ? 'Editar corretor' : 'Cadastro de corretor'}
                    </h2>

                    <form className="dd-form" onSubmit={handleSubmit}>
                        <label className="dd-field">
                            Nome
                            <input
                                className="dd-input"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Nome"
                            />
                        </label>

                        <label className="dd-field">
                            Email
                            <input
                                className="dd-input"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="Email"
                            />
                        </label>

                        <label className="dd-field">
                            Senha
                            <input
                                className="dd-input"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required={!editingBroker}
                                placeholder="Senha"
                            />
                        </label>

                        {editingBroker && (
                            <label className="dd-field">
                                Acesso do corretor
                                <select
                                    className="dd-select"
                                    name="access_scope"
                                    value={formData.access_scope}
                                    onChange={handleChange}
                                >
                                    <option value="vendas">Somente Vendas</option>
                                    <option value="aluguel">Somente Aluguéis</option>
                                    <option value="ambos">Vendas e Aluguéis</option>
                                </select>
                            </label>
                        )}

                        <div className="dd-form-actions">
                            {editingBroker && (
                                <button
                                    className="dd-btn-secondary"
                                    type="button"
                                    onClick={() => {
                                        setEditingBroker(null);
                                        setFormData({
                                            name: '',
                                            email: '',
                                            password: '',
                                            access_scope: 'vendas'
                                        });
                                    }}
                                >
                                    Cancelar
                                </button>
                            )}
                            <button className="dd-btn-primary" type="submit">
                                {editingBroker ? 'Salvar alteracoes' : 'Cadastrar'}
                            </button>
                        </div>
                    </form>
                </section>

                <section className="dd-panel">
                    <h2 style={{ marginTop: 0 }}>Lista de corretores</h2>

                    <div className="dd-table-wrap">
                        {loading ? (
                            <div className="dd-empty">Carregando...</div>
                        ) : brokers.length === 0 ? (
                            <div className="dd-empty">Nenhum corretor cadastrado.</div>
                        ) : (
                            <table className="dd-table">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Email</th>
                                        <th>Perfil</th>
                                        <th>Acesso</th>
                                        <th>Acoes</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {brokers.map((broker) => (
                                        <tr key={broker.id}>
                                            <td><strong>{broker.name}</strong></td>
                                            <td>{broker.email}</td>
                                            <td><span className="dd-pill">{broker.role}</span></td>
                                            <td>
                                                {broker.role === 'admin'
                                                    ? '—'
                                                    : broker.access_scope === 'aluguel'
                                                        ? 'Alugueis'
                                                        : broker.access_scope === 'ambos'
                                                            ? 'Vendas e Alugueis'
                                                            : 'Vendas'}
                                            </td>

                                            <td>
                                                {broker.role !== 'admin' && (
                                                    <div className="dd-row-actions">
                                                        <button
                                                            className="dd-btn-small"
                                                            onClick={() => handleEdit(broker)}
                                                        >
                                                            Editar
                                                        </button>

                                                        <button
                                                            className="dd-btn-small"
                                                            onClick={() => handleDelete(broker.id, broker.name)}
                                                        >
                                                            Excluir
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
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

export default Brokers;