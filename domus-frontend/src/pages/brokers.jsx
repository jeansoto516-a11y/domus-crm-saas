import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

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

  // Carrega os corretores
    const loadBrokers = async () => {
    try {
        const response = await api.get('/users');
        setBrokers(response.data);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
    };

  // Executa ao abrir a página
    useEffect(() => {
    loadBrokers();
    }, []);

  // Atualiza formulário
    const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
        ...current,
        [name]: value
    }));
    };

  // Cadastra corretor
    const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage('');
    setError('');

    try {
        const response = await api.post('/users', formData);

        setMessage(response.data.message);

        await loadBrokers();

        setFormData({
        name: '',
        email: '',
        password: ''
        });

    } catch (err) {
        setError(
        err.response?.data?.error ||
        'Erro ao cadastrar corretor.'
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
        </nav>
        </aside>

        <section className="workspace">
        <header className="workspace-header">
            <div>
            <span className="eyebrow">Equipe</span>
            <h1>Corretores</h1>
            <p>Gerencie os corretores da imobiliária.</p>
            </div>
        </header>

        <section className="panel">
            <h2>Cadastro de corretor</h2>

            {message && (
            <div className="alert success">
                {message}
            </div>
            )}

            {error && (
            <div className="alert error">
                {error}
            </div>
            )}

            <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
                <label>Nome</label>

                <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label>E-mail</label>

                <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label>Senha</label>

                <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                />
            </div>

            <button
                type="submit"
                className="primary-button"
            >
                Cadastrar Corretor
            </button>
            </form>

            <hr style={{ margin: '30px 0' }} />

            <h2>Corretores cadastrados</h2>

            {loading ? (
            <p>Carregando...</p>
            ) : (
            <table style={{ width: '100%', marginTop: '20px' }}>
                <thead>
                <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Perfil</th>
                </tr>
                </thead>

                <tbody>
                {brokers.map((broker) => (
                    <tr key={broker.id}>
                    <td>{broker.name}</td>
                    <td>{broker.email}</td>
                    <td>{broker.role}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            )}
        </section>
        </section>
    </main>
    );
}

export default Brokers;