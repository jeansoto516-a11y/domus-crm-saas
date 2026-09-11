import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import RemindersWidget from '../components/RemindersWidget';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';

function Ranking() {
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
    api.get('/leads/ranking')
        .then((response) => setRanking(response.data))
        .catch((err) => setError(err.response?.data?.error || 'Nao foi possivel carregar o ranking.'))
        .finally(() => setLoading(false));
    }, []);

    const medals = ['🥇', '🥈', '🥉'];

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
            <div className="dd-table-wrap">
            {loading ? (
                <div className="dd-empty">Carregando ranking...</div>
            ) : ranking.length === 0 ? (
                <div className="dd-empty">
                <h2>Nenhum corretor cadastrado</h2>
                <p>Cadastre corretores para acompanhar o desempenho da equipe.</p>
                </div>
            ) : (
                <table className="dd-table">
                <thead>
                    <tr>
                    <th>Posicao</th>
                    <th>Corretor</th>
                    <th>Fechamentos no mes</th>
                    <th>Total de leads</th>
                    </tr>
                </thead>
                <tbody>
                    {ranking.map((broker, index) => (
                    <tr key={broker.id}>
                        <td>{medals[index] || `${index + 1}º`}</td>
                        <td><strong>{broker.name}</strong></td>
                        <td>{broker.fechados_mes}</td>
                        <td>{broker.total_leads}</td>
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

export default Ranking;