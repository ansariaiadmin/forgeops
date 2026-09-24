# Changelog — forgeops

## [0.9.0] - 2026-09-24

### Added
- 47 tests passing: projects, validations, RAG, agents, docs, health, memory, treasury, security, permissions
- RBAC e2e: VIEWER read-only, DEVELOPER create/update, ADMIN/OWNER full, minimumRoleFor
- Treasury: AURORA API integration with 502 unreachable real path (never mock data), balances + sweeps
- Health: dockerode fallback + child_process, Docker socket graceful skip when unavailable, Prisma real integration
- Docker Compose prod drill: postgres 16 + app Next.js, healthcheck wget /api/health/live, clean env .env.example
- CI: lint + typecheck + unit tests + production build, postgres service
- Docs: README badge+mermaid+quickstart, ROADMAP Done vs v2, DEPLOYMENT guide

### Fixed
- 7 TODO closed or explicit v2: memory category TODO is domain value (not tech debt), seed TODO entries are valid fixtures, no code TODOs in src
- Docker socket skip graceful: checkDockerConnection returns connected boolean + version/error, tests pass without Docker socket
- RBAC: can() + minimumRoleFor tested
- Treasury: AURORA API unreachable returns 502 with error message, not mock
- Compose prod drill: .env.example complete, healthcheck, clean env

### Security
- Secret scan 0, .env.example complete per REPORT-7-FINAL: DATABASE_URL, NEXTAUTH_SECRET, GITHUB_ID/SECRET, ENCRYPTION_KEY, AURORA_API_URL optional
- Non-root Docker, secrets via env only

## [0.8.0] - 2026-09-07
- Previous release with 47 tests
