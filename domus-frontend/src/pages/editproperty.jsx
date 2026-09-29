import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import RemindersWidget from '../components/RemindersWidget';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';

function EditProperty() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [form, setForm] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const [photoFiles, setPhotoFiles] = useState([]);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);

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
    api.get(`/properties/${id}`)
        .then((res) => {
        const p = res.data;
        setForm({
            title: p.title || '',
            description: p.description || '',
            lead_type: p.lead_type || 'venda',
            property_type: p.property_type || '',
            region: p.region || '',
            city: p.city || '',
            bedrooms: p.bedrooms ?? '',
            suites: p.suites ?? '',
            bathrooms: p.bathrooms ?? '',
            garage_spots: p.garage_spots ?? '',
            area: p.area ?? '',
            land_area: p.land_area ?? '',
            floor: p.floor || '',
            has_elevator: p.has_elevator === true ? 'true' : p.has_elevator === false ? 'false' : '',
            price: p.price ?? '',
            rent_price: p.rent_price ?? '',
            status: p.status || 'disponivel',
            owner_name: p.owner_name || '',
            owner_contact: p.owner_contact || ''
        });
        setPhotos(p.photos || []);
        })
        .catch((err) => setError(err.response?.data?.error || 'Nao foi possivel carregar o imovel.'))
        .finally(() => setPageLoading(false));
    }, [id]);

    const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    };

    const handleSave = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.title || !form.property_type || !form.region || !form.city) {
        setError('Informe titulo, tipo de imovel, regiao e cidade.');
        return;
    }

    try {
        setLoading(true);
        await api.put(`/properties/${id}`, form);
        navigate('/catalogo');
    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel salvar as alteracoes.');
    } finally {
        setLoading(false);
    }
    };

    const handleFilesChange = (event) => {
    const files = Array.from(event.target.files);
    const totalAfter = photos.length + files.length;

    if (totalAfter > 10) {
        setError(`Voce pode ter no maximo 10 fotos. Ja tem ${photos.length}, escolha ate ${10 - photos.length}.`);
        return;
    }

    setError('');
    setPhotoFiles(files);
    };

    const handleUploadPhotos = async () => {
    if (photoFiles.length === 0) return;

    const formData = new FormData();
    photoFiles.forEach((file) => formData.append('photos', file));

    setUploadingPhotos(true);
    setError('');

    try {
        const { data } = await api.post(`/properties/${id}/photos`, formData, {
        headers: { 'Content-Type': undefined }
        });

        setPhotos((current) => [...current, ...data]);
        setPhotoFiles([]);
    } catch (err) {
        setError(err.response?.data?.error || 'Erro ao enviar fotos.');
    } finally {
        setUploadingPhotos(false);
    }
    };

    const handleDeletePhoto = async (photoId) => {
    const confirmDelete = window.confirm('Excluir esta foto?');
    if (!confirmDelete) return;

    try {
        await api.delete(`/properties/${id}/photos/${photoId}`);
        setPhotos((current) => current.filter((p) => p.id !== photoId));
    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel excluir a foto.');
    }
    };

    if (pageLoading || !form) {
    return (
        <main className="dd-shell app-shell">
        <section className="dd-main">
            <div className="dd-empty">Carregando imovel...</div>
        </section>
        </main>
    );
    }

    const isAluguelOrAmbos = form.lead_type === 'aluguel' || form.lead_type === 'ambos';
    const isVendaOrAmbos = form.lead_type === 'venda' || form.lead_type === 'ambos';

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
            <button className="active" onClick={() => navigate('/catalogo')}>
            <Icon name="file" /> Catalogo de imoveis
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
            <button onClick={() => navigate('/mensagens')}>
            <Icon name="chat" /> Mensagens
            {unreadCount > 0 && <span className="dd-badge">{unreadCount}</span>}
            </button>
        </nav>
        </aside>

        <section className="dd-main">
        <header className="dd-header">
            <div>
            <h1 className="dd-title">Editar imovel</h1>
            <p className="dd-subtitle">Atualize os dados e as fotos do imovel.</p>
            </div>
            <button className="dd-btn-secondary" onClick={() => navigate('/catalogo')}>
            Ver catalogo
            </button>
        </header>

        {error && <div className="dd-alert-error">{error}</div>}

        <section className="dd-panel dd-panel-narrow">
            <form className="dd-form" onSubmit={handleSave}>
            <label className="dd-field">
                Titulo do anuncio
                <input className="dd-input" name="title" onChange={updateField} value={form.title} />
            </label>

            <label className="dd-field">
                Descricao
                <textarea className="dd-input" name="description" onChange={updateField} value={form.description} />
            </label>

            <label className="dd-field">
                Finalidade
                <select className="dd-select" name="lead_type" onChange={updateField} value={form.lead_type}>
                <option value="venda">Venda</option>
                <option value="aluguel">Aluguel</option>
                <option value="ambos">Venda e Aluguel</option>
                </select>
            </label>

            <label className="dd-field">
                Tipo de imovel
                <input className="dd-input" name="property_type" onChange={updateField} value={form.property_type} />
            </label>

            <label className="dd-field">
                Regiao
                <input className="dd-input" name="region" onChange={updateField} value={form.region} />
            </label>

            <label className="dd-field">
                Cidade
                <input className="dd-input" name="city" onChange={updateField} value={form.city} />
            </label>

            <label className="dd-field">
                Dormitorios
                <input className="dd-input" name="bedrooms" onChange={updateField} type="number" min="0" value={form.bedrooms} />
            </label>

            <label className="dd-field">
                Suites
                <input className="dd-input" name="suites" onChange={updateField} type="number" min="0" value={form.suites} />
            </label>

            <label className="dd-field">
                Banheiros
                <input className="dd-input" name="bathrooms" onChange={updateField} type="number" min="0" value={form.bathrooms} />
            </label>

            <label className="dd-field">
                Vagas de garagem
                <input className="dd-input" name="garage_spots" onChange={updateField} type="number" min="0" value={form.garage_spots} />
            </label>

            <label className="dd-field">
                Area (m²)
                <input className="dd-input" name="area" onChange={updateField} type="number" min="0" value={form.area} />
            </label>

            <label className="dd-field">
                Area do terreno (m²)
                <input className="dd-input" name="land_area" onChange={updateField} type="number" min="0" value={form.land_area} />
            </label>

            <label className="dd-field">
                Andar
                <input className="dd-input" name="floor" onChange={updateField} value={form.floor} />
            </label>

            <label className="dd-field">
                Elevador
                <select className="dd-select" name="has_elevator" onChange={updateField} value={form.has_elevator}>
                <option value="">Nao informado</option>
                <option value="true">Sim</option>
                <option value="false">Nao</option>
                </select>
            </label>

            {isVendaOrAmbos && (
                <label className="dd-field">
                Preco de venda
                <input className="dd-input" name="price" onChange={updateField} type="number" min="0" value={form.price} />
                </label>
            )}

            {isAluguelOrAmbos && (
                <label className="dd-field">
                Valor do aluguel
                <input className="dd-input" name="rent_price" onChange={updateField} type="number" min="0" value={form.rent_price} />
                </label>
            )}

            <label className="dd-field">
                Status
                <select className="dd-select" name="status" onChange={updateField} value={form.status}>
                <option value="disponivel">Disponivel</option>
                <option value="reservado">Reservado</option>
                <option value="vendido">Vendido</option>
                <option value="alugado">Alugado</option>
                </select>
            </label>

            <div className="dd-form-actions">
                <button className="dd-btn-secondary" onClick={() => navigate('/catalogo')} type="button">
                Cancelar
                </button>
                <button className="dd-btn-primary" disabled={loading} type="submit">
                {loading ? 'Salvando...' : 'Salvar alteracoes'}
                </button>
            </div>
            </form>
        </section>

        <section className="dd-panel dd-panel-narrow">
            <h2 style={{ marginTop: 0 }}>Fotos ({photos.length}/10)</h2>

            {photos.length > 0 && (
            <div className="dd-property-photo-grid" style={{ marginBottom: 16 }}>
                {photos.map((photo) => (
                <div key={photo.id} style={{ position: 'relative' }}>
                    <img src={photo.url} alt="Foto do imovel" className="dd-property-photo-thumb" />
                    <button
                    type="button"
                    className="dd-photo-remove-btn"
                    onClick={() => handleDeletePhoto(photo.id)}
                    >
                    ×
                    </button>
                </div>
                ))}
            </div>
            )}

            {photos.length < 10 && (
            <>
                <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                multiple
                onChange={handleFilesChange}
                className="dd-input"
                />
                <div className="dd-form-actions" style={{ justifyContent: 'flex-start', marginTop: 12 }}>
                <button className="dd-btn-primary" onClick={handleUploadPhotos} disabled={uploadingPhotos || photoFiles.length === 0} type="button">
                    {uploadingPhotos ? 'Enviando...' : 'Enviar fotos selecionadas'}
                </button>
                </div>
            </>
            )}
        </section>
        </section>
        <RemindersWidget />
    </main>
    );
}

export default EditProperty;