# Workspace

## Overview

pnpm workspace monorepo using TypeScript. FreshMart — a full-stack responsive grocery delivery website inspired by Blinkit and BigBasket, with user authentication, order tracking, and a comprehensive admin panel.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Auth**: Cookie-based session tokens (user: phone+OTP, admin: username+password+bcrypt)
- **Font**: DM Sans (Google Fonts)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   ├── grocery-store/      # FreshMart React frontend (served at /)
│   └── mobile/             # MKS Store Expo React Native mobile app
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## FreshMart Grocery App

### Design System
- Primary green: `#0c831f` (Blinkit style)
- Accent yellow: `#f3c614`
- Page background: `#f2f3f5`
- Discount badge: blue `#536de6`
- Currency: ₹ (Indian Rupees) throughout
- Free delivery threshold: ₹299, delivery fee: ₹25, handling charge: ₹2
- Font: DM Sans

### Features
- 16 product categories, 215+ real grocery products with BigBasket CDN product images (`bbassets.com`)
- Fast image loading: BigBasket medium-size `/m/` images, `object-contain` on white bg (Blinkit-style), `decoding="async"`, eager load first 10
- Product variants/options: admin can add size/pack variants (e.g. "250ml, 500ml, 1L"), shown as "X options" on product card
- Extensive catalog: 40 vegetables, 33 fruits with realistic Indian market prices
- BigBasket Product Fetcher: admin can fetch all categories or single category products
- Auto image fetcher: admin product form auto-fetches BigBasket image after typing 3+ chars, with multi-image picker (Browse Images button shows up to 8 options)
- AI-powered description generator: "AI Generate" button in product form uses OpenAI gpt-5-nano (with template fallback)
- Auto-section adjuster: fetched products auto-map to homepage sections
- Auto round prices: all prices rounded to nearest rupee (Math.ceil)
- Phone-based user authentication (OTP simulation with SMS simulation log)
- Cart management, enhanced checkout with delivery slots, coupon codes, delivery instructions
- Checkout fields: landmark, city (dynamic from store_city setting), pincode
- City delivery restriction: configurable `store_city` setting blocks orders from other cities (when delivery_range=city_only)
- Delivery range toggle: admin can switch between "City Only" and "All India" delivery in settings
- Blinkit-style header: "Delivery in 10 minutes" + dynamic city display from `store_city` setting
- UPI demo payment flow with QR code + Card payment simulation + Cash on Delivery
- Address auto-save: delivery address saved automatically on order placement (with landmark, city, pincode)
- Order tracking with status timeline
- User profiles with saved addresses, wallet, rewards, notifications, help sections
- Wishlist functionality (localStorage-based, accessible from product detail hearts + account page)
- Admin panel (hidden from users, accessible only via /admin/login)
- Admin Bulk Discount Manager: apply/remove by category, all products, or specific product selection
- Admin Section Editor: per-section product picker for featured products
- Admin Integrations: WhatsApp Business QR code generator + order update toggle
- SMS Simulation: all OTP and order notifications logged in-memory (viewable at /api/admin/notifications)
- Auto-image utility for products and categories (60+ mapped Unsplash images)
- Clear all products functionality
- Responsive design (mobile-first) with framer-motion animations
- Dynamic homepage sections auto-generated from fetched categories

### Store Pages
- `/` — Homepage with banners, categories, deals, product sections
- `/login` — Phone-based login/signup with OTP verification
- `/products` — All products with filters/search/sort
- `/categories` — Animated gradient category tiles
- `/category/:slug` — Category product listing
- `/product/:id` — Product detail page
- `/cart` — Cart + enhanced checkout (delivery slots, payment options, coupon, instructions)
- `/account` — Profile, orders, addresses, wishlist, wallet, rewards, notifications, help (tabs)
- `/order/:id` — Order tracking with status timeline

### User Authentication
- Phone number based login with 4-digit OTP (simulated, displayed on screen)
- Cookie-based session (`user_token`, httpOnly, 30-day expiry)
- New users prompted to enter name after first login
- Saved addresses tied to user account
- Orders linked to user ID
- Login required to place orders

