import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function AdminPanel() {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    

    const loadCompanies = () => {
    setLoading(true);
    api.get('/admin/companies')
        .then((response) => setCompanies(response.data))
        .catch((err) => setError(err.response?.data?.error || 'Erro ao carregar imobiliarias.'))
        .finally(() => setLoading(false));
    };

    const loadStats = () => {
    api.get('/admin/stats')
        .then((response) => setStats(response.data))
        .catch(() => {});
    };

    useEffect(() => {
    loadCompanies();
    loadStats();
    }, []);

    const handleActivate = async (id) => {
    setMessage('');
    setError('');
    try {
        await api.put(`/admin/companies/${id}/status`, { subscription_status: 'active' });
        setMessage('Imobiliaria ativada com sucesso.');
        loadCompanies();
    } catch (err) {
        setError(err.response?.data?.error || 'Erro ao ativar.');
    }
    };

    const handleCancel = async (id) => {
    setMessage('');
    setError('');
    try {
        await api.put(`/admin/companies/${id}/status`, { subscription_status: 'canceled' });
        setMessage('Assinatura cancelada.');
        loadCompanies();
    } catch (err) {
        setError(err.response?.data?.error || 'Erro ao cancelar.');
    }
    };

    const handleExtendTrial = async (id) => {
    setMessage('');
    setError('');

    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 7);

    try {
        await api.put(`/admin/companies/${id}/status`, {
        subscription_status: 'trial',
        trial_ends_at: newDate.toISOString()
        });
        setMessage('Trial estendido por mais 7 dias.');
        loadCompanies();
    } catch (err) {
        setError(err.response?.data?.error || 'Erro ao estender trial.');
    }
    };

    if (loading) return null;

    return (
    <main className="app-shell">
        <section className="workspace">
        <header className="workspace-header">
            <div>
            <span className="eyebrow">Domus - Painel do sistema</span>
            <h1>Imobiliarias cadastradas</h1>
            <p>{companies.length} imobiliaria(s) no total.</p>
            </div>
            <button
                className="ghost-button"
                onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                }}
            >
                Sair
            </button>
        </header>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert">{message}</div>}

        {stats && (
            <section className="summary-strip">
            <article>
                <span>Total de imobiliarias</span>
                <strong>{stats.total_imobiliarias}</strong>
            </article>
            <article>
                <span>Ativas (pagantes)</span>
                <strong>{stats.por_status.active}</strong>
            </article>
            <article>
                <span>Em trial</span>
                <strong>{stats.por_status.trial}</strong>
            </article>
            <article>
                <span>Canceladas</span>
                <strong>{stats.por_status.canceled}</strong>
            </article>
            <article>
                <span>Receita mensal estimada</span>
                <strong>R$ {stats.receita_estimada_mensal}</strong>
            </article>
            <article>
                <span>Total de leads no sistema</span>
                <strong>{stats.total_leads}</strong>
            </article>
            <article>
                <span>Total de usuarios</span>
                <strong>{stats.total_usuarios}</strong>
            </article>
            </section>
        )}

        <table className="data-table">
            <thead>
            <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Status</th>
                <th>Trial ate</th>
                <th>Usuarios</th>
                <th>Leads</th>
                <th>Acoes</th>
            </tr>
            </thead>
            <tbody>
            {companies.map((company) => (
                <tr key={company.id}>
                <td>{company.name}</td>
                <td>{company.email || '-'}</td>
                <td>{company.subscription_status}</td>
                <td>{company.trial_ends_at ? new Date(company.trial_ends_at).toLocaleDateString('pt-BR') : '-'}</td>
                <td>{company.total_usuarios}</td>
                <td>{company.total_leads}</td>
                <td>
                    <button className="secondary-button" onClick={() => handleActivate(company.id)}>
                    Ativar
                    </button>{' '}
                    <button className="secondary-button" onClick={() => handleExtendTrial(company.id)}>
                    +7 dias trial
                    </button>{' '}
                    <button className="secondary-button" onClick={() => handleCancel(company.id)}>
                    Cancelar
                    </button>

                    <button className="secondary-button" onClick={() => handleCancel(company.id)}>
                    Cancelar
                    </button>{' '}
                    
                    <button
                        className="secondary-button"
                        onClick={() => navigate(`/admin/mensagens/${company.id}`, { state: { companyName: company.name } })}
                    >
                    Mensagens
                    </button>

                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </section>
    </main>
    );    
}

export default AdminPanel;
