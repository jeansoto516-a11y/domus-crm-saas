import { useEffect, useRef, useState } from 'react';
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

const statusLabels = {
  venda: 'À Venda',
  aluguel: 'Para Alugar',
  reservado: 'Reservado',
  vendido: 'Vendido'
};

const MAX_SIZE = 50 * 1024 * 1024;
const MAX_PHOTOS = 8;

const emptyForm = {
  title: '',
  description: '',
  project_type: 'predio',
  sale_status: 'venda',
  address: '',
  price: '',
  condo_fee: '',
  iptu: '',
  bedrooms: '',
  bathrooms: '',
  parking_spots: '',
  area: '',
  highlights: ''
};

const glyphs = {
  pin: <><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></>,
  bed: <><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" /><path d="M3 18h18" /><path d="M7 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" /></>,
  bath: <><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3Z" /><path d="M7 12V6a2 2 0 0 1 3-1.7" /><path d="M4 19v1M18 19v1" /></>,
  car: <><path d="M4 16v-3l2-5h12l2 5v3" /><path d="M4 16h16v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2Z" /><circle cx="7.5" cy="16" r="1" /><circle cx="16.5" cy="16" r="1" /></>,
  area: <><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M4 9h3M4 15h3M20 9h-3M20 15h-3M9 4v3M15 4v3M9 20v-3M15 20v-3" /></>,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  zoom: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5M11 8v6M8 11h6" /></>,
  left: <path d="M15 5l-7 7 7 7" />,
  right: <path d="M9 5l7 7-7 7" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  check: <path d="M5 12l4 4 10-10" />
};

