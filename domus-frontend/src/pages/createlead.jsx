import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';
import RemindersWidget from '../components/RemindersWidget';

function CreateLead() {
    const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'novo',
    lead_type: 'venda'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

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

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name || (!form.email && !form.phone)) {
      setError('Informe o nome e pelo menos um contato do lead.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/leads', form);
      navigate('/leads');
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        return;
      }
      setError(err.response?.data?.error || 'Nao foi possivel cadastrar o lead.');
    } finally {
      setLoading(false);
    }
  };

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
            <span className="eyebrow">Captacao</span>
            <h1>Novo lead</h1>
            <p>Cadastre uma oportunidade e deixe o Domus calcular a prioridade.</p>
          </div>
          <button className="secondary-button" onClick={() => navigate('/leads')}>
            Ver leads
          </button>
        </header>

        <TrialBanner />

        <section className="panel narrow">
          <form className="form-card clean" onSubmit={handleCreate}>
            {error && <div className="alert error">{error}</div>}

            <label>
              Nome do lead
              <input name="name" onChange={updateField} placeholder="Ex: Marina Oliveira" value={form.name} />
            </label>

            <label>
              Email
              <input name="email" onChange={updateField} placeholder="lead@email.com" type="email" value={form.email} />
            </label>

            <label>
              Telefone
              <input name="phone" onChange={updateField} placeholder="(11) 99999-9999" value={form.phone} />
            </label>

                        <label>
              Tipo de lead
              <select name="lead_type" onChange={updateField} value={form.lead_type}>
                <option value="venda">Venda</option>
                <option value="aluguel">Aluguel</option>
              </select>
            </label>

            <label>
              Etapa inicial
              <select name="status" onChange={updateField} value={form.status}>
                <option value="novo">Novo</option>
                <option value="contato">Contato</option>
                <option value="visita">Visita</option>
                <option value="proposta">Proposta</option>
                <option value="fechado">Fechado</option>
              </select>
            </label>

            <div className="form-actions">
              <button className="secondary-button" onClick={() => navigate('/leads')} type="button">
                Cancelar
              </button>
              <button className="primary-button" disabled={loading} type="submit">
                {loading ? 'Salvando...' : 'Salvar lead'}
              </button>
            </div>
          </form>
        </section>
      </section>
      <RemindersWidget />
    </main>
  );
}

export default CreateLead;
