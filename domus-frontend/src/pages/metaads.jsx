import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import RemindersWidget from '../components/RemindersWidget';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';

function MetaAds() {
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [newLeadsCount, setNewLeadsCount] = useState(0);

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

    useEffect(() => {
    const checkNewLeads = () => {
        api.get('/leads/new-count')
        .then((res) => setNewLeadsCount(res.data.count))
        .catch(() => {});
    };

    checkNewLeads();
    const interval = setInterval(checkNewLeads, 10000);
    return () => clearInterval(interval);
    }, []);

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
            {newLeadsCount > 0 && <span className="dd-badge">{newLeadsCount}</span>}
            </button>
            <button onClick={() => navigate('/leads/novo')}>
            <Icon name="userPlus" /> Novo lead
            </button>
            <button onClick={() => navigate('/catalogo')}>
            <Icon name="file" /> Catalogo de imoveis
            </button>
            <button onClick={() => navigate('/tour-360')}>
            <Icon name="vr" /> Tour Virtual 360°
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
            <button className="active" onClick={() => navigate('/meta-ads')}>
            <Icon name="facebook" /> Meta Ads
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
            <h1 className="dd-title">Meta Ads</h1>
            <p className="dd-subtitle">Desempenho das suas campanhas de trafego pago.</p>
            </div>
        </header>

        <section className="dd-panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div className="dd-icon-badge" style={{ background: '#1877F2', width: 48, height: 48, margin: '0 auto 16px', fontSize: 20 }}>
            f
            </div>
            <h2 style={{ marginTop: 0 }}>Nenhuma conta conectada</h2>
            <p style={{ color: 'var(--dd-muted)', maxWidth: 420, margin: '0 auto 20px' }}>
            Conecte sua conta do Meta Ads para acompanhar aqui o desempenho das suas campanhas de Facebook e Instagram.
            </p>
            <button className="dd-btn-primary" disabled>
            Conectar Meta Ads (em breve)
            </button>
        </section>

        <section className="dd-grid-3">
            <article className="dd-card">
            <div className="dd-card-top">
                <span className="dd-icon-badge" style={{ background: '#1877F2' }}><Icon name="file" /></span>
            </div>
            <span className="dd-card-label">Investimento no periodo</span>
            <strong className="dd-card-value">—</strong>
            <p className="dd-card-desc">Total gasto nas campanhas ativas.</p>
            </article>

            <article className="dd-card">
            <div className="dd-card-top">
                <span className="dd-icon-badge" style={{ background: '#0D9488' }}><Icon name="users" /></span>
            </div>
            <span className="dd-card-label">Leads gerados</span>
            <strong className="dd-card-value">—</strong>
            <p className="dd-card-desc">Leads originados de anuncios.</p>
            </article>

            <article className="dd-card">
            <div className="dd-card-top">
                <span className="dd-icon-badge" style={{ background: '#7C3AED' }}><Icon name="check" /></span>
            </div>
            <span className="dd-card-label">Custo por lead (CPL)</span>
            <strong className="dd-card-value">—</strong>
            <p className="dd-card-desc">Media de investimento por lead gerado.</p>
            </article>
        </section>

        <section className="dd-panel">
            <div className="dd-panel-head">
            <div>
                <h2>Campanhas</h2>
                <p>Desempenho individual de cada campanha ativa.</p>
            </div>
            </div>

            <div className="dd-table-wrap">
            <table className="dd-table">
                <thead>
                <tr>
                    <th>Campanha</th>
                    <th>Investimento</th>
                    <th>Impressoes</th>
                    <th>Cliques</th>
                    <th>CPC</th>
                    <th>Leads</th>
                    <th>CPL</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td colSpan={7}>
                    <div className="dd-empty" style={{ padding: '32px 0' }}>
                        Conecte sua conta do Meta Ads para ver as campanhas aqui.
                    </div>
                    </td>
                </tr>
                </tbody>
            </table>
            </div>
        </section>
        </section>
        <RemindersWidget />
    </main>
    );
}

export default MetaAds;