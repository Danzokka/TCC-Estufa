---
applyTo: "apps/web/**/*.{ts,tsx,js,jsx}"
tools: ["fetch", "get-library-docs "]
---

# Frontend Development Guidelines - Next.js + React

## Links
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/blog/tailwindcss-v4)
- [Shadcn UI Documentation](https://ui.shadcn.com/docs)
- [Magic UI Documentation](https://magicui.design/docs)
- [React Query Documentation](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [Next Auth Documentation](https://next-auth.js.org/getting-started/introduction)

## Tech Stack

- Next.js 15+ com App Router (NUNCA use pages router)
- React 19+ com Server Components
- TypeScript com interfaces (não types)
- Tailwind CSS + Shadcn UI + Magic UI
- React Query (TanStack Query) para data fetching no client side
- Next Auth para autenticação

## Estrutura e Padrões

- Siga a estrutura de diretórios do Next.js App Router assim como esta no link
- Use nomes de diretórios em lowercase com hífens (ex: `components/auth-wizard`)
- Prefira named exports para componentes
- Server Actions ficara na pasta `src/server/actions`
- Use `src` como raiz do código fonte
- Todos componentes usados apenas pela pagina em si ficara na pasta dele em uma pasta `_components` (ex: `src/app/projects/_components/ProjectCard.tsx`)
- Todas as funcoes de lib usados apenas por ele, ficara na pasta dele em uma pasta `_lib` (ex: `src/app/projects/_lib/format.ts`)
- Use `src/server/actions` para server actions que buscam dados
- Use `src/server/actions` para server actions que executam ações (ex: criar, atualizar, deletar)
- Use `src/server/actions` para server actions que executam ações de autenticação (ex: login, logout)
- Use `src/server/functions` para funções utilitárias do servidor que não são server actions
- Use `src/server/middleware` para middlewares do Next.js
- Todas as rotas deverão ter um `layout.tsx` para definir o layout da página, podendo ser root ou apenas implementando do layout geral.
- Rotas protegidas serão protegidas inicialmente no layout da rota.

### Componentes

- Use functional components com TypeScript interfaces
- Prefira React Server Components quando possível
- Use 'use client' apenas quando necessário (interações, hooks, browser APIs)
- Implemente componentes responsivos mobile-first
- Use React.memo para evitar re-renders desnecessários

### Data Fetching

- Qualquer requisição de dados deve ser feita com server actions
- Use server actions para buscar dados, NÃO use API routes
- Implemente axios para a minha api interna do NestJS
- Use fetch cacheando caso não seja uma api do NestJS
- Implemente React Query para cache e sincronização no client side
- Use Suspense boundaries com fallbacks apropriados
- Prefira uncontrolled components com react-hook-form

### Styling

- Use Tailwind CSS com abordagem mobile-first
- Implemente design system com Shadcn UI
- Use cn() utility para concatenar classes condicionalmente

### Performance

- Minimize bundle size com dynamic imports
- Use Next.js Image component para otimização
- Implemente loading states e skeleton screens
- Use `useMemo`, `useCallback` para otimizações

### Formulários

- Use react-hook-form com uncontrolled components
- Implemente validação com Zod schemas
- Use defaultValues para evitar re-renders
- Integre com TypeScript para type safety
