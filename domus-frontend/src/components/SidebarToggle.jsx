import { useEffect, useState } from 'react';

const STORAGE_KEY = 'domus_sidebar_collapsed';

function readStored() {
    try {
    return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
    return false;
    }
}

function SidebarToggle() {
    const [collapsed, setCollapsed] = useState(readStored);

    useEffect(() => {
    document.body.classList.toggle('dd-sidebar-collapsed', collapsed);

    try {
        localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      // sem acesso ao armazenamento do navegador: a escolha vale so ate recarregar
    }
    }, [collapsed]);

    const label = collapsed ? 'Abrir menu' : 'Fechar menu';

    return (
    <button
        type="button"
        className="dd-sidebar-toggle"
        onClick={() => setCollapsed((current) => !current)}
        aria-label={label}
        title={label}
    >
        <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        >
        {collapsed ? <path d="M4 7h16M4 12h16M4 17h16" /> : <path d="M15 6l-6 6 6 6" />}
        </svg>
    </button>
    );
}

export default SidebarToggle;