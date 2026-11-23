# Domus CRM

SaaS multiempresa para imobiliárias: CRM de **vendas** e gestão de **aluguéis**, com funil comercial, score de leads, catálogo de imóveis, vitrine pública, tours 360°, projetos 3D, metas, financeiro e integração com Meta Ads e Mercado Pago.

## Módulos

| Pasta | Descrição |
|---|---|
| `domus-frontend` | Aplicação React 19 + Vite 8 (PWA) |
| `domus-backend` | API Express 5 + PostgreSQL (Supabase), JWT, Mercado Pago, Resend, Supabase Storage |

## Stack

**Backend:** Node.js, Express 5, `pg`, `jsonwebtoken`, `bcrypt`, `multer`, `node-cron`, `axios`, `mercadopago`, `@supabase/supabase-js`, `dotenv`.

**Frontend:** React 19, React Router 7, Axios, Recharts, ExcelJS, `@google/model-viewer` (3D/360°), `@mercadopago/sdk-react`, `vite-plugin-pwa`.

**Serviços externos:** Supabase (PostgreSQL + Storage), Mercado Pago (cartão e Pix), Resend (e-mails), Meta Graph API (Meta Ads).

## Funcionalidades

### Comercial (vendas)
- Landing page comercial com chamada para teste grátis (14 dias).
- Cadastro de imobiliária + usuário administrador, login com JWT (1 dia), recuperação e redefinição de senha por e-mail.
- Dashboard com total de leads, conversão, distribuição por etapa e série temporal.
- CRUD de leads (venda ou aluguel) com funil: `novo → contato → visita → proposta → fechado`.
- Filtros por status e período, exportação CSV, leads parados (stale) e contador de novos leads.
- Score e temperatura (`frio`/`morno`/`quente`) automáticos por lead.
- Perfil de interesse do lead + **matching** automático com imóveis do catálogo (sugestões e leads compatíveis por imóvel).
- Histórico e anotações por lead.
- Ranking de corretores, metas (com tópicos e progresso), lembretes.
- Registro de vendas e investimentos em anúncios; painel **Financeiro** com exportação Excel.
- Formulário público de captação de leads por imobiliária: `/f/:slug`.

### Catálogo e imóveis
- Cadastro/edição de imóveis com fotos (até 10), fotos 360° (até 15) e tour 360°.
- **Vitrine pública** por imobiliária (`/vitrine/:slug`) com registro de interesse.
- Projetos 3D (modelos, plantas, fotos) sincronizados com o catálogo.

### Aluguéis
- Imóveis alugados, contratos criados a partir de lead, geração mensal de pagamentos, controle de status de pagamento.
- Reajuste de aluguel com histórico, caução/garantia, ranking e exportação.
- Dashboard e financeiro de aluguéis (inclui previsão de aluguéis futuros e cauções).

### Marketing
- Integração com **Meta Ads** (conexão da conta de anúncios, insights e gasto).

### Assinatura e cobrança
- Trial de 14 dias; após o fim, rotas protegidas retornam `402`.
- Planos (`backend/src/config/plans.js`):

| Plano | Corretores | Preço/mês |
|---|---|---|
| Normal | 5 | R$ 59,90 |
| Plus | 10 | R$ 99,90 |
| Premium | 20 | R$ 159,90 |

- Pagamento por **cartão** (assinatura recorrente / preapproval) ou **Pix**, com webhook do Mercado Pago.
- E-mails automáticos de aviso de fim de trial (3 dias antes e no último dia) via cron diário às 09:00.

### Administração e acesso
- Perfis: `super_admin` (painel do sistema), `admin` (imobiliária) e `user` (corretor).
- Escopo de acesso do usuário: `vendas`, `aluguel` ou `ambos`.
- Painel super admin: estatísticas, empresas, ativação/bloqueio e chat de mensagens com cada imobiliária.
- Separação multiempresa por `company_id`.
- Termos de uso e política de privacidade, tour de onboarding, tema escuro e PWA instalável.

## Estrutura

```
SISTEMA DOMUS/
├── domus-backend/
│   ├── backup-database.js
│   └── src/
│       ├── app.js
│       ├── config/        (db, supabase, plans)
│       ├── controllers/
│       ├── database/      (init, syncProjectsToCatalog, addCreatedAt)
│       ├── middlewares/   (auth, admin, superAdmin, checkSubscription, rentalAccess)
│       ├── routes/
│       └── services/      (leadScoring, matching, mail, trialReminder, metaSpend, crypto, projectCatalog)
└── domus-frontend/
    └── src/
        ├── components/
        ├── pages/
        ├── services/api.js
        └── styles/
```

## Requisitos

- Node.js 20+ e npm
- Banco PostgreSQL (Supabase recomendado)
- Projeto Supabase com buckets de Storage: `properties` e `Avatars`
- (Opcional) conta Mercado Pago, Resend e Meta Ads

## Configuração (variáveis de ambiente)

Nunca versione arquivos `.env`. Use os arquivos `.env.example` como base.

