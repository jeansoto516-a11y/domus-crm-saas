import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';
import RemindersWidget from '../components/RemindersWidget';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';

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
        </aside>

        <section className="dd-main">
        <header className="dd-header">
            <div>
            <h1 className="dd-title">Ranking de alugueis</h1>
            <p className="dd-subtitle">Imoveis administrados e comissao do mes atual, por corretor.</p>
            </div>

            <button className="dd-btn-secondary" onClick={() => navigate('/alugueis')}>
            Ver dashboard
            </button>
        </header>

        <TrialBanner />

        {error && <div className="dd-alert-error">{error}</div>}

        <section className="dd-panel">
            <div className="dd-table-wrap">
            {loading ? (
                <div className="dd-empty">Carregando ranking...</div>
            ) : ranking.length === 0 ? (
                <div className="dd-empty">
                <h2>Nenhum corretor cadastrado</h2>
                <p>Cadastre corretores para acompanhar o desempenho em alugueis.</p>
                </div>
            ) : (
                <table className="dd-table">
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
            )}
            </div>
        </section>
        </section>
        <RemindersWidget />
    </main>
    );
}

export default RentalRanking;