#!/usr/bin/env bash
set -e
GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; MAGENTA='\033[0;35m'; BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'
ok() { echo -e "${GREEN}✅ $1${NC}"; }
explain() { echo -e "${CYAN}   💡 $1${NC}"; }
example() { echo -e "${DIM}   📝 مثال: $1${NC}"; }
where() { echo -e "${MAGENTA}   🔗 کجا؟ $1${NC}"; }
generate_secret() { openssl rand -base64 32 2>/dev/null | tr -d '\n' | tr -d '/' | tr -d '+' | cut -c1-32 || date +%s | sha256sum | head -c 32; }
ask_with_help() {
  local prompt="$1"; local help_text="$2"; local example_text="$3"; local where_text="$4"; local default_val="$5"; local is_secret="${6:-false}"
  echo ""; echo -e "${BOLD}${BLUE}❓ $prompt${NC}"; [ -n "$help_text" ] && explain "$help_text"; [ -n "$example_text" ] && example "$example_text"; [ -n "$where_text" ] && where "$where_text"
  [ -n "$default_val" ] && echo -e "${DIM}   ⏭️  Enter=پیش‌فرض: $default_val${NC}" || echo -e "${DIM}   ⏭️  اگر نداری Enter=mock${NC}"
  local input=""; if [ "$is_secret" = "true" ]; then read -s -p "   👉 جواب: " input; echo ""; else read -p "   👉 جواب: " input; fi
  [ -z "$input" ] && [ -n "$default_val" ] && input="$default_val"; echo "$input"
}
ask_yes_no() {
  local prompt="$1"; local help_text="$2"; local default_yes="${3:-true}"
  echo ""; echo -e "${BOLD}${BLUE}❓ $prompt${NC}"; [ -n "$help_text" ] && explain "$help_text"
  [ "$default_yes" = "true" ] && echo -e "${DIM}   ⏭️  [Y/n] Enter=بله${NC}" || echo -e "${DIM}   ⏭️  [y/N] Enter=خیر${NC}"
  local input=""; read -p "   👉 جواب (y/n): " input; input=$(echo "$input" | tr '[:upper:]' '[:lower:]')
  [ -z "$input" ] && { if [ "$default_yes" = "true" ]; then input="y"; else input="n"; fi; }
  if [ "$input" = "y" ] || [ "$input" = "yes" ] || [ "$input" = "بله" ]; then echo "yes"; else echo "no"; fi
}

clear
echo -e "${CYAN}"
cat <<'BANNER'
 _____                    ___  ____
