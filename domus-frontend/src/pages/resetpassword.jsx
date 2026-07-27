import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
        setError('As senhas nao coincidem.');
        return;
    }

    if (!token || !email) {
        setError('Link invalido. Solicite uma nova recuperacao de senha.');
        return;
    }

    setLoading(true);

    try {
        const response = await api.post('/auth/reset-password', {
        email,
        token,
        new_password: newPassword
        });

        setMessage(response.data.message);

        setTimeout(() => {
        navigate('/login');
        }, 2000);

    } catch (err) {
        setError(err.response?.data?.error || 'Erro ao redefinir senha.');
    } finally {
        setLoading(false);
        }
    };

    return (
    <main className="app-shell">
        <section className="workspace">
        <header className="workspace-header">
            <div>
            <span className="eyebrow">Domus</span>
            <h1>Redefinir senha</h1>
            <p>Crie uma nova senha para sua conta.</p>
            </div>
        </header>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert">{message}</div>}

        {!token || !email ? (
            <div className="alert error">
            Link invalido ou incompleto. <Link to="/esqueci-senha">Solicitar novo link</Link>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="metric-card">
            <label>
                Nova senha
                <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimo 6 caracteres"
                required
                />
            </label>

            <label>
                Confirmar nova senha
                <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                required
                />
            </label>

            <button className="primary-button" type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Redefinir senha'}
            </button>
            </form>
        )}
        </section>
    </main>
    );
}

export default ResetPassword;