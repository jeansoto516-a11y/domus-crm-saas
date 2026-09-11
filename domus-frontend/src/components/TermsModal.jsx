import { useRef, useState } from 'react';
import './../styles/dark-theme.css';

function TermsModal({ onAccept, onClose }) {
    const [scrolledToEnd, setScrolledToEnd] = useState(false);
    const contentRef = useRef(null);

    const handleScroll = () => {
    const el = contentRef.current;
    if (!el) return;

    const reachedEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;

    if (reachedEnd) {
        setScrolledToEnd(true);
    }
    };

    return (
    <div className="dd-shell dd-modal-overlay">
        <div className="dd-modal-box">
        <div className="dd-modal-header">
            <h2>Termos de Uso e Politica de Privacidade</h2>
            <p>Role o conteudo ate o final para poder aceitar.</p>
        </div>

        <div
            ref={contentRef}
            onScroll={handleScroll}
            className="dd-modal-body"
        >
            <h3>Termos de Uso</h3>

            <p><strong>1. Aceitacao dos termos.</strong> Ao criar uma conta no Domus ("Plataforma"), voce concorda integralmente com estes Termos de Uso.</p>
            <p><strong>2. Descricao do servico.</strong> O Domus e um software como servico (SaaS) de gestao comercial para imobiliarias, com trial gratuito de 14 dias e assinatura mensal apos esse periodo.</p>
            <p><strong>3. Cadastro e responsabilidade.</strong> Voce e responsavel por manter suas credenciais em sigilo e por todas as atividades realizadas na sua conta, incluindo as de corretores cadastrados por voce.</p>
            <p><strong>4. Assinatura e cancelamento.</strong> Apos o trial, o uso continuo depende do pagamento da assinatura (cartao ou Pix). O nao pagamento pode suspender o acesso. Voce pode cancelar a qualquer momento.</p>
            <p><strong>5. Dados inseridos por voce.</strong> Voce e responsavel pelos dados de leads e clientes de terceiros que inserir na Plataforma, e declara possuir base legal para tratar esses dados conforme a LGPD.</p>
            <p><strong>6. Uso aceitavel.</strong> E proibido usar a Plataforma para fins ilicitos ou que violem direitos de terceiros.</p>
            <p><strong>7. Limitacao de responsabilidade.</strong> O Domus busca disponibilidade continua, mas nao garante operacao ininterrupta, nem se responsabiliza por uso indevido ou indisponibilidade de terceiros.</p>
            <p><strong>8. Alteracoes.</strong> Estes termos podem ser atualizados, com comunicacao pelos canais habituais.</p>

            <h3>Politica de Privacidade</h3>

            <p><strong>1. Dados que coletamos.</strong> Do Cliente: nome, e-mail, senha criptografada e, quando aplicavel, CPF para pagamento. Dos leads cadastrados por voce: nome, e-mail e telefone.</p>
            <p><strong>2. Controlador e operador.</strong> Sobre os dados de leads, o Domus atua como operador, e voce (a imobiliaria) como controlador, responsavel por ter base legal junto aos seus proprios leads.</p>
            <p><strong>3. Uso dos dados.</strong> Usamos os dados para operar a Plataforma, processar pagamentos, enviar comunicacoes essenciais e cumprir obrigacoes legais.</p>
            <p><strong>4. Compartilhamento.</strong> Compartilhamos dados apenas com prestadores essenciais: Mercado Pago (pagamentos), Resend (e-mails) e Supabase (banco de dados). Nao vendemos dados a terceiros.</p>
            <p><strong>5. Seguranca.</strong> Usamos criptografia de senhas e controle de acesso por permissao.</p>
            <p><strong>6. Seus direitos.</strong> Voce pode solicitar acesso, correcao, eliminacao ou portabilidade dos seus dados a qualquer momento.</p>
            <p><strong>7. Retencao.</strong> Mantemos os dados enquanto a conta estiver ativa, e por um periodo adicional apos cancelamento quando exigido por lei.</p>

            <p style={{ color: 'var(--dd-muted)', fontSize: 12 }}>
            Versao completa disponivel em /termos e /privacidade a qualquer momento.
            </p>
        </div>

        <div className="dd-modal-footer">
            <button className="dd-btn-secondary" onClick={onClose}>
            Fechar
            </button>
            <button
            className="dd-btn-primary"
            onClick={onAccept}
            disabled={!scrolledToEnd}
            >
            {scrolledToEnd ? 'Li e aceito' : 'Role ate o final para aceitar'}
            </button>
        </div>
        </div>
    </div>
    );
}

export default TermsModal;