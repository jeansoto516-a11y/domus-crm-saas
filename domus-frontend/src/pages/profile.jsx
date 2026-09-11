import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';

function Profile() {
    const [user, setUser] = useState(null);
    const [company, setCompany] = useState(null);

    const [name, setName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [companyName, setCompanyName] = useState('');

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
    api.get('/users/me').then((response) => {
        setUser(response.data.user);
        setCompany(response.data.company);
        setName(response.data.user.name);
        setCompanyName(response.data.company?.name || '');
    });
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

    const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
        await api.put('/users/me', {
        name,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined
        });

        setMessage('Perfil atualizado com sucesso.');
        setCurrentPassword('');
        setNewPassword('');

    } catch (err) {
        setError(err.response?.data?.error || 'Erro ao atualizar perfil.');
    } finally {
        setLoading(false);
    }
    };

    const handleSaveCompany = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
        await api.put('/users/company', { name: companyName });
        setMessage('Imobiliaria atualizada com sucesso.');
    } catch (err) {
        setError(err.response?.data?.error || 'Erro ao atualizar imobiliaria.');
    } finally {
        setLoading(false);
    }
    };

    if (!user) return null;

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
            <button onClick={() => navigate('/ranking')}>
                <Icon name="check" /> Ranking
            </button>
            <button onClick={() => navigate('/metas')}>
                <Icon name="filter" /> Metas
            </button>
            <button className="active" onClick={() => navigate('/perfil')}>
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
            <h1 className="dd-title">Meu perfil</h1>
            <p className="dd-subtitle">Gerencie seus dados de acesso e da imobiliaria.</p>
            </div>
            <button className="dd-btn-secondary" onClick={() => navigate('/dashboard')}>
                Voltar ao dashboard
            </button>
        </header>

        <TrialBanner />

        {error && <div className="dd-alert-error">{error}</div>}
        {message && <div style={{ background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.4)', color: '#5EEAD4', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>{message}</div>}

        <section className="dd-panel dd-panel-narrow">
            <h2 style={{ marginTop: 0 }}>Meus dados</h2>

            <form className="dd-form" onSubmit={handleSaveProfile}>
            <label className="dd-field">
                Nome
                <input
                className="dd-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                />
            </label>

            <label className="dd-field">
                E-mail (nao editavel)
                <input className="dd-input" type="email" value={user.email} disabled />
            </label>

            <label className="dd-field">
                Senha atual
                <input
                className="dd-input"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Preencha somente se for trocar a senha"
                />
            </label>

            <label className="dd-field">
                Nova senha
                <input
                className="dd-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimo 6 caracteres"
                />
            </label>

            <div className="dd-form-actions" style={{ justifyContent: 'flex-start' }}>
                <button className="dd-btn-primary" type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar meus dados'}
                </button>
            </div>
            </form>
        </section>

        {user.role === 'admin' && (
            <section className="dd-panel dd-panel-narrow">
            <h2 style={{ marginTop: 0 }}>Dados da imobiliaria</h2>

            {company?.public_slug && (
                <div style={{ background: 'var(--dd-panel-2)', border: '1px solid var(--dd-border)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <p style={{ fontSize: 13, margin: '0 0 8px', color: 'var(--dd-muted)' }}>
                    Link publico para captacao de leads (divulgue no seu site/Instagram):
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                    className="dd-input"
                    type="text"
                    readOnly
                    value={`${window.location.origin}/f/${company.public_slug}`}
                    style={{ flex: 1, fontSize: 13 }}
                    />
                    <button
                    type="button"
                    className="dd-btn-secondary"
                    onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/f/${company.public_slug}`);
                        alert('Link copiado!');
                    }}
                    >
                    Copiar
                    </button>
                </div>
                </div>
            )}

            <form className="dd-form" onSubmit={handleSaveCompany}>
                <label className="dd-field">
                Nome da imobiliaria
                <input
                    className="dd-input"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                />
                </label>

                <div className="dd-form-actions" style={{ justifyContent: 'flex-start' }}>
                    <button className="dd-btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar imobiliaria'}
                    </button>
                </div>
            </form>
            </section>
        )}
        </section>
    </main>
    );
}

export default Profile;