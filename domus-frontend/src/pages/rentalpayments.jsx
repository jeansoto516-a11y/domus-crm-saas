import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';
import RemindersWidget from '../components/RemindersWidget';

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
        </aside>

        <section className="workspace">
        <header className="workspace-header">
            <div>
            <span className="eyebrow">Financeiro de alugueis</span>
            <h1>Pagamentos mensais</h1>
            <p>Gere as cobrancas do mes e acompanhe o status de cada imovel.</p>
            </div>

            <div className="form-actions">
            <button className="secondary-button" onClick={() => navigate('/alugueis/imoveis')}>
                Ver imoveis
            </button>
            <button className="secondary-button" onClick={() => navigate('/alugueis')}>
                Ver dashboard
            </button>
            </div>
        </header>

        <TrialBanner />

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        <section className="panel">
            <div className="panel-header">
            <div>
                <h2>Mes de referencia</h2>
                <p>Escolha o mes para ver ou gerar os pagamentos.</p>
            </div>
            </div>

            <div className="form-actions">
            <input
                type="month"
                value={monthValue}
                onChange={(event) => setMonthValue(event.target.value)}
            />

            {isAdmin && (
                <button className="primary-button" onClick={handleGenerate} disabled={generating}>
                {generating ? 'Gerando...' : 'Gerar cobrancas do mes'}
                </button>
            )}
            </div>
        </section>

        <section className="panel">
            <h2>Pagamentos do mes</h2>

            {loading ? (
            <div className="empty-state">Carregando pagamentos...</div>
            ) : payments.length === 0 ? (
            <div className="empty-state">
                <h2>Nenhum pagamento neste mes</h2>
                <p>
                {isAdmin
                    ? 'Clique em "Gerar cobrancas do mes" para criar os registros deste mes.'
                    : 'Ainda nao ha cobrancas geradas para este mes.'}
                </p>
            </div>
            ) : (
            <div className="table-wrap">
                <table>
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
                            value={payment.status}
                            onChange={(event) => handleStatusChange(payment.id, event.target.value)}
                            >
                            <option value="pendente">Pendente</option>
                            <option value="pago">Pago</option>
                            <option value="atrasado">Atrasado</option>
                            </select>
                        ) : (
                            <span className="status-pill">{statusLabels[payment.status] || payment.status}</span>
                        )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
        </section>
        </section>
        <RemindersWidget />
    </main>
    );
}

export default Rentalpayments;