# Convenções deste projeto de teste

## Comandos
- build: `npm run build`
- test: `npm test`
- lint: `npm run lint`

## Stack
- Node.js + Express no backend
- Banco de dados Postgres via Prisma

## Regras específicas
- Handlers de rota ficam em `src/routes/`, um arquivo por recurso
- Erros sempre retornam `{ error: string }` no corpo da resposta
- Nenhuma lógica de negócio dentro dos controllers, só nos services
