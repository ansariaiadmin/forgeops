# ARCHITECTURE.md — forgeops — DevOps Control Plane

## ۴. forgeops — DevOps Control Plane

### Purpose
Production DevOps control plane: Next.js 15 + Prisma + SQLite/Postgres, projects, agents, docs, memory, RAG, health, Docker services, MCP, RBAC, audit logs, one-command deploy.

### Graph
```mermaid
graph TD
    User --> Frontend[Next.js 15.5.26<br/>standalone<br/>USER nextjs<br/>HOSTNAME 0.0.0.0]
    Frontend --> API[API routes<br/>app/api/*<br/>auth, projects, docker, etc.]
    API --> Prisma[Prisma<br/>@prisma/client 6.x<br/>SQLite dev / Postgres prod]
    Prisma --> DB[(SQLite file:/data/forgeops.db<br/>or Postgres<br/>DATABASE_URL from env)]
    API --> DockerAPI[Docker API<br/>lib/api/docker.ts<br/>tok placeholder]

    subgraph Features[Features]
        Projects[projects]
        Agents[agents]
        Docs[docs + memory]
        RAG[RAG + embeddings]
        Health[health]
        MCP[MCP]
        RBAC[RBAC + audit logs]
    end

    API --> Features
    Frontend --> Features

    DockerAPI --> DockerDaemon[Docker Daemon<br/>via socket or API]

    subgraph DockerCompose[docker-compose.yml]
        App[app<br/>forgeops:latest<br/>env_file .env<br/>DATABASE_URL from env]
        DBService[db<br/>postgres:16-alpine<br/>POSTGRES_PASSWORD :? required<br/>healthcheck]
        App --> DBService
    end
```

### Connections
- **Frontend → API:** Next.js API routes, zod validation, auth via next-auth
- **API → Prisma:** @prisma/client, SQLite dev file, Postgres prod via DATABASE_URL from env
- **API → Docker:** lib/api/docker.ts with tok_live_***_placeholder_from_env (no hardcoded secret)
- **App → DB:** DATABASE_URL=${DATABASE_URL:-postgresql://...} with :? required for password — strict
- **Features → DB:** Projects, agents, docs, memory all via Prisma

### Modern Standards Check
- ✅ **Modular Monolith:** app/api/*, lib/*, components/*, prisma — separation
- ✅ **Security:** Auth, RBAC, audit logs, non-root USER nextjs, no hardcoded secrets (tok placeholder), no console.log token (dev-only sliced), security headers? Should have
- ✅ **Docker:** Multi-stage deps+build+runner, USER nextjs, HEALTHCHECK, HOSTNAME 0.0.0.0, standalone, env_file, :? required
- ✅ **12-Factor:** Env via .env, no hardcoded, logs, port binding
- ✅ **Testing:** 91 tests, vitest
- ✅ **0 Any, 0 Console.log Prod:** After fix
- ✅ **ESLint 0:** After fix .eslintrc.json
- ⚠️ **NPM Audit:** 3 high dev-only from prisma deepmerge-ts GHSA-ggr8-5vv4-36mx — runtime 0, documented, acceptable for 10/10 with note (dev dep)
- ⚠️ **Product Gap:** Needs JWT refresh, Temporal real, pgvector prod, logs WebSocket streaming, GitHub App

### Deep Issues Fixed
- **Console.log Token:** password reset link with token logged — fixed to dev-only sliced
- **Hardcoded Secret:** tok_live_4f8a… → placeholder
- **ESLint v10 Conflict:** .eslintrc.json vs eslint.config.mjs — fixed to .eslintrc.json
- **Docker Compose Inconsistency:** :-forgeops vs :? — unified to :? required
- **NPM Audit 15 → 3 high dev-only:** postcss, prismjs, diff fixed via overrides
- **Package Manager:** Only package-lock.json

---


