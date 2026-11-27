import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import RemindersWidget from '../components/RemindersWidget';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';


const MAX_FILE_MB = 100;
const MAX_FILES = 10;
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];
const ACCEPT = ALLOWED_EXTENSIONS.join(',');

function getExt(name) {
    const index = (name || '').lastIndexOf('.');
    return index >= 0 ? name.slice(index).toLowerCase() : '';
}

function formatSize(bytes) {
    const size = Number(bytes) || 0;

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;

    return `${(size / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

function PendingFile({ file, onRemove, disabled }) {
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (!file.type.startsWith('image/')) return undefined;

        const url = URL.createObjectURL(file);
        setPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [file]);

    return (
        <div className="dd-pending-file">
            {preview ? (
                <img src={preview} alt={file.name} />
            ) : (
                <span className="dd-file-icon">{getExt(file.name).replace('.', '').toUpperCase().slice(0, 4)}</span>
            )}

            <div className="dd-pending-file-info">
                <span className="dd-pending-file-name">{file.name}</span>
                <span className="dd-pending-file-size">{formatSize(file.size)}</span>
            </div>

            <button type="button" onClick={onRemove} disabled={disabled} aria-label="Remover arquivo">×</button>
        </div>
    );
}

function Messages() {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [newLeadsCount, setNewLeadsCount] = useState(0);
    const bottomRef = useRef(null);
    const fileInputRef = useRef(null);
    const [files, setFiles] = useState([]);
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState(0);
    const [lightbox, setLightbox] = useState(null);
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

    useEffect(() => {
    const checkNewLeads = () => {
        api.get('/leads/new-count')
            .then((res) => setNewLeadsCount(res.data.count))
            .catch(() => {});
    };

    checkNewLeads();
    const interval = setInterval(checkNewLeads, 10000);
    return () => clearInterval(interval);
    }, []);

        const handlePickFiles = (event) => {
        const picked = Array.from(event.target.files || []);
        event.target.value = '';

        if (picked.length === 0) return;

        setError('');

        const accepted = [];

        picked.forEach((file) => {
            if (!ALLOWED_EXTENSIONS.includes(getExt(file.name))) {
                setError(`"${file.name}" nao e um tipo permitido. Envie imagens (JPG, PNG, WEBP), PDF, Word, Excel ou TXT.`);
                return;
            }

            if (file.size > MAX_FILE_MB * 1024 * 1024) {
                setError(`"${file.name}" passa de ${MAX_FILE_MB} MB.`);
                return;
            }

            accepted.push(file);
        });

        const merged = [...files, ...accepted];

        if (merged.length > MAX_FILES) {
            setError(`Envie no maximo ${MAX_FILES} arquivos por mensagem.`);
        }

        setFiles(merged.slice(0, MAX_FILES));
    };

    const removeFile = (index) => {
        setFiles((current) => current.filter((_, i) => i !== index));
    };

    const handleSend = async (e) => {
        e.preventDefault();

        if (sending) return;
        if (!text.trim() && files.length === 0) return;

        try {
            setSending(true);
            setProgress(0);
            setError('');

            if (files.length > 0) {
                const formData = new FormData();
                formData.append('content', text);
                files.forEach((file) => formData.append('files', file));

                await api.post('/messages', formData, {
                    headers: { 'Content-Type': undefined },
                    timeout: 0,
                    onUploadProgress: (event) => {
                        if (event.total) setProgress(Math.round((event.loaded * 100) / event.total));
                    }
                });
            } else {
                await api.post('/messages', { content: text });
            }

            setText('');
            setFiles([]);
            loadMessages();
        } catch (err) {
            setError(err.response?.data?.error || 'Nao foi possivel enviar a mensagem.');
        } finally {
            setSending(false);
            setProgress(0);
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
            <button onClick={() => navigate('/financeiro')}>
                <Icon name="money" /> Financeiro
            </button>
            <button onClick={() => navigate('/leads')}>
                <Icon name="users" /> Leads
                {newLeadsCount > 0 && <span className="dd-badge">{newLeadsCount}</span>}
            </button>
            <button onClick={() => navigate('/leads/novo')}>
                <Icon name="userPlus" /> Novo lead
            </button>
            <button onClick={() => navigate('/catalogo')}>
            <Icon name="file" /> Catalogo de imoveis
            </button>
            <button onClick={() => navigate('/tour-360')}>
            <Icon name="vr" /> Tour Virtual 360°
            </button>
            <button onClick={() => navigate('/projetos-3d')}>
            <Icon name="cube" /> Projetos 3D
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
            <button onClick={() => navigate('/meta-ads')}>
            <Icon name="facebook" /> Meta Ads
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
                                        {msg.content && <div className="dd-bubble-text">{msg.content}</div>}

                    {msg.attachments && msg.attachments.length > 0 && (
                    <div className="dd-bubble-attachments">
                        {msg.attachments.map((att) =>
                        att.type && att.type.startsWith('image/') ? (
                            <img
                            key={att.id || att.url}
                            className="dd-attach-img"
                            src={att.url}
                            alt={att.name}
                            onClick={() => setLightbox(att.url)}
                            />
                        ) : (
                            <a
                            key={att.id || att.url}
                            className="dd-attach-file"
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            >
                            <span className="dd-file-icon">{getExt(att.name).replace('.', '').toUpperCase().slice(0, 4)}</span>
                            <span className="dd-attach-file-info">
                                <strong>{att.name}</strong>
                                <small>{formatSize(att.size)}</small>
                            </span>
                            </a>
                        )
                        )}
                    </div>
                    )}
                    <div className="dd-bubble-meta">
                    {msg.sender_role === 'company' ? 'Voce' : 'Domus'} - {new Date(msg.created_at).toLocaleString('pt-BR')}
                    </div>
                </div>
                ))
            )}
            <div ref={bottomRef} />
            </div>

                        {files.length > 0 && (
            <div className="dd-chat-attachments">
                {files.map((file, index) => (
                <PendingFile
                    key={`${file.name}-${file.size}-${index}`}
                    file={file}
                    disabled={sending}
                    onRemove={() => removeFile(index)}
                />
                ))}
            </div>
            )}

            {sending && files.length > 0 && (
            <div className="dd-chat-progress">
                <div className="dd-chat-progress-bar" style={{ width: `${progress}%` }} />
                <span>Enviando... {progress}%</span>
            </div>
            )}

            <form onSubmit={handleSend} className="dd-chat-form">
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPT}
                style={{ display: 'none' }}
                onChange={handlePickFiles}
            />
            <button
                type="button"
                className="dd-btn-secondary dd-chat-clip"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                title="Anexar arquivos"
                aria-label="Anexar arquivos"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
            </button>
            <input
                className="dd-input"
                type="text"
                placeholder="Escreva sua mensagem..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={sending}
                style={{ flex: 1 }}
            />
            <button className="dd-btn-primary" type="submit" disabled={sending}>
                {sending ? 'Enviando...' : 'Enviar'}
            </button>
            </form>
        </section>
        </section>
                {lightbox && (
        <div className="dd-chat-lightbox" onClick={() => setLightbox(null)}>
            <img src={lightbox} alt="Anexo" />
        </div>
        )}
    </main>
    );
}

export default Messages;