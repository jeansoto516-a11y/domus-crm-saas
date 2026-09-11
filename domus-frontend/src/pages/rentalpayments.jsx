import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';
import RemindersWidget from '../components/RemindersWidget';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';

const statusLabels = {
    pendente: 'Pendente',
    pago: 'Pago',
    atrasado: 'Atrasado'
};

function currentMonthValue() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function Rentalpayments() {
    const navigate = useNavigate();

    const currentUser = useMemo(() => {
    try {
        return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
        return {};
    }
    }, []);

    const isAdmin = currentUser.role === 'admin';

    const [monthValue, setMonthValue] = useState(currentMonthValue());
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);

    const referenceMonth = `${monthValue}-01`;

    const loadPayments = async () => {
    setLoading(true);
    setError('');

    try {
        const response = await api.get('/rentals/payments', {
        params: { month: referenceMonth }
        });
        setPayments(response.data);
    } catch (err) {
        setError(err.response?.data?.error || 'Erro ao buscar pagamentos.');
    } finally {
        setLoading(false);
    }
    };

    useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monthValue]);

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

    const handleGenerate = async () => {
    setGenerating(true);
    setMessage('');
    setError('');

    try {
        const response = await api.post('/rentals/generate-month');
        setMessage(response.data.message || 'Cobrancas do mes geradas com sucesso.');
        loadPayments();
        setTimeout(() => setMessage(''), 4000);
    } catch (err) {
        setError(err.response?.data?.error || 'Erro ao gerar cobrancas do mes.');
    } finally {
        setGenerating(false);
    }
    };

    const handleStatusChange = async (id, status) => {
    try {
        await api.put(`/rentals/payments/${id}/status`, { status });
        loadPayments();
    } catch (err) {
        setError(err.response?.data?.error || 'Erro ao atualizar status.');
    }
    };

    const formatCurrency = (value) =>
    Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
            <button className="active" onClick={() => navigate('/alugueis')}>
                <Icon name="file" /> Alugueis
            </button>
            <button onClick={() => navigate('/leads')}>
                <Icon name="users" /> Leads
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
        </aside>

        <section className="dd-main">
        <header className="dd-header">
            <div>
            <h1 className="dd-title">Pagamentos mensais</h1>
            <p className="dd-subtitle">Gere as cobrancas do mes e acompanhe o status de cada imovel.</p>
            </div>

            <div className="dd-header-right">
            <button className="dd-btn-secondary" onClick={() => navigate('/alugueis/imoveis')}>
                Ver imoveis
            </button>
            <button className="dd-btn-secondary" onClick={() => navigate('/alugueis')}>
                Ver dashboard
            </button>
            </div>
        </header>

        <TrialBanner />

        {message && <div className="dd-alert-success">{message}</div>}
        {error && <div className="dd-alert-error">{error}</div>}

        <section className="dd-panel">
            <h2 style={{ marginTop: 0 }}>Mes de referencia</h2>
            <p style={{ color: 'var(--dd-muted)', marginTop: -8, fontSize: 13 }}>Escolha o mes para ver ou gerar os pagamentos.</p>

            <div className="dd-inline-form" style={{ alignItems: 'center' }}>
            <input
                className="dd-input"
                type="month"
                value={monthValue}
                onChange={(event) => setMonthValue(event.target.value)}
            />

            {isAdmin && (
                <button className="dd-btn-primary" onClick={handleGenerate} disabled={generating}>
                {generating ? 'Gerando...' : 'Gerar cobrancas do mes'}
                </button>
            )}
            </div>
        </section>

        <section className="dd-panel">
            <h2 style={{ marginTop: 0 }}>Pagamentos do mes</h2>

            <div className="dd-table-wrap">
            {loading ? (
                <div className="dd-empty">Carregando pagamentos...</div>
            ) : payments.length === 0 ? (
                <div className="dd-empty">
                <h2>Nenhum pagamento neste mes</h2>
                <p>
                    {isAdmin
                    ? 'Clique em "Gerar cobrancas do mes" para criar os registros deste mes.'
                    : 'Ainda nao ha cobrancas geradas para este mes.'}
                </p>
                </div>
            ) : (
                <table className="dd-table">
                <thead>
                    <tr>
                    <th>Imovel</th>
                    <th>Corretor</th>
                    <th>Aluguel</th>
                    <th>Valor administracao</th>
                    <th>Comissao corretor</th>
                    <th>Status</th>
                    </tr>
                </thead>

                <tbody>
                    {payments.map((payment) => (
                    <tr key={payment.id}>
                        <td>{payment.address}</td>
                        <td>{payment.corretor || 'Nao informado'}</td>
                        <td>{formatCurrency(payment.rent_value)}</td>
                        <td>{formatCurrency(payment.admin_fee_value)}</td>
                        <td>{formatCurrency(payment.broker_commission_value)}</td>
                        <td>
                        {isAdmin ? (
                            <select
                            className="dd-select"
                            value={payment.status}
                            onChange={(event) => handleStatusChange(payment.id, event.target.value)}
                            >
                            <option value="pendente">Pendente</option>
                            <option value="pago">Pago</option>
                            <option value="atrasado">Atrasado</option>
                            </select>
                        ) : (
                            <span className="dd-pill">{statusLabels[payment.status] || payment.status}</span>
                        )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            )}
            </div>
        </section>
        </section>
        <RemindersWidget />
    </main>
    );
}

export default Rentalpayments;