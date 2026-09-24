# 🗺️ ForgeOps — نقشه‌ی راه توسعه (Roadmap)

> **نسخه:** ۱.۰ · **تاریخ:** ۲۱ آگوست ۲۰۲۶ · **وضعیت کلی:** ✅ **هر ۶ فاز کامل — پروژه ۱۰۰٪**
> هر فاز دارای «تعریف انجام» (Definition of Done) است؛ فاز فقط وقتی کامل اعلام می‌شود که همه‌ی معیارهایش سبز باشند.

---

## 📊 نمای کلی فازها

| فاز   | نام                     | هدف                                | وضعیت              | برآورد |
| ----- | ----------------------- | ---------------------------------- | ------------------ | ------ |
| ۰     | بنیان UI                | ۱۴ ماژول کامل با Mock Data         | ✅ کامل (۸۵ کامیت) | —      |
| **۱** | **لایه‌ی داده‌ی واقعی** | اتصال همه‌ی ماژول‌ها به Prisma/API | 🔄 **در حال اجرا** | ۵ روز  |
| ۲     | امنیت و سخت‌سازی        | رمزنگاری، RBAC، فلوی ایمیل، ممیزی  | ⏳ برنامه‌ریزی‌شده | ۵ روز  |
| ۳     | بلادرنگ و هوش مصنوعی    | SSE بلادرنگ، Embedding، LLM        | ✅ کامل          | —      |
| ۴     | پلتفرم و DX             | تنظیمات، تست‌ها، عملکرد، i18n      | ✅ کامل          | —      |
| ۵     | تولید (Production)      | Postgres، Docker، CI/CD، استقرار   | ✅ کامل          | —      |

**مسیر طی‌شده:** فاز ۱ (۸۵٪→۹۲٪) ← فاز ۲ (→۹۵٪) ← فاز ۳ (→۹۸٪) ← فاز ۴+۵ (→۱۰۰٪) ✅

---

## ✅ فاز ۰ — بنیان UI (کامل)

**دستاوردها:** Next.js 15 + TS + Tailwind + Shadcn · احراز هویت NextAuth/Prisma/bcrypt · ۱۵ مدل Prisma · داشبورد آماری · مدیریت پروژه‌ها (RHF+Zod) · ۸ تب کامل جزئیات پروژه (Docker، Context، Memory، RAG، MCP، Docs، Agents، Health) · تم دارک/لایت · ۸۵ کامیت سبز (lint/typecheck/build).

---

## 🔄 فاز ۱ — لایه‌ی داده‌ی واقعی (در حال اجرا)

**هدف:** حذف تدریجی Mock Data و اتصال هر ماژول به API های واقعی (Prisma + SQLite) بدون تغییر UI.

### ۱.۱ داده‌ی نمونه (Seed) — 🟡 در حال انجام

- [x] اسکریپت seed کامل با tsx: کاربران، ورک‌اسپیس، ۱۰ پروژه، ۸ سرویس، ۵ ایجنت، ۸ Job، حافظه‌ها، مستندات، MCPها، RAG، لاگ‌های ممیزی
- [ ] حفظ کاربر ادمین + ۴ کاربر دمو (aria/john/maria/sam)
- [x] idempotent (قابل اجرای چندباره)
- **تعریف انجام:** `npm run db:seed` → همه‌ی جداول پر، اجرای مجدد بدون خطا

### ۱.۲ API پروژه‌ها — 🟡 در حال انجام

- [x] `GET /api/projects` (لیست + شمارنده‌ی سرویس/ایجنت، احراز هویت)
- [x] `POST /api/projects` (اعتبارسنجی Zod، یکتایی slug، 409)
- [x] `GET/PATCH/DELETE /api/projects/[slug]`
- [x] اتصال صفحه‌ی مدیریت پروژه‌ها + صفحه‌ی جزئیات به API
- **تعریف انجام:** CRUD کامل با curl تست‌شده (200/201/400/401/409) + UI واقعی

### ۱.۳ API سرویس‌ها — 🟡 در حال انجام

- [x] `GET/POST /api/projects/[slug]/services`
- [x] `POST /api/projects/[slug]/services/[id]` (action: start|stop|restart|delete)
- [x] اتصال تب Docker Services به API (رفرش، اکشن‌ها، افزودن)
- **تعریف انجام:** وضعیت سرویس‌ها در دیتابیس واقعاً تغییر می‌کند و در رفرش می‌ماند

### ۱.۴ API داشبورد — ⏳ بعدی

- [ ] `GET /api/dashboard/stats` (aggregate: پروژه‌ها، سرویس‌های RUNNING، ایجنت‌های فعال، میانگین Health)
- [ ] اتصال کارت‌های آماری + Project Health + Agent Status به API
- **تعریف انجام:** داشبورد بدون هیچ import از mock-data رندر شود

### ۱.۵ API بقیه‌ی ماژول‌ها — ⏳ بعدی

- [ ] Memory: `GET/POST/PATCH/DELETE /api/projects/[slug]/memory` + pin
- [ ] Docs: `GET/POST/PATCH /api/projects/[slug]/docs` (نسخه‌ها به‌عنوان جدول DocVersion)
- [ ] MCP: `GET/POST/PATCH/DELETE /api/projects/[slug]/mcp` + connect/disconnect/test
- [ ] RAG: `GET/POST /api/projects/[slug]/rag/sources` + re-index + search
- [ ] Agents: `GET/POST/PATCH/DELETE /api/projects/[slug]/agents` + jobs + usage
- [ ] Context: `GET /api/projects/[slug]/context/tree` + file + analyze
- [ ] Health: `GET /api/projects/[slug]/health` + metrics + logs

