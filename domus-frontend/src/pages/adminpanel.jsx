import { useEffect, useState } from 'react';
import api from '../services/api';

function AdminPanel() {
    const [companies, setCompanies] = useState([]);
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

    useEffect(() => {
    loadCompanies();
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
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </section>
    </main>
    );    

    /**
 * Estatisticas gerais do sistema
 */
exports.getStats = async (req, res) => {
    try {
        const companiesResult = await pool.query(`
            SELECT subscription_status, COUNT(*) AS total
            FROM companies
            GROUP BY subscription_status
        `);

        const totalLeadsResult = await pool.query(`SELECT COUNT(*) AS total FROM leads`);
        const totalUsersResult = await pool.query(`SELECT COUNT(*) AS total FROM users WHERE role != 'super_admin'`);

        const recentCompaniesResult = await pool.query(`
            SELECT id, name, subscription_status, created_at
            FROM companies
            ORDER BY created_at DESC
            LIMIT 5
        `);

        const stats = {
            por_status: {
                trial: 0,
                active: 0,
                canceled: 0
            },
            total_leads: Number(totalLeadsResult.rows[0].total),
            total_usuarios: Number(totalUsersResult.rows[0].total),
            recentes: recentCompaniesResult.rows
        };

        companiesResult.rows.forEach((item) => {
            stats.por_status[item.subscription_status] = Number(item.total);
        });

        stats.total_imobiliarias = stats.por_status.trial + stats.por_status.active + stats.por_status.canceled;
        stats.receita_estimada_mensal = (stats.por_status.active * 59.90).toFixed(2);

        return res.json(stats);

    } catch (err) {
        console.error('Erro ao buscar estatisticas:', err);
        return res.status(500).json({ error: 'Erro ao buscar estatisticas.' });
    }
};
}
export default AdminPanel;
