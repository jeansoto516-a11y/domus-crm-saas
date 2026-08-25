import { useEffect, useState } from 'react';
import api from '../services/api';

function RemindersWidget() {
    const [open, setOpen] = useState(false);
    const [reminders, setReminders] = useState([]);
    const [note, setNote] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [error, setError] = useState('');

    const loadReminders = () => {
    api.get('/reminders')
        .then((res) => setReminders(res.data))
        .catch(() => {});
    };

    useEffect(() => {
    loadReminders();
    const interval = setInterval(loadReminders, 15000);
    return () => clearInterval(interval);
    }, []);

    const pendingCount = reminders.filter((r) => !r.done).length;

    const handleCreate = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;

    try {
        await api.post('/reminders', { note, due_date: dueDate || null });
        setNote('');
        setDueDate('');
        loadReminders();
    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel criar o lembrete.');
    }
    };

    const handleToggle = async (reminder) => {
    try {
        await api.put(`/reminders/${reminder.id}`, { done: !reminder.done });
        loadReminders();
    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel atualizar.');
    }
    };

    const handleDelete = async (id) => {
    try {
        await api.delete(`/reminders/${id}`);
        loadReminders();
    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel excluir.');
    }
    };

    const pending = reminders.filter((r) => !r.done);
    const done = reminders.filter((r) => r.done);

    return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999 }}>
        {open && (
        <div
            style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            width: 320,
            maxHeight: 440,
            display: 'flex',
            flexDirection: 'column',
            marginBottom: 12,
            overflow: 'hidden'
            }}
        >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Meus lembretes</strong>
            <button onClick={() => setOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            <form onSubmit={handleCreate} style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, borderBottom: '1px solid #E5E7EB' }}>
            {error && <div style={{ color: '#B91C1C', fontSize: 12 }}>{error}</div>}
            <input
                type="text"
                placeholder="Novo lembrete..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ fontSize: 13 }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
                <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ flex: 1, fontSize: 12 }}
                />
                <button className="primary-button" type="submit" style={{ padding: '4px 10px', fontSize: 13 }}>
                +
                </button>
            </div>
            </form>

            <div style={{ overflowY: 'auto', padding: 8 }}>
            {reminders.length === 0 && (
                <p style={{ color: '#6B7280', fontSize: 13, padding: 8 }}>Nenhum lembrete ainda.</p>
            )}

            {pending.map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 8px' }}>
                <input type="checkbox" checked={false} onChange={() => handleToggle(r)} style={{ marginTop: 3 }} />
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}>{r.note}</div>
                                        {r.due_date && (
                    <div style={{ fontSize: 11, color: '#6B7280' }}>
                        {new Date(r.due_date).toLocaleDateString('pt-BR')}
                    </div>
                    )}
                </div>
                <button onClick={() => handleDelete(r.id)} style={{ border: 'none', background: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 12 }}>✕</button>
                </div>
            ))}

            {done.length > 0 && (
                <>
                <div style={{ fontSize: 11, color: '#9CA3AF', padding: '8px 8px 4px' }}>Concluidos</div>
                {done.map((r) => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 8px', opacity: 0.5 }}>
                    <input type="checkbox" checked={true} onChange={() => handleToggle(r)} style={{ marginTop: 3 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, textDecoration: 'line-through' }}>{r.note}</div>
                    </div>
                    <button onClick={() => handleDelete(r.id)} style={{ border: 'none', background: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 12 }}>✕</button>
                    </div>
                ))}
                </>
            )}
            </div>
        </div>
        )}

        <button
        onClick={() => setOpen((v) => !v)}
        style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#0F766E',
            color: '#fff',
            border: 'none',
            fontSize: 22,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            position: 'relative'
        }}
        >
        📋
        {pendingCount > 0 && (
            <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: '#DC2626',
            color: '#fff',
            borderRadius: '999px',
            fontSize: 11,
            padding: '1px 6px'
            }}>
            {pendingCount}
            </span>
        )}
        </button>
    </div>
    );
}

export default RemindersWidget;