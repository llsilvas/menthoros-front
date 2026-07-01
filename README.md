# Menthoros Frontend

Frontend web do **Menthoros**: a interface do sistema de decisão para treinadores de
corrida/endurance.

O foco da aplicação é ajudar o coach a:

- ver quem precisa de atenção primeiro;
- entender o motivo do alerta;
- revisar e aprovar sugestões da IA;
- acompanhar atleta, plano e contexto sem sair do fluxo de trabalho.

## Stack principal

- React 19
- TypeScript ~5.8
- Vite 7
- MUI 7 + Emotion
- react-router-dom 7
- Axios com client gerado a partir do OpenAPI
- Recharts
- date-fns
- Vitest + Testing Library
- Playwright

> Não usamos Tailwind nem Redux/Zustand/React Query.

## Como rodar

Pré-requisitos:

- Node.js compatível com o projeto
- dependências instaladas com `npm install`

Comandos úteis:

```bash
npm run dev
npm run build
npm run lint
npm run test:run
npm run test:e2e
```

## Convenções de produto

- A interface é **coach-first**.
- A IA propõe; o treinador decide.
- A tela precisa explicar o que está acontecendo, não apenas mostrar métricas.
- Copy e UX seguem PT-BR.
- O produto prioriza ação, contexto e revisão, não automação cega.

## Estrutura relevante

- `src/features/` — novas telas por domínio/role
- `src/pages/` — shell legada ainda em transição
- `src/api/` — client OpenAPI gerado
- `src/landing/` — landing page e copy de marketing

## Onde olhar primeiro

- `CLAUDE.md` deste repositório: regras e padrões do módulo
- `menthoros-product/openspec/SPRINTS.md`: roadmap canônico
- `menthoros-product/prd/`: discovery e PRDs versionados
