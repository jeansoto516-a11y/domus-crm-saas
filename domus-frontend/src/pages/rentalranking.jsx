import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';
import RemindersWidget from '../components/RemindersWidget';

function RentalRanking() {
    const navigate = useNavigate();

    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
    api.get('/rentals/ranking')
        .then((response) => setRanking(response.data))
        .catch((err) => setError(err.response?.data?.error || 'Nao foi possivel carregar o ranking.'))
        .finally(() => setLoading(false));
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

    const medals = ['🥇', '🥈', '🥉'];

    const formatCurrency = (value) =>
    Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
            <button onClick={() => navigate('/brokers')}>Corretores</button>
            <button onClick={() => navigate('/ranking')}>Ranking</button>
            <button onClick={() => navigate('/metas')}>Metas</button>
            <button className="active" onClick={() => navigate('/alugueis')}>Alugueis</button>
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
            <span className="eyebrow">Desempenho da equipe</span>
            <h1>Ranking de alugueis</h1>
            <p>Imoveis administrados e comissao do mes atual, por corretor.</p>
            </div>

            <button className="secondary-button" onClick={() => navigate('/alugueis')}>
            Ver dashboard
            </button>
        </header>

        <TrialBanner />

        {error && <div className="alert error">{error}</div>}

        <section className="panel">
            {loading ? (
            <div className="empty-state">Carregando ranking...</div>
            ) : ranking.length === 0 ? (
            <div className="empty-state">
                <h2>Nenhum corretor cadastrado</h2>
                <p>Cadastre corretores para acompanhar o desempenho em alugueis.</p>
            </div>
            ) : (
            <div className="table-wrap">
                <table>
                <thead>
                    <tr>
                    <th>Posicao</th>
                    <th>Corretor</th>
                    <th>Imoveis ativos</th>
                    <th>Total de imoveis</th>
                    <th>Comissao no mes</th>
                    </tr>
                </thead>
                <tbody>
                    {ranking.map((broker, index) => (
                    <tr key={broker.id}>
                        <td>{medals[index] || `${index + 1}º`}</td>
                        <td><strong>{broker.name}</strong></td>
                        <td>{broker.imoveis_ativos}</td>
                        <td>{broker.total_imoveis}</td>
                        <td>{formatCurrency(broker.comissao_mes)}</td>
                    </tr>
                    ))}
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

export default RentalRanking;