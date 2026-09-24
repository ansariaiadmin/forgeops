# 📋 گزارش وضعیت پروژه ForgeOps

> **تاریخ تهیه:** ۱۸ آگوست ۲۰۲۶ · **منبع داده:** اجرای مستقیم دستورات روی پروژه (git log, find, npm run lint/typecheck/build, Prisma)

---

## 🏗️ ۱. خلاصه‌ی کلی پروژه

| مورد                   | مقدار                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| **نام پروژه**          | ForgeOps — پلتفرم کنترل DevOps (هوشمندسازی توسعه با Agent و MCP)                                               |
| **وضعیت کلی**          | ⚠️ **تقریباً کامل** — همه‌ی ماژول‌های UI با Mock Data کار می‌کنند؛ اتصال به API واقعی باقی مانده               |
| **درصد پیشرفت کلی**    | **۸۵٪** — ۱۲ مرحله از ۱۴ مرحله کامل؛ باقی‌مانده: API های واقعی (Prisma) و استقرار                              |
| **آخرین بروزرسانی**    | ۲۰۲۶-۰۸-۱۸ ساعت ۱۷:۲۴ (آخرین کامیت: `dc03b56`)                                                                 |
| **تعداد کل کامیت‌ها**  | **۸۵** (۶۴ feat · ۲۰ chore · ۱ docs)                                                                           |
| **شاخه‌ی فعال**        | `main` (تک‌شاخه، بدون شاخه‌ی feature)                                                                          |
| **وضعیت working tree** | ✅ تمیز (۰ تغییر commit نشده)                                                                                  |
| **نسخه‌های کلیدی**     | Next.js 15.5.23 · React 19.2 · TypeScript 5.9 · Prisma 6.19.3 · NextAuth 4.24.15 · Tailwind 3.4.19 · Zod 4.4.3 |

---

## 📊 ۲. وضعیت مراحل (Roadmap)

