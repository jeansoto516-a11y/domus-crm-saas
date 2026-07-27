import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
        const response = await api.post('/auth/forgot-password', { email });
        setMessage(response.data.message);
    } catch (err) {
        setError(err.response?.data?.error || 'Erro ao solicitar recuperacao de senha.');
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
            <h1>Esqueci minha senha</h1>
            <p>Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>
            </div>
        </header>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert">{message}</div>}

        <form onSubmit={handleSubmit} className="metric-card">
            <label>
            E-mail
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
            />
            </label>

            <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar link de recuperacao'}
            </button>
        </form>

        <Link to="/login">Voltar para o login</Link>
        </section>
    </main>
    );
}

export default ForgotPassword;