import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../services/api';

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

function AdminMessages() {
    const { companyId } = useParams();
    const location = useLocation();
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const bottomRef = useRef(null);
    const fileInputRef = useRef(null);
    const [files, setFiles] = useState([]);
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState(0);
    const [lightbox, setLightbox] = useState(null);
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

                await api.post(`/messages/company/${companyId}`, formData, {
                    headers: { 'Content-Type': undefined },
                    timeout: 0,
                    onUploadProgress: (event) => {
                        if (event.total) setProgress(Math.round((event.loaded * 100) / event.total));
                    }
                });
            } else {
                await api.post(`/messages/company/${companyId}`, { content: text });
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
    <>
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
                                        {msg.content && <div style={{ fontSize: 14 }}>{msg.content}</div>}

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
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                    {msg.sender_role === 'admin' ? 'Voce (Domus)' : companyName} - {new Date(msg.created_at).toLocaleString('pt-BR')}
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

            <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
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
                className="secondary-button"
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
                type="text"
                placeholder="Escreva sua mensagem..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={sending}
                style={{ flex: 1 }}
            />
            <button className="primary-button" type="submit" disabled={sending}>
                {sending ? 'Enviando...' : 'Enviar'}
            </button>
            </form>
        </section>
        </section>
            </main>

    {lightbox && (
        <div className="dd-chat-lightbox" onClick={() => setLightbox(null)}>
        <img src={lightbox} alt="Anexo" />
        </div>
    )}
    </>
    );
}

export default AdminMessages;