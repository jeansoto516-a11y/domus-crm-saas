import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function TrialBanner() {
    const [status, setStatus] = useState(null);

    useEffect(() => {
    let active = true;

    api.get('/payments/status')
        .then((response) => {
        if (active) setStatus(response.data);
        })
        .catch(() => {
            
        });

    return () => {
        active = false;
    };
    }, []);

    if (!status) return null;

    const { subscription_status, days_left } = status;

    if (subscription_status === 'active') {
    return null;
    }

    if (subscription_status === 'trial') {
    if (days_left === null || days_left > 3) {
        return null;
    }

    if (days_left >= 1) {
        return (
        <div className="alert">
            Seu periodo de teste gratis termina em {days_left} {days_left === 1 ? 'dia' : 'dias'}.{' '}
            <Link to="/checkout">Assine agora</Link> para nao perder o acesso.
        </div>
        );
    }

    return (
        <div className="alert error">
        Seu periodo de teste gratis termina hoje.{' '}
        <Link to="/checkout">Assine agora</Link> para nao perder o acesso.
        </div>
    );
    }

    return (
    <div className="alert error">
        Sua assinatura nao esta ativa. <Link to="/checkout">Assine agora</Link> para continuar usando o Domus.
    </div>
    );
}

export default TrialBanner;