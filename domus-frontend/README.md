# Domus CRM Frontend

Aplicacao React/Vite do Domus CRM, um SaaS para imobiliarias gerenciarem leads, funil comercial e indicadores.

## Como rodar localmente

```bash
npm install
npm run dev
```

Crie um arquivo `.env` com:

```env
VITE_API_URL=http://localhost:3000
```

## Build de producao

```bash
npm run build
```

No deploy, configure `VITE_API_URL` apontando para a URL publica do backend.
