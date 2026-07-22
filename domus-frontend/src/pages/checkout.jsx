import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import api from '../services/api';

const PLAN_PRICE = 59.90;

function Checkout() {
    const [method, setMethod] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [pixData, setPixData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
    const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
    if (publicKey) {
        initMercadoPago(publicKey);
    }
    }, []);

    const handleCardSubmit = async (formData) => {
    setLoading(true);
    setError('');

    try {
        await api.post('/payments/checkout/card', {
        card_token_id: formData.token
        });

        setSuccess('Assinatura criada com sucesso! Sua conta sera liberada automaticamente.');

        setTimeout(() => {
        navigate('/dashboard');
        }, 2500);

    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel criar a assinatura.');
    } finally {
        setLoading(false);
    }
    };

    const handleGeneratePix = async () => {
    setLoading(true);
    setError('');
    setPixData(null);

    try {
        const response = await api.post('/payments/checkout/pix');
        setPixData(response.data);
    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel gerar o Pix.');
    } finally {
        setLoading(false);
    }
    };

    const copyPixCode = () => {
    if (pixData?.qr_code) {
        navigator.clipboard.writeText(pixData.qr_code);
        setSuccess('Codigo Pix copiado!');
        setTimeout(() => setSuccess(''), 2000);
    }
    };

    return (
    <main className="app-shell">
        <section className="workspace">
        <header className="workspace-header">
            <div>
            <span className="eyebrow">Assinatura Domus</span>
            <h1>Escolha como pagar</h1>
            <p>Plano mensal - R$ {PLAN_PRICE.toFixed(2).replace('.', ',')}</p>
            </div>
        </header>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert">{success}</div>}

        {!method && (
            <section className="filters-bar">
            <button className="primary-button" onClick={() => setMethod('card')}>
                Pagar com cartao de credito
                </button>
            <button className="secondary-button" onClick={() => setMethod('pix')}>
                Pagar com Pix
            </button>
            </section>
        )}

        {method === 'card' && (
            <section>
            <button className="ghost-button" onClick={() => setMethod(null)}>
                Voltar
            </button>

            <CardPayment
                initialization={{ amount: PLAN_PRICE }}
                onSubmit={handleCardSubmit}
                onError={(err) => {
                console.error('Erro no formulario de cartao:', err);
                setError('Erro ao processar o cartao. Confira os dados e tente novamente.');
                }}
            />
            </section>
        )}

        {method === 'pix' && (
            <section>
            <button className="ghost-button" onClick={() => setMethod(null)}>
                Voltar
            </button>

            {!pixData && (
                <button
                className="primary-button"
                onClick={handleGeneratePix}
                disabled={loading}
                >
                {loading ? 'Gerando...' : 'Gerar QR Code Pix'}
                </button>
            )}

            {pixData && (
                <div className="metric-card">
                <p>Escaneie o QR Code abaixo com o app do seu banco:</p>

                {pixData.qr_code_base64 && (
                    <img
                    src={`data:image/png;base64,${pixData.qr_code_base64}`}
                    alt="QR Code Pix"
                    style={{ width: 220, height: 220 }}
                    />
                )}

                <button className="secondary-button" onClick={copyPixCode}>
                    Copiar codigo Pix
                </button>

                <p>Apos o pagamento, sua assinatura sera liberada automaticamente em ate 1 minuto.</p>
                </div>
            )}
            </section>
        )}
        </section>
    </main>
    );
}

export default Checkout;