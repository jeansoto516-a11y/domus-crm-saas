import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import RemindersWidget from '../components/RemindersWidget';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';

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
            <button onClick={() => navigate('/alugueis')}>
                <Icon name="file" /> Alugueis
            </button>
            <button onClick={() => navigate('/leads')}>
                <Icon name="users" /> Leads
            </button>
            <button onClick={() => navigate('/leads/novo')}>
                <Icon name="userPlus" /> Novo lead
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
            <button className="active" onClick={() => navigate('/mensagens')}>
                <Icon name="chat" /> Mensagens
                {unreadCount > 0 && <span className="dd-badge">{unreadCount}</span>}
            </button>
        </nav>
        </aside>

        <section className="dd-main">
        <header className="dd-header">
            <div>
            <h1 className="dd-title">Mensagens</h1>
            <p className="dd-subtitle">Fale diretamente com a equipe do Domus.</p>
            </div>
        </header>

        {error && <div className="dd-alert-error">{error}</div>}

        <section className="dd-panel dd-chat-panel">
            <div className="dd-chat-scroll">
            {loading ? (
                <p style={{ color: 'var(--dd-muted)' }}>Carregando conversa...</p>
            ) : messages.length === 0 ? (
                <p style={{ color: 'var(--dd-muted)' }}>Nenhuma mensagem ainda. Envie a primeira!</p>
            ) : (
                messages.map((msg) => (
                <div
                    key={msg.id}
                    className={`dd-bubble ${msg.sender_role === 'company' ? 'mine' : 'theirs'}`}
                >
                    <div className="dd-bubble-text">{msg.content}</div>
                    <div className="dd-bubble-meta">
                    {msg.sender_role === 'company' ? 'Voce' : 'Domus'} - {new Date(msg.created_at).toLocaleString('pt-BR')}
                    </div>
                </div>
                ))
            )}
            <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="dd-chat-form">
            <input
                className="dd-input"
                type="text"
                placeholder="Escreva sua mensagem..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{ flex: 1 }}
            />
            <button className="dd-btn-primary" type="submit">
                Enviar
            </button>
            </form>
        </section>
        </section>
        <RemindersWidget />
    </main>
    );
}

export default Messages;