import { Link, useNavigate } from 'react-router-dom';
import '../styles/dark-theme.css';

function Home() {
  const navigate = useNavigate();

  const salesFeatures = [
    'Distribuição automática: cada lead novo vai direto para o corretor com menos leads ativos',
    'Funil visual com scoring automático (frio, morno, quente)',
    'WhatsApp em um clique, com mensagem já pronta',
    'Formulário público de captação para seu site ou Instagram',
    'Histórico completo do lead, com anotações da equipe',
    'Metas mensais e ranking de corretores'
  ];

  const rentalFeatures = [
    'Cadastro de imóveis administrados, com inquilino, proprietário e contrato',
    'Cálculo automático de comissão e taxa de administração',
    'Cobrança mensal gerada com um clique, com controle de pago/pendente/atrasado',
    'Alerta de contrato vencendo (30, 60 e 90 dias)',
    'Reajuste de aluguel com histórico completo',
    'Ranking de corretores também por aluguéis administrados'
  ];

  const stats = [
    { value: '2 módulos', label: 'vendas e aluguéis no mesmo sistema' },
    { value: '14 dias', label: 'de teste grátis, sem cartão' },
    { value: 'R$ 59,90', label: 'por mês, tudo incluso' }
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
      answer: 'Não. Cada corretor vê apenas os próprios leads e imóveis. Você define, por corretor, se ele acessa vendas, aluguéis ou os dois. Só o administrador tem visão completa da operação.'
    }
  ];

  return (
    <main className="dd-landing">
      <nav className="dd-landing-nav">
        <Link className="dd-auth-brand" to="/">
          <span className="dd-brand-mark">D</span>
          <span>Domus</span>
        </Link>
        <div className="dd-landing-nav-links">
          <a href="#sistema">Sistema</a>
          <a href="#alugueis">Aluguéis</a>
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
          <span className="dd-auth-eyebrow">O único CRM que junta vendas e aluguéis</span>
          <h1>Sua imobiliária inteira em um sistema só: leads, corretores e imóveis alugados sob controle.</h1>
          <p>
            Pare de espalhar sua operação entre WhatsApp, planilhas de comissão e cadernos de aluguel.
            O Domus organiza a captação, o funil de vendas e a gestão de imóveis administrados —
            com sua equipe toda vendo só o que precisa ver.
          </p>
          <div className="dd-hero-actions">
            <button className="dd-btn-primary dd-btn-large" onClick={() => navigate('/register')}>
              Iniciar teste grátis de 14 dias
            </button>
            <button className="dd-btn-secondary dd-btn-large" onClick={() => navigate('/login')}>
              Acessar plataforma
            </button>
          </div>
        </div>

        <div>
          <div className="dd-showcase-card">
            <span>Domus CRM</span>
            <strong>Vendas + Aluguéis, conectados</strong>
          </div>
          <div className="dd-showcase-stats">
            {stats.map((stat) => (
              <article key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="dd-section" id="sistema">
        <div className="dd-section-heading">
          <span className="dd-auth-eyebrow">Dois módulos, um sistema só</span>
          <h2>Tudo que sua imobiliária precisa, sem pagar por dois sistemas diferentes.</h2>
          <p>
            A maioria dos CRMs do mercado só cuida da venda e esquece o pós — ou faz gestão de aluguel
            separada, em outra ferramenta. No Domus, sua equipe trabalha em um lugar só.
          </p>
        </div>

        <div className="dd-modules-grid">
          <article className="dd-module-card highlight">
            <span className="dd-module-tag vendas">Vendas</span>
            <h3>Funil comercial completo</h3>
            <p>Do primeiro contato ao contrato fechado, com prioridade automática pros leads mais quentes.</p>
            <ul className="dd-module-list">
              {salesFeatures.map((item) => (
                <li key={item}><span>✓</span>{item}</li>
              ))}
            </ul>
          </article>

          <article className="dd-module-card" id="alugueis">
            <span className="dd-module-tag alugueis">Aluguéis</span>
            <h3>Gestão de imóveis administrados</h3>
            <p>Controle financeiro de cada imóvel alugado pela imobiliária, sem planilha paralela.</p>
            <ul className="dd-module-list">
              {rentalFeatures.map((item) => (
                <li key={item}><span>✓</span>{item}</li>
              ))}
            </ul>
          </article>
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
          <a href="#alugueis">Aluguéis</a>
          <a href="#precos">Preços</a>
        </div>
      </footer>
    </main>
  );
}

export default Home;