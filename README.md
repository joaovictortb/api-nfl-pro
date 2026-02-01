# API Node (Express) + Supabase

Projeto Node dentro da pasta `api/`: servidor Express que expõe os endpoints de automação e histórico e usa o Supabase como banco.

## Estrutura

- **package.json** – dependências e scripts do projeto Node
- **tsconfig.json** – configuração TypeScript da API
- **supabase.ts** – cliente Supabase (variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`)
- **app.ts** – aplicação Express com rotas `/api/health`, `/api/automation-config`, `/api/posts-history`, `/api/automation-logs`
- **server.ts** – inicia o servidor (porta 3001 por padrão)
- **health.ts**, **automation-config.ts**, etc. – funções serverless para deploy no Vercel (um arquivo por endpoint)

## Rodar localmente

1. Entre na pasta da API e instale as dependências:

   ```bash
   cd api
   npm install
   ```

2. Crie um arquivo `.env` dentro de `api/` (ou use variáveis de ambiente) com:

   ```
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
   ```

3. Suba o servidor:

   ```bash
   npm run dev
   ```

   A API ficará em **http://localhost:3001**.

4. Teste:

   - http://localhost:3001/
   - http://localhost:3001/api/health

Para o frontend usar essa API local, defina no `.env` da raiz do projeto:

```
VITE_API_BASE=http://localhost:3001/api
```

## Deploy (Vercel)

No Vercel, a pasta `api/` é tratada como **Serverless Functions**: cada arquivo `health.ts`, `automation-config.ts`, etc. vira um endpoint (`/api/health`, `/api/automation-config`, …). Não é preciso rodar o Express em produção; o Vercel usa esses handlers. As variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` devem estar configuradas no projeto Vercel.

## Resumo

- **Local**: projeto Node com Express em `api/` → `cd api && npm run dev`
- **Vercel**: os arquivos `api/*.ts` (health, automation-config, posts-history, automation-logs) são as funções serverless; o Express em `app.ts` + `server.ts` serve só para desenvolvimento local.