function Glyph({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {glyphs[name]}
    </svg>
  );
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return null;
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function splitTitle(title) {
  const words = (title || '').trim().split(/\s+/);
  if (words.length < 2) return { first: '', last: words[0] || '' };
  return { first: words.slice(0, -1).join(' '), last: words[words.length - 1] };
}

function Projects3D() {
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [planOpen, setPlanOpen] = useState(false);
  const viewerRef = useRef(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingProject, setEditingProject] = useState(null);
  const [modelFile, setModelFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [floorPlanFile, setFloorPlanFile] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
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

  const resetFiles = () => {
    setModelFile(null);
    setCoverFile(null);
    setFloorPlanFile(null);
    setPhotoFiles([]);
  };

  const openForm = () => {
    setEditingProject(null);
    setExistingPhotos([]);
    setForm(emptyForm);
    resetFiles();
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (project) => {
    setEditingProject(project);
    setExistingPhotos(project.photos || []);
    setForm({
      title: project.title || '',
      description: project.description || '',
      project_type: project.project_type || 'predio',
      sale_status: project.sale_status || 'venda',
      address: project.address || '',
      price: project.price ?? '',
      condo_fee: project.condo_fee ?? '',
      iptu: project.iptu ?? '',
      bedrooms: project.bedrooms ?? '',
      bathrooms: project.bathrooms ?? '',
      parking_spots: project.parking_spots ?? '',
      area: project.area ?? '',
      highlights: project.highlights || ''
    });
    resetFiles();
    setFormError('');
    setSelected(null);
    setShowForm(true);
  };

  const openProject = (project) => {
    setSelected(project);
    setActiveIndex(0);
    setPlanOpen(false);
  };

  const closeViewer = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    setPlanOpen(false);
    setSelected(null);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      viewerRef.current?.requestFullscreen?.();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!form.title) {
      setFormError('Informe o titulo.');
      return;
    }

    if (!editingProject) {
      if (!modelFile) {
        setFormError('Escolha o arquivo .glb.');
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
    }

    if (existingPhotos.length + photoFiles.length > MAX_PHOTOS) {
      setFormError(`O maximo e ${MAX_PHOTOS} fotos.`);
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value ?? ''));
    if (!editingProject && modelFile) formData.append('model', modelFile);
    if (coverFile) formData.append('cover', coverFile);
    if (floorPlanFile) formData.append('floor_plan', floorPlanFile);
    photoFiles.forEach((file) => formData.append('photos', file));

    try {
      setSaving(true);

      if (editingProject) {
        await api.put(`/projects-3d/${editingProject.id}`, formData, {
          headers: { 'Content-Type': undefined }
        });
      } else {
        await api.post('/projects-3d', formData, {
          headers: { 'Content-Type': undefined }
        });
      }

      setShowForm(false);
      loadProjects();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Nao foi possivel salvar o projeto.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExistingPhoto = async (photoId) => {
    if (!window.confirm('Excluir esta foto?')) return;

    try {
      await api.delete(`/projects-3d/${editingProject.id}/photos/${photoId}`);
      setExistingPhotos((current) => current.filter((p) => p.id !== photoId));
      loadProjects();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Nao foi possivel excluir a foto.');
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Excluir o projeto "${project.title}"?`)) return;

    try {
      await api.delete(`/projects-3d/${project.id}`);
      closeViewer();
      loadProjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel excluir o projeto.');
    }
  };

  const renderViewer = () => {
    const photos = selected.photos || [];
    const items = [{ type: '3d' }, ...photos.map((p) => ({ type: 'photo', url: p.url }))];
    const current = items[activeIndex] || items[0];
    const highlights = (selected.highlights || '').split('\n').map((line) => line.trim()).filter(Boolean);
    const { first, last } = splitTitle(selected.title);

    const specs = [
      { label: 'Quartos', icon: 'bed', value: selected.bedrooms },
      { label: 'Banheiros', icon: 'bath', value: selected.bathrooms },
      { label: 'Vaga(s)', icon: 'car', value: selected.parking_spots }
    ].filter((spec) => spec.value !== null && spec.value !== undefined);

    const extras = [
      selected.condo_fee ? `Condomínio: ${formatMoney(selected.condo_fee)}` : null,
      selected.iptu ? `IPTU: ${formatMoney(selected.iptu)}` : null
    ].filter(Boolean);

    const goPrev = () => setActiveIndex((i) => (i - 1 + items.length) % items.length);
    const goNext = () => setActiveIndex((i) => (i + 1) % items.length);

    return (
      <div className="dd-p3d" ref={viewerRef}>
        <div className="dd-p3d-glow" />

        <header className="dd-p3d-top">
          <div className="dd-p3d-brand">
            <span className="dd-brand-mark">D</span>
            <div>
              <strong>Domus</strong>
              <small>Seu imóvel em <span className="dd-p3d-accent">3D</span></small>
            </div>
          </div>

          <div className="dd-p3d-top-actions">
            <button className="dd-p3d-pill" onClick={() => openEdit(selected)}>Editar</button>
            <button className="dd-p3d-pill" onClick={() => handleDelete(selected)}>Excluir</button>
            <button className="dd-p3d-pill" onClick={closeViewer}><Glyph name="back" size={16} /> Voltar</button>
            <button className="dd-p3d-icon-btn" onClick={toggleFullscreen} aria-label="Tela cheia">
              <Glyph name="expand" />
            </button>
          </div>
        </header>

        <div className="dd-p3d-body">
          <aside className="dd-p3d-info">
            <span className="dd-p3d-status"><i />{statusLabels[selected.sale_status] || 'À Venda'}</span>

            <h1>
              {first && `${first} `}
              <span className="dd-p3d-accent">{last}</span>
            </h1>

            {selected.address && (
              <p className="dd-p3d-address"><Glyph name="pin" size={16} /> {selected.address}</p>
            )}

            {specs.length > 0 && (
              <div className="dd-p3d-specs">
                {specs.map((spec) => (
                  <div className="dd-p3d-spec" key={spec.label}>
                    <Glyph name={spec.icon} size={20} />
                    <strong>{spec.value}</strong>
                    <span>{spec.label}</span>
                  </div>
                ))}
              </div>
            )}

            {selected.area && (
              <div className="dd-p3d-area">
                <Glyph name="area" size={22} />
                <div>
                  <small>Área útil</small>
                  <strong>{Number(selected.area)} m²</strong>
                </div>
              </div>
            )}

            {selected.price && (
              <div className="dd-p3d-price">
                <strong>{formatMoney(selected.price)}</strong>
                {extras.length > 0 && <small>{extras.join('  |  ')}</small>}
              </div>
            )}

            {selected.description && <p className="dd-p3d-desc">{selected.description}</p>}
          </aside>

          <section className="dd-p3d-stage">
            {current.type === '3d' ? (
              <model-viewer
                src={selected.model_url}
                alt={selected.title}
                camera-controls
                auto-rotate
                shadow-intensity="1"
                environment-image="neutral"
                touch-action="none"
              />
            ) : (
              <img src={current.url} alt={selected.title} />
            )}
          </section>

          <aside className="dd-p3d-side">
            <div className="dd-p3d-card">
              <h3>Destaques</h3>
              {highlights.length > 0 ? (
                <ul className="dd-p3d-highlights">
                  {highlights.map((item) => (
                    <li key={item}><Glyph name="check" size={16} /> {item}</li>
                  ))}
                </ul>
              ) : (
                <p className="dd-p3d-muted">Nenhum destaque cadastrado.</p>
              )}
            </div>

            <div className="dd-p3d-card">
              <h3>Mapa do imóvel</h3>
              {selected.floor_plan_url ? (
                <div className="dd-p3d-plan">
                  <img src={selected.floor_plan_url} alt="Planta do imóvel" />
                  <button type="button" onClick={() => setPlanOpen(true)} aria-label="Ampliar planta">
                    <Glyph name="zoom" size={16} />
                  </button>
                </div>
              ) : (
                <p className="dd-p3d-muted">Planta não cadastrada.</p>
              )}
            </div>
          </aside>
        </div>

        <footer className="dd-p3d-bottom">
          <div className="dd-p3d-thumbs-wrap">
            <button className="dd-p3d-arrow" onClick={goPrev} disabled={items.length < 2} aria-label="Anterior">
              <Glyph name="left" />
            </button>

            <div className="dd-p3d-thumbs">
              {items.map((item, index) => (
                <button
                  key={index}
                  className={`dd-p3d-thumb${index === activeIndex ? ' active' : ''}`}
                  onClick={() => setActiveIndex(index)}
                >
                  {item.type === '3d' ? (
                    selected.cover_url ? <img src={selected.cover_url} alt="Modelo 3D" /> : <Icon name="cube" />
                    ) : (
                    <img src={item.url} alt={`Foto ${index}`} />
                    )}
                </button>
                ))}
            </div>

            <button className="dd-p3d-arrow" onClick={goNext} disabled={items.length < 2} aria-label="Próxima">
                <Glyph name="right" />
            </button>
            </div>

            <button className="dd-p3d-explore" onClick={() => setActiveIndex(0)}>
            <Icon name="cube" />
            <span>Explore cada detalhe com a visão <span className="dd-p3d-accent">3D</span></span>
            </button>
        </footer>
        </div>
    );
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
                <article key={project.id} className="dd-property-card" onClick={() => openProject(project)}>
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
                    <span className="dd-property-location">
                    {project.address || typeLabels[project.project_type] || project.project_type}
                    </span>
                    {project.price && <strong>{formatMoney(project.price)}</strong>}
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
                <h2>{editingProject ? 'Editar projeto 3D' : 'Novo projeto 3D'}</h2>
                <button className="dd-modal-close" onClick={() => !saving && setShowForm(false)}>×</button>
            </div>

            <div className="dd-modal-body">
                {formError && <div className="dd-alert-error">{formError}</div>}

                <form className="dd-form" onSubmit={handleSubmit}>
                <label className="dd-field">
                    Titulo
                    <input className="dd-input" name="title" onChange={updateField} placeholder="Ex: Apartamento Premium" value={form.title} />
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
                    Situacao
                    <select className="dd-select" name="sale_status" onChange={updateField} value={form.sale_status}>
                    <option value="venda">A venda</option>
                    <option value="aluguel">Para alugar</option>
                    <option value="reservado">Reservado</option>
                    <option value="vendido">Vendido</option>
                    </select>
                </label>

                <label className="dd-field">
                    Endereco
                    <input className="dd-input" name="address" onChange={updateField} placeholder="Ex: Av. das Flores, 1234 - Centro" value={form.address} />
                </label>

                <label className="dd-field">
                    Quartos
                    <input className="dd-input" name="bedrooms" onChange={updateField} type="number" min="0" value={form.bedrooms} />
                </label>

                <label className="dd-field">
                    Banheiros
                    <input className="dd-input" name="bathrooms" onChange={updateField} type="number" min="0" value={form.bathrooms} />
                </label>

                <label className="dd-field">
                    Vagas
                    <input className="dd-input" name="parking_spots" onChange={updateField} type="number" min="0" value={form.parking_spots} />
                </label>

                <label className="dd-field">
                    Area util (m²)
                    <input className="dd-input" name="area" onChange={updateField} type="number" min="0" step="any" value={form.area} />
                </label>

                <label className="dd-field">
                    Preco (R$)
                    <input className="dd-input" name="price" onChange={updateField} type="number" min="0" step="any" value={form.price} />
                </label>

                <label className="dd-field">
                    Condominio (R$)
                    <input className="dd-input" name="condo_fee" onChange={updateField} type="number" min="0" step="any" value={form.condo_fee} />
                </label>

                <label className="dd-field">
                    IPTU (R$)
                    <input className="dd-input" name="iptu" onChange={updateField} type="number" min="0" step="any" value={form.iptu} />
                </label>

                <label className="dd-field">
                    Destaques (um por linha)
                    <textarea
                    className="dd-input"
                    name="highlights"
                    onChange={updateField}
                    placeholder={'Planta inteligente\nExcelente iluminacao\nVaranda com churrasqueira'}
                    value={form.highlights}
                    />
                </label>

                {!editingProject && (
                    <label className="dd-field">
                    Arquivo 3D (.glb, ate 50 MB)
                    <input
                        className="dd-input"
                        type="file"
                        accept=".glb,model/gltf-binary"
                        onChange={(e) => setModelFile(e.target.files[0] || null)}
                    />
                    </label>
                )}

                <label className="dd-field">
                    {editingProject ? 'Imagem de capa (envie so para trocar)' : 'Imagem de capa (opcional)'}
                    <input
                    className="dd-input"
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={(e) => setCoverFile(e.target.files[0] || null)}
                    />
                </label>

                <label className="dd-field">
                    {editingProject ? 'Planta do imovel (envie so para trocar)' : 'Planta do imovel (imagem, opcional)'}
                    <input
                    className="dd-input"
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={(e) => setFloorPlanFile(e.target.files[0] || null)}
                    />
                </label>

                {existingPhotos.length > 0 && (
                    <div className="dd-property-photo-grid">
                    {existingPhotos.map((photo) => (
                        <div key={photo.id} style={{ position: 'relative' }}>
                        <img src={photo.url} alt="Foto do projeto" className="dd-property-photo-thumb" />
                        <button type="button" className="dd-photo-remove-btn" onClick={() => handleDeleteExistingPhoto(photo.id)}>
                            ×
                        </button>
                        </div>
                    ))}
                    </div>
                )}

                <label className="dd-field">
                    Fotos do imovel (ate {MAX_PHOTOS} no total, opcional)
                    <input
                    className="dd-input"
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    multiple
                    onChange={(e) => setPhotoFiles(Array.from(e.target.files))}
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

        {selected && renderViewer()}

        {selected && planOpen && selected.floor_plan_url && (
        <div className="dd-p3d-plan-modal" onClick={() => setPlanOpen(false)}>
            <img src={selected.floor_plan_url} alt="Planta do imóvel" />
        </div>
        )}

        <RemindersWidget />
    </main>
    );
}

export default Projects3D;