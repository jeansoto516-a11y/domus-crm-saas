import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
            <h1 className="dd-title">{address}</h1>
            <p className="dd-subtitle">Linha do tempo de todas as cobrancas geradas para este imovel.</p>
            </div>

            <button className="dd-btn-secondary" onClick={() => navigate('/alugueis/imoveis')}>
            Voltar para imoveis
            </button>
        </header>

        <TrialBanner />

        {error && <div className="dd-alert-error">{error}</div>}

        <section className="dd-panel">
            <h2 style={{ marginTop: 0 }}>Linha do tempo</h2>

            {loading ? (
            <div className="dd-empty">Carregando historico...</div>
            ) : payments.length === 0 ? (
            <div className="dd-empty">
                <h2>Nenhum pagamento gerado ainda</h2>
                <p>Assim que as cobrancas mensais forem geradas, elas aparecem aqui.</p>
            </div>
            ) : (
            <div className="dd-timeline-list">
                {payments.map((payment) => (
                <div key={payment.id} className="dd-timeline-card">
                    <div>
                    <strong style={{ textTransform: 'capitalize' }}>
                        {formatMonth(payment.reference_month)}
                    </strong>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--dd-muted)' }}>
                        Aluguel {formatCurrency(payment.rent_value)} · Administracao {formatCurrency(payment.admin_fee_value)} · Comissao {formatCurrency(payment.broker_commission_value)}
                    </p>
                    {payment.paid_at && (
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--dd-muted)' }}>
                        Pago em {new Date(payment.paid_at).toLocaleDateString('pt-BR')}
                        </p>
                    )}
                    </div>

                    <span className="dd-pill">
                    {statusLabels[payment.status] || payment.status}
                    </span>
                </div>
                ))}
            </div>
            )}
        </section>

        <section className="dd-panel">
            <h2 style={{ marginTop: 0 }}>Historico de reajustes</h2>

            {adjustments.length === 0 ? (
            <div className="dd-empty">Nenhum reajuste registrado ainda.</div>
            ) : (
            <div className="dd-timeline-list">
                {adjustments.map((adjustment) => (
                <div key={adjustment.id} className="dd-timeline-card" style={{ display: 'block' }}>
                    <strong>
                    {formatCurrency(adjustment.old_value)} {'->'} {formatCurrency(adjustment.new_value)}
                    </strong>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--dd-muted)' }}>
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