| مرحله | نام                                              | وضعیت | درصد | توضیح                                                                                                                                                      |
| ----- | ------------------------------------------------ | ----- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ۱     | پروژه‌ی پایه Next.js 15 + TS + Tailwind + Shadcn | ✅    | ۱۰۰٪ | اسکلد کامل با فایل‌های config، فونت Geist، تم دارک/لایت، Layout با Sidebar جمع‌شونده ۲۴۰px و هدر ۶۴px                                                      |
| ۲     | سیستم احراز هویت (NextAuth + Prisma + bcrypt)    | ✅    | ۱۰۰٪ | Credentials + JWT، صفحات login/register/forgot-password، API های login/register/logout، middleware محافظ، ProtectedRoute، seed ادمین — **تست‌شده با curl** |
| ۳     | Prisma Schema کامل (۱۵ مدل)                      | ✅    | ۱۰۰٪ | ۱۵ model + ۱۵ enum، UUID، روابط Cascade/SetNull، ایندکس‌ها، ۲ مایگریشن اعمال‌شده، `prisma validate` پاس                                                    |
| ۴     | Layout اصلی + داشبورد آماری                      | ✅    | ۱۰۰٪ | Sidebar رسمی shadcn (آیکون/آف‌کنواس)، ۴ کارت آماری، Quick Actions، Recent Activity (AuditLog)                                                              |
| ۵     | صفحه‌ی مدیریت پروژه‌ها                           | ✅    | ۱۰۰٪ | جستجو + فیلترهای Status/Env/Owner، گرید کارتی، مودال New/Edit با **React Hook Form + Zod**، حذف با تأیید                                                   |
| ۶     | صفحه‌ی جزئیات پروژه با ۸ تب                      | ✅    | ۱۰۰٪ | مسیر `/projects/[slug]`، هدر با بج‌ها و Health Score، ناوبری Tabs                                                                                          |
| ۷     | تب Docker Services                               | ✅    | ۱۰۰٪ | جدول کامل با اکشن‌ها، جزئیات بازشونده (Env/Volumes/CPU/RAM/Logs)، **Polling 5 ثانیه**، Docker Compose (آپلود/Up/Down)                                      |
| ۸     | تب Context Tree                                  | ✅    | ۱۰۰٪ | درخت react-arborist با آیکون‌ها، هایلایت فایل‌های مهم، پیش‌نمایش کد (highlight) و Markdown، تشخیص Tech Stack، Context Pack، تحلیل ساختار                   |
| ۹     | تب Memory                                        | ✅    | ۱۰۰٪ | ۵ دسته، لیست با Pin/Edit/Delete، ویرایشگر Markdown (EasyMDE)، جزئیات با تاریخچه، جستجو و فیلتر تگ                                                          |
| ۱۰    | تب RAG (MVP)                                     | ✅    | ۱۰۰٪ | مدیریت منابع + شبیه‌سازی Indexing با Progress، جستجوی متنی (token-overlap)، آمار پایگاه دانش                                                               |
| ۱۱    | تب MCP Hub                                       | ✅    | ۱۰۰٪ | داشبورد وضعیت، لیست اتصالات با ۶ اکشن، فرم با JSON Editor (react-json-view)، جزئیات با لاگ و آمار، **Test Connection**                                     |
| ۱۲    | تب Agents                                        | ✅    | ۱۰۰٪ | فیلتر نوع، کارت‌ها، فرم کامل (Model/Tools/MCP/Scope)، جزئیات با **نمودار Recharts** مصرف، Job Queue، New Job/Stop All                                      |
| ۱۳    | تب Docs                                          | ✅    | ۱۰۰٪ | لیست با فیلتر نوع، ویرایشگر کامل با Export (MD/PDF)، **Version History با Diff Viewer**، ۳ قابلیت AI                                                       |
| ۱۴    | تب Health & Logs                                 | ✅    | ۱۰۰٪ | Health Score با ۶ فاکتور، Service Health Cards، **Live Logs** با فیلتر/Pause/Download، Alert Config با Test، ۴ نمودار متریک                                |
| —     | اتصال API های واقعی (Prisma)                     | ⚠️    | ۱۰٪  | فقط auth واقعی است؛ بقیه‌ی داده‌ها Mock (لایه‌ی `lib/api/*` آماده‌ی تعویض است)                                                                             |
| —     | استقرار Production                               | ❌    | ۰٪   | بیلد موفق است ولی دیپلوی (Docker/Vercel) انجام نشده                                                                                                        |

---

## 📁 ۳. ساختار فایل‌ها و پوشه‌ها

