import { Link } from 'react-router-dom';

function Privacidade() {
    return (
    <main className="app-shell">
        <section className="workspace">
        <header className="workspace-header">
            <div>
            <span className="eyebrow">Domus</span>
            <h1>Politica de Privacidade</h1>
            <p>Ultima atualizacao: agosto de 2026</p>
            </div>
            <Link className="secondary-button" to="/">Voltar ao inicio</Link>
        </header>

        <section className="metric-card" style={{ lineHeight: 1.7 }}>
            <h2>1. Quem somos</h2>
            <p>
            O Domus e uma plataforma de gestao comercial para imobiliarias. Esta politica explica
            quais dados coletamos, como usamos e como protegemos essas informacoes, em conformidade
            com a Lei Geral de Protecao de Dados (LGPD - Lei 13.709/2018).
            </p>

            <h2>2. Dados que coletamos</h2>
            <p>
            <strong>Do Cliente (imobiliaria e usuarios):</strong> nome, e-mail, senha (armazenada de
            forma criptografada) e, quando aplicavel para pagamento, nome completo e CPF.<br />
            <strong>De leads cadastrados pelo Cliente:</strong> nome, e-mail e telefone, inseridos
            pelo proprio Cliente para uso interno de gestao comercial.
            </p>

            <h2>3. Papeis: controlador e operador</h2>
            <p>
            Em relacao aos dados de leads inseridos pelo Cliente, o Domus atua como <strong>operador</strong>
            dos dados, e o Cliente (a imobiliaria) atua como <strong>controlador</strong>, sendo
            responsavel por garantir base legal para o tratamento desses dados junto aos seus proprios
            leads e clientes.
            </p>

            <h2>4. Para que usamos os dados</h2>
            <p>
            Utilizamos os dados coletados para: viabilizar o funcionamento da Plataforma, processar
            pagamentos, enviar comunicacoes essenciais (recuperacao de senha, avisos de assinatura),
            e cumprir obrigacoes legais.
            </p>

            <h2>5. Compartilhamento com terceiros</h2>
            <p>
            Compartilhamos dados estritamente necessarios com prestadores de servico que operam a
            Plataforma: processamento de pagamentos (Mercado Pago), envio de e-mails transacionais
            (Resend) e hospedagem de banco de dados (Supabase). Nao vendemos dados a terceiros.
            </p>

            <h2>6. Seguranca</h2>
            <p>
            Adotamos medidas tecnicas razoaveis para proteger os dados armazenados, incluindo
            criptografia de senhas e controle de acesso por permissao (corretor x administrador).
            </p>

            <h2>7. Direitos do titular</h2>
            <p>
            Voce pode solicitar a qualquer momento: confirmacao de tratamento, acesso, correcao,
            eliminacao ou portabilidade dos seus dados, entrando em contato pelo e-mail de suporte
            informado no site.
            </p>

            <h2>8. Retencao de dados</h2>
            <p>
            Mantemos os dados enquanto a conta estiver ativa. Apos o cancelamento, os dados podem
            ser mantidos por um periodo adicional para cumprimento de obrigacoes legais, e depois
            eliminados ou anonimizados.
            </p>

            <h2>9. Alteracoes desta politica</h2>
            <p>
            Esta politica pode ser atualizada periodicamente, com a data de "ultima atualizacao"
            revisada no topo da pagina.
            </p>
        </section>
        </section>
    </main>
    );
}

export default Privacidade;