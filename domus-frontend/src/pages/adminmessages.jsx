import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../services/api';

function AdminMessages() {
    const { companyId } = useParams();
    const location = useLocation();
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const bottomRef = useRef(null);
    const navigate = useNavigate();

    const companyName = location.state?.companyName || `Imobiliaria #${companyId}`;

    const loadMessages = useCallback(async () => {
    try {
        const { data } = await api.get(`/messages/company/${companyId}`);
        setMessages(data);
    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel carregar as mensagens.');
    } finally {
        setLoading(false);
    }
    }, [companyId]);

    useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 8000);
    return () => clearInterval(interval);
    }, [loadMessages]);

    useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
        await api.post(`/messages/company/${companyId}`, { content: text });
        setText('');
        loadMessages();
    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel enviar a mensagem.');
    }
    };

    return (
    <main className="app-shell">
        <section className="workspace">
        <header className="workspace-header">
            <div>
            <span className="eyebrow">Domus - Painel do sistema</span>
            <h1>Conversa com {companyName}</h1>
            </div>
            <button className="secondary-button" onClick={() => navigate('/admin')}>
            Voltar ao painel
            </button>
        </header>

        {error && <div className="alert error">{error}</div>}

        <section
            className="panel"
            style={{
            display: 'flex',
            flexDirection: 'column',
            height: '60vh',
            padding: 16
            }}
        >
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
                <p>Carregando conversa...</p>
            ) : messages.length === 0 ? (
                <p style={{ color: '#6B7280' }}>Nenhuma mensagem ainda com essa imobiliaria.</p>
            ) : (
                messages.map((msg) => (
                <div
                    key={msg.id}
                    style={{
                    alignSelf: msg.sender_role === 'admin' ? 'flex-end' : 'flex-start',
                    background: msg.sender_role === 'admin' ? '#0F766E' : '#F3F4F6',
                    color: msg.sender_role === 'admin' ? '#fff' : '#1F2937',
                    borderRadius: 12,
                    padding: '8px 12px',
                    maxWidth: '70%'
                    }}
                >
                    <div style={{ fontSize: 14 }}>{msg.content}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                    {msg.sender_role === 'admin' ? 'Voce (Domus)' : companyName} - {new Date(msg.created_at).toLocaleString('pt-BR')}
                    </div>
                </div>
                ))
            )}
            <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
                type="text"
                placeholder="Escreva sua mensagem..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{ flex: 1 }}
            />
            <button className="primary-button" type="submit">
                Enviar
            </button>
            </form>
        </section>
        </section>
    </main>
    );
}

export default AdminMessages;