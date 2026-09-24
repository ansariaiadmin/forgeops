## [v0.9.1] - 2026-09-24 - Non-Technical Auto Install + Auto Update Edition

### Added - نصب خودکار برای افراد غیر فنی
- **install.sh**: نصب خودکار تمیز - چک Docker, ساخت .env با رمز تصادفی openssl, docker compose up --build -d, صبر 30s, سلامت چک, نمایش آدرس و رمز ورود
- **update.sh**: آپدیت خودکار - بکاپ به backups/YYYYMMDD-HHMMSS/, git pull origin main, docker compose pull + up --build -d, health check, rollback hint
- **start.sh, stop.sh, status.sh, logs.sh, backup.sh**: دستورات ساده روزانه
- **install.bat, start.bat, stop.bat, status.bat, logs.bat, update.bat, backup.bat**: نسخه ویندوز برای افراد غیر فنی
- **INSTALL.md**: راهنمای کامل فارسی نصب در 3 قدم (<5 دقیقه)
- **docs/USER_GUIDE_FA.md**: آموزش کامل تمام بخش‌ها - داشبورد, تنظیمات .env, Docker چیست, بکاپ, عیب‌یابی, امنیت, ورژن‌ها
- **docs/USER_GUIDE_EN.md**: Full English guide for non-technical
- **README**: بخش جدید "برای افراد غیر فنی / For Non-Technical Users — نصب در 1 دقیقه!" با one-liner

### Fixed
- Clean presentation: حذف cache artifacts, .env فقط .env.example
- Non-technical UX: پیام‌های فارسی + انگلیسی، رنگی، راهنمای قدم به قدم

### Docs
- README badge+mermaid+quickstart+sample output + non-technical section
- INSTALL.md + docs/USER_GUIDE_FA.md + docs/USER_GUIDE_EN.md

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
