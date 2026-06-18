# Domus CRM

SaaS para imobiliarias acompanharem leads, funil comercial, score de prioridade e conversao.

## Modulos

- `domus-frontend`: aplicacao React/Vite.
- `domus-backend`: API Express com PostgreSQL, JWT e integracao opcional com Mercado Pago.

## Funcionalidades prontas

- Landing page comercial com chamada para teste gratis.
- Cadastro de imobiliaria e usuario administrador.
- Login com JWT.
- Dashboard com total de leads, conversao e distribuicao por etapa.
- Cadastro e listagem de leads.
- Filtros por status e periodo.
- Score e temperatura automaticos por lead.
- Separacao multiempresa por `company_id`.
- Checkout Mercado Pago em `/payments/checkout` quando configurado.

## Backend local

```bash
cd domus-backend
npm install
copy .env.example .env
npm run db:init
npm run dev
```

Edite `.env` com sua `DATABASE_URL` e um `JWT_SECRET` seguro antes de iniciar.

## Frontend local

```bash
cd domus-frontend
npm install
copy .env.example .env
npm run dev
```

## Deploy

Backend:

- Configure `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `APP_URL` e `API_URL`.
- Rode `npm run db:init` uma vez no banco de producao.
- Com Mercado Pago, configure `MERCADO_PAGO_ACCESS_TOKEN`.

Frontend:

- Configure `VITE_API_URL` com a URL publica da API.
- Rode `npm run build` e publique a pasta `dist`.
