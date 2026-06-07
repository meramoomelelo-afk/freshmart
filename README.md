# FreshMart — Full-Stack Grocery Store

A production-ready, full-stack online grocery store built with **React**, **Node.js/Express**, **PostgreSQL**, and **Drizzle ORM**. Ships with a customer storefront, multi-step checkout flow, admin dashboard, WhatsApp order notifications, and Docker support for one-command deployment.

---

## Features

**Customer Storefront**
- Product catalog with categories, search, and filtering
- Add to cart, quantity controls, product detail pages
- Coupon / discount codes
- 4-step checkout: Cart → Address → Delivery Slot → Payment
- Cash on Delivery and UPI payment methods
- Order tracking page
- User accounts with phone/OTP login and saved addresses

**Admin Dashboard** (`/admin`)
- Product management (add, edit, delete, bulk import via AI)
- Category management
- Order management with status updates
- Coupon management
- Store settings (name, city, delivery fee, slots, footer, etc.)
- WhatsApp order notifications (via QR scan)
- SMS notifications (Fast2SMS)
- AI-assisted product image generation (Hugging Face FLUX)

**Infrastructure**
- Dockerized — single `docker build` + `docker run`
- Render.com `render.yaml` for one-click cloud deploy
- Auto schema push on container start (no manual migrations needed)
- Object storage support (Cloudflare R2 or local filesystem)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TailwindCSS v4, Framer Motion, TanStack Query |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Custom phone/OTP sessions |
| Notifications | WhatsApp (Baileys), Fast2SMS |
| Deployment | Docker, Render.com |

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 22+
- pnpm 9+ (`npm i -g pnpm`)
- PostgreSQL 14+ running locally (or a cloud connection string)

### 1. Clone the repo

```bash
git clone https://github.com/meramoomelelo-afk/freshmart.git
cd freshmart
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/freshmart
SESSION_SECRET=your-random-secret-at-least-32-chars
PORT=3000
NODE_ENV=development
```

### 4. Create the database

```sql
-- In psql or any PostgreSQL client:
CREATE DATABASE freshmart;
```

The schema is pushed automatically when you start the server. No manual migrations needed.

### 5. Run in development

Start the API server and frontend dev server in two terminals:

```bash
# Terminal 1 — API server (hot reloads)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (Vite HMR)
pnpm --filter @workspace/grocery-store run dev
```

Open **http://localhost:22204** (or the port shown in the Vite output).

Admin panel: **http://localhost:3000/admin**

---

## Environment Variables

### Required

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Random secret for signing sessions (32+ chars) | `s3cr3t-rand0m-str1ng` |
| `PORT` | Port the server listens on | `3000` |
| `NODE_ENV` | `production` or `development` | `production` |

### Optional — SMS Notifications

| Variable | Description |
|---|---|
| `FAST2SMS_API_KEY` | [Fast2SMS](https://fast2sms.com) API key for OTP/notification SMS |

### Optional — Object Storage (Cloudflare R2)

Used for storing product images. If not set, images are stored locally.

| Variable | Description |
|---|---|
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key ID |
| `R2_SECRET_ACCESS_KEY` | R2 secret access key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Public base URL for the bucket (e.g. `https://pub-xxx.r2.dev`) |

### Optional — AI Features

| Variable | Description |
|---|---|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI-compatible API key for AI product suggestions |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Base URL (if using a proxy or alternative provider) |

### Optional — Misc

| Variable | Description | Default |
|---|---|---|
| `LOG_LEVEL` | Pino log level (`trace`, `debug`, `info`, `warn`, `error`) | `info` |

---

## Database Setup (Detailed)

The project uses **Drizzle ORM** with **PostgreSQL**.

### Tables created automatically on first start

| Table | Purpose |
|---|---|
| `users` | Customer accounts (name, phone, OTP) |
| `admin_users` | Admin panel users |
| `products` | Product catalog |
| `categories` | Product categories |
| `cart_items` | Shopping cart items per user/session |
| `orders` | Customer orders |
| `addresses` | Saved delivery addresses |
| `coupons` | Discount coupons |
| `site_settings` | Store configuration key/value store |

### Manual schema push (if needed)

```bash
cd lib/db
pnpm run push
```

### Reset the database (destructive!)

```bash
cd lib/db
pnpm run push-force
```

---

## Docker Deployment

### Build the image

```bash
docker build -t freshmart .
```

### Run the container

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@your-db-host:5432/freshmart" \
  -e SESSION_SECRET="your-very-long-random-secret" \
  -e NODE_ENV=production \
  --name freshmart \
  freshmart
```

The server starts on **http://localhost:3000**.

The startup script (`start.sh`) automatically pushes the Drizzle schema before starting the server — no manual migration step needed.

### Docker Compose (with local Postgres)

Create `docker-compose.yml`:

```yaml
version: '3.9'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: freshmart
      POSTGRES_USER: freshmart
      POSTGRES_PASSWORD: secret
    volumes:
      - pg_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://freshmart:secret@db:5432/freshmart
      SESSION_SECRET: change-this-to-a-long-random-secret
      NODE_ENV: production
    depends_on:
      - db

volumes:
  pg_data:
```

```bash
docker compose up -d
```

---

## Deploy to Render.com

The repo includes `render.yaml` for one-click deploy.

### Steps

1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) → **New** → **Blueprint**.
3. Select your GitHub repo.
4. Render reads `render.yaml` and sets up the web service automatically.
5. In the Render dashboard, add the **Environment Variables**:
   - `DATABASE_URL` — create a **Render PostgreSQL** database first and paste its Internal URL
   - Any optional variables you need (SMS, R2, etc.)
6. Click **Deploy**.

Render auto-deploys on every push to `main`.

---

## Admin Panel

Navigate to `/admin` on your domain.

**Default credentials** are set in the database by the first admin signup, or via the `admin_users` table.

The admin panel lets you:
- Add/edit/delete products and categories
- Manage orders (view, change status)
- Configure store settings (name, delivery fee, slots, etc.)
- Scan a QR code to connect WhatsApp for order notifications
- Generate product images with Hugging Face AI (requires free API key from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens))

---

## Project Structure

```
freshmart/
├── artifacts/
│   ├── api-server/          # Express REST API
│   │   └── src/
│   │       ├── routes/      # All API routes
│   │       ├── lib/         # Helpers (delivery config, etc.)
│   │       └── index.ts     # Entry point
│   └── grocery-store/       # React/Vite frontend
│       └── src/
│           ├── pages/       # All pages (home, cart, checkout, admin, etc.)
│           ├── components/  # Shared UI components
│           └── lib/         # API client, auth hook, checkout state
├── lib/
│   ├── db/                  # Drizzle ORM schema + db connection
│   ├── api-spec/            # Shared API type definitions
│   ├── api-zod/             # Zod validation schemas
│   └── api-client-react/    # TanStack Query hooks
├── Dockerfile               # Multi-stage production Docker build
├── render.yaml              # Render.com deploy config
├── start.sh                 # Container entrypoint (schema push + server)
└── pnpm-workspace.yaml      # pnpm monorepo config
```

---

## License

MIT
