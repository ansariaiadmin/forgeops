# ForgeOps

DevOps control plane built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, **shadcn/ui** and **NextAuth.js**.

## Requirements

- Node.js 20+

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# then set NEXTAUTH_SECRET (generate: openssl rand -base64 32)

# 3. Create the SQLite database (Prisma migrate + generate)
npm run db:migrate

# 4. (Optional) Seed an initial OWNER admin
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo accounts (seeded):**

| Role | Email | Password |
| --- | --- | --- |
| OWNER | `admin@forgeops.dev` | `Admin@12345` |
| ADMIN | `aria@forgeops.dev` | `Dev@12345` |
| DEVELOPER | `john@forgeops.dev` | `Dev@12345` |
| VIEWER | `sam@forgeops.dev` | `Dev@12345` |

## Production deployment

```bash
cp .env.example .env            # set NEXTAUTH_SECRET + ENCRYPTION_KEY
docker compose up -d --build
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for Docker, Postgres migration, CI/CD and security notes.

## Scripts

| Script                 | Description                       |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Start the dev server              |
| `npm run build`        | Production build                  |
| `npm run start`        | Serve the production build        |
| `npm run lint`         | ESLint check                      |
| `npm run typecheck`    | TypeScript check (`tsc --noEmit`) |
| `npm run format`       | Format all files with Prettier    |
| `npm run format:check` | Verify formatting                 |
| `npm run db:migrate`   | Run Prisma migrations (dev)       |
| `npm run db:generate`  | Regenerate the Prisma client      |
| `npm run db:studio`    | Open Prisma Studio                |
| `npm run db:seed`      | Seed an admin (OWNER) user        |

## Folder structure

```
forgeops/
├── app/            # Pages (App Router)
│   ├── (app)/      # Authenticated pages (app shell layout)
│   │   └── dashboard/
│   ├── auth/       # login / register / forgot-password
│   └── api/auth/   # NextAuth catch-all + custom login/register/logout
├── components/     # Reusable components
│   ├── auth/       # LoginForm, RegisterForm, ForgotPasswordForm, ProtectedRoute
│   ├── layout/     # App shell, header, sidebar
│   └── ui/         # shadcn/ui primitives
├── lib/            # auth config, prisma client, password hashing, constants
├── types/          # TypeScript definitions (incl. next-auth augmentation)
├── hooks/          # Custom React hooks
├── utils/          # Pure helper functions
├── prisma/         # Schema + migrations (SQLite)
├── scripts/        # seed-admin.mjs
└── middleware.ts   # Route protection
```

## Data model

Full Prisma schema in `prisma/schema.prisma` (SQLite for development, UUID PKs):

| Entity                | Relation / notes                                                                 |
| --------------------- | -------------------------------------------------------------------------------- |
| `User`                | avatar, lastLogin, isActive; owns workspaces/projects                            |
| `Workspace`           | slug unique; owner → User (cascade)                                              |
| `Project`             | slug unique per workspace; status/environment enums; techStack JSON, healthScore |
| `ProjectMember`       | User↔Project M2M with role (composite PK)                                        |
| `DockerService`       | ports/volumes/networks as JSON                                                   |
| `EnvironmentVariable` | value encrypted at rest (TODO `lib/crypto`); unique per project+env+key          |
| `ProjectMemory`       | category enum (ARCHITECTURE, DECISION, BUG, ...)                                 |
| `MCPConnection`       | config/allowedTools/scopes JSON                                                  |
| `Agent`               | nullable project (global agents), tools/mcpIds JSON, token & cost counters       |
| `AgentJob`            | task/result/error, tokens & cost per run                                         |
| `Document`            | Markdown content, path unique per project, versioning, lastEditedBy (SetNull)    |
| `RAGSource`           | chunks JSON; embeddings JSON (pgvector on Postgres)                              |
| `AuditLog`            | append-only (no updatedAt), SetNull refs                                         |
| `Backup`              | append-only, type/status enums                                                   |
| `Task`                | status/priority enums, assignedTo/assignedAgent (SetNull)                        |

Deletion strategy: ownership chains cascade (`Workspace → Project → children`),
soft references use `onDelete: SetNull` so history survives. Hot fields
(`projectId`, `userId`, `status`) are indexed.

## Authentication

NextAuth.js (v4) with the **Credentials provider** and **JWT sessions**, backed by
**Prisma + SQLite**. Passwords are hashed with **bcryptjs** (10 rounds) — see
`lib/password.ts`.

### User model

| Field       | Type        | Notes                                                         |
| ----------- | ----------- | ------------------------------------------------------------- |
| `id`        | `string`    | UUID (generated)                                              |
| `email`     | `string`    | Unique                                                        |
| `password`  | `string`    | bcrypt hash — never returned                                  |
| `name`      | `string`    |                                                               |
| `role`      | `enum Role` | `OWNER` · `ADMIN` · `DEVELOPER` · `VIEWER` (default `VIEWER`) |
| `createdAt` | `datetime`  |                                                               |
| `updatedAt` | `datetime`  |                                                               |

### Pages

| Route                   | Description                                       |
| ----------------------- | ------------------------------------------------- |
| `/auth/login`           | Email + password sign-in                          |
| `/auth/register`        | Create an account (auto-login)                    |
| `/auth/forgot-password` | Password recovery (UI ready; email provider TODO) |

### API routes

| Route                     | Description                                           |
| ------------------------- | ----------------------------------------------------- |
| `POST /api/auth/register` | Create user (bcrypt) → 201 + JWT + session cookie     |
| `POST /api/auth/login`    | Verify credentials → 200 + JWT + session cookie       |
| `POST /api/auth/logout`   | Expire the session cookie                             |
| `/api/auth/[...nextauth]` | NextAuth endpoints (`session`, `csrf`, `callback`, …) |

The JWT returned by login/register is the same token NextAuth stores in the
`next-auth.session-token` cookie (JWE, AES-GCM), so client-side `useSession()`,
middleware `getToken()` and server-side `getSessionUser()` all accept it.

### Route protection (`middleware.ts`)

- Every route **except** `/auth/*` requires a session → redirected to `/auth/login`
- Authenticated users visiting `/auth/*` → redirected to `/dashboard`
- NextAuth's own `/api/auth/*` endpoints are excluded from the matcher

`ProtectedRoute` (`components/auth/protected-route.tsx`) adds a client-side
guard on top of the middleware, and the dashboard also checks the session
server-side (`getSessionUser`).

### Roles

The `role` enum (`OWNER`, `ADMIN`, `DEVELOPER`, `VIEWER`) is embedded in the JWT
and exposed as `session.user.role`. Registration always creates `VIEWER`;
promote users via `npm run db:studio` or the seed script.

## Configuration

- `next.config.js` — Next.js options
- `tailwind.config.js` — Tailwind theme (CSS variables, dark mode via `.dark` class)
- `tsconfig.json` — TypeScript with `@/*` path alias
- `.eslintrc.json` — ESLint (next/core-web-vitals + prettier)
- `.prettierrc` — Prettier formatting rules
- `components.json` — shadcn/ui config
- `.env` — `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (see `.env.example`)

## Theme

The app ships with light / dark / system themes via `next-themes`.
The toggle lives in the header (`components/theme-toggle.tsx`). Theme
variables are defined in `app/globals.css` and mapped in `tailwind.config.js`.

## Adding shadcn/ui components

```bash
npx shadcn@latest add button card
```

Components are installed into `components/ui/` and auto-imported with the `@/components/ui` alias.
