import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';
import RemindersWidget from '../components/RemindersWidget';

function RentalDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();

    const user = useMemo(() => {
    try {
        return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
        return {};
    }
    }, []);

    const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    }, [navigate]);

    useEffect(() => {
    let active = true;

    const fetchDashboard = async () => {
        try {
        setLoading(true);
        setError('');
        const response = await api.get('/rentals/dashboard');
        if (active) setData(response.data);
        } catch (err) {
        if (err.response?.status === 401) {
            logout();
            return;
        }
        if (active) {
            setError(err.response?.data?.error || 'Nao foi possivel carregar o dashboard de alugueis.');
        }
        } finally {
        if (active) setLoading(false);
        }
    };

    fetchDashboard();

    return () => {
        active = false;
    };
    }, [logout]);

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

    const totalImoveis = data?.total_imoveis || 0;
    const imoveisAtivos = data?.imoveis_ativos || 0;
    const somaAlugueis = data?.soma_alugueis || 0;
    const mesAtual = data?.mes_atual || {
    pendente: 0,
    pago: 0,
    atrasado: 0,
    receita_administracao_mes: 0,
    total_comissao_corretores_mes: 0
    };

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
            <button onClick={() => navigate('/alugueis')}>Alugueis</button>
            <button onClick={() => navigate('/leads')}>Leads</button>
            <button className="active" onClick={() => navigate('/leads/novo')}>Novo lead</button>
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
        <button className="ghost-button full" onClick={logout}>Sair</button>
        </aside>

        <section className="workspace">
        <header className="workspace-header">
            <div>
            <span className="eyebrow">Visao de alugueis</span>
            <h1>Dashboard de Alugueis</h1>
            <p>{user.name ? `Ola, ${user.name}.` : 'Acompanhe os imoveis administrados.'}</p>
            </div>
            <button className="primary-button" onClick={() => navigate('/alugueis/imoveis')}>
            Ver imoveis
            </button>
            <button className="secondary-button" onClick={() => navigate('/alugueis/pagamentos')}>
            Ver pagamentos
            </button>
        </header>

        <TrialBanner />

        {error && <div className="alert error">{error}</div>}

        {loading ? (
            <div className="empty-state">Carregando indicadores...</div>
        ) : (
            <>
            <section className="metrics-grid">
                <article className="metric-card">
                <span>Total de imoveis</span>
                <strong>{totalImoveis}</strong>
                <p>Imoveis cadastrados no sistema.</p>
                </article>
                <article className="metric-card">
                <span>Imoveis ativos</span>
                <strong>{imoveisAtivos}</strong>
                <p>Contratos em andamento.</p>
                </article>
                <article className="metric-card">
                <span>Soma dos alugueis</span>
                <strong>{formatCurrency(somaAlugueis)}</strong>
                <p>Valor total dos alugueis ativos.</p>
                </article>
                <article className="metric-card">
                <span>Pendentes (mes)</span>
                <strong>{mesAtual.pendente}</strong>
                <p>Pagamentos ainda nao confirmados.</p>
                </article>
                <article className="metric-card">
                <span>Pagos (mes)</span>
                <strong>{mesAtual.pago}</strong>
                <p>Pagamentos confirmados no mes.</p>
                </article>
                <article className="metric-card">
                <span>Atrasados (mes)</span>
                <strong>{mesAtual.atrasado}</strong>
                <p>Pagamentos em atraso.</p>
                </article>
            </section>

            <section className="panel">
                <div className="panel-header">
                <div>
                    <h2>Financeiro do mes</h2>
                    <p>Receita de administracao e comissoes geradas neste mes.</p>
                </div>
                </div>

                <section className="metrics-card">
                <article className="metric-card">
                    <span>Receita de administracao</span>
                    <strong>{formatCurrency(mesAtual.receita_administracao_mes)}</strong>
                    <p>Ganho da imobiliaria no mes atual.</p>
                </article>

                <article className="metric-card">
                    <span>Comissao dos corretores</span>
                    <strong>{formatCurrency(mesAtual.total_comissao_corretores_mes)}</strong>
                    <p>Total a pagar aos corretores no mes atual.</p>
                </article>
                </section>
            </section>
            </>
        )}
        </section>
        <RemindersWidget />
    </main>
    );
}

export default RentalDashboard;