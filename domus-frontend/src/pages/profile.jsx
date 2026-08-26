import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';

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

    useEffect(() => {
    api.get('/users/me').then((response) => {
        setUser(response.data.user);
        setCompany(response.data.company);
        setName(response.data.user.name);
        setCompanyName(response.data.company?.name || '');
    });
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
    <main className="app-shell">
        <section className="workspace">
        <header className="workspace-header">
            <div>
            <span className="eyebrow">Domus</span>
            <h1>Meu perfil</h1>
            </div>
            <Link className="secondary-button" to="/dashboard">Voltar ao dashboard</Link>
        </header>

        <TrialBanner />

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert">{message}</div>}

        <section className="metric-card">
            <h2>Meus dados</h2>

            <form onSubmit={handleSaveProfile}>
            <label>
                Nome
                <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                />
            </label>

            <label>
                E-mail (nao editavel)
                <input type="email" value={user.email} disabled />
            </label>

            <label>
                Senha atual
                <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Preencha somente se for trocar a senha"
                />
            </label>

            <label>
                Nova senha
                <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimo 6 caracteres"
                />
            </label>

            <button className="primary-button" type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar meus dados'}
            </button>
            </form>
        </section>

        {user.role === 'admin' && (
            <section className="metric-card">
            <h2>Dados da imobiliaria</h2>

                        {company?.public_slug && (
                <div style={{ background: '#F3F4F6', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <p style={{ fontSize: 13, margin: '0 0 8px', color: '#6B7280' }}>
                    Link publico para captacao de leads (divulgue no seu site/Instagram):
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/f/${company.public_slug}`}
                    style={{ flex: 1, fontSize: 13 }}
                    />
                    <button
                    type="button"
                    className="secondary-button"
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

            <form onSubmit={handleSaveCompany}>
                <label>
                Nome da imobiliaria
                <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                />
                </label>

                <button className="primary-button" type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar imobiliaria'}
                </button>
            </form>
            </section>
        )}
        </section>
    </main>
    );
}

export default Profile;