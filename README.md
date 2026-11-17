# EcoMedia Web

Front-end em React da **EcoMedia**, rede social de ações sustentáveis (ODS 11: cidades e comunidades sustentáveis).
Projeto do Recode. A API fica em [ecomedia-api](https://github.com/DavidSaintAnna/ecomedia-api).

## Como rodar

Precisa de Node 22.12 ou mais novo.

```bash
npm install
npm run dev
```

Abra http://localhost:5173.

Por padrão, no desenvolvimento o site fala com a API em `http://localhost:3333`. Para usar outra API, copie
`.env.example` para `.env` e troque `VITE_API_URL`. A versão publicada usa `https://ecomedia-api.onrender.com`.

A API só aceita pedidos vindos de endereços listados na variável `CORS_ORIGIN` dela (o padrão já inclui
`http://localhost:5173`). O site precisa rodar exatamente nessa porta.

### Quem só quer testar

- **A API:** abra o Swagger em https://ecomedia-api.onrender.com/api-docs/, crie uma conta em `POST /api/auth/register`
  e use o botão Authorize.
- **O site com a sua própria API:** clone o repositório [ecomedia-api](https://github.com/DavidSaintAnna/ecomedia-api),
  crie o `.env` dela (com o seu banco PostgreSQL e um `JWT_SECRET`) e rode `npm run dev` lá. Depois rode o site daqui.
- **O site com a API publicada:** crie um `.env` com `VITE_API_URL=https://ecomedia-api.onrender.com`. Isso exige que a
  `CORS_ORIGIN` da API aceite `http://localhost:5173`.

O site em si não tem segredo nenhum: a senha do banco fica só no `.env` da API.

## Comandos

| Comando             | O que faz                               |
| ------------------- | --------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento             |
| `npm test`          | Testes (Vitest + Testing Library)       |
| `npm run typecheck` | Verifica os tipos do TypeScript         |
| `npm run build`     | Verifica os tipos e gera a pasta `dist` |
| `npm run preview`   | Abre a versão gerada pelo build         |

## Estrutura

```
src/
  api/         cliente HTTP, tipos das respostas e hooks do TanStack Query
  auth/        sessão da pessoa (login, cadastro, sair) e proteção de telas
  components/  peças reutilizáveis (Layout, ServerStatus...)
  lib/         funções auxiliares (datas em pt-BR)
  pages/       uma pasta/arquivo por tela
  test/        configuração dos testes
```

## Tecnologias

React 19, TypeScript, Vite, React Router, TanStack Query, Vitest e Testing Library. CSS simples, sem biblioteca de estilos.

## Datas

A API devolve datas em UTC. O site as mostra sempre no horário de Brasília (`America/Sao_Paulo`), em `src/lib/dates.ts`.

## Login

O token que a API devolve fica no `localStorage` (chave `ecomedia.token`). Ao abrir o site, `GET /api/auth/me`
confirma quem é a pessoa; se o token venceu ou a conta não existe mais, ele é apagado. Telas que exigem login ficam
dentro de `RequireAuth` (`src/auth/RequireAuth.tsx`).