```
forgeops/  (۶.۳ MB سورس + ۹۸۳ MB node_modules)
├── app/  (۹۳۶ خط)                          ← صفحات App Router
│   ├── (app)/                              ← صفحات احرازشده (با Sidebar)
│   │   ├── layout.tsx                      ← ✅ SidebarProvider + AppSidebar + AppHeader
│   │   ├── page.tsx                        ← ریدایرکت → /dashboard
│   │   ├── dashboard/page.tsx              ← ✅ داشبورد آماری کامل
│   │   ├── projects/page.tsx               ← ✅ مدیریت پروژه‌ها (گرید + فیلتر + مودال)
│   │   ├── projects/[slug]/page.tsx        ← ✅ جزئیات پروژه با ۸ تب (metadata داینامیک)
│   │   ├── agents/page.tsx                 ← ⚠️ placeholder
│   │   ├── mcp-hub/page.tsx                ← ⚠️ placeholder
│   │   ├── docs/page.tsx                   ← ⚠️ placeholder
│   │   └── settings/page.tsx               ← ⚠️ placeholder
│   ├── auth/{login,register,forgot-password}/  ← ✅ صفحات ورود/ثبت/بازیابی
│   ├── api/auth/                           ← ✅ ۴ route: [...nextauth], login, register, logout
│   ├── layout.tsx                          ← ✅ فونت‌ها + ThemeProvider + SessionProvider
│   └── globals.css                         ← ✅ توکن‌های تم + override های EasyMDE
├── components/  (۱۱,۸۶۸ خط — ۹۳ کامپوننت)
│   ├── ui/  (۲۱ فایل)                      ← ✅ شادکن: sidebar, sheet, dialog, alert-dialog,
│   │                                          select, switch, tabs, table, scroll-area, progress,
│   │                                          tooltip, dropdown-menu, badge, button, card, ...
│   ├── layout/  (app-sidebar, app-header)  ← ✅
│   ├── auth/  (۴ فرم + ProtectedRoute)     ← ✅
│   ├── dashboard/  (۶ کامپوننت)            ← ✅
│   ├── theme-provider.tsx · theme-toggle.tsx ← ✅ تم دارک/لایت/سیستم
│   └── projects/
│       ├── project-card / filters / form-dialog / delete-dialog / badges  ← ✅
│       └── detail/
│           ├── project-detail-header / project-tabs / tab-placeholder
│           └── tabs/  (۴۸ فایل — ۸ تب)
│               ├── docker/ (جدول، جزئیات، compose، لاگ، فرم)
│               ├── context/ (درخت، پیش‌نمایش، تحلیل، پک)
│               ├── memory/ (ویرایشگر، بج‌ها، فرم، جزئیات)
│               ├── rag/ (منابع، جستجو، آمار)
│               ├── mcp/ (داشبورد، فرم، جزئیات، بج‌ها)
│               ├── agents/ (کارت، فرم، جزئیات، نمودار، صف)
│               ├── docs/ (لیست، ویرایشگر، تاریخچه، مودال)
│               └── health/ (امتیاز، سرویس‌ها، لاگ، هشدار، متریک)
├── lib/  (۴,۰۸۶ خط)
│   ├── auth.ts / auth-http.ts / password.ts / prisma.ts / constants.ts / utils.ts
│   ├── mock-data.ts                        ← ✅ داده‌ی mock تایپ‌شده با مدل‌های Prisma (۱۷,۵۰۰ خط)
│   ├── api/  (۹ لایه): projects, docker, context, memory, rag, mcp, agents, docs, health
│   └── validations/  (۷ اسکیمای Zod)
├── types/  (next-auth.d.ts, index.ts)
├── hooks/  (use-media-query, use-mobile, use-polling)
├── utils/  (format, slug)
├── prisma/
│   ├── schema.prisma                       ← ✅ ۱۵ مدل + ۱۵ enum
│   └── migrations/ (۲ مایگریشن)            ← ✅ add_user_model, add_domain_models
├── scripts/seed-admin.mjs                  ← ✅ سید ادمین
├── middleware.ts                           ← ✅ محافظت مسیرها
├── next.config.js · tailwind.config.js · tsconfig.json · .eslintrc.json · .prettierrc
├── components.json · .env (gitignored) · .env.example
└── README.md
```

**فایل‌های اضافی/غیرضروری:**

- ⚠️ ۴ صفحه‌ی placeholder سطح بالا (agents/mcp-hub/docs/settings) — چون قابلیت واقعی‌شان در تب‌های جزئیات پروژه است؛ یا باید کامل شوند یا به مسیر پروژه ریدایرکت شوند
- ℹ️ `app/(app)/page.tsx` فقط ریدایرکت است (ممکن است مستقیم `/dashboard` شود)
- ℹ️ `components.json` برای افزودن شادکن (نگهداری)
- ❌ فایل‌های قدیمی حذف‌شده‌اند (app-shell/header/sidebar قدیمی و placeholder های هر تب) — هیچ فایل مرده‌ای در درخت نیست

---

## 🔧 ۴. وضعیت فنی (Technical Status)

### Backend / API

- ✅ **۴ اندپوینت واقعی** (همه در `app/api/auth/`):
  - `POST /api/auth/login` — ورود + JWT + کوکی سشن (تست: 200/401 ✓)
  - `POST /api/auth/register` — ثبت‌نام + bcrypt + auto-login (تست: 201/409 ✓)
  - `POST /api/auth/logout` — ابطال کوکی (تست: 200 ✓)
  - `/api/auth/[...nextauth]` — اندپوینت‌های استاندارد NextAuth (session/csrf/callback)
