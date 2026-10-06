import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import RemindersWidget from '../components/RemindersWidget';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';

function CreateProperty() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
    title: '',
    description: '',
    lead_type: 'venda',
    property_type: '',
    region: '',
    city: '',
    bedrooms: '',
    suites: '',
    bathrooms: '',
    garage_spots: '',
    area: '',
    land_area: '',
    floor: '',
    has_elevator: '',
    price: '',
    rent_price: '',
    status: 'disponivel',
    owner_name: '',
    owner_contact: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [createdProperty, setCreatedProperty] = useState(null);
    const [photoFiles, setPhotoFiles] = useState([]);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const [uploadedPhotos, setUploadedPhotos] = useState([]);

    const [photo360Files, setPhoto360Files] = useState([]);
    const [uploading360, setUploading360] = useState(false);
    const [uploaded360Photos, setUploaded360Photos] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [newLeadsCount, setNewLeadsCount] = useState(0);

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

    const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    };

    const handleCreate = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.title || !form.property_type || !form.region || !form.city) {
        setError('Informe titulo, tipo de imovel, regiao e cidade.');
        return;
    }

    try {
        setLoading(true);
        const { data } = await api.post('/properties', form);
        setCreatedProperty(data);
    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel cadastrar o imovel.');
    } finally {
        setLoading(false);
    }
    };

    const handleFilesChange = (event) => {
    const files = Array.from(event.target.files);
    const totalAfter = uploadedPhotos.length + files.length;

    if (totalAfter > 10) {
        setError(`Voce pode ter no maximo 10 fotos. Ja tem ${uploadedPhotos.length}, escolha ate ${10 - uploadedPhotos.length}.`);
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
        const { data } = await api.post(`/properties/${createdProperty.id}/photos`, formData, {
        headers: { 'Content-Type': undefined }
        });

        setUploadedPhotos((current) => [...current, ...data]);
        setPhotoFiles([]);
    } catch (err) {
        setError(err.response?.data?.error || 'Erro ao enviar fotos.');
    } finally {
        setUploadingPhotos(false);
    }
    };

    const handleFiles360Change = (event) => {
    setPhoto360Files(Array.from(event.target.files));
    };

    const handleUpload360Photos = async () => {
    if (photo360Files.length === 0) return;

    const formData = new FormData();
    photo360Files.forEach((file) => formData.append('photos360', file));

    setUploading360(true);
    setError('');

    try {
        const { data } = await api.post(`/properties/${createdProperty.id}/photos360`, formData, {
        headers: { 'Content-Type': undefined }
        });

        setUploaded360Photos((current) => [...current, ...data]);
        setPhoto360Files([]);
    } catch (err) {
        setError(err.response?.data?.error || 'Erro ao enviar fotos 360.');
    } finally {
        setUploading360(false);
    }
    };

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
            {newLeadsCount > 0 && <span className="dd-badge">{newLeadsCount}</span>}
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
            <button className="active" onClick={() => navigate('/meta-ads')}>
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
            <h1 className="dd-title">Novo imovel</h1>
            <p className="dd-subtitle">Cadastre um imovel para o catalogo e o matching de leads.</p>
            </div>
            <button className="dd-btn-secondary" onClick={() => navigate('/catalogo')}>
            Ver catalogo
            </button>
        </header>

        {error && <div className="dd-alert-error">{error}</div>}

        {!createdProperty ? (
            <section className="dd-panel dd-panel-narrow">
            <form className="dd-form" onSubmit={handleCreate}>
                <label className="dd-field">
                Titulo do anuncio
                <input className="dd-input" name="title" onChange={updateField} placeholder="Ex: Apartamento 3 dorms no Centro" value={form.title} />
                </label>

                <label className="dd-field">
                Descricao
                <textarea className="dd-input" name="description" onChange={updateField} placeholder="Detalhes do imovel" value={form.description} />
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
                <input className="dd-input" name="property_type" onChange={updateField} placeholder="Ex: Apartamento, Casa..." value={form.property_type} />
                </label>

                <label className="dd-field">
                Regiao
                <input className="dd-input" name="region" onChange={updateField} placeholder="Ex: Zona Sul" value={form.region} />
                </label>

                <label className="dd-field">
                Cidade
                <input className="dd-input" name="city" onChange={updateField} placeholder="Ex: Sao Paulo" value={form.city} />
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
                <input className="dd-input" name="floor" onChange={updateField} placeholder="Ex: 5º andar, Terreo..." value={form.floor} />
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

                <p style={{ color: 'var(--dd-muted)', fontSize: 12, margin: '8px 0 0' }}>
                    Os dados abaixo (dono do imovel) sao visiveis apenas para corretores e a imobiliaria. Nunca aparecem para o lead.
                </p>

                <label className="dd-field">
                Nome do proprietario
                <input className="dd-input" name="owner_name" onChange={updateField} placeholder="Nome de quem e o dono do imovel" value={form.owner_name} />
                </label>

                <label className="dd-field">
                Contato do proprietario
                <input className="dd-input" name="owner_contact" onChange={updateField} placeholder="Telefone ou email do proprietario" value={form.owner_contact} />
                </label>

                <div className="dd-form-actions">
                <button className="dd-btn-secondary" onClick={() => navigate('/catalogo')} type="button">
                    Cancelar
                </button>
                <button className="dd-btn-primary" disabled={loading} type="submit">
                    {loading ? 'Salvando...' : 'Salvar e adicionar fotos'}
                </button>
                </div>
            </form>
            </section>
                ) : (
            <>
            <section className="dd-panel dd-panel-narrow">
            <h2 style={{ marginTop: 0 }}>Fotos do imovel</h2>
            <p style={{ color: 'var(--dd-muted)' }}>
                Imovel "{createdProperty.title}" cadastrado. Agora adicione ate 10 fotos (voce ja enviou {uploadedPhotos.length}).
            </p>

            {uploadedPhotos.length > 0 && (
                <div className="dd-property-photo-grid" style={{ marginBottom: 16 }}>
                {uploadedPhotos.map((photo) => (
                    <img key={photo.id} src={photo.url} alt="Foto do imovel" className="dd-property-photo-thumb" />
                ))}
                </div>
            )}

                        {uploadedPhotos.length < 10 && (
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

          <section className="dd-panel dd-panel-narrow">
            <h2 style={{ marginTop: 0 }}>Fotos 360° (Tour Virtual)</h2>
            <p style={{ color: 'var(--dd-muted)', fontSize: 13 }}>
              Opcional. Use o modo panoramico/360 da camera do celular (nativo em Android e iPhone) pra tirar uma foto ja "costurada" de cada ambiente. Voce ja enviou {uploaded360Photos.length}.
            </p>

            {uploaded360Photos.length > 0 && (
              <div className="dd-property-photo-grid" style={{ marginBottom: 16 }}>
                {uploaded360Photos.map((photo) => (
                    <img key={photo.id} src={photo.url} alt="Foto 360 do imovel" className="dd-property-photo-thumb" />
                ))}
                </div>
            )}

            {uploaded360Photos.length < 15 && (
                <>
                <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    multiple
                    onChange={handleFiles360Change}
                    className="dd-input"
                />
                <div className="dd-form-actions" style={{ justifyContent: 'flex-start', marginTop: 12 }}>
                    <button className="dd-btn-primary" onClick={handleUpload360Photos} disabled={uploading360 || photo360Files.length === 0} type="button">
                    {uploading360 ? 'Enviando...' : 'Enviar fotos 360 selecionadas'}
                    </button>
                </div>
                </>
            )}

                <div className="dd-form-actions" style={{ marginTop: 20 }}>
                <button className="dd-btn-primary" onClick={() => navigate('/catalogo')} type="button">
                Ir para o catalogo
                </button>
            </div>
            </section>
            </>
        )}
        </section>
        <RemindersWidget />
    </main>
    );
}

export default CreateProperty;