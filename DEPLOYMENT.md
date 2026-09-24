# 🚀 راهنمای استقرار ForgeOps (Production)

## پیش‌نیازها

- **Docker 24+** و Docker Compose v2 (برای مسیر Docker)
- یا Node.js 20+ (برای مسیر مستقیم)
- متغیرهای محیطی (see `.env.example`):
  - `NEXTAUTH_SECRET` — حداقل ۳۲ بایت تصادفی (`openssl rand -base64 32`)
  - `ENCRYPTION_KEY` — ۳۲ بایت hex (`node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`)
  - `NEXTAUTH_URL` — آدرس عمومی اپ
  - (اختیاری) `OPENAI_API_KEY` — برای LLM و Embedding واقعی

---

## مسیر ۱ — Docker Compose (توصیه‌شده)

```bash
# 1. آماده‌سازی
cp .env.example .env
# NEXTAUTH_SECRET، ENCRYPTION_KEY و (در صورت نیاز) POSTGRES_PASSWORD را پر کنید

# 2. ساخت و اجرا
docker compose up -d --build

# 3. اجرای مایگریشن + seed (یک‌بار)
docker compose exec app sh -c "cd /app && npx prisma migrate deploy && node scripts/seed.mjs"

# 4. بررسی سلامت
curl http://localhost:3000/api/health/live   # → {"status":"ok","db":"up"}
```

- اپ روی `http://localhost:3000` · دیتابیس پیش‌فرض SQLite در volume `forgeops-data`
- برای Postgres: `DATABASE_URL="postgresql://forgeops:...@db:5432/forgeops"` را در `.env` ست کنید و از `prisma/schema.postgres.prisma` استفاده کنید (دستورات زیر)

### مهاجرت به Postgres

```bash
cp prisma/schema.postgres.prisma prisma/schema.prisma
docker compose exec app npx prisma migrate deploy
```

> ⚠️ UUID ها: `@default(uuid())` روی Postgres نیازمند اکستنشن `uuid-ossp` است — موتور مهاجرت Prisma آن را خودکار نصب می‌کند.

---

## مسیر ۲ — استقرار مستقیم (بدون Docker)

```bash
npm ci
npx prisma generate
npx prisma migrate deploy        # برای SQLite: npx prisma migrate dev
npm run build
npm run start                    # پورت 3000
```

---

## CI/CD (GitHub Actions)

`.github/workflows/ci.yml` — روی هر push/PR به `main`:
1. `npm ci` + `prisma generate`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test` (۲۸ تست واحد)
5. `npm run build`

برای دیپلوی خودکار (مثلاً Vercel)، بلاک `deploy` در انتهای workflow را فعال کنید و سکرت‌های `VERCEL_TOKEN`، `VERCEL_ORG_ID`، `VERCEL_PROJECT_ID` را اضافه کنید.

---

## Healthcheck & مانیتورینگ

| اندپوینت | کاربرد |
|----------|--------|
| `GET /api/health/live` | بدون احراز — بررسی سرور + دیتابیس (استفاده در HEALTHCHECK داکر) |

لاگ‌ها: `docker compose logs -f app`

---

## امنیت در Production

- ✅ رمزها bcrypt (rounds=10) · ✅ JWT با `NEXTAUTH_SECRET` · ✅ رمزنگاری AES-256-GCM مقادیر env با `ENCRYPTION_KEY`
- ✅ Rate limiting روی auth (login 10/5min، register 5/10min)
- ✅ RBAC (VIEWER/DEVELOPER/ADMIN/OWNER) روی همه‌ی route ها
- ✅ Audit log خودکار با IP/user-agent
- ✅ کاربر non-root در image داکر + HEALTHCHECK
- ⚠️ همیشه پشت **HTTPS** (ترجیحاً reverse proxy: nginx/Caddy/Traefik) قرار دهید
- ⚠️ `NEXTAUTH_SECRET` و `ENCRYPTION_KEY` را در Secret Manager نگه دارید، نه در git

---

## Troubleshooting

| مشکل | راه‌حل |
|------|--------|
| `ENCRYPTION_KEY is not set` | در `.env` ست کنید (hex ۳۲ بایت) |
| خطای `prisma migrate deploy` روی Postgres | `uuid-ossp` را دستی نصب کنید: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` |
| `next start` کند است | برای مقیاس بالا از `node .next/standalone/server.js` با PM2/Cluster استفاده کنید |
| تغییر کلید رمزنگاری | مقادیر قبلی قابل رمزگشایی نیستند — قبل از چرخش، مقدارها را بازنویسی کنید |
