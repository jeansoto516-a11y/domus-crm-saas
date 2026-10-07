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
      answer: 'Depende do pacote escolhido: Normal (ate 5 corretores) por R$ 59,90/mes, Plus (ate 10) por R$ 99,90/mes, ou Premium (ate 20) por R$ 159,90/mes. Pode ser pago por cartao de credito (recorrente automatico) ou Pix.'
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
          <span className="dd-auth-eyebrow">Vendas + Aluguéis em um sistema só</span>
          <h1>Duas operações, um sistema: venda mais e administre aluguéis sem planilha.</h1>
          <p>
            Sua imobiliária hoje provavelmente usa um app pra WhatsApp, uma planilha para comissão
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
          <h2>Recursos pensados para o dia a dia da sua imobiliária.</h2>
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

      <section className="dd-showcase-section" id="meta-ads-showcase">
        <div className="dd-showcase-grid">
          <div className="dd-showcase-visual">
            <div className="dd-mockup-frame">
              <div className="dd-mockup-chrome">
                <span /><span /><span />
              </div>
              <div className="dd-mockup-body">
                <p className="dd-mockup-title">
                  <span className="dd-fb-badge">f</span> Meta Ads · desempenho
                </p>
                <div className="dd-mockup-metrics">
                  <div className="dd-card">
                    <span className="dd-card-label">Investimento</span>
                    <strong className="dd-card-value">R$ 1.240</strong>
                  </div>
                  <div className="dd-card">
                    <span className="dd-card-label">Leads gerados</span>
                    <strong className="dd-card-value">58</strong>
                  </div>
                  <div className="dd-card">
                    <span className="dd-card-label">Custo por lead</span>
                    <strong className="dd-card-value">R$ 21</strong>
                  </div>
                </div>
                <div className="dd-showcase-bars">
                  <div className="dd-showcase-bar-row">
                    <span>Campanha Lançamento</span>
                    <div className="dd-showcase-bar-track"><div className="dd-showcase-bar-fill" style={{ width: '82%', background: '#1877F2' }} /></div>
                  </div>
                  <div className="dd-showcase-bar-row">
                    <span>Campanha Aluguel</span>
                    <div className="dd-showcase-bar-track"><div className="dd-showcase-bar-fill" style={{ width: '54%', background: '#4C4FE0' }} /></div>
                  </div>
                  <div className="dd-showcase-bar-row">
                    <span>Campanha Retargeting</span>
                    <div className="dd-showcase-bar-track"><div className="dd-showcase-bar-fill" style={{ width: '31%', background: '#7C3AED' }} /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dd-showcase-content">
            <span className="dd-auth-eyebrow">Novidade</span>
            <h2>Veja o retorno dos seus anúncios sem sair do CRM.</h2>
            <p>
              Conecte sua conta do Meta Ads e acompanhe investimento, leads gerados e custo por lead
              de cada campanha de Facebook e Instagram — direto no painel do Domus, sem planilha
              paralela e sem custo extra de ferramenta.
            </p>
            <ul className="dd-showcase-list">
              <li>✓ Conexão simples, sem mensalidade adicional</li>
              <li>✓ Investimento e custo por lead por campanha</li>
              <li>✓ Saiba qual anúncio realmente traz cliente, não só clique</li>
            </ul>
            <button className="dd-btn-primary" onClick={() => navigate('/register')}>
              Quero testar grátis
            </button>
          </div>
        </div>
      </section>

      <section className="dd-showcase-section reverse" id="tour-360-showcase">
        <div className="dd-showcase-grid">
          <div className="dd-showcase-content">
            <span className="dd-auth-eyebrow">Novidade</span>
            <h2>Leve o cliente para dentro do imóvel, mesmo à distância.</h2>
            <p>
              Cadastre fotos 360° de cada ambiente e deixe seus leads "caminharem" pelo imóvel
              direto do catálogo — no computador, arrastando com o mouse, ou no celular, girando
              o aparelho pra olhar em volta.
            </p>
            <ul className="dd-showcase-list">
              <li>✓ Um tour por imóvel, com quantos ambientes quiser</li>
              <li>✓ Funciona em qualquer computador ou celular, sem app</li>
              <li>✓ Aumenta o interesse de quem ainda não pode visitar pessoalmente</li>
            </ul>
            <button className="dd-btn-primary" onClick={() => navigate('/register')}>
              Quero testar grátis
            </button>
          </div>

          <div className="dd-showcase-visual">
            <div className="dd-tour-mockup">
              <div className="dd-tour-mockup-panorama">
                <svg
                  viewBox="0 0 800 450"
                  preserveAspectRatio="xMidYMid slice"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="Visão em primeira pessoa de uma sala em um tour de realidade virtual"
                  style={{ width: '100%', height: '100%', display: 'block' }}
                >
                  <defs>
                    <linearGradient id="tourWall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#3b4080" />
                      <stop offset="1" stopColor="#262b5e" />
                    </linearGradient>
                    <linearGradient id="tourSideWall" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0" stopColor="#1a1d45" />
                      <stop offset="1" stopColor="#2b3068" />
                    </linearGradient>
                    <linearGradient id="tourSideWallR" x1="1" y1="0" x2="0" y2="0">
                      <stop offset="0" stopColor="#1a1d45" />
                      <stop offset="1" stopColor="#2b3068" />
                    </linearGradient>
                    <linearGradient id="tourFloor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#4a3a78" />
                      <stop offset="1" stopColor="#1f1840" />
                    </linearGradient>
                    <linearGradient id="tourCeiling" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0" stopColor="#20244f" />
                      <stop offset="1" stopColor="#12142f" />
                    </linearGradient>
                    <linearGradient id="tourWindow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#cfe6ff" />
                      <stop offset="1" stopColor="#8fb8f5" />
                    </linearGradient>
                    <linearGradient id="tourDoor" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.85" />
                      <stop offset="1" stopColor="#ffb86b" stopOpacity="0.55" />
                    </linearGradient>
                    <radialGradient id="tourVignette" cx="0.5" cy="0.5" r="0.75">
                      <stop offset="0.45" stopColor="#000" stopOpacity="0" />
                      <stop offset="1" stopColor="#000" stopOpacity="0.9" />
                    </radialGradient>
                    <clipPath id="tourFloorClip">
                      <polygon points="0,450 150,260 650,260 800,450" />
                    </clipPath>
                  </defs>

                  <g transform="translate(400 225)">
                    <g>
                      <animateTransform
                        attributeName="transform"
                        type="scale"
                        values="1;1.08;1"
                        dur="14s"
                        repeatCount="indefinite"
                      />
                      <g transform="translate(-400 -225)">
                        {/* Teto, paredes e piso */}
                        <polygon points="0,0 800,0 650,60 150,60" fill="url(#tourCeiling)" />
                        <polygon points="0,0 150,60 150,260 0,450" fill="url(#tourSideWall)" />
                        <polygon points="800,0 650,60 650,260 800,450" fill="url(#tourSideWallR)" />
                        <rect x="150" y="60" width="500" height="200" fill="url(#tourWall)" />
                        <polygon points="0,450 150,260 650,260 800,450" fill="url(#tourFloor)" />

                        {/* Linhas do piso em perspectiva */}
                        <g clipPath="url(#tourFloorClip)" stroke="#ffffff" strokeOpacity="0.07" strokeWidth="2">
                          <line x1="150" y1="260" x2="-325" y2="450" />
                          <line x1="250" y1="260" x2="-35" y2="450" />
                          <line x1="350" y1="260" x2="255" y2="450" />
                          <line x1="450" y1="260" x2="545" y2="450" />
                          <line x1="550" y1="260" x2="835" y2="450" />
                          <line x1="650" y1="260" x2="1125" y2="450" />
                          <line x1="0" y1="285" x2="800" y2="285" />
                          <line x1="0" y1="320" x2="800" y2="320" />
                          <line x1="0" y1="370" x2="800" y2="370" />
                          <line x1="0" y1="430" x2="800" y2="430" />
                        </g>

                        {/* Luz da janela no piso */}
                        <polygon points="330,260 470,260 580,450 220,450" fill="#ffffff" opacity="0.07" />

                        {/* Janela */}
                        <rect x="325" y="80" width="150" height="90" rx="3" fill="url(#tourWindow)" />
                        <rect x="325" y="80" width="150" height="90" rx="3" fill="none" stroke="#e8f0ff" strokeWidth="3" />
                        <line x1="400" y1="80" x2="400" y2="170" stroke="#e8f0ff" strokeWidth="3" />
                        <line x1="325" y1="125" x2="475" y2="125" stroke="#e8f0ff" strokeWidth="3" />

                        {/* Porta para o próximo cômodo */}
                        <polygon points="675,110 740,90 740,374 675,292" fill="url(#tourDoor)" />
                        <polygon points="675,110 740,90 740,374 675,292" fill="none" stroke="#f3e2c4" strokeWidth="3" />

                        {/* Quadro na parede esquerda */}
                        <polygon points="45,95 115,125 115,205 45,250" fill="#12142f" stroke="#8a8fd6" strokeWidth="3" />
                        <polygon points="55,115 105,137 105,193 55,228" fill="#7C3AED" opacity="0.7" />
                        <polygon points="55,185 80,170 105,193 55,228" fill="#2F6FED" opacity="0.8" />

                        {/* Luminária pendente */}
                        <line x1="400" y1="0" x2="400" y2="38" stroke="#c9ccff" strokeWidth="2" />
                        <polygon points="378,38 422,38 436,62 364,62" fill="#ffd9a0" />
                        <ellipse cx="400" cy="64" rx="34" ry="5" fill="#ffd9a0" opacity="0.35" />

                        {/* Tapete */}
                        <ellipse cx="400" cy="345" rx="210" ry="48" fill="#7C3AED" opacity="0.38" />
                        <ellipse cx="400" cy="345" rx="160" ry="34" fill="#4C4FE0" opacity="0.35" />

                        {/* Sofá */}
                        <rect x="290" y="172" width="220" height="56" rx="12" fill="#5a5fe8" />
                        <rect x="278" y="205" width="24" height="58" rx="9" fill="#4448c9" />
                        <rect x="498" y="205" width="24" height="58" rx="9" fill="#4448c9" />
                        <rect x="296" y="212" width="208" height="50" rx="10" fill="#6a6ff5" />
                        <line x1="400" y1="214" x2="400" y2="260" stroke="#4448c9" strokeWidth="2" />
                        <rect x="312" y="190" width="56" height="30" rx="8" fill="#B0389E" opacity="0.85" />

                        {/* Mesinha de centro */}
                        <rect x="335" y="318" width="130" height="14" rx="4" fill="#d9d4ff" opacity="0.9" />
                        <rect x="345" y="332" width="8" height="22" fill="#9a95d6" />
                        <rect x="447" y="332" width="8" height="22" fill="#9a95d6" />
                        <rect x="375" y="306" width="22" height="12" rx="3" fill="#ffd9a0" />

                        {/* Planta */}
                        <rect x="176" y="218" width="34" height="44" rx="6" fill="#d7d9ff" />
                        <ellipse cx="193" cy="200" rx="14" ry="30" fill="#0D9488" transform="rotate(-18 193 200)" />
                        <ellipse cx="193" cy="196" rx="14" ry="32" fill="#14b8a6" transform="rotate(14 193 196)" />
                        <ellipse cx="193" cy="190" rx="12" ry="30" fill="#0f766e" />
                      </g>
                    </g>
                  </g>

                  {/* Efeito de óculos de VR */}
                  <rect width="800" height="450" fill="url(#tourVignette)" />

                  {/* Mira central */}
                  <circle cx="400" cy="225" r="7" fill="none" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="2" />
                  <circle cx="400" cy="225" r="1.8" fill="#ffffff" fillOpacity="0.9" />

                  {/* HUD */}
                  <g>
                    <rect x="300" y="396" width="200" height="30" rx="15" fill="#000" fillOpacity="0.45" />
                    <circle cx="324" cy="411" r="4.5" fill="#ef4444" />
                    <text x="340" y="416" fill="#ffffff" fillOpacity="0.9" fontSize="14" fontFamily="Inter, Arial, sans-serif">
                      Tour virtual · Sala de estar
                    </text>
                  </g>
                </svg>
              </div>
              <div className="dd-tour-mockup-thumbs">
                <span className="active">Sala</span>
                <span>Quarto</span>
                <span>Cozinha</span>
                <span>Varanda</span>
              </div>
            </div>
          </div>
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
          <span className="dd-auth-eyebrow">Escolha o tamanho da sua equipe</span>
          <h2>Um pacote pra cada fase da sua imobiliária.</h2>
          <p>Vendas e aluguéis inclusos em todos os pacotes — a diferença é só quantos corretores você pode cadastrar.</p>
        </div>

        <div className="dd-pricing-grid">
          <div className="dd-pricing-tier">
            <h3>Normal</h3>
            <div className="dd-pricing-value">
              <strong>R$ 59,90</strong>
              <span>/mes</span>
            </div>
            <p className="dd-pricing-tier-limit">Ate 5 corretores</p>
            <ul>
              <li>✓ Vendas e aluguéis inclusos</li>
              <li>✓ Leads e imóveis ilimitados</li>
              <li>✓ 14 dias de teste grátis</li>
              <li>✓ Suporte pelo chat do sistema</li>
            </ul>
            <button className="dd-btn-secondary full" onClick={() => navigate('/register')}>
              Começar com o Normal
            </button>
          </div>

          <div className="dd-pricing-tier highlight">
            <span className="dd-pricing-tier-badge">Mais escolhido</span>
            <h3>Plus</h3>
            <div className="dd-pricing-value">
              <strong>R$ 99,90</strong>
              <span>/mes</span>
            </div>
            <p className="dd-pricing-tier-limit">Ate 10 corretores</p>
            <ul>
              <li>✓ Vendas e aluguéis inclusos</li>
              <li>✓ Leads e imóveis ilimitados</li>
              <li>✓ 14 dias de teste grátis</li>
              <li>✓ Suporte pelo chat do sistema</li>
            </ul>
            <button className="dd-btn-primary full" onClick={() => navigate('/register')}>
              Começar com o Plus
            </button>
          </div>

          <div className="dd-pricing-tier">
            <h3>Premium</h3>
            <div className="dd-pricing-value">
              <strong>R$ 159,90</strong>
              <span>/mes</span>
            </div>
            <p className="dd-pricing-tier-limit">Ate 20 corretores</p>
            <ul>
              <li>✓ Vendas e aluguéis inclusos</li>
              <li>✓ Leads e imóveis ilimitados</li>
              <li>✓ 14 dias de teste grátis</li>
              <li>✓ Suporte pelo chat do sistema</li>
            </ul>
            <button className="dd-btn-secondary full" onClick={() => navigate('/register')}>
              Começar com o Premium
            </button>
          </div>
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