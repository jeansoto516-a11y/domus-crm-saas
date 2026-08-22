import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

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
    <main className="app-shell">
        <aside className="sidebar">
        <div className="brand">
            <span className="brand-mark">D</span>
            <span>Domus CRM</span>
        </div>
        <nav className="side-nav">
            <button onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button onClick={() => navigate('/leads')}>Leads</button>
            <button onClick={() => navigate('/leads/novo')}>Novo lead</button>
            <button onClick={() => navigate('/brokers')}>Corretores</button>
            <button className="active" onClick={() => navigate('/ranking')}>Ranking</button>
            <button onClick={() => navigate('/metas')}>Metas</button>
            <button onClick={() => navigate('/mensagens')}>Mensagens</button>
        </nav>
        </aside>

        <section className="workspace">
        <header className="workspace-header">
            <div>
            <span className="eyebrow">Desempenho da equipe</span>
            <h1>Ranking de corretores</h1>
            <p>Fechamentos registrados no mes atual.</p>
            </div>
        </header>

        {error && <div className="alert error">{error}</div>}

        <section className="panel">
            {loading ? (
            <div className="empty-state">Carregando ranking...</div>
            ) : ranking.length === 0 ? (
            <div className="empty-state">
                <h2>Nenhum corretor cadastrado</h2>
                <p>Cadastre corretores para acompanhar o desempenho da equipe.</p>
            </div>
            ) : (
            <div className="table-wrap">
                <table>
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
            </div>
            )}
        </section>
        </section>
    </main>
    );
}

export default Ranking;