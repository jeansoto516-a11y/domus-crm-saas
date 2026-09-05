import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import TrialBanner from '../components/TrialBanner';
import RemindersWidget from '../components/RemindersWidget';

const statusLabels = {
    pendente: 'Pendente',
    pago: 'Pago',
    atrasado: 'Atrasado'
};

function formatMonth(referenceMonth) {
    if (!referenceMonth) return '-';
    const date = new Date(referenceMonth);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function RentalPropertyHistory() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [payments, setPayments] = useState([]);
    const [adjustments, setAdjustments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);

    const loadHistory = async () => {
    setLoading(true);
    setError('');

    try {
        const response = await api.get('/rentals/payments', {
        params: { property_id: id }
        });

        const sorted = [...response.data].sort(
        (a, b) => new Date(b.reference_month) - new Date(a.reference_month)
        );

        setPayments(sorted);
    } catch (err) {
        setError(err.response?.data?.error || 'Erro ao buscar historico.');
    } finally {
        setLoading(false);
    }
    };

        const loadAdjustments = async () => {
    try {
        const response = await api.get(`/rentals/properties/${id}/adjustments`);
        setAdjustments(response.data);
    } catch (err) {
        console.error(err);
    }
    };

    useEffect(() => {
    loadHistory();
    loadAdjustments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

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

    const formatCurrency = (value) =>
    Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const address = payments[0]?.address || 'Imovel';

    return (
    <main className="app-shell">
        <aside className="sidebar">
        <div className="brand">
            <span className="brand-mark">D</span>
            <span>Domus CRM</span>
        </div>

        <nav className="side-nav">
            <button onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button className="active" onClick={() => navigate('/alugueis')}>Alugueis</button>
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
            <span className="eyebrow">Historico de pagamentos</span>
            <h1>{address}</h1>
            <p>Linha do tempo de todas as cobrancas geradas para este imovel.</p>
            </div>

            <button className="secondary-button" onClick={() => navigate('/alugueis/imoveis')}>
            Voltar para imoveis
            </button>
        </header>

        <TrialBanner />

        {error && <div className="alert error">{error}</div>}

        <section className="panel">
            <h2>Linha do tempo</h2>

            {loading ? (
            <div className="empty-state">Carregando historico...</div>
            ) : payments.length === 0 ? (
            <div className="empty-state">
                <h2>Nenhum pagamento gerado ainda</h2>
                <p>Assim que as cobrancas mensais forem geradas, elas aparecem aqui.</p>
            </div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {payments.map((payment) => (
                <div
                    key={payment.id}
                    style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px'
                    }}
                >
                    <div>
                    <strong style={{ textTransform: 'capitalize' }}>
                        {formatMonth(payment.reference_month)}
                    </strong>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
                        Aluguel {formatCurrency(payment.rent_value)} · Administracao {formatCurrency(payment.admin_fee_value)} · Comissao {formatCurrency(payment.broker_commission_value)}
                    </p>
                    {payment.paid_at && (
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9CA3AF' }}>
                        Pago em {new Date(payment.paid_at).toLocaleDateString('pt-BR')}
                        </p>
                    )}
                    </div>

                    <span className="status-pill">
                    {statusLabels[payment.status] || payment.status}
                    </span>
                </div>
                ))}
            </div>
            )}
                </section>

        <section className="panel">
            <h2>Historico de reajustes</h2>

            {adjustments.length === 0 ? (
            <div className="empty-state">Nenhum reajuste registrado ainda.</div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {adjustments.map((adjustment) => (
                <div
                    key={adjustment.id}
                    style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '12px 16px'
                    }}
                >
                    <strong>
                    {formatCurrency(adjustment.old_value)} {'->'} {formatCurrency(adjustment.new_value)}
                    </strong>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
                    {new Date(adjustment.adjusted_at).toLocaleDateString('pt-BR')}
                    {adjustment.adjusted_by_name ? ` · por ${adjustment.adjusted_by_name}` : ''}
                    </p>
                </div>
                ))}
            </div>
            )}
        </section>
        </section>
        <RemindersWidget />
    </main>
    );
}

export default RentalPropertyHistory;