### Admin Panel (hidden from store UI)
- `/admin/login` — Admin login (accessible only by typing URL directly)
- `/admin` — Dashboard with clickable stat cards linking to relevant pages
- `/admin/products` — Full CRUD for products + Bulk Discount Manager + Image Upload
  - Discount Manager: apply/remove discounts in bulk (by category or all products)
  - Quick-select percentage buttons (5%, 10%, 15%, 20%, 25%, 30%, 40%, 50%)
  - API: `POST /api/admin/bulk-discount` with `{action, discountPercent, categoryId, applyTo}`
  - Image Upload: admin can upload product images directly (stored in Replit Object Storage via GCS)
  - API: `POST /api/admin/products/upload-image` (multipart, admin-only, 5MB limit, JPEG/PNG/WebP/GIF)
  - Serving: `GET /api/uploads/product-images/:file` (public, restricted to product-images prefix only)
- `/admin/categories` — CRUD for categories + visibility toggle (hide/show from store)
- `/admin/orders` — Order management with status updates (clickable from dashboard)
- `/admin/coupons` — Coupon code CRUD (create, edit, toggle, delete) with percentage/flat discount types, min order, max uses, expiry
- `/admin/settings` — Full homepage customization:
  - Store config (name, header tagline, city, state, delivery time, fees, footer text)
  - Homepage Display toggles: Category Grid, Quick Links Bar, Footer (show/hide)
  - Homepage banners: add/remove/edit title, subtitle, tag, CTA, image, gradient, link
  - Value props: add/remove/edit title, subtitle, icon, colors
  - Homepage sections: add, remove, reorder, toggle visibility, attach specific product IDs
  - Each section: title, subtitle, emoji, type (deals/category/featured/custom), category slug, colors, gradients
  - Custom section type: shows only manually pinned products (no automatic category/deals/featured fetch)
  - Sub-buttons: customizable filter tags per section (add/edit/remove with label and color)
  - Automation: auto-section adjuster, auto-round prices toggles
  - Integrations: Real WhatsApp Business integration using `@whiskeysockets/baileys`:
    - `whatsapp-service.ts`: manages WhatsApp Web client lifecycle (connect/disconnect/send)
    - Real QR code generation: admin clicks "Connect WhatsApp Device" → generates real WhatsApp QR → admin scans with phone → server becomes linked device
    - Frontend polls `/admin/whatsapp/status` every 2s for live QR/connection state updates
    - When connected: OTPs sent as real WhatsApp messages; fallback to SMS simulation if send fails
    - Session persisted to `/tmp/whatsapp-auth`

### Admin Authentication
- Cookie-based session with `admin_token` httpOnly cookie
- bcryptjs password hashing (10 rounds)
- In-memory session store with 24-hour expiration
- Default credentials: username=`admin`, password=`admin123`

### Mobile Navigation
- Bottom nav: Home, Categories, Cart (with badge), Account
- Floating "View cart" green pill above bottom nav
- Product detail sticky bar above bottom nav

### API Endpoints (Public)
- `GET /api/categories`, `GET /api/products` (supports `?ids=1,2,3`), `GET /api/products/:id`, `GET /api/products/summary`
- `GET /api/deals`, `GET /api/settings/public`
- `GET /api/cart`, `POST /api/cart`, `PUT /api/cart/:productId`, `DELETE /api/cart/:productId`, `DELETE /api/cart`
- `POST /api/orders` (links to user if logged in, accepts optional `couponCode`)
- `POST /api/coupons/validate` with `{code, orderTotal}` — validates coupon and returns discount amount

