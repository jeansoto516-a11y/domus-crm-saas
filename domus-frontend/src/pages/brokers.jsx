import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';
import RemindersWidget from '../components/RemindersWidget';

function Brokers() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [brokers, setBrokers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const [editingBroker, setEditingBroker] = useState(null);

    // carregar corretores
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
            password: ''
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
                password: ''
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
        <main className="app-shell">
            <aside className="sidebar">
                <div className="brand">
                    <span className="brand-mark">D</span>
                    <span>Domus CRM</span>
                </div>

                <nav className="side-nav">
                    <button onClick={() => navigate('/dashboard')}>
                        Dashboard
                    </button>

                    <button onClick={() => navigate('/leads')}>
                        Leads
                    </button>

                    <button onClick={() => navigate('/leads/novo')}>
                        Novo lead
                    </button>

                    <button className="active">
                        Corretores
                    </button>

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
            </aside>

            <section className="workspace">
                <header className="workspace-header">
                    <h1>Corretores</h1>
                </header>

                <TrialBanner />

                <section className="panel">

                    <h2>
                        {editingBroker ? 'Editar corretor' : 'Cadastro de corretor'}
                    </h2>

                    {message && <div className="alert success">{message}</div>}
                    {error && <div className="alert error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Nome"
                        />

                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Email"
                        />

                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required={!editingBroker}
                            placeholder="Senha"
                        />

                        <button type="submit">
                            {editingBroker ? 'Salvar alterações' : 'Cadastrar'}
                        </button>

                        {editingBroker && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingBroker(null);
                                    setFormData({
                                        name: '',
                                        email: '',
                                        password: ''
                                    });
                                }}
                            >
                                Cancelar
                            </button>
                        )}
                    </form>

                    <hr />

                    <h2>Lista de corretores</h2>

                    {loading ? (
                        <p>Carregando...</p>
                    ) : brokers.length === 0 ? (
                        <p>Nenhum corretor cadastrado.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Email</th>
                                    <th>Perfil</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>

                            <tbody>
                                {brokers.map((broker) => (
                                    <tr key={broker.id}>
                                        <td>{broker.name}</td>
                                        <td>{broker.email}</td>
                                        <td>{broker.role}</td>

                                        <td>
                                            {broker.role !== 'admin' && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(broker)}
                                                        style={{ marginRight: '8px' }}
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(broker.id, broker.name)}
                                                    >
                                                        Excluir
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                </section>
            </section>
            <RemindersWidget />
        </main>
    );
}

export default Brokers;