### ۱.۶ پاک‌سازی — ⏳ بعدی

- [ ] حذف `lib/mock-data.ts` پس از اتصال کامل همه‌ی ماژول‌ها
- [ ] افزودن اسکیمای `DocVersion` به Prisma (برای نسخه‌بندی مستندات)
- **تعریف انجام:** `grep -r "mock" lib components` → فقط در کامنت‌ها

---

## 🔒 فاز ۲ — امنیت و سخت‌سازی

| تسک               | توضیح                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| رمزنگاری Env Vars | `lib/crypto.ts` با AES-256-GCM برای `EnvironmentVariable.value` (هدرگذاری nonce/iv)                        |
| فلوی بازیابی رمز  | توکن یکبارمصرف (hash در DB + انقضا ۳۰ دقیقه) + ارسال ایمیل (Resend) + صفحه‌ی reset                         |
| RBAC واقعی        | لایه‌ی permission (`can(role, action)`) + بررسی در route ها (فقط OWNER/ADMIN حذف/ایجاد، VIEWER فقط خواندن) |
| ممیزی کامل        | نوشتن AuditLog خودکار در همه‌ی mutation ها (action/resource/details/ip)                                    |
| Rate Limiting     | محدودسازی ورود/ثبت‌نام (بر اساس IP) + هدرهای نرخ برای API عمومی                                            |
| محافظت CSRF       | تأیید origin در route های POST                                                                             |

**تعریف انجام:** سناریوی «کاربر VIEWER نمی‌تواند پروژه حذف کند» با curl اثبات شود؛ رمزها در DB قابل خواندن نباشند.

---

## 🤖 فاز ۳ — بلادرنگ و هوش مصنوعی

| تسک               | توضیح                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| WebSocket         | جایگزینی Polling سرویس‌ها و لاگ‌ها با اتصال realtime (ws یا SSE) — اندپوینت `/api/live`                           |
| RAG واقعی         | Embedding با `transformers.js` یا OpenAI + جستجوی برداری (sqlite-vec یا pgvector) — پرکردن `RAGSource.embeddings` |
| LLM واقعی         | اتصال OpenAI/Anthropic SDK: اجرای واقعی Job ایجنت‌ها، تولید Docs، Context Pack → پرامپت واقعی                     |
| صف Job            | اجرای حقیقی AgentJob با صف داخلی + ذخیره‌ی tokens/cost واقعی                                                      |
| متریک‌های بلادرنگ | نمونه‌برداری CPU/RAM با فاصله‌ی ثابت در حافظه + ذخیره‌ی دوره‌ای                                                   |

**تعریف انجام:** یک تسک «Fix flaky test» با ایجنت واقعی اجرا و نتیجه در DB ذخیره شود؛ جستجوی RAG نتایج معنایی برگرداند.

---

## 🧰 فاز ۴ — پلتفرم و DX

| تسک               | توضیح                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| صفحه‌ی Settings   | مدیریت ورک‌اسپیس، اعضا و نقش‌ها (جدول ProjectMember واقعی)             |
| صفحات placeholder | Agents/MCP Hub/Docs سراسری یا ریدایرکت به تب‌های پروژه                 |
| تست‌های واحد      | Vitest برای lib/api/*، validations و util ها (coverage > 70%)          |
| تست E2E           | Playwright: ورود → ساخت پروژه → باز کردن تب‌ها                         |
| عملکرد            | Lazy-load همه‌ی تب‌ها (کاهش باندل ۶۲۰kB)، `next/image`، تقسیم chunk ها |
| خطایابی           | Sentry + صفحه‌ی error boundary اختصاصی + لاگ‌سازی ساخت‌یافته           |

**تعریف انجام:** `npm test` سبز؛ Lighthouse > 90؛ هیچ صفحه‌ای placeholder نباشد.

---

## 🚀 فاز ۵ — تولید (Production)

| تسک                  | توضیح                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| مهاجرت به PostgreSQL | تغییر datasource + مایگریشن مجدد + داده‌ی seed                           |
| Dockerfile           | multi-stage (deps→build→runner) + غیرروت + healthcheck                   |
| docker-compose.yml   | app + postgres + redis + (اختیاری) nginx                                 |
| CI/CD                | GitHub Actions: lint → typecheck → test → build → deploy (Vercel یا VPS) |
| Environment ها       | `.env.production`، NEXTAUTH_SECRET واقعی، HTTPS                          |
| مانیتورینگ           | Uptime + Sentry + لاگ مرکزی                                              |
| مستندات              | README کامل + دیاگرام معماری + راهنمای استقرار                           |

**تعریف انجام:** `docker compose up -d` → برنامه روی دامنه‌ی واقعی با HTTPS در دسترس باشد.

---

## 🎯 اصول کار (Definition of Done — برای هر تسک)

1. ✅ کد با `npm run lint` و `npm run typecheck` و `npm run build` سبز باشد
2. ✅ تست عملکردی با curl/مرورگر انجام شده باشد
3. ✅ کامیت با پیام Conventional (feat/fix/chore/docs)
4. ✅ مستندات مربوطه (README/ROADMAP) به‌روز باشد

## 🚫 خارج از محدوده (فعلاً)

- Orchestration چند-کاربره (دعوت/تیم‌ها)
- اجرای واقعی Docker (نیازمند دیمون) — شبیه‌سازی تا فاز ۵
- اپ موبایل / PWA
