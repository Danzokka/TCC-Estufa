This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Configuração de Ambiente

Antes de executar o projeto, você precisa configurar as seguintes variáveis de ambiente:

1. Crie um arquivo `.env.local` na raiz do projeto `apps/web/`
2. Adicione as seguintes variáveis:

```bash
# Configurações da API
NEXT_PUBLIC_API_URL=http://localhost:5000

# Configurações de Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here

# Configurações do MapTiler (obrigatório para o mapa funcionar)
# Obtenha sua chave gratuita em: https://www.maptiler.com/
NEXT_PUBLIC_MAPTILER_KEY=your_maptiler_key_here
```

### MapTiler Setup

O mapa utiliza o MapTiler Streets v4 com suporte a temas claro e escuro. Para obter uma chave gratuita:

1. Acesse [maptiler.com](https://www.maptiler.com/)
2. Crie uma conta gratuita
3. Copie sua chave de API
4. Adicione-a ao arquivo `.env.local` como `NEXT_PUBLIC_MAPTILER_KEY`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
