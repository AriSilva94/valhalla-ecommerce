This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Analytics e SEO

Configure as variáveis abaixo no ambiente de produção:

```env
NEXT_PUBLIC_SITE_URL=https://seudominio.com
NEXT_PUBLIC_APP_ENV=production

NEXT_PUBLIC_ANALYTICS_ENABLED=false
NEXT_PUBLIC_ANALYTICS_MODE=gtm
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Arquitetura:

- O Google Tag Manager é o modo principal (`NEXT_PUBLIC_ANALYTICS_MODE=gtm`).
- O GA4 deve ser configurado dentro do painel do GTM como uma Google Tag usando o Measurement ID `G-...`.
- A tag GA4 no GTM deve usar um trigger de todas as páginas.
- Não habilite GTM e GA direto ao mesmo tempo. O código só inicializa um modo por vez.
- Analytics não carrega sem `NEXT_PUBLIC_ANALYTICS_ENABLED=true` e sem ID válido.
- Para testar em desenvolvimento, defina explicitamente `NEXT_PUBLIC_ANALYTICS_ENABLED=true` e use um container/ID de teste.

Verificação:

- Use o GTM Preview Mode para confirmar que o container `NEXT_PUBLIC_GTM_ID` foi carregado.
- Use o Google Tag Assistant para validar que há apenas uma instalação ativa.
- Depois de publicar a tag GA4 no GTM, valide eventos nos relatórios Realtime e DebugView do GA4.
- Eventos customizados devem usar o helper `trackEvent` em `app/lib/analytics.ts`.
- Não há tracking manual de `page_view`; GA4/GTM deve medir navegação via histórico do navegador para evitar duplicidade.

Indexação:

- `app/robots.ts` permite indexação apenas em produção.
- Desenvolvimento, preview e staging são bloqueados com `Disallow: /`.
- `NEXT_PUBLIC_SITE_URL` é usado como URL canônica em metadata, `robots.txt` e `sitemap.xml`.
