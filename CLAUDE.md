@AGENTS.md

# JurisBot — Assistente Jurídico Inteligente

## Stack
- Next.js 16 (App Router) + React + TypeScript
- Tailwind CSS v4 + shadcn/ui (base-nova style, no `asChild` — uses `render` prop)
- Supabase (PostgreSQL + Auth + Storage + pgvector)
- Prisma v7 ORM (schema em `prisma/schema.prisma`, client gerado em `src/generated/prisma`, requires `@prisma/adapter-pg`)
- tRPC (type-safe API, routers em `src/server/routers/`)
- React Query (server state via tRPC)
- Baileys (@whiskeysockets/baileys) for WhatsApp Web
- OpenAI + Google Gemini + Anthropic Claude (multi-model AI with fallback)

## Commands
- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run db:generate` — generate Prisma client
- `npm run db:push` — push schema to DB (no migration)
- `npm run db:migrate` — create migration and apply
- `npm run db:studio` — open Prisma Studio

## Architecture
- `src/app/` — Next.js App Router pages and layouts
  - `(auth)/` — login, register (public)
  - `(dashboard)/` — main app pages (protected by proxy)
  - `api/trpc/[trpc]/` — tRPC HTTP handler
  - `api/knowledge/upload/` — file upload endpoint
- `src/components/ui/` — shadcn/ui primitives
- `src/components/` — feature components (layout, conversations, dashboard, shared)
- `src/lib/` — clients and utilities
  - `supabase/` — client, server, middleware, actions
  - `prisma/` — Prisma client singleton with PrismaPg adapter
  - `trpc/` — tRPC client + provider
  - `ai/` — multi-model AI engine (providers, router, prompts)
  - `whatsapp/` — Baileys manager + message handler
  - `rag/` — RAG pipeline (extractor, chunker, embeddings, search, pipeline)
- `src/server/` — tRPC routers and context (server-only)
  - Routers: user, office, dashboard, whatsapp, aiConfig, conversation, lead, process, knowledge
- `src/types/` — shared TypeScript types (re-exports from Prisma)

## Key Conventions
- Language: TypeScript strict
- Styling: Tailwind utility classes, use `cn()` from `@/lib/utils`
- Components: shadcn/ui base-nova style — no `asChild`, use `render` prop instead
- Data fetching: tRPC for all API calls, `protectedProcedure` for auth-required
- Auth: Supabase Auth, proxy at `src/proxy.ts` protects all routes except `/login` and `/register`
- Multi-tenant: all queries must filter by `officeId` from the authenticated user's context
- DB columns: snake_case via `@map()`, TypeScript fields are camelCase
- Prisma v7: exports `UserModel` not `User`, requires adapter in constructor
- Next.js 16: `proxy.ts` instead of `middleware.ts`, `serverExternalPackages` for Node-only packages
- Design: zinc neutrals, indigo primary (#4F46E5), amber for hot leads, dark mode toggle in header
