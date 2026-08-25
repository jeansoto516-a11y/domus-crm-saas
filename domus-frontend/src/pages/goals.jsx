import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import RemindersWidget from '../components/RemindersWidget';

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
    <main className="app-shell">
        <aside className="sidebar">
        <div className="brand">
            <span className="brand-mark">D</span>
            <span>Domus CRM</span>
        </div>
        <nav className="side-nav">
            <button onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button onClick={() => navigate('/leads')}>Leads</button>
            <button onClick={() => navigate('/brokers')}>Corretores</button>
            <button onClick={() => navigate('/ranking')}>Ranking</button>
            <button className="active" onClick={() => navigate('/metas')}>Metas</button>
            <button onClick={() => navigate('/mensagens')}>Mensagens</button>
        </nav>
        </aside>

        <section className="workspace">
        <header className="workspace-header">
            <div>
            <span className="eyebrow">Desempenho da equipe</span>
            <h1>Metas mensais</h1>
            <p>Acompanhe o progresso dos corretores no mes atual.</p>
            </div>
        </header>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert">{message}</div>}

        {user.role === 'admin' && (
            <>
            <section className="metric-card">
                <h2>Criar topico personalizado</h2>
                <form onSubmit={handleCreateTopic} style={{ display: 'flex', gap: 8 }}>
                <input
                    type="text"
                    placeholder="Ex: Ligacoes realizadas"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    style={{ flex: 1 }}
                />
                <button className="secondary-button" type="submit">Criar topico</button>
                </form>
            </section>

            <section className="metric-card">
                <h2>Definir meta</h2>
                <form onSubmit={handleSetGoal} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select
                    value={form.user_id}
                    onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
                >
                    <option value="">Corretor</option>
                    {brokers.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>

                <select
                    value={form.topic_id}
                    onChange={(e) => setForm((f) => ({ ...f, topic_id: e.target.value }))}
                >
                    <option value="">Topico</option>
                    {topics.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>

                <input
                    type="number"
                    placeholder="Meta (numero)"
                    value={form.target_value}
                    onChange={(e) => setForm((f) => ({ ...f, target_value: e.target.value }))}
                    style={{ width: 120 }}
                />

                <button className="primary-button" type="submit">Salvar meta</button>
                </form>
            </section>
            </>
        )}

        <section className="panel">
            {loading ? (
            <div className="empty-state">Carregando metas...</div>
            ) : goals.length === 0 ? (
            <div className="empty-state">
                <h2>Nenhuma meta definida ainda</h2>
                <p>{user.role === 'admin' ? 'Defina metas para seus corretores acima.' : 'Aguarde o administrador definir suas metas.'}</p>
            </div>
            ) : (
            <div className="table-wrap">
                <table>
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
                            <div style={{ background: '#E5E7EB', borderRadius: 999, height: 8, width: 100 }}>
                            <div style={{
                                background: pct >= 100 ? '#16A34A' : '#0F766E',
                                width: `${pct}%`,
                                height: 8,
                                borderRadius: 999
                            }} />
                            </div>
                            <span style={{ fontSize: 11, color: '#6B7280' }}>{pct}%</span>
                        </td>
                                                <td>
                            {goal.metric_type === 'manual' && (user.role === 'admin' || goal.user_id === user.id) && (
                            <button
                                className="small-button"
                                onClick={() => {
                                const value = prompt('Novo valor alcancado:', goal.achieved_value);
                                if (value !== null) handleUpdateProgress(goal.id, Number(value));
                                }}
                            >
                                Atualizar
                            </button>
                            )}{' '}
                            {user.role === 'admin' && (
                            <button
                                className="small-button"
                                onClick={() => handleDeleteGoal(goal.id)}
                            >
                                Excluir
                            </button>
                            )}
                        </td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
            </div>
            )}
        </section>
        </section>
        <RemindersWidget />
    </main>
    );
}

export default Goals;