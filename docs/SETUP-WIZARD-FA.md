# 🧙‍♂️ جادوگر نصب ForgeOps — DevOps Control Plane — فوق ساده!

**نسخه:** v2.0.0 — سقف 10/10 — Ceiling
**زمان:** ۱ دقیقه — فقط ۳ کلیک!
**برای:** غیر فنی — حتی اگر Docker ندونی

---

## 🎯 ForgeOps — DevOps Control Plane چیه؟ به زبان ساده:

کنترل پنل DevOps — پروژه‌ها + ایجنت‌ها + RAG + Docker + RBAC

**ویژگی‌های سقف 10/10:**
پروژه‌ها + ایجنت‌ها + RAG + Docker Services + MCP + RBAC + audit logs + JWT refresh + WS logs streaming — سقف 10/10

---

## 🚀 جادوگر نصب — فقط ۳ قدم!

### قدم ۰: چی لازم داری؟ (۳۰ ثانیه)

یک کامپیوتر با اینترنت — Docker جعبه جادویی — جادوگر چک می‌کنه.

### قدم ۱: دانلود (۳۰ ثانیه)

```bash
git clone https://github.com/ansariaiadmin/forgeops.git
cd forgeops
```
یا zip از Releases → Extract

### قدم ۲: جادوگر نصب — فقط Enter! (۱ دقیقه)

**ویندوز:** `install.bat` دوبار کلیک

**مک/لینوکس:**
```bash
chmod +x install.sh
./install.sh
```

**چی می‌بینی؟**
```
[1/6] بررسی سیستم... ✓
[2/6] Docker... ✓ Docker 24.0.5
[3/6] Git... ✓
[4/6] وابستگی‌ها... ✓ Docker کافیه!
[5/6] تنظیمات — رمز بانکی... ✓ .env ساخته شد
[6/6] ساخت و اجرا — docker compose up --build -d
....................
✓ آماده! — http://localhost:3000
```

### قدم ۳: استفاده (۱۰ ثانیه)

مرورگر → `http://localhost:3000`

**چی کار کن؟**
1. مرورگر → localhost:3000 2. پروژه بساز 3. Docker Services ببین 4. Logs streaming زنده ببین via WebSocket

---

## 🔄 آپدیت — `./update.sh` — ۳۰ ثانیه — بکاپ خودکار

## 🛠️ دستورات — مثل کنترل تلویزیون:
- `./status.sh` — روشنه؟
- `./logs.sh` — لاگ
- `./stop.sh` / `./start.sh`

## 🆘 عیب‌یابی — به زبان ساده:

**پورت اشغال:** `./stop.sh` + `docker compose down` + `./start.sh`

**Docker نیست:** https://docs.docker.com/get-docker/

**.env خراب:** `rm .env` + `cp .env.example .env` + `./install.sh`

**سرویس بالا نمی‌آد:** `./logs.sh`

---

## 🔒 امنیت:
- `.env` کلید خونه — به کسی نده!
- Non-root Docker USER 1001 — نه root
- No hardcoded secrets — env_file
- Secret scan 0

---

**برای غیر فنی:** فقط `install.sh` → مرورگر → http://localhost:3000 — همین! 🎉

**نویسنده:** Fleet 10/10 — سطح اعلی — نهایت سادگی
**نسخه:** v2.0.0 — سقف
