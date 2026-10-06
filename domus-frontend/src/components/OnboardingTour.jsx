import { useEffect, useState } from 'react';
import '../styles/dark-theme.css';

function OnboardingTour({ steps, onFinish }) {
    const [stepIndex, setStepIndex] = useState(0);
    const [rect, setRect] = useState(null);

    const step = steps[stepIndex];

    useEffect(() => {
    const el = document.querySelector(step.selector);

    if (!el) {
        if (stepIndex < steps.length - 1) {
        setStepIndex((i) => i + 1);
        } else {
        onFinish();
        }
        return;
    }

    el.scrollIntoView({ block: 'nearest' });

    const update = () => setRect(el.getBoundingClientRect());
    update();

    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stepIndex]);

    if (!rect) return null;

    const padding = 6;

    const spotlightStyle = {
    position: 'fixed',
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
    borderRadius: 10,
    boxShadow: '0 0 0 9999px rgba(10, 10, 14, 0.78)',
    pointerEvents: 'none',
    zIndex: 2000,
    border: '2px solid var(--dd-accent, #6c5ce7)',
    transition: 'top 0.2s ease, left 0.2s ease'
    };

    const tooltipTop = Math.min(rect.bottom + 14, window.innerHeight - 190);
    const tooltipLeft = Math.min(Math.max(rect.left, 16), window.innerWidth - 316);

    const tooltipStyle = {
    position: 'fixed',
    top: tooltipTop,
    left: tooltipLeft,
    width: 300,
    zIndex: 2001
    };

    const isLast = stepIndex === steps.length - 1;

    return (
    <>
        <div style={spotlightStyle} />
        <div className="dd-tour-tooltip" style={tooltipStyle}>
        <div className="dd-tour-step-count">{stepIndex + 1} de {steps.length}</div>
        <h3>{step.title}</h3>
        <p>{step.text}</p>
        <div className="dd-tour-actions">
            <button className="dd-tour-skip" type="button" onClick={onFinish}>
            Pular tour
            </button>
            <button
            className="dd-btn-primary"
            type="button"
            onClick={() => (isLast ? onFinish() : setStepIndex((i) => i + 1))}
            >
            {isLast ? 'Concluir' : 'Proximo'}
            </button>
        </div>
        </div>
    </>
    );
}

export default OnboardingTour;