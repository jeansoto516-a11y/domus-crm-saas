import { useNavigate } from 'react-router-dom';

function Brokers() {
    const navigate = useNavigate();

    return (
    <main className="app-shell">
        <aside className="sidebar">
        <div className="brand">
            <span className="brand-mark">D</span>
            <span>Domus CRM</span>
        </div>

        <nav className="side-nav">
            <button onClick={() => navigate('/dashboard')}>
            Dashboard
            </button>

            <button onClick={() => navigate('/leads')}>
            Leads
            </button>

            <button onClick={() => navigate('/leads/novo')}>
            Novo lead
            </button>

            <button className="active">
            Corretores
            </button>
        </nav>
        </aside>

        <section className="workspace">
        <header className="workspace-header">
            <div>
            <span className="eyebrow">Equipe</span>
            <h1>Corretores</h1>
            <p>Gerencie os corretores da imobiliária.</p>
            </div>
        </header>

        <section className="panel">
            <h2>Cadastro de corretor</h2>

            <p>
            Em breve vamos adicionar o formulário de cadastro.
            </p>
        </section>
        </section>
    </main>
    );
}

export default Brokers;