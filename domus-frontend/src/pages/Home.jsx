import { useNavigate } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();

    return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Domus CRM 🚀</h1>

        <p>
        Organize seus leads, aumente suas vendas e tenha controle total do seu funil.
        </p>

        <h3 style={{ color: 'green' }}>
        Teste grátis por 14 dias
        </h3>

        <p>
        Sem cartão de crédito • Cancele quando quiser
        </p>

        <h2>R$ 79,90 / mês</h2>

        <button onClick={() => navigate('/register')}>
        Começar grátis
        </button>

        <br /><br />

        <button onClick={() => navigate('/login')}>
        Já tenho conta
        </button>
    </div>
    );
}

export default Home;