### API Endpoints (User Auth)
- `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`
- `POST /api/auth/update-profile`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET /api/auth/addresses`, `POST /api/auth/addresses`, `PUT /api/auth/addresses/:id`, `DELETE /api/auth/addresses/:id`
- `GET /api/auth/orders`

### API Endpoints (Admin)
- Auth: `POST /api/admin/setup`, `GET /api/admin/check-setup`, `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/me`
- Dashboard: `GET /api/admin/dashboard`
- Products: `GET /api/admin/products`, `POST /api/admin/products`, `PUT /api/admin/products/:id`, `DELETE /api/admin/products/:id`
- Categories: `GET /api/admin/categories`, `POST /api/admin/categories`, `PUT /api/admin/categories/:id`, `DELETE /api/admin/categories/:id`
- Orders: `GET /api/admin/orders`, `PUT /api/admin/orders/:id/status`
- Coupons: `GET /api/admin/coupons`, `POST /api/admin/coupons`, `PUT /api/admin/coupons/:id`, `DELETE /api/admin/coupons/:id`
- Settings: `GET /api/admin/settings`, `PUT /api/admin/settings`
- Category visibility: `PUT /api/admin/categories/:id/visibility` with `{visible: boolean}`
- Fetcher: `GET /api/admin/fetcher/categories`, `POST /api/admin/fetcher/fetch`, `GET /api/admin/fetcher/search-image?name=...`, `GET /api/admin/fetcher/search-images?q=...` (multi-image)
- AI: `POST /api/admin/generate-description` with `{name, category?, unit?, quantity?}`
- Notifications: `GET /api/admin/notifications` (SMS simulation log)
- Bulk Discount: `POST /api/admin/bulk-discount` with `{action, discountPercent, categoryId, applyTo, productIds}`
- WhatsApp: `GET /api/admin/whatsapp/status`, `POST /api/admin/whatsapp/connect`, `POST /api/admin/whatsapp/disconnect`, `POST /api/admin/whatsapp/send`
- Utilities: `POST /api/admin/clear-products`, `POST /api/admin/round-prices`

### DB Schema
- `categories` — id, name, slug, icon, color, product_count
- `products` — id, name, description, price, original_price, discount, unit, quantity, category_id, category_name, image_url, in_stock, rating, review_count, is_featured, is_organic, tags, delivery_time, updated_at
- `cart_items` — id, product_id, quantity, added_at
- `orders` — id, user_id, items (jsonb), total, status, name, phone, address, payment_method, estimated_delivery, delivery_instructions, coupon_code, coupon_discount, created_at
- `coupons` — id, code (unique), type (percentage/flat), value, min_order, max_uses, used_count, active, expires_at, created_at
- `users` — id, phone, name, created_at
- `addresses` — id, user_id, label, full_address, landmark, city, pincode, is_default, created_at
- `admin_users` — id, username, password_hash, display_name, role, created_at
- `site_settings` — id, key, value (jsonb), updated_at

## Mobile App (Expo)

### `artifacts/mobile` (`@workspace/mobile`)
MKS Store native mobile app built with Expo + React Native. Connects to the same API server.

- **Navigation**: Tab-based (Home, Categories, Cart, Account) with NativeTabs/liquid glass support on iOS 26+
- **API**: Uses `@workspace/api-client-react` generated hooks with `setBaseUrl(EXPO_PUBLIC_DOMAIN)`
- **Cart**: CartContext wraps `useGetCart`, `useAddToCart`, `useUpdateCartItem`, `useRemoveFromCart`, `useClearCart`
- **Screens**: Home (banners + categories + deals + featured), Categories grid, Product detail, Category listing, Search, Deals, Cart with bill details, Account
- **Fonts**: Inter (400/500/600/700)
- **Colors**: Primary green `#0c831f`, accent yellow `#f3c614`, consistent with web app
- **IMPORTANT**: Never create `app.config.ts` — use `app.json` only

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/grocery-store` (`@workspace/grocery-store`)
React + Vite frontend for FreshMart. Served at `/` (root). Includes admin panel pages under `/admin/*`.

### `artifacts/api-server` (`@workspace/api-server`)
Express 5 API server. Routes in `src/routes/`. Auth routes in `src/routes/auth.ts`. Admin routes in `src/routes/admin.ts`.

### `lib/db` (`@workspace/db`)
Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)
OpenAPI 3.1 spec + Orval config. Run codegen: `pnpm --filter @workspace/api-spec run codegen`