### Backend (`domus-backend/.env`)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `PORT` | Não | Porta da API (padrão `3000`) |
| `DATABASE_URL` | Sim | String de conexão PostgreSQL |
| `DB_SSL` | Não | `true` para bancos que exigem SSL (ex.: Supabase) |
| `JWT_SECRET` | Sim | Chave longa e aleatória para assinar tokens |
| `CORS_ORIGIN` | Sim (produção) | URL do frontend permitida |
| `APP_URL` | Sim | URL pública do frontend (links de e-mail) |
| `API_URL` | Sim (produção) | URL pública da API (webhooks) |
| `MERCADO_PAGO_ACCESS_TOKEN` | Para cobrança | Access token do Mercado Pago |
| `RESEND_API_KEY` | Para e-mails | Chave da API do Resend |
| `RESEND_FROM` | Para e-mails | Remetente dos e-mails |
| `SUPABASE_URL` | Sim | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Chave service role (**somente backend**) |
| `META_TOKEN_KEY` | Para Meta Ads | Chave para criptografar tokens do Meta |
| `META_GRAPH_VERSION` | Não | Versão da Graph API (padrão `v25.0`) |

### Frontend (`domus-frontend/.env`)

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL da API (ex.: `http://localhost:3000`) |
| `VITE_MP_PUBLIC_KEY` | Chave pública do Mercado Pago (checkout com cartão) |

## Rodando localmente

### Backend

```bash
cd domus-backend
npm install
copy .env.example .env      # Linux/macOS: cp .env.example .env
npm run db:init
npm run dev
```

Edite o `.env` com `DATABASE_URL`, `JWT_SECRET` seguro e as chaves do Supabase antes de iniciar. A API sobe em `http://localhost:3000` (`GET /health` verifica a conexão com o banco).

### Frontend

```bash
cd domus-frontend
npm install
copy .env.example .env      # Linux/macOS: cp .env.example .env
npm run dev
```

Acesse `http://localhost:5173`.

## Scripts

**Backend**

| Comando | Ação |
|---|---|
| `npm run dev` | API com nodemon |
| `npm start` | API em produção |
| `npm run db:init` | Cria/atualiza tabelas (idempotente) |
| `npm run check` | Verifica sintaxe de `src/app.js` |
| `node backup-database.js` | Backup JSON de `companies`, `users` e `leads` em `backups/` |
| `node src/database/syncProjectsToCatalog.js` | Sincroniza projetos 3D com o catálogo |

**Frontend**

| Comando | Ação |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (`dist`) |
| `npm run preview` | Preview do build |
| `npm run lint` | ESLint |

## Rotas principais da API

Rotas autenticadas exigem `Authorization: Bearer <token>`; a maioria exige assinatura ativa ou trial válido.

| Prefixo | Conteúdo |
|---|---|
| `/auth` | `register`, `login`, `forgot-password`, `reset-password` |
| `/users` | perfil, avatar, empresa, plano, onboarding, gestão de corretores |
| `/leads` | CRUD, dashboard, timeseries, export, ranking, stale, perfil, sugestões, histórico, captação pública (`/public/:slug`) |
| `/properties` | CRUD, fotos, fotos 360°, matching de leads, vitrine pública (`/public/:slug`) |
| `/projects-3d` | projetos 3D e fotos |
| `/rentals` | imóveis alugados, contratos, pagamentos, reajustes, ranking, export, dashboard |
| `/sales`, `/investments`, `/finance` | vendas, investimentos em anúncios e resumo financeiro |
| `/goals`, `/reminders` | metas e lembretes |
| `/meta-ads` | status, conexão e insights do Meta Ads |
| `/payments` | `status`, `checkout/card`, `checkout/pix`, `webhook` |
| `/messages`, `/admin` | chat com a imobiliária e painel super admin |

## Páginas do frontend

Públicas: `/`, `/login`, `/register`, `/esqueci-senha`, `/redefinir-senha`, `/termos`, `/privacidade`, `/f/:slug`, `/vitrine/:slug`.

Autenticadas: `/dashboard`, `/leads`, `/leads/novo`, `/ranking`, `/metas`, `/brokers`, `/perfil`, `/checkout`, `/mensagens`, `/catalogo` (`/novo`, `/:id/editar`), `/tour-360`, `/projetos-3d`, `/meta-ads`, `/financeiro`, `/alugueis` (`/imoveis`, `/pagamentos`, `/ranking`, `/imoveis/:id/historico`), `/admin`, `/admin/mensagens/:companyId`.

## Deploy

### Backend
1. Configure as variáveis: `DATABASE_URL`, `DB_SSL`, `JWT_SECRET`, `CORS_ORIGIN`, `APP_URL`, `API_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM`, `MERCADO_PAGO_ACCESS_TOKEN` e `META_TOKEN_KEY`.
2. Rode `npm run db:init` uma vez no banco de produção.
3. Inicie com `npm start`.
4. No Mercado Pago, aponte o webhook para `API_URL/payments/webhook`.

### Frontend
1. Configure `VITE_API_URL` (URL pública da API) e `VITE_MP_PUBLIC_KEY`.
2. Rode `npm run build` e publique a pasta `dist` (configure fallback SPA para `index.html`).

## Segurança

- `.env`, `node_modules`, `dist` e logs estão no `.gitignore`; nunca comite chaves ou tokens.
- A `SUPABASE_SERVICE_ROLE_KEY` e o `JWT_SECRET` devem existir apenas no backend.
- Não versione a pasta `domus-backend/backups/` (contém dados reais de clientes).
- Senhas são armazenadas com `bcrypt`; tokens de redefinição são armazenados com hash e expiram em 1 hora.

## Licença

ISC