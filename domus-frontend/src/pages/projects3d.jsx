import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '@google/model-viewer';
import api from '../services/api';
import RemindersWidget from '../components/RemindersWidget';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';

const typeLabels = {
    predio: 'Predio / Condominio',
    apartamento: 'Apartamento',
    outro: 'Outro'
};

const MAX_SIZE = 50 * 1024 * 1024;

function Projects3D() {
    const navigate = useNavigate();

    const [unreadCount, setUnreadCount] = useState(0);
    const [newLeadsCount, setNewLeadsCount] = useState(0);

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [selected, setSelected] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', project_type: 'predio' });
    const [modelFile, setModelFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

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

    const loadProjects = () => {
    api.get('/projects-3d')
        .then((res) => setProjects(res.data))
        .catch((err) => setError(err.response?.data?.error || 'Nao foi possivel carregar os projetos.'))
        .finally(() => setLoading(false));
    };

    useEffect(() => {
    loadProjects();
    }, []);

    const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    };

    const openForm = () => {
    setForm({ title: '', description: '', project_type: 'predio' });
    setModelFile(null);
    setCoverFile(null);
    setFormError('');
    setShowForm(true);
    };

    const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!form.title || !modelFile) {
        setFormError('Informe o titulo e escolha o arquivo .glb.');
        return;
    }

    if (!modelFile.name.toLowerCase().endsWith('.glb')) {
        setFormError('O modelo precisa ser um arquivo .glb.');
        return;
    }

    if (modelFile.size > MAX_SIZE) {
        setFormError('O arquivo passa de 50 MB. Comprima o modelo antes de enviar.');
        return;
    }

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('project_type', form.project_type);
    formData.append('model', modelFile);
    if (coverFile) formData.append('cover', coverFile);

    try {
        setSaving(true);
        await api.post('/projects-3d', formData, {
        headers: { 'Content-Type': undefined }
        });
        setShowForm(false);
        loadProjects();
    } catch (err) {
        setFormError(err.response?.data?.error || 'Nao foi possivel salvar o projeto.');
    } finally {
        setSaving(false);
    }
    };

    const handleDelete = async (project) => {
    if (!window.confirm(`Excluir o projeto "${project.title}"?`)) return;

    try {
        await api.delete(`/projects-3d/${project.id}`);
        setSelected(null);
        loadProjects();
    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel excluir o projeto.');
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
            <button className="active" onClick={() => navigate('/projetos-3d')}>
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
            <button onClick={() => navigate('/mensagens')}>
            <Icon name="chat" /> Mensagens
            {unreadCount > 0 && <span className="dd-badge">{unreadCount}</span>}
            </button>
        </nav>
        </aside>

        <section className="dd-main">
        <header className="dd-header">
            <div>
            <h1 className="dd-title">Projetos 3D</h1>
            <p className="dd-subtitle">Predios, condominios e apartamentos em 3D para explorar.</p>
            </div>
            <button className="dd-btn-primary" onClick={openForm}>
            <Icon name="cube" /> Novo projeto
            </button>
        </header>

        {error && <div className="dd-alert-error">{error}</div>}

        {loading ? (
            <div className="dd-empty">Carregando projetos...</div>
        ) : projects.length === 0 ? (
            <div className="dd-empty">
            <h2>Nenhum projeto 3D cadastrado</h2>
            <p>Envie o primeiro modelo .glb para visualizar aqui.</p>
            <button className="dd-btn-primary" style={{ marginTop: 12 }} onClick={openForm}>Enviar projeto</button>
            </div>
        ) : (
            <div className="dd-property-grid">
            {projects.map((project) => (
                <article key={project.id} className="dd-property-card" onClick={() => setSelected(project)}>
                <div className="dd-property-cover">
                    {project.cover_url ? (
                    <img src={project.cover_url} alt={project.title} />
                    ) : (
                    <div className="dd-property-cover-placeholder"><Icon name="cube" /></div>
                    )}
                    <span className="dd-property-status disponivel">3D</span>
                </div>

                <div className="dd-property-body">
                    <strong>{project.title}</strong>
                    <span className="dd-property-location">{typeLabels[project.project_type] || project.project_type}</span>
                    {project.description && (
                    <span className="dd-property-specs">{project.description.slice(0, 80)}</span>
                    )}
                </div>
                </article>
            ))}
            </div>
        )}
        </section>

        {showForm && (
        <div className="dd-modal-overlay" onClick={() => !saving && setShowForm(false)}>
            <div className="dd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dd-modal-header">
                <h2>Novo projeto 3D</h2>
                <button className="dd-modal-close" onClick={() => !saving && setShowForm(false)}>×</button>
            </div>

            <div className="dd-modal-body">
                {formError && <div className="dd-alert-error">{formError}</div>}

                <form className="dd-form" onSubmit={handleSubmit}>
                <label className="dd-field">
                    Titulo
                    <input className="dd-input" name="title" onChange={updateField} placeholder="Ex: Residencial Aurora - Torre A" value={form.title} />
                </label>

                <label className="dd-field">
                    Tipo
                    <select className="dd-select" name="project_type" onChange={updateField} value={form.project_type}>
                    <option value="predio">Predio / Condominio</option>
                    <option value="apartamento">Apartamento</option>
                    <option value="outro">Outro</option>
                    </select>
                </label>

                <label className="dd-field">
                    Descricao
                    <textarea className="dd-input" name="description" onChange={updateField} value={form.description} />
                </label>

                <label className="dd-field">
                    Arquivo 3D (.glb, ate 50 MB)
                    <input
                    className="dd-input"
                    type="file"
                    accept=".glb,model/gltf-binary"
                    onChange={(e) => setModelFile(e.target.files[0] || null)}
                    />
                </label>

                <label className="dd-field">
                    Imagem de capa (opcional)
                    <input
                    className="dd-input"
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={(e) => setCoverFile(e.target.files[0] || null)}
                    />
                </label>

                <div className="dd-form-actions">
                    <button className="dd-btn-secondary" type="button" disabled={saving} onClick={() => setShowForm(false)}>
                    Cancelar
                    </button>
                    <button className="dd-btn-primary" type="submit" disabled={saving}>
                    {saving ? 'Enviando...' : 'Salvar projeto'}
                    </button>
                </div>
                </form>
            </div>
            </div>
        </div>
        )}

        {selected && (
        <div className="dd-tour-overlay">
            <div className="dd-tour-header">
            <strong>{selected.title}</strong>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button className="dd-btn-small" onClick={() => handleDelete(selected)}>Excluir</button>
                <button className="dd-modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            </div>

            <div className="dd-viewer-3d">
            <model-viewer
                src={selected.model_url}
                alt={selected.title}
                camera-controls
                auto-rotate
                shadow-intensity="1"
                touch-action="none"
                style={{ width: '100%', height: '100%' }}
            />
            </div>

            <div className="dd-viewer-3d-hint">Arraste para girar · role ou use dois dedos para dar zoom</div>
        </div>
        )}

        <RemindersWidget />
    </main>
    );
}

export default Projects3D;