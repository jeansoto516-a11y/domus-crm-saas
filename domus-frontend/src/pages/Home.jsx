import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const benefits = [
    {
      title: 'Organizacao comercial',
      text: 'Centralize leads, contatos, visitas e propostas para que a equipe saiba exatamente o proximo passo.'
    },
    {
      title: 'Prioridade inteligente',
      text: 'O score automatico ajuda corretores e gestores a focarem primeiro nas oportunidades com maior chance de fechamento.'
    },
    {
      title: 'Gestao com clareza',
      text: 'Acompanhe conversao, volume de leads e desempenho do funil em uma visao simples para decisoes rapidas.'
    }
  ];

  const steps = ['Captar', 'Atender', 'Agendar', 'Propor', 'Fechar'];

  return (
    <main className="site-shell institutional">
      <nav className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">D</span>
          <span>Domus</span>
        </Link>
        <div className="topbar-actions">
          <a className="nav-link" href="#empresa">Empresa</a>
          <a className="nav-link" href="#sistema">Sistema</a>
          <button className="ghost-button" onClick={() => navigate('/login')}>
            Entrar
          </button>
          <button className="primary-button" onClick={() => navigate('/register')}>
            Comecar agora
          </button>
        </div>
      </nav>

      <section className="real-estate-hero">
        <div className="hero-copy">
          <span className="eyebrow">Tecnologia para imobiliarias modernas</span>
          <h1>Domus ajuda imobiliarias a vender melhor, atender mais rapido e crescer com controle.</h1>
          <p>
            Somos uma empresa criada para simplificar a rotina comercial do mercado imobiliario.
            Nosso sistema transforma leads espalhados em um processo organizado, mensuravel e pronto
            para gerar mais visitas, propostas e fechamentos.
          </p>
          <div className="hero-actions">
            <button className="primary-button large" onClick={() => navigate('/register')}>
              Iniciar teste gratis
            </button>
            <button className="secondary-button large" onClick={() => navigate('/login')}>
              Acessar plataforma
            </button>
          </div>
        </div>

        <div className="property-showcase" aria-label="Resumo visual da plataforma Domus">
          <div className="showcase-image">
            <div className="building-card">
              <span>Domus CRM</span>
              <strong>Imobiliaria conectada</strong>
            </div>
          </div>
          <div className="showcase-stats">
            <article>
              <strong>14 dias</strong>
              <span>para testar gratis</span>
            </article>
            <article>
              <strong>5 etapas</strong>
              <span>no funil comercial</span>
            </article>
            <article>
              <strong>100%</strong>
              <span>focado em vendas imobiliarias</span>
            </article>
          </div>
        </div>
      </section>

      <section className="about-section" id="empresa">
        <div>
          <span className="eyebrow">Sobre a Domus</span>
          <h2>Uma empresa feita para dar mais previsibilidade ao mercado imobiliario.</h2>
        </div>
        <p>
          A Domus nasceu com o objetivo de ajudar imobiliarias a sairem de planilhas, conversas
          perdidas e controles manuais. Acreditamos que uma boa venda imobiliaria depende de
          relacionamento, velocidade e acompanhamento. Por isso criamos uma plataforma enxuta,
          profissional e facil de usar no dia a dia.
        </p>
      </section>

      <section className="system-section" id="sistema">
        <div className="section-heading">
          <span className="eyebrow">Objetivo do sistema</span>
          <h2>Transformar atendimento em processo comercial.</h2>
          <p>
            O Domus organiza cada oportunidade desde o primeiro contato ate o fechamento,
            dando visibilidade para gestores e foco para corretores.
          </p>
        </div>

        <div className="benefit-grid">
          {benefits.map((benefit) => (
            <article key={benefit.title}>
              <span className="checkmark">✓</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="process-band">
        <div>
          <span className="eyebrow">Fluxo Domus</span>
          <h2>Do lead ao contrato, sem perder oportunidades no caminho.</h2>
        </div>
        <div className="process-steps">
          {steps.map((step, index) => (
            <article key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{step}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div>
          <span className="eyebrow">Pronto para vender com mais controle?</span>
          <h2>Comece a usar o Domus na sua imobiliaria.</h2>
          <p>Cadastre sua empresa, teste gratis e veja seu funil comercial ganhar forma.</p>
        </div>
        <button className="primary-button large" onClick={() => navigate('/register')}>
          Criar conta gratis
        </button>
      </section>
    </main>
  );
}

export default Home;
