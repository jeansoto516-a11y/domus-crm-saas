import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';
import RemindersWidget from '../components/RemindersWidget';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';

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
        <button className="dd-logout" onClick={logout}>Sair</button>
        </aside>

        <section className="dd-main">
        <header className="dd-header">
            <div>
            <h1 className="dd-title">Dashboard de Alugueis</h1>
            <p className="dd-subtitle">{user.name ? `Ola, ${user.name}.` : 'Acompanhe os imoveis administrados.'}</p>
            </div>
            <div className="dd-header-right">
                <button className="dd-btn-primary" onClick={() => navigate('/alugueis/imoveis')}>
                Ver imoveis
                </button>
                <button className="dd-btn-secondary" onClick={() => navigate('/alugueis/pagamentos')}>
                Ver pagamentos
                </button>
                <button className="dd-btn-secondary" onClick={() => navigate('/alugueis/ranking')}>
                Ver ranking
                </button>
            </div>
        </header>

        <TrialBanner />

        {error && <div className="dd-alert-error">{error}</div>}

        {loading ? (
            <div className="dd-panel">Carregando indicadores...</div>
        ) : (
            <>
            <section className="dd-grid-3">
                <article className="dd-card">
                <span className="dd-card-label">Total de imoveis</span>
                <strong className="dd-card-value">{totalImoveis}</strong>
                <p className="dd-card-desc">Imoveis cadastrados no sistema.</p>
                </article>
                <article className="dd-card">
                <span className="dd-card-label">Imoveis ativos</span>
                <strong className="dd-card-value">{imoveisAtivos}</strong>
                <p className="dd-card-desc">Contratos em andamento.</p>
                </article>
                <article className="dd-card">
                <span className="dd-card-label">Soma dos alugueis</span>
                <strong className="dd-card-value">{formatCurrency(somaAlugueis)}</strong>
                <p className="dd-card-desc">Valor total dos alugueis ativos.</p>
                </article>
            </section>

            <section className="dd-grid-3">
                <article className="dd-card">
                <span className="dd-card-label">Pendentes (mes)</span>
                <strong className="dd-card-value">{mesAtual.pendente}</strong>
                <p className="dd-card-desc">Pagamentos ainda nao confirmados.</p>
                </article>
                <article className="dd-card">
                <span className="dd-card-label">Pagos (mes)</span>
                <strong className="dd-card-value">{mesAtual.pago}</strong>
                <p className="dd-card-desc">Pagamentos confirmados no mes.</p>
                </article>
                <article className="dd-card">
                <span className="dd-card-label">Atrasados (mes)</span>
                <strong className="dd-card-value">{mesAtual.atrasado}</strong>
                <p className="dd-card-desc">Pagamentos em atraso.</p>
                </article>
            </section>

            <section className="dd-panel">
                <div className="dd-panel-head">
                <div>
                    <h2>Financeiro do mes</h2>
                    <p>Receita de administracao e comissoes geradas neste mes.</p>
                </div>
                </div>

                <section className="dd-grid-3" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <article className="dd-card">
                    <span className="dd-card-label">Receita de administracao</span>
                    <strong className="dd-card-value">{formatCurrency(mesAtual.receita_administracao_mes)}</strong>
                    <p className="dd-card-desc">Ganho da imobiliaria no mes atual.</p>
                </article>

                <article className="dd-card">
                    <span className="dd-card-label">Comissao dos corretores</span>
                    <strong className="dd-card-value">{formatCurrency(mesAtual.total_comissao_corretores_mes)}</strong>
                    <p className="dd-card-desc">Total a pagar aos corretores no mes atual.</p>
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