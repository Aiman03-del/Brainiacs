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
# Brainiacs

## Application Routes

The authenticated product lives under `/dashboard`, which preserves the existing route boundary and lets the dashboard layout own one shared navigation shell. Boards are Brainiacs' collaboration units: each board has its existing Kanban view at `/dashboard/boards/[id]` and channel conversation at `/dashboard/messenger/[boardId]`. The Tasks entry is an index into those Kanban views, not a second task implementation.

- Public: `/`, `/about`, `/pricing`, `/faq`
- Authentication: `/login`, `/signup`, and `/auth/callback`
- Workspace: `/dashboard`, `/dashboard/boards`, `/dashboard/messenger`
- Work and tools: `/dashboard/tasks`, `/dashboard/activity`, `/dashboard/ai`, `/dashboard/search`
- Account: `/dashboard/profile`, `/dashboard/settings`
- Existing secondary feature: `/dashboard/leaderboard`

Direct messages and workspace-wide search are not backed by existing data or behavior. The navigation therefore routes to board conversations and a clearly marked search foundation instead of advertising nonfunctional features. The dashboard proxy performs early auth redirects; authenticated layouts and data pages retain server-side checks.
