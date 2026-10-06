import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import RemindersWidget from '../components/RemindersWidget';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';

const PANNELLUM_CSS = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css';
const PANNELLUM_JS = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';

function loadPannellum() {
    return new Promise((resolve, reject) => {
    if (window.pannellum) {
        resolve();
        return;
    }

    if (!document.querySelector(`link[href="${PANNELLUM_CSS}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = PANNELLUM_CSS;
        document.head.appendChild(link);
    }

    const existingScript = document.querySelector(`script[src="${PANNELLUM_JS}"]`);

    if (existingScript) {
        existingScript.addEventListener('load', resolve);
        existingScript.addEventListener('error', reject);
        return;
    }

    const script = document.createElement('script');
    script.src = PANNELLUM_JS;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
    });
}

function leadTypeLabel(type) {
    if (type === 'aluguel') return 'Aluguel';
    if (type === 'ambos') return 'Venda e Aluguel';
    return 'Venda';
}

function Tour360() {
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [newLeadsCount, setNewLeadsCount] = useState(0);

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [selectedProperty, setSelectedProperty] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [pannellumReady, setPannellumReady] = useState(false);

    const viewerRef = useRef(null);
    const viewerInstanceRef = useRef(null);

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

    useEffect(() => {
    api.get('/properties/360/tour')
        .then((res) => setProperties(res.data))
        .catch((err) => setError(err.response?.data?.error || 'Nao foi possivel carregar os tours.'))
        .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
    loadPannellum()
        .then(() => setPannellumReady(true))
        .catch(() => setError('Nao foi possivel carregar o visualizador 360.'));
    }, []);

    const openTour = (property) => {
    setSelectedProperty(property);
    setActiveIndex(0);
    };

    const closeTour = () => {
    if (viewerInstanceRef.current) {
        viewerInstanceRef.current.destroy();
        viewerInstanceRef.current = null;
    }
    setSelectedProperty(null);
    };

    useEffect(() => {
    if (!selectedProperty || !pannellumReady || !viewerRef.current) return;

    const photo = selectedProperty.photos_360[activeIndex];
    if (!photo) return;

    if (viewerInstanceRef.current) {
        viewerInstanceRef.current.destroy();
        viewerInstanceRef.current = null;
    }

    viewerInstanceRef.current = window.pannellum.viewer(viewerRef.current, {
        type: 'equirectangular',
        panorama: photo.url,
        autoLoad: true,
        compass: false,
        showZoomCtrl: true,
        showFullscreenCtrl: true,
        orientationOnByDefault: true,
        hfov: 110
    });

    return () => {
        if (viewerInstanceRef.current) {
        viewerInstanceRef.current.destroy();
        viewerInstanceRef.current = null;
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProperty, activeIndex, pannellumReady]);

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
            <button className="active" onClick={() => navigate('/tour-360')}>
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
            <h1 className="dd-title">Tour Virtual 360°</h1>
            <p className="dd-subtitle">Visite os imoveis que tem fotos 360 cadastradas.</p>
            </div>
        </header>

        {error && <div className="dd-alert-error">{error}</div>}

        {loading ? (
            <div className="dd-empty">Carregando tours...</div>
        ) : properties.length === 0 ? (
            <div className="dd-empty">
            <h2>Nenhum tour 360 cadastrado</h2>
            <p>Adicione fotos 360 ao editar um imovel no catalogo.</p>
            <button className="dd-btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/catalogo')}>Ver catalogo</button>
            </div>
        ) : (
            <div className="dd-property-grid">
            {properties.map((property) => {
                const cover = property.photos_360[0]?.url || property.photos[0]?.url;

                return (
                <article key={property.id} className="dd-property-card" onClick={() => openTour(property)}>
                    <div className="dd-property-cover">
                    {cover ? (
                        <img src={cover} alt={property.title} />
                    ) : (
                        <div className="dd-property-cover-placeholder"><Icon name="vr" /></div>
                    )}
                    <span className="dd-property-status disponivel">360°</span>
                    </div>

                    <div className="dd-property-body">
                    <strong>{property.title}</strong>
                    <span className="dd-property-location">{property.city} - {property.region}</span>

                    <div className="dd-property-specs">
                        <span>{property.photos_360.length} ambiente(s)</span>
                        <span>{leadTypeLabel(property.lead_type)}</span>
                    </div>
                    </div>
                </article>
                );
            })}
            </div>
        )}
        </section>

        {selectedProperty && (
        <div className="dd-tour-overlay">
            <div className="dd-tour-header">
            <strong>{selectedProperty.title}</strong>
            <button className="dd-modal-close" onClick={closeTour}>×</button>
            </div>

            <div ref={viewerRef} className="dd-tour-viewer" />

            {selectedProperty.photos_360.length > 1 && (
            <div className="dd-tour-thumbs">
                {selectedProperty.photos_360.map((photo, index) => (
                <button
                    key={photo.id}
                    className={`dd-tour-thumb-btn${index === activeIndex ? ' active' : ''}`}
                    onClick={() => setActiveIndex(index)}
                >
                    {photo.label || `Ambiente ${index + 1}`}
                </button>
                ))}
            </div>
            )}
        </div>
        )}

        <RemindersWidget />
    </main>
    );
}

export default Tour360;