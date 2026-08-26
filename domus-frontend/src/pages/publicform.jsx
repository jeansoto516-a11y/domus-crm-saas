import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

function PublicForm() {
    const { slug } = useParams();
    const [company, setCompany] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
    api.get(`/leads/public/${slug}`)
        .then((res) => setCompany(res.data))
        .catch(() => setNotFound(true));
    }, [slug]);

    const updateField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || (!form.email && !form.phone)) {
        setError('Preencha o nome e pelo menos um contato (e-mail ou telefone).');
        return;
    }

    try {
        setLoading(true);
        const res = await api.post(`/leads/public/${slug}`, form);
        setSuccess(res.data.message);
        setForm({ name: '', email: '', phone: '' });
    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel enviar seus dados.');
    } finally {
        setLoading(false);
    }
    };

    if (notFound) {
    return (
        <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <p>Formulario nao encontrado.</p>
        </main>
    );
    }

    return (
    <main style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F3F4F6',
        fontFamily: 'sans-serif',
        padding: 16
    }}>
        <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: 32,
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>{company?.name || 'Carregando...'}</h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>
            Preencha seus dados e entraremos em contato o quanto antes.
        </p>

        {success ? (
            <div style={{ background: '#ECFDF5', color: '#047857', padding: 16, borderRadius: 8, fontSize: 14 }}>
            {success}
            </div>
        ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {error && (
                <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: 10, borderRadius: 8, fontSize: 13 }}>
                {error}
                </div>
            )}

            <label style={{ fontSize: 13 }}>
                Nome
                <input
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="Seu nome completo"
                style={{ width: '100%', padding: 10, marginTop: 4, borderRadius: 8, border: '1px solid #D1D5DB' }}
                />
            </label>

            <label style={{ fontSize: 13 }}>
                E-mail
                <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                placeholder="seu@email.com"
                style={{ width: '100%', padding: 10, marginTop: 4, borderRadius: 8, border: '1px solid #D1D5DB' }}
                />
            </label>

            <label style={{ fontSize: 13 }}>
                Telefone
                <input
                name="phone"
                value={form.phone}
                onChange={updateField}
                placeholder="(11) 99999-9999"
                style={{ width: '100%', padding: 10, marginTop: 4, borderRadius: 8, border: '1px solid #D1D5DB' }}
                />
            </label>

            <button
                type="submit"
                disabled={loading}
                style={{
                background: '#0F766E',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 8
                }}
            >
                {loading ? 'Enviando...' : 'Quero ser contatado'}
            </button>
            </form>
        )}
        </div>
    </main>
    );
}

export default PublicForm;