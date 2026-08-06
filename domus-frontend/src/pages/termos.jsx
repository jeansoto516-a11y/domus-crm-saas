import { Link } from 'react-router-dom';

function Termos() {
    return (
    <main className="app-shell">
        <section className="workspace">
        <header className="workspace-header">
            <div>
            <span className="eyebrow">Domus</span>
            <h1>Termos de Uso</h1>
            <p>Ultima atualizacao: agosto de 2026</p>
            </div>
            <Link className="secondary-button" to="/">Voltar ao inicio</Link>
        </header>

            <section className="metric-card" style={{ lineHeight: 1.7 }}>
            <h2>1. Aceitacao dos termos</h2>
            <p>
            Ao criar uma conta no Domus ("Plataforma"), voce ("Cliente" ou "Usuario") concorda
            integralmente com estes Termos de Uso. Se voce nao concorda com algum ponto, nao deve
            utilizar a Plataforma.
            </p>

            <h2>2. Descricao do servico</h2>
            <p>
            O Domus e um software como servico (SaaS) de gestao comercial para imobiliarias,
            permitindo o cadastro de corretores, gestao de leads e acompanhamento de funil de
            vendas. O acesso e fornecido mediante assinatura mensal, apos um periodo de teste
            gratuito (trial) de 14 dias.
            </p>

            <h2>3. Cadastro e responsabilidade pela conta</h2>
            <p>
            O Cliente e responsavel por manter a confidencialidade de suas credenciais de acesso
            e por todas as atividades realizadas em sua conta, incluindo as de corretores
            cadastrados por ele. O Cliente declara que as informacoes fornecidas no cadastro sao
            verdadeiras e atuais.
            </p>

            <h2>4. Assinatura, cobranca e cancelamento</h2>
            <p>
            Apos o periodo de trial, a continuidade do uso da Plataforma esta condicionada ao
            pagamento da assinatura mensal vigente, via cartao de credito ou Pix. O nao pagamento
            apos o vencimento pode resultar na suspensao do acesso. O Cliente pode cancelar sua
            assinatura a qualquer momento, sem multa, permanecendo responsavel por valores ja
            vencidos.
            </p>

            <h2>5. Dados inseridos pelo Cliente</h2>
            <p>
            O Cliente e o unico responsavel pelos dados que insere na Plataforma, incluindo dados
            de leads e clientes de terceiros. O Cliente declara possuir base legal adequada
            (conforme a Lei Geral de Protecao de Dados - LGPD) para coletar e tratar esses dados
            dentro do Domus.
            </p>

            <h2>6. Uso aceitavel</h2>
            <p>
            E vedado usar a Plataforma para fins ilicitos, envio de spam, ou qualquer atividade
            que viole direitos de terceiros ou a legislacao vigente.
            </p>

            <h2>7. Disponibilidade e limitacao de responsabilidade</h2>
            <p>
            O Domus busca manter a Plataforma disponivel de forma continua, mas nao garante
            operacao ininterrupta. O Domus nao se responsabiliza por perdas decorrentes de uso
            indevido, indisponibilidade de terceiros (como provedores de pagamento) ou casos
            fortuitos/forca maior.
            </p>

            <h2>8. Alteracoes destes termos</h2>
            <p>
            Estes termos podem ser atualizados periodicamente. Alteracoes relevantes serao
            comunicadas ao Cliente pelos canais habituais da Plataforma.
            </p>

            <h2>9. Contato</h2>
            <p>
            Duvidas sobre estes termos podem ser encaminhadas para o e-mail de suporte informado
            no site.
            </p>
        </section>
        </section>
    </main>
    );
}

export default Termos;