import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/dark-theme.css';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Informe email e senha para entrar.');
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel entrar. Confira seus dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="dd-shell dd-auth-shell">
      <section className="dd-auth-panel">
        <Link className="dd-auth-brand" to="/">
          <span className="dd-brand-mark">D</span>
          <span>Domus <span style={{ color: 'var(--dd-blue)' }}>CRM</span></span>
        </Link>

        <div>
          <span className="dd-auth-eyebrow">Acesso seguro</span>
          <h1 className="dd-auth-title">Entre na sua central comercial.</h1>
          <p className="dd-auth-subtitle">Continue acompanhando leads, visitas, propostas e fechamentos.</p>
        </div>

        <form className="dd-form" onSubmit={handleLogin}>
          {error && <div className="dd-alert-error">{error}</div>}

          <label className="dd-field">
            Email
            <input
              className="dd-input"
              autoComplete="email"
              name="email"
              onChange={updateField}
              placeholder="voce@imobiliaria.com"
              type="email"
              value={form.email}
            />
          </label>

          <label className="dd-field">
            Senha
            <input
              className="dd-input"
              autoComplete="current-password"
              name="password"
              onChange={updateField}
              placeholder="Sua senha"
              type="password"
              value={form.password}
            />
          </label>

          <button className="dd-btn-primary full" disabled={loading} type="submit">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="dd-auth-footer">
          <Link to="/esqueci-senha">Esqueci minha senha</Link>
        </p>

        <p className="dd-auth-footer">
          Ainda nao tem conta? <Link to="/register">Comece o teste gratis</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;