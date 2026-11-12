import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import RemindersWidget from '../components/RemindersWidget';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';

const formatMoney = (value) => {
    if (value === null || value === undefined) return '—';
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatNumber = (value) => Number(value || 0).toLocaleString('pt-BR');

const emptyConnectForm = { ad_account_id: '', access_token: '' };

function MetaAds() {
    const navigate = useNavigate();

    const [unreadCount, setUnreadCount] = useState(0);
    const [newLeadsCount, setNewLeadsCount] = useState(0);

    const [status, setStatus] = useState(null);
    const [message, setMessage] = useState('');

    const [filters, setFilters] = useState({ startDate: '', endDate: '' });
    const [insights, setInsights] = useState(null);
    const [insightsLoading, setInsightsLoading] = useState(false);
    const [insightsError, setInsightsError] = useState('');
    const [needsReconnect, setNeedsReconnect] = useState(false);

    const [showConnect, setShowConnect] = useState(false);
    const [connectForm, setConnectForm] = useState(emptyConnectForm);
    const [connecting, setConnecting] = useState(false);
    const [connectError, setConnectError] = useState('');

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

    const loadStatus = useCallback(() => {
    return api.get('/meta-ads/status')
        .then((res) => setStatus(res.data))
        .catch(() => setStatus({ connected: false, can_manage: false }));
    }, []);

    useEffect(() => {
    loadStatus();
    }, [loadStatus]);

    const canSeeData = Boolean(status?.connected && status?.can_manage);
    const rangeKey = filters.startDate && filters.endDate ? `${filters.startDate}|${filters.endDate}` : '';

    useEffect(() => {
    if (!canSeeData) return;

    let active = true;
    const [startDate, endDate] = rangeKey ? rangeKey.split('|') : [];

    setInsightsLoading(true);
    setInsightsError('');
    setNeedsReconnect(false);

    api.get('/meta-ads/insights', { params: startDate ? { startDate, endDate } : {} })
        .then((res) => {
        if (active) setInsights(res.data);
        })
        .catch((err) => {
        if (!active) return;
        setInsights(null);
        setInsightsError(err.response?.data?.error || 'Não foi possível carregar os dados do Meta Ads.');
        setNeedsReconnect(Boolean(err.response?.data?.reconnect));
        })
        .finally(() => {
        if (active) setInsightsLoading(false);
        });

    return () => {
        active = false;
    };
    }, [canSeeData, rangeKey]);

    const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
    };

    const openConnect = () => {
    setConnectForm(emptyConnectForm);
    setConnectError('');
    setShowConnect(true);
    };

    const closeConnect = () => {
    if (connecting) return;
    setConnectForm(emptyConnectForm);
    setShowConnect(false);
    };

    const handleConnect = async (event) => {
    event.preventDefault();
    setConnectError('');

    if (!connectForm.ad_account_id.trim() || !connectForm.access_token.trim()) {
        setConnectError('Informe o ID da conta e o token.');
        return;
    }

    try {
        setConnecting(true);
        const { data } = await api.put('/meta-ads/connect', connectForm);

        setConnectForm(emptyConnectForm);
        setShowConnect(false);
        setMessage(`Conta "${data.account_name}" conectada com sucesso.`);
        await loadStatus();
        setTimeout(() => setMessage(''), 5000);
    } catch (err) {
        setConnectError(err.response?.data?.error || 'Não foi possível conectar.');
    } finally {
        setConnecting(false);
    }
    };

    const handleDisconnect = async () => {
    if (!window.confirm('Desconectar a conta do Meta Ads? Os dados deixam de aparecer aqui.')) return;

    try {
        await api.delete('/meta-ads/disconnect');
        setInsights(null);
        setInsightsError('');
        await loadStatus();
    } catch (err) {
        setInsightsError(err.response?.data?.error || 'Não foi possível desconectar.');
    }
    };

    const totals = insights?.totals;
    const campaigns = insights?.campaigns || [];

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
            <button onClick={() => navigate('/projetos-3d')}>
            <Icon name="cube" /> Projetos 3D
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
            <p className="dd-subtitle">Desempenho das suas campanhas de tráfego pago.</p>
            </div>

            {status?.connected && status?.can_manage && (
            <div className="dd-header-right">
                <button className="dd-btn-secondary" onClick={openConnect}>Trocar conexão</button>
                <button className="dd-btn-secondary" onClick={handleDisconnect}>Desconectar</button>
            </div>
            )}
        </header>

        {message && (
            <div style={{ background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.4)', color: '#5EEAD4', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>
            {message}
            </div>
        )}

        {!status ? (
            <div className="dd-empty">Carregando...</div>
        ) : !status.connected ? (
            <section className="dd-panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div className="dd-icon-badge" style={{ background: '#1877F2', width: 48, height: 48, margin: '0 auto 16px', fontSize: 20 }}>
                f
            </div>
            <h2 style={{ marginTop: 0 }}>Nenhuma conta conectada</h2>
            <p style={{ color: 'var(--dd-muted)', maxWidth: 440, margin: '0 auto 20px' }}>
                {status.can_manage
                ? 'Conecte sua conta do Meta Ads para acompanhar aqui o desempenho das suas campanhas de Facebook e Instagram.'
                : 'O administrador da imobiliária ainda não conectou a conta do Meta Ads.'}
            </p>
            {status.can_manage && (
                <button className="dd-btn-primary" onClick={openConnect}>
                Conectar Meta Ads
                </button>
            )}
            </section>
        ) : !status.can_manage ? (
            <section className="dd-panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <h2 style={{ marginTop: 0 }}>Conta conectada</h2>
            <p style={{ color: 'var(--dd-muted)' }}>Somente o administrador pode ver os dados do Meta Ads.</p>
            </section>
        ) : (
            <>
            <div className="dd-analytics-filters">
                <label>
                Início
                <input className="dd-input" name="startDate" onChange={updateFilter} type="date" value={filters.startDate} />
                </label>
                <label>
                Fim
                <input className="dd-input" name="endDate" onChange={updateFilter} type="date" value={filters.endDate} />
                </label>
                <button className="dd-btn-secondary" onClick={() => setFilters({ startDate: '', endDate: '' })}>
                Limpar
                </button>
                <span style={{ color: 'var(--dd-muted)', fontSize: 12, alignSelf: 'center' }}>
                {rangeKey ? 'Período selecionado' : 'Sem datas: últimos 30 dias'}
                </span>
            </div>

            {insightsError && (
                <div className="dd-alert-error">
                {insightsError}
                {needsReconnect && (
                    <button className="dd-btn-small" style={{ marginLeft: 12 }} onClick={openConnect}>
                    Reconectar
                    </button>
                )}
                </div>
            )}

            <section className="dd-grid-3">
                <article className="dd-card">
                <div className="dd-card-top">
                    <span className="dd-icon-badge" style={{ background: '#1877F2' }}><Icon name="file" /></span>
                </div>
                <span className="dd-card-label">Investimento no período</span>
                <strong className="dd-card-value">{totals ? formatMoney(totals.spend) : '—'}</strong>
                <p className="dd-card-desc">Total gasto nas campanhas.</p>
                </article>

                <article className="dd-card">
                <div className="dd-card-top">
                    <span className="dd-icon-badge" style={{ background: '#0D9488' }}><Icon name="users" /></span>
                </div>
                <span className="dd-card-label">Resultados</span>
                <strong className="dd-card-value">{totals ? formatNumber(totals.results) : '—'}</strong>
                <p className="dd-card-desc">
                    {totals
                    ? `${formatNumber(totals.leads)} leads · ${formatNumber(totals.conversations)} conversas iniciadas`
                    : 'Leads e conversas gerados pelos anúncios.'}
                </p>
                </article>

                <article className="dd-card">
                <div className="dd-card-top">
                    <span className="dd-icon-badge" style={{ background: '#7C3AED' }}><Icon name="check" /></span>
                </div>
                <span className="dd-card-label">Custo por resultado</span>
                <strong className="dd-card-value">{totals ? formatMoney(totals.cost_per_result) : '—'}</strong>
                <p className="dd-card-desc">Investimento dividido pelos resultados.</p>
                </article>
            </section>

            <section className="dd-panel">
                <div className="dd-panel-head">
                <div>
                    <h2>Campanhas</h2>
                    <p>Desempenho individual de cada campanha no período.</p>
                </div>
                </div>

                <div className="dd-table-wrap">
                <table className="dd-table">
                    <thead>
                    <tr>
                        <th>Campanha</th>
                        <th>Investimento</th>
                        <th>Impressões</th>
                        <th>Cliques</th>
                        <th>CPC</th>
                        <th>Resultados</th>
                        <th>Custo/resultado</th>
                    </tr>
                    </thead>
                    <tbody>
                    {insightsLoading ? (
                        <tr>
                        <td colSpan={7}><div className="dd-empty" style={{ padding: '32px 0' }}>Carregando dados do Meta...</div></td>
                        </tr>
                    ) : campaigns.length === 0 ? (
                        <tr>
                        <td colSpan={7}><div className="dd-empty" style={{ padding: '32px 0' }}>Nenhuma campanha com dados neste período.</div></td>
                        </tr>
                    ) : (
                        campaigns.map((campaign) => (
                        <tr key={campaign.id}>
                            <td><strong>{campaign.name}</strong></td>
                            <td>{formatMoney(campaign.spend)}</td>
                            <td>{formatNumber(campaign.impressions)}</td>
                            <td>{formatNumber(campaign.clicks)}</td>
                            <td>{formatMoney(campaign.cpc)}</td>
                            <td>{formatNumber(campaign.results)}</td>
                            <td>{formatMoney(campaign.cost_per_result)}</td>
                        </tr>
                        ))
                    )}
                    </tbody>
                </table>
                </div>
            </section>
            </>
        )}
        </section>

        {showConnect && (
        <div className="dd-modal-overlay" onClick={closeConnect}>
            <div className="dd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dd-modal-header">
                <h2>Conectar Meta Ads</h2>
                <button className="dd-modal-close" onClick={closeConnect}>×</button>
            </div>

            <div className="dd-modal-body">
                {connectError && <div className="dd-alert-error">{connectError}</div>}

                <form className="dd-form" onSubmit={handleConnect} autoComplete="off">
                <label className="dd-field">
                    ID da conta de anúncios
                    <input
                    className="dd-input"
                    value={connectForm.ad_account_id}
                    onChange={(e) => setConnectForm((current) => ({ ...current, ad_account_id: e.target.value }))}
                    placeholder="Somente os números da conta"
                    />
                </label>

                <label className="dd-field">
                    Token de acesso
                    <input
                    className="dd-input"
                    type="password"
                    value={connectForm.access_token}
                    onChange={(e) => setConnectForm((current) => ({ ...current, access_token: e.target.value }))}
                    placeholder="Token do usuário do sistema (permissão ads_read)"
                    autoComplete="new-password"
                    />
                </label>

                <details style={{ fontSize: 13, color: 'var(--dd-muted)' }}>
                    <summary style={{ cursor: 'pointer' }}>Como gerar o token</summary>
                    <ol style={{ paddingLeft: 18, lineHeight: 1.6 }}>
                    <li>Em developers.facebook.com, crie um app com o produto Marketing API.</li>
                    <li>No Business Manager: Configurações da empresa → Usuários → Usuários do sistema → Adicionar.</li>
                    <li>Atribua ao usuário a sua conta de anúncios e o app.</li>
                    <li>Gerar novo token: escolha o app, expiração "Nunca" e marque só <strong>ads_read</strong>.</li>
                    <li>O ID da conta está no Gerenciador de Anúncios (use só os números).</li>
                    </ol>
                </details>

                <p style={{ fontSize: 12, color: 'var(--dd-muted)', margin: 0 }}>
                    O token é guardado criptografado e nunca é exibido de volta.
                </p>

                <div className="dd-form-actions">
                    <button className="dd-btn-secondary" type="button" disabled={connecting} onClick={closeConnect}>
                    Cancelar
                    </button>
                    <button className="dd-btn-primary" type="submit" disabled={connecting}>
                    {connecting ? 'Conectando...' : 'Conectar'}
                    </button>
                </div>
                </form>
            </div>
            </div>
        </div>
        )}

        <RemindersWidget />
    </main>
    );
}

export default MetaAds;