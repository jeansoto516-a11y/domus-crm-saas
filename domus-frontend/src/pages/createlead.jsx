import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';
import RemindersWidget from '../components/RemindersWidget';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';

function CreateLead() {
    const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    acquisition_type: '',
    property_type: '',
    region: '',
    city: '',
    bedrooms: '',
    suites: '',
    bathrooms: '',
    garage_spots: '',
    min_area: '',
    land_area: '',
    floor_preference: '',
    has_elevator: '',
    budget_min: '',
    budget_max: '',
    down_payment: '',
    trade_value: '',
    urgency: '',
    notes: '',
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

    if (!form.acquisition_type || !form.property_type || !form.region || !form.city || !form.urgency) {
      setError('Preencha tipo de aquisição, tipo de imóvel, região, cidade e urgência.');
      return;
    }

    const payload = {
      ...form,
      has_elevator: form.has_elevator === '' ? null : form.has_elevator === 'sim'
    };

    try {
      setLoading(true);
      await api.post('/leads', payload);
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
          <button className="active" onClick={() => navigate('/leads/novo')}>
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
            <h1 className="dd-title">Novo lead</h1>
            <p className="dd-subtitle">Cadastre uma oportunidade e deixe o Domus calcular a prioridade.</p>
          </div>
          <button className="dd-btn-secondary" onClick={() => navigate('/leads')}>
            Ver leads
          </button>
        </header>

        <TrialBanner />

        <section className="dd-panel dd-panel-narrow">
          <form className="dd-form" onSubmit={handleCreate}>
            {error && <div className="dd-alert-error">{error}</div>}

            <label className="dd-field">
              Nome do lead
              <input className="dd-input" name="name" onChange={updateField} placeholder="Ex: Marina Oliveira" value={form.name} />
            </label>

            <label className="dd-field">
              Email
              <input className="dd-input" name="email" onChange={updateField} placeholder="lead@email.com" type="email" value={form.email} />
            </label>

                        <label className="dd-field">
              Telefone
              <input className="dd-input" name="phone" onChange={updateField} placeholder="(11) 99999-9999" value={form.phone} />
            </label>

            <label className="dd-field">
              Tipo de aquisição
              <input className="dd-input" name="acquisition_type" onChange={updateField} placeholder="Ex: Compra à vista, Financiamento..." value={form.acquisition_type} />
            </label>

            <label className="dd-field">
              Tipo de imóvel
              <input className="dd-input" name="property_type" onChange={updateField} placeholder="Ex: Apartamento, Casa..." value={form.property_type} />
            </label>

            <label className="dd-field">
              Região
              <input className="dd-input" name="region" onChange={updateField} placeholder="Ex: Zona Sul" value={form.region} />
            </label>

            <label className="dd-field">
              Cidade
              <input className="dd-input" name="city" onChange={updateField} placeholder="Ex: São Paulo" value={form.city} />
            </label>

            <label className="dd-field">
              Urgência
              <input className="dd-input" name="urgency" onChange={updateField} placeholder="Ex: Imediata, 3 meses..." value={form.urgency} />
            </label>

            <label className="dd-field">
              Dormitórios
              <input className="dd-input" name="bedrooms" onChange={updateField} type="number" min="0" value={form.bedrooms} />
            </label>

            <label className="dd-field">
              Suítes
              <input className="dd-input" name="suites" onChange={updateField} type="number" min="0" value={form.suites} />
            </label>

            <label className="dd-field">
              Banheiros
              <input className="dd-input" name="bathrooms" onChange={updateField} type="number" min="0" value={form.bathrooms} />
            </label>

            <label className="dd-field">
              Vagas de garagem
              <input className="dd-input" name="garage_spots" onChange={updateField} type="number" min="0" value={form.garage_spots} />
            </label>

            <label className="dd-field">
              Área mínima (m²)
              <input className="dd-input" name="min_area" onChange={updateField} type="number" min="0" value={form.min_area} />
            </label>

            <label className="dd-field">
              Área do terreno (m²)
              <input className="dd-input" name="land_area" onChange={updateField} type="number" min="0" value={form.land_area} />
            </label>

            <label className="dd-field">
              Preferência de andar
              <input className="dd-input" name="floor_preference" onChange={updateField} placeholder="Ex: Alto, Térreo..." value={form.floor_preference} />
            </label>

            <label className="dd-field">
              Elevador
              <select className="dd-select" name="has_elevator" onChange={updateField} value={form.has_elevator}>
                <option value="">Não informado</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </label>

            <label className="dd-field">
              Orçamento mínimo
              <input className="dd-input" name="budget_min" onChange={updateField} type="number" min="0" value={form.budget_min} />
            </label>

            <label className="dd-field">
              Orçamento máximo
              <input className="dd-input" name="budget_max" onChange={updateField} type="number" min="0" value={form.budget_max} />
            </label>

            <label className="dd-field">
              Valor de entrada
              <input className="dd-input" name="down_payment" onChange={updateField} type="number" min="0" value={form.down_payment} />
            </label>

            <label className="dd-field">
              Valor do imóvel na troca
              <input className="dd-input" name="trade_value" onChange={updateField} type="number" min="0" value={form.trade_value} />
            </label>

            <label className="dd-field">
              Observações
              <textarea className="dd-input" name="notes" onChange={updateField} placeholder="Anotações sobre o lead" value={form.notes} />
            </label>

            <label className="dd-field">
              Tipo de lead
              <select className="dd-select" name="lead_type" onChange={updateField} value={form.lead_type}>
                <option value="venda">Venda</option>
                <option value="aluguel">Aluguel</option>
              </select>
            </label>

            <label className="dd-field">
              Etapa inicial
              <select className="dd-select" name="status" onChange={updateField} value={form.status}>
                <option value="novo">Novo</option>
                <option value="contato">Contato</option>
                <option value="visita">Visita</option>
                <option value="proposta">Proposta</option>
                <option value="fechado">Fechado</option>
              </select>
            </label>

            <div className="dd-form-actions">
              <button className="dd-btn-secondary" onClick={() => navigate('/leads')} type="button">
                Cancelar
              </button>
              <button className="dd-btn-primary" disabled={loading} type="submit">
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