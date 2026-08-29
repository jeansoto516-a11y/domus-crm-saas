import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Distribuição automatica de leads',
      text: 'Cada novo lead e direcionado automaticamente para o corretor com menos leads ativos no momento, sem esforco manual do gestor.'
    },
    {
      title: 'WhatsApp em um clique',
      text: 'Abra a conversa com o lead direto do card, com mensagem ja pronta, sem precisar copiar número.'
    },
    {
      title: 'Metas e ranking da equipe',
      text: 'Defina metas mensais por corretor e acompanhe quem mais converteu, com progresso calculado automaticamente pelo funil.'
    },
    {
      title: 'Formulario publico de captação',
      text: 'Gere um link proprio para o site ou Instagram da imobiliaria. Cada lead cai direto no funil, ja pontuado e distribuido.'
    },
    {
      title: 'Historico completo do lead',
      text: 'Toda mudança de etapa e cada anotação ficam registradas numa linha do tempo, sem se perder em conversas soltas.'
    },
    {
      title: 'Suporte direto pelo sistema',
      text: 'Chat interno com a equipe Domus, sem precisar sair da plataforma para tirar duvidas.'
    }
  ];

  const steps = ['Captar', 'Atender', 'Agendar', 'Propor', 'Fechar'];

  const faqs = [
    {
      question: 'Preciso de cartão de crédito para testar?',
      answer: 'Não. O teste gratuito de 14 dias começa assim que voce cria sua conta, sem pedir dados de pagamento.'
    },
    {
      question: 'Como funciona a cobrança depois do teste?',
      answer: 'A assinatura custa R$ 59,90 por mes, e pode ser paga por cartão de credito (recorrente automatico) ou Pix.'
    },
    {
      question: 'Posso cancelar quando quiser?',
      answer: 'Sim, o cancelamento pode ser feito a qualquer momento, sem multa ou burocracia.'
    },
    {
      question: 'Os dados dos meus leads e clientes ficam seguros?',
      answer: 'Sim. Seguimos praticas de proteção de dados alinhadas a LGPD, com senhas criptografadas e acesso controlado por permissão dentro da sua equipe.'
    },
    {
      question: 'Os corretores tem acesso a tudo?',
      answer: 'Não. Cada corretor ve apenas os proprios leads. Somente o administrador da imobiliaria tem visão completa da operação.'
    }
  ];

  return (
    <main className="site-shell institutional">
      <nav className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">D</span>
          <span>Domus</span>
        </Link>
        <div className="topbar-actions">
          <a className="nav-link" href="#sistema">Sistema</a>
          <a className="nav-link" href="#precos">Preços</a>
          <a className="nav-link" href="#faq">Dúvidas</a>
          <button className="ghost-button" onClick={() => navigate('/login')}>
            Entrar
          </button>
          <button className="primary-button" onClick={() => navigate('/register')}>
            Começar agora
          </button>
        </div>
      </nav>

      <section className="real-estate-hero">
        <div className="hero-copy">
          <span className="eyebrow">Tecnologia para imobiliarias modernas</span>
          <h1>Domus ajuda imobiliarias a vender melhor, atender mais rapido e crescer com controle.</h1>
          <p>
            Leads espalhados em WhatsApp, planilhas e cadernos viram um processo único, organizado
            e mensuravel. Do primeiro contato ao fechamento, sem perder oportunidade no caminho.
          </p>
          <div className="hero-actions">
            <button className="primary-button large" onClick={() => navigate('/register')}>
              Iniciar teste grátis de 14 dias
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
              <span>de teste grátis, sem cartão</span>
            </article>
            <article>
              <strong>R$ 59,90</strong>
              <span>por mês após o teste</span>
            </article>
            <article>
              <strong>100%</strong>
              <span>focado em vendas imobiliarias</span>
            </article>
          </div>
        </div>
      </section>

      <section className="system-section" id="sistema">
        <div className="section-heading">
          <span className="eyebrow">O que o Domus faz por você</span>
          <h2>Recursos pensados para o dia a dia da sua imobiliaria.</h2>
          <p>
            Não é só um cadastro de leads. E um sistema completo para captar, distribuir,
            acompanhar e converter, com sua equipe toda na mesma página.
          </p>
        </div>

        <div className="benefit-grid">
          {features.map((feature) => (
            <article key={feature.title}>
              <span className="checkmark">✓</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
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

      <section className="pricing-section" id="precos">
        <div className="section-heading">
          <span className="eyebrow">Plano simples, sem pegadinha</span>
          <h2>Um plano unico para toda a sua imobiliaria.</h2>
        </div>

        <div className="pricing-card">
          <span className="eyebrow">Plano Domus</span>
          <div className="pricing-value">
            <strong>R$ 59,90</strong>
            <span>/mes</span>
          </div>
          <p>Corretores ilimitados, leads ilimitados, todos os recursos inclusos.</p>
          <ul>
            <li>✓ 14 dias de teste grátis, sem cartão de crédito</li>
            <li>✓ Pagamento por cartão (recorrente automático) ou Pix</li>
            <li>✓ Cancele quando quiser, sem multa</li>
            <li>✓ Suporte direto pelo chat do sistema</li>
          </ul>
          <button className="primary-button large" onClick={() => navigate('/register')}>
            Começar teste grátis
          </button>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="section-heading">
          <span className="eyebrow">Perguntas frequentes</span>
          <h2>Dúvidas comuns antes de começar.</h2>
        </div>

        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.question} className="faq-item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div>
          <span className="eyebrow">Pronto para vender com mais controle?</span>
          <h2>Comece a usar o Domus na sua imobiliaria.</h2>
          <p>Cadastre sua empresa, teste grátis por 14 dias e veja seu funil comercial ganhar forma.</p>
        </div>
        <button className="primary-button large" onClick={() => navigate('/register')}>
          Criar conta grátis
        </button>
      </section>

      <footer className="site-footer">
        <div className="brand">
          <span className="brand-mark">D</span>
          <span>Domus</span>
        </div>
        <div className="footer-links">
          <Link to="/termos">Termos de Uso</Link>
          <Link to="/privacidade">Politica de Privacidade</Link>
          <a href="#sistema">Sistema</a>
          <a href="#precos">Preços</a>
        </div>
      </footer>
    </main>
  );
}

export default Home;