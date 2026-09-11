import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import RemindersWidget from '../components/RemindersWidget';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';

function currentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function Goals() {
    const [topics, setTopics] = useState([]);
    const [brokers, setBrokers] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [newTopicName, setNewTopicName] = useState('');
    const [form, setForm] = useState({ user_id: '', topic_id: '', target_value: '' });

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const month = currentMonth();

    const loadAll = async () => {
    setLoading(true);
    try {
        const [topicsRes, goalsRes] = await Promise.all([
        api.get('/goals/topics'),
        api.get('/goals', { params: { month } })
        ]);
        setTopics(topicsRes.data);
        setGoals(goalsRes.data);

        if (user.role === 'admin') {
        const brokersRes = await api.get('/users');
        setBrokers(brokersRes.data.filter((u) => u.role === 'user'));
        }
    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel carregar as metas.');
    } finally {
        setLoading(false);
    }
    };

    useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    try {
        await api.post('/goals/topics', { name: newTopicName });
        setNewTopicName('');
        setMessage('Topico criado com sucesso.');
        loadAll();
    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel criar o topico.');
    }
    };

    const handleSetGoal = async (e) => {
    e.preventDefault();
    if (!form.user_id || !form.topic_id || !form.target_value) {
        setError('Preencha corretor, topico e meta.');
        return;
    }

    try {
        await api.post('/goals', { ...form, month });
        setForm({ user_id: '', topic_id: '', target_value: '' });
        setMessage('Meta definida com sucesso.');
        loadAll();
    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel salvar a meta.');
    }
    };

    const handleUpdateProgress = async (goalId, value) => {
    try {
        await api.put(`/goals/${goalId}/progress`, { achieved_value: value });
        loadAll();
    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel atualizar o progresso.');
    }
    };

    const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta meta?')) return;

    try {
        await api.delete(`/goals/${goalId}`);
        setMessage('Meta excluida com sucesso.');
        loadAll();
    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel excluir a meta.');
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
            <button className="active" onClick={() => navigate('/metas')}>
                <Icon name="filter" /> Metas
            </button>
            <button onClick={() => navigate('/perfil')}>
                <Icon name="users" /> Perfil
            </button>
            <button onClick={() => navigate('/mensagens')}>
                <Icon name="chat" /> Mensagens
            </button>
        </nav>
        </aside>

        <section className="dd-main">
        <header className="dd-header">
            <div>
            <h1 className="dd-title">Metas mensais</h1>
            <p className="dd-subtitle">Acompanhe o progresso dos corretores no mes atual.</p>
            </div>
        </header>

        {error && <div className="dd-alert-error">{error}</div>}
        {message && <div style={{ background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.4)', color: '#5EEAD4', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>{message}</div>}

        {user.role === 'admin' && (
            <>
            <section className="dd-panel">
                <h2 style={{ marginTop: 0 }}>Criar topico personalizado</h2>
                <form onSubmit={handleCreateTopic} className="dd-inline-form">
                <input
                    className="dd-input"
                    type="text"
                    placeholder="Ex: Ligacoes realizadas"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    style={{ flex: 1 }}
                />
                <button className="dd-btn-secondary" type="submit">Criar topico</button>
                </form>
            </section>

            <section className="dd-panel">
                <h2 style={{ marginTop: 0 }}>Definir meta</h2>
                <form onSubmit={handleSetGoal} className="dd-inline-form">
                <select
                    className="dd-select"
                    value={form.user_id}
                    onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
                >
                    <option value="">Corretor</option>
                    {brokers.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>

                <select
                    className="dd-select"
                    value={form.topic_id}
                    onChange={(e) => setForm((f) => ({ ...f, topic_id: e.target.value }))}
                >
                    <option value="">Topico</option>
                    {topics.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>

                <input
                    className="dd-input"
                    type="number"
                    placeholder="Meta (numero)"
                    value={form.target_value}
                    onChange={(e) => setForm((f) => ({ ...f, target_value: e.target.value }))}
                    style={{ width: 120 }}
                />

                <button className="dd-btn-primary" type="submit">Salvar meta</button>
                </form>
            </section>
            </>
        )}

        <section className="dd-panel">
            <div className="dd-table-wrap">
            {loading ? (
                <div className="dd-empty">Carregando metas...</div>
            ) : goals.length === 0 ? (
                <div className="dd-empty">
                <h2>Nenhuma meta definida ainda</h2>
                <p>{user.role === 'admin' ? 'Defina metas para seus corretores acima.' : 'Aguarde o administrador definir suas metas.'}</p>
                </div>
            ) : (
                <table className="dd-table">
                <thead>
                    <tr>
                    {user.role === 'admin' && <th>Corretor</th>}
                    <th>Topico</th>
                    <th>Progresso</th>
                    <th>Meta</th>
                    <th>%</th>
                    <th>Acoes</th>
                    </tr>
                </thead>
                <tbody>
                    {goals.map((goal) => {
                    const pct = goal.target_value > 0
                      ? Math.min(100, Math.round((goal.achieved_value / goal.target_value) * 100))
                        : 0;

                    return (
                        <tr key={goal.id}>
                        {user.role === 'admin' && <td>{goal.corretor}</td>}
                        <td>{goal.topico}</td>
                        <td>{goal.achieved_value}</td>
                        <td>{goal.target_value}</td>
                        <td>
                            <div className="dd-progress-track">
                            <div className="dd-progress-fill" style={{
                                background: pct >= 100 ? '#16A34A' : '#2F6FED',
                                width: `${pct}%`
                            }} />
                            </div>
                            <span className="dd-progress-pct">{pct}%</span>
                        </td>
                        <td>
                            <div className="dd-row-actions">
                            {goal.metric_type === 'manual' && (user.role === 'admin' || goal.user_id === user.id) && (
                                <button
                                className="dd-btn-small"
                                onClick={() => {
                                    const value = prompt('Novo valor alcancado:', goal.achieved_value);
                                    if (value !== null) handleUpdateProgress(goal.id, Number(value));
                                }}
                                >
                                Atualizar
                                </button>
                            )}
                            {user.role === 'admin' && (
                                <button
                                className="dd-btn-small"
                                onClick={() => handleDeleteGoal(goal.id)}
                                >
                                Excluir
                                </button>
                            )}
                            </div>
                        </td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
            )}
            </div>
        </section>
        </section>
        <RemindersWidget />
    </main>
    );
}

export default Goals;