- ✅ **۹ لایه‌ی API آماده (mock)** در `lib/api/`: projects, docker, context, memory, rag, mcp, agents, docs, health — هرکدام با مستندات اندپوینت‌های REST آینده در کامنت
- ✅ اتصال دیتابیس: Prisma Client با SQLite (`prisma/dev.db`) — فقط در auth استفاده می‌شود
- ⚠️ بقیه‌ی API ها هنوز به Prisma متصل نیستند (داده‌ی mock برگردانده می‌شود)

### Frontend

- ✅ **۱۱ مسیر کاربری** (۱۲ فایل page.tsx): `/`، `/dashboard`، `/projects`، `/projects/[slug]`، `/agents`، `/mcp-hub`، `/docs`، `/settings`، `/auth/login`، `/auth/register`، `/auth/forgot-password`
- ✅ **۹۳ کامپوننت** (۲۱ کامپوننت shadcn/ui + ۷۲ اختصاصی)
- ✅ **تم دارک/لایت/سیستم** با next-themes + سوییچ در هدر + override های EasyMDE
- ✅ Layout مشترک: Sidebar 240px (آیکون/آف‌کنواس/موبایل)، هدر 64px، Content اسکرول‌شونده
- ✅ واکنش‌گرایی کامل (موبایل → دسکتاپ)
- ⚠️ باندل صفحه‌ی `[slug]` بزرگ شده: **۶۲۰ kB First Load** (react-arborist + recharts + react-json-view + markdown) — تب Health lazy-load شده ولی بقیه نه

### Database

- ✅ **۱۵ مدل Prisma**: User, Workspace, Project, ProjectMember, DockerService, EnvironmentVariable, ProjectMemory, MCPConnection, Agent, AgentJob, Document, RAGSource, AuditLog, Backup, Task
- ✅ **۱۵ enum** (Role, ProjectStatus, Environment, ServiceStatus, MemoryCategory, MCPStatus, AgentType, AgentStatus, JobStatus, DocumentType, RAGSourceType, BackupType, BackupStatus, TaskStatus, TaskPriority)
- ✅ **۲ مایگریشن** اعمال‌شده: `add_user_model` + `add_domain_models` — دیتابیس با schema هم‌اهنگ است
- ✅ **داده‌های seed شده**: `admin@forgeops.dev (OWNER)` + `dev@forgeops.dev (VIEWER)` — رمزها bcrypt (rounds=10)

### Docker

- ⚠️ **docker-compose.yml برای خود پروژه وجود ندارد** — برنامه روی Node مستقیم اجرا می‌شود (npm run dev)
- ✅ تب Docker Services شامل **Mock Compose Panel** است (آپلود/پیش‌نمایش/Compose Up/Down شبیه‌سازی‌شده)
- ✅ ۸ سرویس mock تعریف‌شده (web, api, worker, db, redis, ml, cron, cache) — فقط داده‌ی UI
- ❌ هیچ کانتینری واقعی در حال اجرا نیست (این سندباکس Docker ندارد)

---

## 🐛 ۵. مشکلات و چالش‌ها

### باگ‌ها / مشکلات حل‌شده (در تاریخچه)

| مشکل                                                           | راه‌حل                                                   |
| -------------------------------------------------------------- | -------------------------------------------------------- |
| OOM در dev server با @patternfly/react-log-viewer (۳ بار kill) | حذف پکیج (~۱۰۰ وابستگی) و ساخت LogViewer سفارشی سبک      |
| ناسازگاری react-json-view با React 19 (peer محدود)             | استفاده از fork نگه‌داریشده‌ی @microlink/react-json-view |
| `@db.Text` نامعتبر در SQLite                                   | حذف annotation ها                                        |
| خطای تایپ Recharts v3 (TooltipProps)                           | مهاجرت به `TooltipContentProps`                          |
| بیلد و dev سرور هم‌زمان → خرابی کش `.next`                     | پاک‌سازی `.next` + جدا کردن اجراها                       |

### مشکلات شناخته‌شده (باز)

