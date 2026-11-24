import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function StickyOffsets() {
    const location = useLocation();

    useEffect(() => {
    let observer = null;

    const apply = () => {
        const header = document.querySelector('.dd-main > .dd-header');
        const height = header ? Math.round(header.getBoundingClientRect().height) : 0;
        document.documentElement.style.setProperty('--dd-header-h', `${height}px`);
    };

    apply();

    const header = document.querySelector('.dd-main > .dd-header');

    if (header && typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(apply);
        observer.observe(header);
    }

    window.addEventListener('resize', apply);

    return () => {
        if (observer) observer.disconnect();
        window.removeEventListener('resize', apply);
    };
    }, [location.pathname]);

    return null;
}

export default StickyOffsets;