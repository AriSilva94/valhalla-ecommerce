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
NEXT_PUBLIC_ANALYTICS_MODE=ga
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Só necessário se NEXT_PUBLIC_ANALYTICS_MODE=gtm
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

### Deploy em Docker / Dokploy

As variáveis `NEXT_PUBLIC_*` precisam ser cadastradas nos **dois** lugares do
Dokploy: **Build Arguments** e **Environment**. O `docker-compose.yml` já as
repassa para os dois estágios.

| Variável | Build arg | Runtime env |
| --- | --- | --- |
| `NEXT_PUBLIC_MEDIA_HOST` | sim | sim |
| `NEXT_PUBLIC_SITE_URL` | sim | sim |
| `NEXT_PUBLIC_APP_ENV` | sim | sim |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | sim | sim |
| `NEXT_PUBLIC_ANALYTICS_MODE` | sim | sim |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | sim | sim |
| `NEXT_PUBLIC_GTM_ID` | só no modo `gtm` | só no modo `gtm` |
| `STRAPI_URL` | não | sim |

Por que os dois:

- **Build arg** — `next build` prerenderiza `/robots.txt` e resolve
  `images.remotePatterns` a partir de `next.config.ts`. Esses valores ficam
  congelados na imagem; definir a variável só em runtime não os altera.
- **Runtime env** — `app/lib/analytics-config.ts` e `app/lib/site-url.ts` leem
  `process.env` por acesso dinâmico (`env.NEXT_PUBLIC_*` via parâmetro), o que
  impede a substituição estática do Next. O layout é renderizado sob demanda, então
  a tag de analytics é montada a cada request com o env do contêiner. O estágio
  `runtime` do `Dockerfile` é um `FROM` novo e não herda os `ARG`/`ENV` do estágio de
  build — sem a variável no `environment:`, ela simplesmente não existe no contêiner.

`ARG` não atravessa estágios de um build multi-stage: se um novo estágio precisar
da variável, ela tem que ser redeclarada nele.

Validação local:

```bash
docker compose --env-file .env.dokploy.prod build web
docker compose --env-file .env.dokploy.prod up -d web
curl -s localhost:3000 | grep -o "gtag/js?id=G-[A-Z0-9]*"
curl -s localhost:3000/robots.txt
```

Se o ID não aparecer no HTML, o problema está na configuração do contêiner, não no GA4.

Arquitetura:

- O modo ativo é o GA4 direto (`NEXT_PUBLIC_ANALYTICS_MODE=ga`): `app/components/Analytics.tsx`
  renderiza `<GoogleAnalytics>` do `@next/third-parties/google`, que injeta o `gtag.js` com
  `NEXT_PUBLIC_GA_MEASUREMENT_ID`. Sem container GTM no caminho, sem etapa de publicação.
- O modo `gtm` continua implementado como alternativa. Nele o GA4 precisa ser configurado no
  painel do GTM como Google Tag com o Measurement ID `G-...` e trigger de todas as páginas.
- Um modo por vez. `getAnalyticsConfig` (`app/lib/analytics-config.ts`) retorna uma união
  discriminada, então GTM e GA nunca inicializam juntos — o que duplicaria page_view.
- Analytics não carrega sem `NEXT_PUBLIC_ANALYTICS_ENABLED=true` e sem ID no formato válido
  (`G-XXXXXXXXXX` para `ga`, `GTM-XXXXXXX` para `gtm`). ID inválido cai em `off` sem lançar erro.
- Para testar em desenvolvimento, defina explicitamente `NEXT_PUBLIC_ANALYTICS_ENABLED=true`.

Verificação (modo `ga`):

- DevTools → Network: deve aparecer `googletagmanager.com/gtag/js?id=G-...` **uma vez**, seguido
  de `google-analytics.com/g/collect?v=2`. Nenhum `gtm.js` deve ser carregado.
- Console: `window.dataLayer` populado.
- Google Tag Assistant para confirmar que há só uma instalação ativa.
- GA4 → Relatórios → Tempo real, navegando entre páginas.
- No GA4: Administrador → Fluxos de dados → stream Web → Medição avançada → Visualizações de
  página → "Alterações de página com base em eventos do histórico do navegador". Isso cobre a
  navegação client-side; o page_view do primeiro carregamento independe dessa opção.
- Não há tracking manual de `page_view`. O `gtag.js` já registra navegação via histórico, então
  um componente de rota manual dobraria a contagem.
- Eventos customizados devem usar o helper `trackEvent` em `app/lib/analytics.ts`.

No modo `gtm`, o container precisa ter sido publicado (Submit → Publish). Container salvo e não
publicado = versão live vazia = GA4 sem dados, mesmo com o `gtm.js` carregando normalmente.

Indexação:

- `app/robots.ts` permite indexação apenas em produção.
- Desenvolvimento, preview e staging são bloqueados com `Disallow: /`.
- `NEXT_PUBLIC_SITE_URL` é usado como URL canônica em metadata, `robots.txt` e `sitemap.xml`.