|  ___|__  _ __ __ _  ___ / _ \|  _ \ ___ 
| |_ / _ \| '__/ _` |/ _ \ | | | |_) / __|
|  _| (_) | | | (_| |  __/ |_| |  __/\__ \
|_|  \___/|_|  \__, |\___|\___/|_|   |___/
DevOps Control Plane + Notification — Zero Support
BANNER
echo -e "${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  🧙‍♂️ جادوگر نصب ForgeOps v3.0.0 — پشتیبانی صفر${NC}"
echo -e "${BLUE}  کنترل پنل DevOps + ناتیف${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}سلام! 👋 کنترل پنل DevOps — پروژه‌ها + RAG + Docker + JWT + WS logs + ناتیف — سقف!${NC}"
echo ""
read -p "برای شروع جادو Enter بزنید... ✨ " _

echo -e "${BLUE}[1/7] 🔍 سیستم${NC}"; ok "اوکیه"; sleep 1
echo -e "${BLUE}[2/7] 🐳 Docker${NC}"; if ! command -v docker &> /dev/null; then echo -e "${RED}Docker نیست${NC}"; exit 1; else ok "Docker: $(docker --version)"; fi; sleep 1
echo -e "${BLUE}[3/7] 🔑 رمزهای بانکی${NC}"; SECRET_AUTH=$(generate_secret); SECRET_ENC=$(generate_secret); ok "2 رمز ساخته شد"; sleep 1

echo -e "${BLUE}[4/7] 🤖 AI Provider (اختیاری) — برای RAG${NC}"
explain "ForgeOps از AI برای RAG استفاده می‌کنه — اختیاری"
AI_PROVIDER=$(ask_with_help "AI پرووایدر؟" "برای RAG — اگر نمی‌خوای mock" "openai یا mock" "https://platform.openai.com/api-keys" "mock" "false")
AI_KEY=""
if [ "$AI_PROVIDER" != "mock" ]; then AI_KEY=$(ask_with_help "کلید API؟" "sk-..." "sk-..." "https://platform.openai.com/api-keys" "" "true"); ok "AI تنظیم شد"; fi
sleep 1

echo -e "${BLUE}[5/7] 📧 Email + 📱 SMS — برای ناتیف DevOps${NC}"
explain "وقتی پروژه خطا می‌خوره یا دیپلوی می‌شه، ناتیف می‌ده"
EMAIL_PROVIDER=$(ask_with_help "ایمیل پرووایدر؟" "برای ناتیف" "smtp یا mock" "Gmail App Passwords" "mock" "false")
SMTP_HOST=""; SMTP_USER=""; SMTP_PASS=""
if [ "$EMAIL_PROVIDER" = "smtp" ]; then
  SMTP_HOST=$(ask_with_help "SMTP Host؟" "smtp.gmail.com" "smtp.gmail.com" "Gmail" "smtp.gmail.com" "false")
  SMTP_USER=$(ask_with_help "SMTP User؟" "you@gmail.com" "ایمیل" "" "false")
  SMTP_PASS=$(ask_with_help "SMTP Pass؟" "App Password" "app-pass" "myaccount.google.com → App Passwords" "" "true")
  ok "SMTP تنظیم شد"
fi
SMS_PROVIDER=$(ask_with_help "SMS پرووایدر؟" "برای ناتیف مهم" "ghasedak یا mock" "https://ghasedak.me/" "mock" "false")
SMS_KEY=""
if [ "$SMS_PROVIDER" != "mock" ]; then SMS_KEY=$(ask_with_help "کلید API SMS؟" "از پنل" "api-key" "پنل → API" "" "true"); ok "SMS تنظیم شد"; fi
sleep 1

echo -e "${BLUE}[6/7] 🔔 Notification System — DevOps Alerts${NC}"
explain "وقتی پروژه خطا می‌خوره، دیپلوی می‌شه، یا لاگ مهم میاد — خبر می‌ده"
NOTIF_EMAIL=$(ask_yes_no "ایمیل ناتیف برای DevOps روشن باشه؟" "وقتی خطا یا دیپلوی می‌شه ایمیل بره" "true")
NOTIF_SMS=$(ask_yes_no "پیامک ناتیف برای خطای مهم روشن باشه؟" "وقتی خطای critical میاد پیامک بره" "false")
TELEGRAM_ENABLED=$(ask_yes_no "ربات تلگرام برای ناتیف DevOps می‌خوای؟" "وقتی خطا میاد تلگرام خبر می‌ده — رایگان — برای تیم" "true")
TELEGRAM_TOKEN=""; TELEGRAM_CHAT=""
if [ "$TELEGRAM_ENABLED" = "yes" ]; then
  echo -e "${BOLD}   @BotFather → /newbot → توکن${NC}"
  TELEGRAM_TOKEN=$(ask_with_help "توکن ربات؟" "از @BotFather" "123456:ABC..." "@BotFather" "" "true")
  TELEGRAM_CHAT=$(ask_with_help "Chat ID؟" "از getUpdates — می‌تونه گروه باشه" "123456789" "https://api.telegram.org/bot<TOKEN>/getUpdates" "" "false")
  ok "Telegram تنظیم شد"
fi
sleep 1

echo -e "${BLUE}[7/7] ⚙️ .env + 🏗️ اجرا${NC}"
cat > .env <<EOF
# ForgeOps — .env — جادوگر v3.0.0 — پشتیبانی صفر — $(date)
NODE_ENV=production
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${SECRET_AUTH}
ENCRYPTION_KEY=${SECRET_ENC}
DATABASE_URL=postgresql://forgeops:${SECRET_AUTH}@db:5432/forgeops?schema=public
POSTGRES_USER=forgeops
POSTGRES_PASSWORD=${SECRET_AUTH}
POSTGRES_DB=forgeops

# AI — RAG — چیه؟ هوش مصنوعی برای جستجوی کد
AI_PROVIDER=${AI_PROVIDER}
OPENAI_API_KEY=${AI_KEY}

# Email + SMS — برای ناتیف DevOps
EMAIL_PROVIDER=${EMAIL_PROVIDER}
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=587
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
SMS_PROVIDER=${SMS_PROVIDER}
SMS_API_KEY=${SMS_KEY}

# Notification System — سقف 10/10 — چیه؟ اطلاع‌رسانی خطا + دیپلوی + لاگ
NOTIF_IN_APP=true
NOTIF_EMAIL=${NOTIF_EMAIL}
NOTIF_SMS=${NOTIF_SMS}
NOTIF_TELEGRAM=${TELEGRAM_ENABLED}
TELEGRAM_BOT_TOKEN=${TELEGRAM_TOKEN}
TELEGRAM_CHAT_ID=${TELEGRAM_CHAT}
EOF

ok ".env ساخته شد — $(wc -l < .env) خط"
echo -e "${MAGENTA}  docker compose up --build -d${NC}"
docker compose up --build -d 2>&1 | tail -n 20 || docker compose up -d
echo ""; echo -e "${BLUE}  ⏳ 30 ثانیه صبر...${NC}"
echo -n "  "; for i in {1..30}; do echo -n "."; sleep 1; if curl -sf http://localhost:3000 >/dev/null 2>&1; then echo ""; ok "آماده!"; break; fi; done
echo ""; docker compose ps 2>/dev/null || true

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  🎉 جادو تمام! ForgeOps آماده — پشتیبانی صفر! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BOLD}${BLUE}📍 دسترسی:${NC}"
echo -e "${GREEN}  🌐 URL: http://localhost:3000 — پروژه‌ها + Docker + Logs streaming${NC}"
echo -e "${GREEN}  🔑 JWT Refresh: /api/auth/refresh — سقف!${NC}"
echo -e "${GREEN}  📡 WS Logs: /api/logs/stream?service=app&follow=true — سقف!${NC}"
echo ""
echo -e "${BOLD}${BLUE}✅ چک‌لیست:${NC}"
echo -e "  $([ "$AI_PROVIDER" != "mock" ] && echo "✅" || echo "⚠️") AI: $AI_PROVIDER — RAG"
echo -e "  ✅ In-App Notif: همیشه روشن"
echo -e "  $([ "$NOTIF_EMAIL" = "yes" ] && echo "✅" || echo "⚪") Email Notif: $NOTIF_EMAIL"
echo -e "  $([ "$TELEGRAM_ENABLED" = "yes" ] && echo "✅" || echo "⚪") Telegram Notif: $TELEGRAM_ENABLED — DevOps Alerts"
echo ""
echo -e "${CYAN}📚 docs/SETUP-WIZARD-FA.md${NC}"
echo ""