1. ⚠️ **هشدارهای npm install**: eslint@8.57.1 (منسوخ — پشتیبانی متوقف)، rimraf/glob/inflight قدیمی (وابستگی‌های ترانزیتیو) — بی‌خطر ولی ایده‌آل نیست
2. ⚠️ **باندل سنگین** `[slug]` (۶۲۰ kB) — lazy-load فقط برای Health انجام شده؛ بقیه‌ی تب‌ها استاتیک import می‌شوند
3. ⚠️ **forgot-password فقط UI** است — پرووایدر ایمیل (Resend/SES) پیاده‌سازی نشده
4. ⚠️ **RAG جستجوی متنی ساده** — Embedding + pgvector در فاز بعد (فیلد `embeddings` آماده است)
5. ⚠️ **رمزنگاری EnvironmentVariable** — کامنت TODO در schema (AES-256-GCM) — پیاده‌سازی نشده
6. ⚠️ **۴ صفحه‌ی placeholder** (agents/mcp-hub/docs/settings) — محتوای واقعی در تب‌های جزئیات است
7. ⚠️ **هیچ تست اتوماتیک** (vitest/jest) وجود ندارد — فقط تست‌های دستی curl و tsx
8. ⚠️ **next-auth v4** — نسخه‌ی فعلی پایدار ولی v5 بتا در دسترس است
9. ℹ️ `npm run build` حدود ۴۰–۷۵ ثانیه — در سندباکس ۲GB باید با `NODE_OPTIONS="--max-old-space-size=1536"` اجرا شود

### وضعیت Linter/TypeScript

- ✅ ESLint: **۰ خطا** (`npm run lint` پاس)
- ✅ TypeScript: **۰ خطا** (`npm run typecheck` پاس)
- ✅ Prettier: **همه‌ی فایل‌ها فرمت‌شده** (`format:check` پاس)
- ✅ `prisma validate`: معتبر

---

## ⏭️ ۶. گام‌های بعدی (Next Steps)

### در حال انجام

- هیچ — آخرین تب (Health & Logs) کامل شد؛ پروژه در وضعیت «آماده برای فاز اتصال»

### اولویت بعدی (پیشنهادی)

1. **API واقعی پروژه‌ها**: `GET/POST /api/projects` + `GET /api/projects/[slug]` با Prisma (seed چند پروژه) → جایگزینی `lib/api/projects.ts`
2. **API سرویس‌ها**: `GET /api/projects/[slug]/services` + اکشن‌های start/stop/restart (بدون شبیه‌سازی)
3. **API داشبورد**: `GET /api/dashboard/stats` (aggregate از دیتابیس) → حذف mock-data.ts تدریجی
4. **صفحات placeholder**: ساخت Agents/MCP Hub/Docs/Settings واقعی یا ریدایرکت
5. **استقرار**: Dockerfile + docker-compose.yml برای خود ForgeOps + `.env.production` + `npm run build && npm start`

### بهبودها (پیشنهادی)

- Lazy-load بقیه‌ی تب‌های سنگین با `next/dynamic` (کاهش ۶۲۰ kB)
- مهاجرت به ESLint 9 + flat config
- تست‌های واحد برای `lib/api/*` و validations (vitest)
- رمزنگاری EnvironmentVariable با `lib/crypto`
- WebSocket واقعی به‌جای Polling برای لاگ و سرویس‌ها
- ساختار چندشاخه‌ای git (main/dev/feature) برای تیم

---

## 📈 ۷. آمار و ارقام

