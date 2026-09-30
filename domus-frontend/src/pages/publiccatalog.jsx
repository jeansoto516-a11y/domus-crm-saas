/** Catalogo Publico de imoveis */

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import '../styles/dark-theme.css';

const leadTypeLabels = {
    venda: 'Venda',
    aluguel: 'Aluguel',
    ambos: 'Venda e Aluguel'
};

function formatMoney(value) {
    if (!value) return null;
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function PublicCatalog() {
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    const brokerId = searchParams.get('corretor') || '';

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
    return <div className="dd-public-catalog"><p style={{ color: '#888' }}>Carregando catalogo...</p></div>;
    }

    if (error) {
    return <div className="dd-public-catalog"><p style={{ color: '#e17055' }}>{error}</p></div>;
    }

    return (
    <div className="dd-public-catalog">
        <header className="dd-public-header">
        <h1>{data.company.name}</h1>
        <p>Imoveis disponiveis</p>
        </header>

        {data.properties.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center' }}>Nenhum imovel disponivel no momento.</p>
        ) : (
        <div className="dd-property-grid">
            {data.properties.map((property) => {
            const cover = property.photos?.[0]?.url;

            return (
                <article key={property.id} className="dd-property-card" onClick={() => openProperty(property)}>
                <div className="dd-property-cover">
                    {cover ? <img src={cover} alt={property.title} /> : <div className="dd-property-cover-placeholder">🏠</div>}
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

        {selectedProperty && (
        <div className="dd-modal-overlay" onClick={closeProperty}>
            <div className="dd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dd-modal-header">
                <h2>{selectedProperty.title}</h2>
                <button className="dd-modal-close" onClick={closeProperty}>×</button>
            </div>

            <div className="dd-modal-body">
                {selectedProperty.photos && selectedProperty.photos.length > 0 && (
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
                )}

                <div className="dd-profile-grid" style={{ marginTop: 16 }}>
                <div className="dd-profile-item"><span>Finalidade</span><strong>{leadTypeLabels[selectedProperty.lead_type]}</strong></div>
                <div className="dd-profile-item"><span>Tipo</span><strong>{selectedProperty.property_type}</strong></div>
                <div className="dd-profile-item"><span>Regiao</span><strong>{selectedProperty.region}</strong></div>
                <div className="dd-profile-item"><span>Cidade</span><strong>{selectedProperty.city}</strong></div>
                {selectedProperty.bedrooms > 0 && <div className="dd-profile-item"><span>Dormitorios</span><strong>{selectedProperty.bedrooms}</strong></div>}
                {selectedProperty.bathrooms > 0 && <div className="dd-profile-item"><span>Banheiros</span><strong>{selectedProperty.bathrooms}</strong></div>}
                {selectedProperty.garage_spots > 0 && <div className="dd-profile-item"><span>Vagas</span><strong>{selectedProperty.garage_spots}</strong></div>}
                {selectedProperty.area && <div className="dd-profile-item"><span>Area</span><strong>{selectedProperty.area}m²</strong></div>}
                {selectedProperty.price && <div className="dd-profile-item"><span>Preco</span><strong>{formatMoney(selectedProperty.price)}</strong></div>}
                {selectedProperty.rent_price && <div className="dd-profile-item"><span>Aluguel</span><strong>{formatMoney(selectedProperty.rent_price)}</strong></div>}
                </div>

                {selectedProperty.description && (
                <div className="dd-profile-notes">
                    <span>Descricao</span>
                    <p>{selectedProperty.description}</p>
                </div>
                )}

                <div style={{ borderTop: '1px solid var(--dd-border, #2a2a33)', marginTop: 16, paddingTop: 16 }}>
                <h3 style={{ marginTop: 0 }}>Tenho interesse</h3>
                <p style={{ color: 'var(--dd-muted)', fontSize: 13 }}>
                    Preencha seus dados que a gente te chama no WhatsApp sobre esse imovel.
                </p>

                {submitError && <div className="dd-alert-error">{submitError}</div>}

                <form className="dd-form" onSubmit={handleSubmitInterest}>
                    <label className="dd-field">
                    Seu nome
                    <input className="dd-input" name="name" onChange={updateContactField} value={contactForm.name} />
                    </label>

                    <label className="dd-field">
                    Seu telefone (WhatsApp)
                    <input className="dd-input" name="phone" onChange={updateContactField} placeholder="(11) 99999-9999" value={contactForm.phone} />
                    </label>

                    <div className="dd-form-actions">
                    <button className="dd-btn-primary" type="submit" disabled={submitting}>
                        {submitting ? 'Enviando...' : 'Falar no WhatsApp'}
                    </button>
                    </div>
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