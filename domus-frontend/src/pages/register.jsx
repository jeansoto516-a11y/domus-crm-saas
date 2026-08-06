import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import TermsModal from '../components/TermsModal';

function Register() {
  const [form, setForm] = useState({
    company_name: '',
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const navigate = useNavigate();

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitRegistration = async () => {
    try {
      setLoading(true);
      await api.post('/auth/register', { ...form, role: 'admin', accepted_terms: true });
      setSuccess('Conta criada. Redirecionando para o login...');
      setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel criar sua conta agora.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.company_name || !form.name || !form.email || !form.password) {
      setError('Preencha todos os campos para criar sua conta.');
      return;
    }

    if (form.password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setShowTermsModal(true);
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel wide">
        <Link className="brand" to="/">
          <span className="brand-mark">D</span>
          <span>Domus CRM</span>
        </Link>
        <div>
          <span className="eyebrow">Teste gratis por 14 dias</span>
          <h1>Crie o espaco da sua imobiliaria.</h1>
          <p>Em menos de um minuto voce ja pode cadastrar leads e acompanhar o funil.</p>
        </div>

        <form className="form-card two-columns" onSubmit={handleRegister}>
          {error && <div className="alert error span-all">{error}</div>}
          {success && <div className="alert success span-all">{success}</div>}

          <label>
            Imobiliaria
            <input
              autoComplete="organization"
              name="company_name"
              onChange={updateField}
              placeholder="Nome da imobiliaria"
              value={form.company_name}
            />
          </label>

          <label>
            Seu nome
            <input
              autoComplete="name"
              name="name"
              onChange={updateField}
              placeholder="Nome do responsavel"
              value={form.name}
            />
          </label>

          <label>
            Email
            <input
              autoComplete="email"
              name="email"
              onChange={updateField}
              placeholder="voce@imobiliaria.com"
              type="email"
              value={form.email}
            />
          </label>

          <label>
            Senha
            <input
              autoComplete="new-password"
              name="password"
              onChange={updateField}
              placeholder="Minimo 6 caracteres"
              type="password"
              value={form.password}
            />
          </label>

          <button className="primary-button full span-all" disabled={loading} type="submit">
            {loading ? 'Criando conta...' : 'Criar conta e iniciar teste'}
          </button>
        </form>

        {showTermsModal && (
          <TermsModal
            onClose={() => setShowTermsModal(false)}
            onAccept={() => {
              setShowTermsModal(false);
              submitRegistration();
            }}
          />
        )}

        <p className="auth-footer">
          Ja tem conta? <Link to="/login">Entrar no Domus</Link>
        </p>
      </section>
    </main>
  );
}

export default Register;