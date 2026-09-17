import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import '../styles/dark-theme.css';

function Home() {
  const navigate = useNavigate();

  const bentoFeatures = [
    { icon: 'userPlus', title: 'Distribuição automática de leads', text: 'Cada lead novo vai direto pro corretor com menos leads ativos, sem esforço manual do gestor.', span: 2 },
    { icon: 'phone', title: 'WhatsApp em um clique', text: 'Conversa aberta direto do card do lead, com mensagem já pronta.', span: 2 },
    { icon: 'file', title: 'Gestão de aluguéis inclusa', text: 'Cobrança mensal, comissão de administração e reajuste anual, sem planilha paralela.', span: 2 },
    { icon: 'calendar', title: 'Alerta de contrato vencendo', text: 'Avisos automáticos em 30, 60 e 90 dias antes do fim do contrato.', span: 2 },
    { icon: 'check', title: 'Metas e ranking da equipe', text: 'Acompanhe quem mais vende e quem mais administra imóveis, com progresso automático.', span: 4 }
  ];

  const steps = ['Captar', 'Atender', 'Agendar', 'Propor', 'Fechar'];

  const faqs = [
    {
      question: 'Preciso de cartão de crédito para testar?',
      answer: 'Não. O teste gratuito de 14 dias começa assim que você cria sua conta, sem pedir dados de pagamento.'
    },
    {
      question: 'O Domus serve só para vendas ou também para aluguéis?',
      answer: 'Os dois. O mesmo plano inclui o CRM de vendas completo e o módulo de gestão de aluguéis administrados, sem custo adicional.'
    },
    {
      question: 'Como funciona a cobrança depois do teste?',
      answer: 'A assinatura custa R$ 59,90 por mês, e pode ser paga por cartão de crédito (recorrente automático) ou Pix.'
    },
    {
      question: 'Posso cancelar quando quiser?',
      answer: 'Sim, o cancelamento pode ser feito a qualquer momento, sem multa ou burocracia.'
    },
    {
      question: 'Os dados dos meus leads e clientes ficam seguros?',
      answer: 'Sim. Seguimos práticas de proteção de dados alinhadas à LGPD, com senhas criptografadas e acesso controlado por permissão dentro da sua equipe.'
    },
    {
      question: 'Os corretores têm acesso a tudo?',
      answer: 'Não. Cada corretor vê apenas os próprios leads e imóveis. Você define, por corretor, se ele acessa vendas, aluguéis ou os dois.'
    }
  ];

  return (
        <main className="dd-shell dd-landing">
                  <div className="dd-universe-bg">
        <span className="dd-universe-glow-1" />
      </div>

      <nav className="dd-landing-nav">
        <Link className="dd-auth-brand" to="/">
          <span className="dd-brand-mark">D</span>
          <span>Domus</span>
        </Link>
        <div className="dd-landing-nav-links">
          <a href="#sistema">Sistema</a>
          <a href="#precos">Preços</a>
          <a href="#faq">Dúvidas</a>
          <button className="dd-btn-secondary" onClick={() => navigate('/login')}>
            Entrar
          </button>
          <button className="dd-btn-primary" onClick={() => navigate('/register')}>
            Começar agora
          </button>
        </div>
      </nav>

      <section className="dd-hero">
        <div>
          <span className="dd-auth-eyebrow">Vendas + Aluguéis num sistema só</span>
          <h1>2 operações, 1 sistema: venda mais e administre aluguéis sem planilha.</h1>
          <p>
            Sua imobiliária hoje provavelmente usa um app pra WhatsApp, uma planilha pra comissão
            e um caderno pra aluguel. O Domus junta tudo isso: funil de vendas com distribuição
            automática de leads e gestão financeira de imóveis administrados, no mesmo login.
          </p>
          <div className="dd-hero-actions">
            <button className="dd-btn-primary dd-btn-large" onClick={() => navigate('/register')}>
              Iniciar teste grátis de 14 dias
            </button>
            <button className="dd-btn-secondary dd-btn-large" onClick={() => navigate('/login')}>
              Acessar plataforma
            </button>
          </div>
          <div className="dd-trustbar">
            <span>✓ Sem cartão de crédito</span>
            <span>✓ Cancele quando quiser</span>
            <span>✓ Dados protegidos (LGPD)</span>
          </div>
        </div>

        <div className="dd-mockup-frame">
          <div className="dd-mockup-chrome">
            <span /><span /><span />
          </div>
          <div className="dd-mockup-body">
            <p className="dd-mockup-title">Dashboard · visão geral</p>
            <div className="dd-mockup-metrics">
              <div className="dd-card">
                <span className="dd-card-label">Total de leads</span>
                <strong className="dd-card-value">32</strong>
              </div>
              <div className="dd-card">
                <span className="dd-card-label">Conversão</span>
                <strong className="dd-card-value">41%</strong>
              </div>
              <div className="dd-card">
                <span className="dd-card-label">Imóveis ativos</span>
                <strong className="dd-card-value">18</strong>
              </div>
            </div>
            <div className="dd-mockup-funnel">
              <span style={{ background: '#2F6FED' }}>Novos</span>
              <span style={{ background: '#4C4FE0' }}>Contato</span>
              <span style={{ background: '#7C3AED' }}>Visita</span>
              <span style={{ background: '#B0389E' }}>Proposta</span>
              <span style={{ background: '#0D9488' }}>Fechado</span>
            </div>
          </div>
        </div>
      </section>

      <section className="dd-section" id="sistema">
        <div className="dd-section-heading">
          <span className="dd-auth-eyebrow">O que o Domus faz por você</span>
          <h2>Recursos pensados pro dia a dia da sua imobiliária.</h2>
          <p>
            Não é só um cadastro de leads. É um sistema completo pra captar, distribuir,
            acompanhar, converter e ainda administrar os imóveis alugados pela imobiliária.
          </p>
        </div>

        <div className="dd-bento-grid">
          {bentoFeatures.map((feature) => (
            <article
              key={feature.title}
              className={`dd-bento-card ${feature.span === 4 ? 'span-4' : ''}`}
            >
              <span className="dd-icon-badge" style={{ background: 'var(--dd-blue)' }}>
                <Icon name={feature.icon} />
              </span>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dd-process-band">
        <div className="dd-process-band-inner">
          <span className="dd-auth-eyebrow">Fluxo Domus</span>
          <h2>Do lead ao contrato, sem perder oportunidades no caminho.</h2>
          <div className="dd-process-steps">
            {steps.map((step, index) => (
              <article key={step}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{step}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="dd-section" id="precos">
        <div className="dd-section-heading">
          <span className="dd-auth-eyebrow">Plano simples, sem pegadinha</span>
          <h2>Um plano único, com vendas e aluguéis inclusos.</h2>
        </div>

        <div className="dd-pricing-card">
          <span className="dd-auth-eyebrow">Plano Domus</span>
          <div className="dd-pricing-value">
            <strong>R$ 59,90</strong>
            <span>/mês</span>
          </div>
          <p style={{ color: 'var(--dd-muted)' }}>Corretores ilimitados, leads ilimitados, imóveis ilimitados. Vendas e aluguéis no mesmo plano.</p>
          <ul>
            <li>✓ 14 dias de teste grátis, sem cartão de crédito</li>
            <li>✓ Módulo completo de gestão de aluguéis incluso</li>
            <li>✓ Pagamento por cartão (recorrente automático) ou Pix</li>
            <li>✓ Cancele quando quiser, sem multa</li>
            <li>✓ Suporte direto pelo chat do sistema</li>
          </ul>
          <button className="dd-btn-primary dd-btn-large full" onClick={() => navigate('/register')}>
            Começar teste grátis
          </button>
        </div>
      </section>

      <section className="dd-section" id="faq">
        <div className="dd-section-heading">
          <span className="dd-auth-eyebrow">Perguntas frequentes</span>
          <h2>Dúvidas comuns antes de começar.</h2>
        </div>

        <div className="dd-faq-list">
          {faqs.map((item) => (
            <details key={item.question} className="dd-faq-item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="dd-cta-section">
        <span className="dd-auth-eyebrow">Pronto para organizar vendas e aluguéis no mesmo lugar?</span>
        <h2>Comece a usar o Domus na sua imobiliária.</h2>
        <p>Cadastre sua empresa, teste grátis por 14 dias e veja seu funil comercial e seus imóveis administrados sob controle.</p>
        <button className="dd-btn-primary dd-btn-large" onClick={() => navigate('/register')}>
          Criar conta grátis
        </button>
      </section>

      <footer className="dd-landing-footer">
        <div className="dd-auth-brand">
          <span className="dd-brand-mark">D</span>
          <span>Domus</span>
        </div>
        <div className="dd-footer-links">
          <Link to="/termos">Termos de Uso</Link>
          <Link to="/privacidade">Política de Privacidade</Link>
          <a href="#sistema">Sistema</a>
          <a href="#precos">Preços</a>
        </div>
      </footer>
    </main>
  );
}

export default Home;