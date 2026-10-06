import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import RemindersWidget from '../components/RemindersWidget';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';

const statusLabels = {
    disponivel: 'Disponivel',
    reservado: 'Reservado',
    vendido: 'Vendido',
    alugado: 'Alugado'
};

const leadTypeLabels = {
    venda: 'Venda',
    aluguel: 'Aluguel',
    ambos: 'Venda e Aluguel'
};

function formatMoney(value) {
    if (!value) return null;
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function PropertyCatalog() {
    const navigate = useNavigate();

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ lead_type: '', status: '' });

    const [selectedProperty, setSelectedProperty] = useState(null);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
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

    const loadProperties = () => {
    setLoading(true);
    api.get('/properties', { params: filters })
        .then((res) => setProperties(res.data))
        .catch((err) => setError(err.response?.data?.error || 'Nao foi possivel carregar os imoveis.'))
        .finally(() => setLoading(false));
    };

    useEffect(() => {
    loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
    };

    const openProperty = (property) => {
    setSelectedProperty(property);
    setActivePhotoIndex(0);
    };

    const closeProperty = () => setSelectedProperty(null);

    const handleDelete = async (id, title) => {
    const confirmDelete = window.confirm(`Deseja realmente excluir o imovel "${title}"?`);
    if (!confirmDelete) return;

    try {
        await api.delete(`/properties/${id}`);
        setSelectedProperty(null);
        loadProperties();
    } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel excluir o imovel.');
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
            <button className="active" onClick={() => navigate('/leads/novo')}>
            <Icon name="userPlus" /> Novo lead
            </button>
            <button onClick={() => navigate('/catalogo')}>
            <Icon name="file" /> Catalogo de imoveis
            </button>
            <button onClick={() => navigate('/tour-360')}>
            <Icon name="vr" /> Tour Virtual 360°
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
            <h1 className="dd-title">Catalogo de imoveis</h1>
            <p className="dd-subtitle">Imoveis disponiveis para venda e aluguel.</p>
            </div>
            <button className="dd-btn-primary" onClick={() => navigate('/catalogo/novo')}>
            <Icon name="userPlus" /> Novo imovel
            </button>
        </header>

        {error && <div className="dd-alert-error">{error}</div>}

        <section className="dd-filters-row">
            <label>
            Finalidade
            <select className="dd-select" name="lead_type" onChange={updateFilter} value={filters.lead_type}>
                <option value="">Todas</option>
                <option value="venda">Venda</option>
                <option value="aluguel">Aluguel</option>
            </select>
            </label>
            <label>
            Status
            <select className="dd-select" name="status" onChange={updateFilter} value={filters.status}>
                <option value="">Todos</option>
                <option value="disponivel">Disponivel</option>
                <option value="reservado">Reservado</option>
                <option value="vendido">Vendido</option>
                <option value="alugado">Alugado</option>
            </select>
            </label>
            <button className="dd-btn-secondary" onClick={() => setFilters({ lead_type: '', status: '' })}>
            Limpar
            </button>
        </section>

        {loading ? (
            <div className="dd-empty">Carregando imoveis...</div>
        ) : properties.length === 0 ? (
            <div className="dd-empty">
            <h2>Nenhum imovel cadastrado</h2>
            <p>Cadastre o primeiro imovel do catalogo.</p>
            <button className="dd-btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/catalogo/novo')}>Cadastrar imovel</button>
            </div>
        ) : (
            <div className="dd-property-grid">
            {properties.map((property) => {
                const cover = property.photos?.[0]?.url;

                return (
                <article key={property.id} className="dd-property-card" onClick={() => openProperty(property)}>
                    <div className="dd-property-cover">
                    {cover ? (
                        <img src={cover} alt={property.title} />
                    ) : (
                        <div className="dd-property-cover-placeholder"><Icon name="file" /></div>
                    )}
                    <span className={`dd-property-status ${property.status}`}>
                        {statusLabels[property.status] || property.status}
                    </span>
                    </div>

                    <div className="dd-property-body">
                    <strong>{property.title}</strong>
                    <span className="dd-property-location">{property.city} - {property.region}</span>

                    <div className="dd-property-specs">
                        {property.bedrooms > 0 && <span>{property.bedrooms} dorm.</span>}
                        {property.bathrooms > 0 && <span>{property.bathrooms} banh.</span>}
                        {property.garage_spots > 0 && <span>{property.garage_spots} vaga(s)</span>}
                        {property.area && <span>{property.area}m²</span>}
                    </div>

                    <div className="dd-property-price-row">
                        <span className="dd-pill">{leadTypeLabels[property.lead_type] || property.lead_type}</span>
                        <strong>
                        {property.lead_type === 'aluguel'
                            ? formatMoney(property.rent_price)
                            : formatMoney(property.price) || formatMoney(property.rent_price)}
                        </strong>
                    </div>
                    </div>
                </article>
                );
            })}
            </div>
        )}
        </section>

        {selectedProperty && (
        <div className="dd-modal-overlay" onClick={closeProperty}>
            <div className="dd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dd-modal-header">
                <h2>{selectedProperty.title}</h2>
                <button className="dd-modal-close" onClick={closeProperty}>×</button>
            </div>

            <div className="dd-modal-body">
                {selectedProperty.photos && selectedProperty.photos.length > 0 ? (
                <div className="dd-property-gallery">
                    <img
                    className="dd-property-gallery-main"
                    src={selectedProperty.photos[activePhotoIndex]?.url}
                    alt={selectedProperty.title}
                    />
                    {selectedProperty.photos.length > 1 && (
                    <div className="dd-property-gallery-thumbs">
                        {selectedProperty.photos.map((photo, index) => (
                        <img
                            key={photo.id}
                            src={photo.url}
                            alt=""
                            className={`dd-property-gallery-thumb${index === activePhotoIndex ? ' active' : ''}`}
                            onClick={() => setActivePhotoIndex(index)}
                        />
                        ))}
                    </div>
                    )}
                </div>
                ) : (
                <p style={{ color: 'var(--dd-muted)' }}>Nenhuma foto cadastrada.</p>
                )}

                <div className="dd-profile-grid" style={{ marginTop: 16 }}>
                <div className="dd-profile-item"><span>Finalidade</span><strong>{leadTypeLabels[selectedProperty.lead_type]}</strong></div>
                <div className="dd-profile-item"><span>Tipo</span><strong>{selectedProperty.property_type}</strong></div>
                <div className="dd-profile-item"><span>Regiao</span><strong>{selectedProperty.region}</strong></div>
                <div className="dd-profile-item"><span>Cidade</span><strong>{selectedProperty.city}</strong></div>
                {selectedProperty.bedrooms > 0 && <div className="dd-profile-item"><span>Dormitorios</span><strong>{selectedProperty.bedrooms}</strong></div>}
                {selectedProperty.suites > 0 && <div className="dd-profile-item"><span>Suites</span><strong>{selectedProperty.suites}</strong></div>}
                {selectedProperty.bathrooms > 0 && <div className="dd-profile-item"><span>Banheiros</span><strong>{selectedProperty.bathrooms}</strong></div>}
                {selectedProperty.garage_spots > 0 && <div className="dd-profile-item"><span>Vagas</span><strong>{selectedProperty.garage_spots}</strong></div>}
                {selectedProperty.area && <div className="dd-profile-item"><span>Area</span><strong>{selectedProperty.area}m²</strong></div>}
                {selectedProperty.land_area && <div className="dd-profile-item"><span>Area do terreno</span><strong>{selectedProperty.land_area}m²</strong></div>}
                {selectedProperty.floor && <div className="dd-profile-item"><span>Andar</span><strong>{selectedProperty.floor}</strong></div>}
                {selectedProperty.has_elevator !== null && <div className="dd-profile-item"><span>Elevador</span><strong>{selectedProperty.has_elevator ? 'Sim' : 'Nao'}</strong></div>}
                {selectedProperty.price && <div className="dd-profile-item"><span>Preco</span><strong>{formatMoney(selectedProperty.price)}</strong></div>}
                {selectedProperty.rent_price && <div className="dd-profile-item"><span>Aluguel</span><strong>{formatMoney(selectedProperty.rent_price)}</strong></div>}
                <div className="dd-profile-item"><span>Status</span><strong>{statusLabels[selectedProperty.status]}</strong></div>
                </div>

                {selectedProperty.description && (
                <div className="dd-profile-notes">
                    <span>Descricao</span>
                    <p>{selectedProperty.description}</p>
                </div>
                )}

                {(selectedProperty.owner_name || selectedProperty.owner_contact) && (
                <div className="dd-profile-notes" style={{ borderTop: '1px solid var(--dd-border, #2a2a33)', paddingTop: 12, marginTop: 12 }}>
                    <span>Proprietario (visivel apenas para a equipe)</span>
                    <p>
                    {selectedProperty.owner_name || 'Nome nao informado'}
                    {selectedProperty.owner_contact ? ` — ${selectedProperty.owner_contact}` : ''}
                    </p>
                </div>
                )}

                <div className="dd-form-actions" style={{ marginTop: 20 }}>
                <button className="dd-btn-small" onClick={() => navigate(`/catalogo/${selectedProperty.id}/editar`)}>
                    Editar imovel
                </button>
                <button className="dd-btn-small" onClick={() => handleDelete(selectedProperty.id, selectedProperty.title)}>
                    Excluir imovel
                </button>
                </div>
            </div>
            </div>
        </div>
        )}

        <RemindersWidget />
    </main>
    );
}

export default PropertyCatalog;