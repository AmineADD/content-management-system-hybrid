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

## Search Console index status

Each editor (blog article, Happy Wall template, happy date, happy spot, and
their category/tag pages) shows whether its public page is indexed by Google.
The check runs only when the connection environment is **PROD**, since staging
rows have no page on the public domain.

It needs a Google service account with read access to the Search Console
properties:

1. Create a service account in Google Cloud and download its JSON key.
2. Enable the **Google Search Console API** on that project.
3. In Search Console, add the service account's `client_email` as a user on the
   **domain property** (`sc-domain:happy-milo.com`, `forever-milo.com`,
   `support-milo.com`) — Full or Restricted both work.
4. Set the whole JSON key as one env var:

```bash
GOOGLE_SERVICE_ACCOUNT_JSON='{"client_email":"…","private_key":"-----BEGIN PRIVATE KEY-----\n…"}'
```

Without the variable the chip reads "Index status unavailable" and the rest of
the CMS is unaffected. The URL Inspection API allows 2000 checks/day per
property.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
