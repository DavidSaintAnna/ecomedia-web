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
  components/  peças reutilizáveis (Layout, ServerStatus...)
  lib/         funções auxiliares (datas em pt-BR)
  pages/       uma pasta/arquivo por tela
  test/        configuração dos testes
```

## Tecnologias

React 19, TypeScript, Vite, React Router, TanStack Query, Vitest e Testing Library. CSS simples, sem biblioteca de estilos.

## Datas

A API devolve datas em UTC. O site as mostra sempre no horário de Brasília (`America/Sao_Paulo`), em `src/lib/dates.ts`.
