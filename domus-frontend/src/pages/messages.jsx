import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Messages() {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const bottomRef = useRef(null);
    const navigate = useNavigate();

    const loadMessages = useCallback(async () => {
    try {
        const { data } = await api.get('/messages');
        setMessages(data);
    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel carregar as mensagens.');
    } finally {
        setLoading(false);
    }
    }, []);

    useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 8000);
    return () => clearInterval(interval);
    }, [loadMessages]);

    useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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

    const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
        await api.post('/messages', { content: text });
        setText('');
        loadMessages();
    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel enviar a mensagem.');
    }
    };

    return (
    <main className="app-shell">
        <aside className="sidebar">
            <div className="brand">
            <span className="brand-mark">D</span>
            <span>Domus CRM</span>
        </div>
        <nav className="side-nav">
            <button onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button onClick={() => navigate('/leads')}>Leads</button>
            <button onClick={() => navigate('/leads/novo')}>Novo lead</button>
            <button onClick={() => navigate('/brokers')}>Corretores</button>
            <button onClick={() => navigate('/ranking')}>Ranking</button>
            <button className="active" onClick={() => navigate('/mensagens')}>
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
            <span className="eyebrow">Suporte Domus</span>
            <h1>Mensagens</h1>
            <p>Fale diretamente com a equipe do Domus.</p>
            </div>
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
                <p style={{ color: '#6B7280' }}>Nenhuma mensagem ainda. Envie a primeira!</p>
            ) : (
                messages.map((msg) => (
                <div
                    key={msg.id}
                    style={{
                    alignSelf: msg.sender_role === 'company' ? 'flex-end' : 'flex-start',
                    background: msg.sender_role === 'company' ? '#0F766E' : '#F3F4F6',
                    color: msg.sender_role === 'company' ? '#fff' : '#1F2937',
                    borderRadius: 12,
                    padding: '8px 12px',
                    maxWidth: '70%'
                    }}
                >
                    <div style={{ fontSize: 14 }}>{msg.content}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                    {msg.sender_role === 'company' ? 'Voce' : 'Domus'} - {new Date(msg.created_at).toLocaleString('pt-BR')}
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

export default Messages;