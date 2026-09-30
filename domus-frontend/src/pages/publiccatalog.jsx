/** catalogo de imoveis para leads */

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import '../styles/public-catalog.css';

const leadTypeLabels = {
    venda: 'Venda',
    aluguel: 'Aluguel',
    ambos: 'Venda e Aluguel'
};

function formatMoney(value) {
    if (!value) return null;
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function IconBed() {
    return (
    <svg className="pc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" />
        <path d="M3 18h18" />
        <path d="M7 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
    </svg>
    );
}

function IconBath() {
    return (
    <svg className="pc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3Z" />
        <path d="M7 12V6a2 2 0 0 1 3-1.7" />
        <path d="M4 19v1M18 19v1" />
    </svg>
    );
}

function IconCar() {
    return (
    <svg className="pc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 16v-3l2-5h12l2 5v3" />
        <path d="M4 16h16v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2Z" />
        <circle cx="7.5" cy="16" r="1" />
        <circle cx="16.5" cy="16" r="1" />
    </svg>
    );
}

function IconArea() {
    return (
    <svg className="pc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="4" width="16" height="16" rx="1" />
        <path d="M4 9h3M4 15h3M20 9h-3M20 15h-3M9 4v3M15 4v3M9 20v-3M15 20v-3" />
    </svg>
    );
}

function IconPin() {
    return (
    <svg className="pc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
    </svg>
    );
}

function PublicCatalog() {
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    const brokerId = searchParams.get('corretor') || '';

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filterType, setFilterType] = useState('');
    const [filterCity, setFilterCity] = useState('');

    const [selectedProperty, setSelectedProperty] = useState(null);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);

    const [contactForm, setContactForm] = useState({ name: '', phone: '' });
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
    api.get(`/properties/public/${slug}`)
        .then((res) => setData(res.data))
        .catch((err) => setError(err.response?.data?.error || 'Catalogo nao encontrado.'))
        .finally(() => setLoading(false));
    }, [slug]);

    const cities = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.properties.map((p) => p.city).filter(Boolean))].sort();
    }, [data]);

    const filteredProperties = useMemo(() => {
    if (!data) return [];
    return data.properties.filter((p) => {
        if (filterType && p.lead_type !== filterType && p.lead_type !== 'ambos') return false;
        if (filterCity && p.city !== filterCity) return false;
        return true;
    });
    }, [data, filterType, filterCity]);

    const openProperty = (property) => {
    setSelectedProperty(property);
    setActivePhotoIndex(0);
    setContactForm({ name: '', phone: '' });
    setSubmitError('');
    };

    const closeProperty = () => setSelectedProperty(null);

    const updateContactField = (event) => {
    const { name, value } = event.target;
    setContactForm((current) => ({ ...current, [name]: value }));
    };

    const handleSubmitInterest = async (event) => {
    event.preventDefault();
    setSubmitError('');

    if (!contactForm.name || !contactForm.phone) {
        setSubmitError('Informe seu nome e telefone.');
        return;
    }

    try {
        setSubmitting(true);

        const { data: result } = await api.post(`/properties/public/${slug}/interest`, {
        name: contactForm.name,
        phone: contactForm.phone,
        property_id: selectedProperty.id,
        broker_id: brokerId || undefined
        });

        const message = encodeURIComponent(
        `Ola! Tenho interesse no imovel "${selectedProperty.title}" que vi no catalogo.`
        );

        const targetPhone = (result.contact_phone || '').replace(/\D/g, '');
        const phoneWithCountry = targetPhone.startsWith('55') ? targetPhone : `55${targetPhone}`;

        window.location.href = `https://wa.me/${phoneWithCountry}?text=${message}`;

    } catch (err) {
        setSubmitError(err.response?.data?.error || 'Nao foi possivel enviar seu contato.');
        setSubmitting(false);
    }
    };

    if (loading) {
    return <div className="pc-page"><div className="pc-main"><p className="pc-empty">Carregando catalogo...</p></div></div>;
    }

    if (error) {
    return <div className="pc-page"><div className="pc-main"><p className="pc-empty">{error}</p></div></div>;
    }

    return (
    <div className="pc-page">
        <header className="pc-header">
        <div className="pc-header-inner">
            <span className="pc-brand">{data.company.name}</span>
            <span className="pc-header-tag">Catalogo de imoveis</span>
        </div>
        </header>

        <section className="pc-hero">
        <div className="pc-hero-inner">
            <h1>Encontre o imovel certo para o seu proximo passo</h1>
            <p>Selecao atualizada de imoveis disponiveis para venda e aluguel.</p>
            <div className="pc-hero-stat">
            <strong>{data.properties.length}</strong>
            <span>imoveis disponiveis agora</span>
            </div>
        </div>
        </section>

        <div className="pc-filters">
        <div className="pc-filter-field">
            Finalidade
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Todas</option>
            <option value="venda">Venda</option>
            <option value="aluguel">Aluguel</option>
            </select>
        </div>

        <div className="pc-filter-field">
            Cidade
            <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)}>
            <option value="">Todas</option>
            {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
            ))}
            </select>
        </div>

        <span className="pc-filter-count">
            {filteredProperties.length} imovel(is) encontrado(s)
        </span>
        </div>

        <main className="pc-main">
        {filteredProperties.length === 0 ? (
            <p className="pc-empty">Nenhum imovel encontrado para esse filtro.</p>
        ) : (
            <div className="pc-grid">
            {filteredProperties.map((property) => {
                const cover = property.photos?.[0]?.url;
                const relevantPrice = property.lead_type === 'aluguel'
                ? property.rent_price
                : formatMoney(property.price) ? property.price : property.rent_price;

                return (
                <article key={property.id} className="pc-card" onClick={() => openProperty(property)}>
                    <div className="pc-card-photo">
                    {cover ? (
                        <img src={cover} alt={property.title} />
                    ) : (
                        <div className="pc-card-photo-placeholder">
                        <IconArea />
                        </div>
                    )}
                    <span className="pc-card-tag">{leadTypeLabels[property.lead_type] || property.lead_type}</span>
                    </div>

                    <div className="pc-card-body">
                    <div className="pc-card-location">
                        <IconPin />
                        {property.city}{property.region ? ` - ${property.region}` : ''}
                    </div>

                    <div className="pc-card-title">{property.title}</div>

                    <div className="pc-card-specs">
                        {property.bedrooms > 0 && (
                        <span className="pc-card-spec"><IconBed /> {property.bedrooms}</span>
                        )}
                        {property.bathrooms > 0 && (
                        <span className="pc-card-spec"><IconBath /> {property.bathrooms}</span>
                        )}
                        {property.garage_spots > 0 && (
                        <span className="pc-card-spec"><IconCar /> {property.garage_spots}</span>
                        )}
                        {property.area && (
                        <span className="pc-card-spec"><IconArea /> {property.area}m²</span>
                        )}
                    </div>

                    <div className="pc-card-price">
                        {formatMoney(relevantPrice) || 'Consulte'}
                    </div>
                    </div>
                </article>
                );
            })}
            </div>
        )}
        </main>

        {selectedProperty && (
        <div className="pc-modal-overlay" onClick={closeProperty}>
            <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pc-modal-header">
                <h2>{selectedProperty.title}</h2>
                <button className="pc-modal-close" onClick={closeProperty}>×</button>
            </div>

            <div className="pc-modal-body">
                {selectedProperty.photos && selectedProperty.photos.length > 0 && (
                <>
                    <img
                    className="pc-gallery-main"
                    src={selectedProperty.photos[activePhotoIndex]?.url}
                    alt={selectedProperty.title}
                    />
                    {selectedProperty.photos.length > 1 && (
                    <div className="pc-gallery-thumbs">
                        {selectedProperty.photos.map((photo, index) => (
                        <img
                            key={photo.id}
                            src={photo.url}
                            alt=""
                            className={`pc-gallery-thumb${index === activePhotoIndex ? ' active' : ''}`}
                            onClick={() => setActivePhotoIndex(index)}
                        />
                        ))}
                    </div>
                    )}
                </>
                )}

                <div className="pc-detail-grid">
                <div className="pc-detail-item"><span>Finalidade</span><strong>{leadTypeLabels[selectedProperty.lead_type]}</strong></div>
                <div className="pc-detail-item"><span>Tipo</span><strong>{selectedProperty.property_type}</strong></div>
                <div className="pc-detail-item"><span>Regiao</span><strong>{selectedProperty.region}</strong></div>
                <div className="pc-detail-item"><span>Cidade</span><strong>{selectedProperty.city}</strong></div>
                {selectedProperty.bedrooms > 0 && <div className="pc-detail-item"><span>Dormitorios</span><strong>{selectedProperty.bedrooms}</strong></div>}
                {selectedProperty.bathrooms > 0 && <div className="pc-detail-item"><span>Banheiros</span><strong>{selectedProperty.bathrooms}</strong></div>}
                {selectedProperty.garage_spots > 0 && <div className="pc-detail-item"><span>Vagas</span><strong>{selectedProperty.garage_spots}</strong></div>}
                {selectedProperty.area && <div className="pc-detail-item"><span>Area</span><strong>{selectedProperty.area}m²</strong></div>}
                {selectedProperty.price && <div className="pc-detail-item"><span>Preco</span><strong>{formatMoney(selectedProperty.price)}</strong></div>}
                {selectedProperty.rent_price && <div className="pc-detail-item"><span>Aluguel</span><strong>{formatMoney(selectedProperty.rent_price)}</strong></div>}
                </div>

                {selectedProperty.description && (
                <p className="pc-description">{selectedProperty.description}</p>
                )}

                <div className="pc-interest-box">
                <h3>Tenho interesse</h3>
                <p>Preencha seus dados que a gente te chama no WhatsApp sobre esse imovel.</p>

                {submitError && <div className="pc-error">{submitError}</div>}

                <form onSubmit={handleSubmitInterest}>
                    <label className="pc-field">
                    Seu nome
                    <input name="name" onChange={updateContactField} value={contactForm.name} />
                    </label>

                    <label className="pc-field">
                    Seu telefone (WhatsApp)
                    <input name="phone" onChange={updateContactField} placeholder="(11) 99999-9999" value={contactForm.phone} />
                    </label>

                    <button className="pc-btn" type="submit" disabled={submitting}>
                    {submitting ? 'Enviando...' : 'Falar no WhatsApp'}
                    </button>
                </form>
                </div>
            </div>
            </div>
        </div>
        )}
    </div>
    );
}

export default PublicCatalog;