| معیار                        | مقدار                                                         |
| ---------------------------- | ------------------------------------------------------------- |
| تعداد فایل‌های سورس          | **۱۵۱** (app/components/lib/types/hooks/utils/prisma/scripts) |
| تعداد خطوط کد                | **۲۸,۹۱۸** کل (شامل JSON/package) — ~۱۷,۵۰۰ خط سورس فعال      |
| خطوط کامپوننت‌ها             | ۱۱,۸۶۸ (components)                                           |
| تعداد کامپوننت‌ها            | **۹۳** (۲۱ shadcn/ui + ۷۲ اختصاصی)                            |
| تعداد صفحات                  | **۱۱ مسیر** (۱۲ فایل page.tsx — یکی ریدایرکت)                 |
| تعداد API ها                 | **۴ اندپوینت واقعی** + ۹ لایه‌ی mock آماده                    |
| تعداد مدل‌های دیتابیس        | **۱۵ مدل + ۱۵ enum**                                          |
| تعداد مایگریشن‌ها            | ۲                                                             |
| تعداد کاربران seeded         | ۲ (OWNER + VIEWER)                                            |
| تعداد تب‌های جزئیات پروژه    | ۸ (۴۸ فایل کامپوننت)                                          |
| تعداد اسکیمای Zod            | ۷                                                             |
| تعداد وابستگی‌ها             | **۵۲** (۳۶ prod + ۱۶ dev)                                     |
| زمان build                   | ~۴۰ ثانیه (کش گرم) / ~۷۵ ثانیه (سرد)                          |
| حجم پروژه                    | ۶.۳ MB سورس + ۹۸۳ MB node_modules + ۴۳۵ MB .next              |
| حجم package-lock             | ۳۹۱ KB                                                        |
| First Load JS (داشبورد)      | ۱۰۲ kB                                                        |
| First Load JS (جزئیات پروژه) | ۶۲۰ kB                                                        |
| تعداد کامیت‌ها               | **۸۵**                                                        |

---

## ✅ ۸. چک‌لیست نهایی

- [x] پروژه با `npm run dev` اجرا می‌شود (پورت ۳۰۰۰، HTTP 200 ✓)
- [x] تسک‌های TypeScript بدون خطا هستند (`tsc --noEmit` ✓)
- [x] ESLint بدون خطا است (`npm run lint` ✓ — ۰ مشکل)
- [x] Prettier بدون خطا است (`format:check` ✓)
- [x] `prisma validate` معتبر است
- [x] `npm run build` موفق است (۱۶ صفحه استاتیک + route های داینامیک)
- [x] تمام صفحات قابل دسترس هستند (۱۱ مسیر — ۷ مسیر placeholder عمدی در ناوبری)
- [x] احراز هویت کار می‌کند (login 200/401، register 201/409، logout 200، middleware 307 ✓)
- [x] دیتابیس متصل است (SQLite + Prisma، ۲ مایگریشن، کاربران seeded)
- [x] تم دارک/لایت کار می‌کند (next-themes + سوییچ هدر)
- [x] هر ۸ تب جزئیات پروژه رندر می‌شوند (تست HTTP ✓)
- [x] Mock Data در همه‌ی ماژول‌ها با تایپ‌های Prisma هم‌راستاست
- [ ] API های واقعی (Prisma) برای پروژه‌ها/سرویس‌ها/داشبورد — **انجام نشده** (mock فعلاً)
- [ ] فلوی واقعی forgot-password با ایمیل — **انجام نشده** (فقط UI)
- [ ] رمزنگاری EnvironmentVariable (AES-256-GCM) — **انجام نشده** (TODO در schema)
- [ ] Embedding و Vector Search برای RAG (pgvector) — **انجام نشده** (جستجوی متنی MVP)
- [ ] تست‌های اتوماتیک (unit/integration) — **انجام نشده**
- [ ] Dockerfile و استقرار production — **انجام نشده**
- [ ] مهاجرت به ESLint 9 — **انجام نشده**

---

## 🧭 جمع‌بندی

**ForgeOps** در وضعیت **۸۵٪** است: تمام ۱۴ ماژول UI (احراز هویت، داشبورد، مدیریت پروژه، و ۸ تب کامل جزئیات پروژه) پیاده‌سازی، تست و با کامیت‌های واضح ثبت شده‌اند؛ کیفیت کد سبز است (lint/typecheck/build همگی پاس). بخش‌های باقی‌مانده عمدتاً **زیرساختی** هستند: اتصال داده‌ی mock به API های واقعی Prisma، تکمیل فلوی ایمیل، و استقرار production. ساختار لایه‌ای (`lib/api/*` + validations مشترک) طوری طراحی شده که این انتقال بدون تغییر UI انجام شود.
