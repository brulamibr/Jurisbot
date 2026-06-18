@AGENTS.md

# JurisBot — Assistente Jurídico Inteligente

## Stack
- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4 + shadcn/ui (base-nova style)
- Supabase (PostgreSQL + Auth + Storage + pgvector)
- Prisma ORM (schema em `prisma/schema.prisma`, client gerado em `src/generated/prisma`)
- tRPC (type-safe API, routers em `src/server/routers/`)
- Zustand (client state) + React Query (server state via tRPC)
- Socket.io (real-time)

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
  - `(dashboard)/` — main app (protected)
  - `api/trpc/[trpc]/` — tRPC HTTP handler
- `src/components/ui/` — shadcn/ui primitives
- `src/components/` — feature components (layout, conversations, leads, dashboard, shared)
- `src/lib/` — clients and utilities (supabase, prisma, trpc, ai, whatsapp, rag)
- `src/server/` — tRPC routers and context (server-only)
- `src/types/` — shared TypeScript types (re-exports from Prisma)

## Conventions
- Language: TypeScript strict, no `any`
- Styling: Tailwind utility classes, no inline styles, use `cn()` from `@/lib/utils`
- Components: shadcn/ui as base, customize via className props
- Data fetching: tRPC for all API calls, `protectedProcedure` for auth-required, `adminProcedure` for admin-only
- Auth: Supabase Auth, middleware at `src/middleware.ts` protects all routes except `/login` and `/register`
- Multi-tenant: all queries must filter by `officeId` from the authenticated user's context
- DB column naming: snake_case via `@map()`, TypeScript fields are camelCase
- Design: zinc neutrals, indigo primary (#4F46E5), amber warning for hot leads, dark mode via `.dark` class
