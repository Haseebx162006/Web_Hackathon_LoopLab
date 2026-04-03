## **HACKATHON WINNER LOOPLAB WEB DEV COMPETITON 2026**

# 🚀 LoopBazar

## 📌 Overview

![alt text](image.png)

LoopBazar is a full-stack, multi-vendor e-commerce platform built for modern marketplace operations. It supports three distinct roles (buyer, seller, admin), real-time communication, secure checkout flows, and AI-assisted decision-making.

The platform combines a Next.js frontend with an Express + MongoDB backend, and introduces practical AI modules for:
- Dynamic product pricing suggestions for sellers
- AI-powered buyer support assistant
- Intelligent search autocomplete powered by product relevance + search history signals

It is production-oriented with health checks, proxy-aware backend configuration, role-based access control, rate limiting, and deployment guides for Render, Railway, and Vercel.

--- URl :https://web-hackathon-loop-lab.vercel.app/

## ✨ Features
### Buyer Experience
- Public product discovery with category filters, sorting, and pagination
- Search autocomplete suggestions with popular query hints
- Product detail pages with ratings/reviews and related items
- Cart and wishlist management
- Checkout with multiple payment modes:
  - Cash on delivery
  - Card/wallet style flows
  - Stripe payment intent flow
  - Boutique account with payment proof upload
- Buyer dashboard for profile, addresses, order history, and return requests
- AI support chat widget for order/refund/shipping assistance

### Seller Workspace
- Seller authentication and protected dashboard
- Product lifecycle management:
  - Create/update/delete products
  - Multi-image uploads
  - Bulk import from Excel
- Inventory management with low-stock indicators
- Coupon creation and management
- Order processing pipeline (confirm, pack, ship) with tracking updates
- Seller analytics (revenue, order trends, top products)
- AI dynamic pricing assistant before product publish/update

### Admin Control Center
- Dedicated admin login and protected admin routes
- User management (status updates: active, suspended, blocked)
- Product moderation (approve, reject, flag)
- Order monitoring and inspection
- Payment and refund log visibility
- Platform analytics dashboard

### Realtime + Platform Reliability
- Buyer-seller realtime chat with Socket.IO
- Message status flows: sent, seen, resolved
- Optional image attachments in chat (Cloudinary or local fallback)
- Secure middleware stack: Helmet, CORS policy, JWT auth, role gates
- API throttling with strict auth endpoint limits
- Graceful shutdown and health-check endpoint for production hosts

### Core API Overview
- Auth: POST /api/auth/signup, POST /api/auth/login, POST /api/auth/seller-login, OAuth callbacks
- Public: GET /api/public/home, GET /api/public/products, GET /api/public/products/:id, GET /api/public/stores
- Buyer: /api/cart, /api/wishlist, /api/checkout, /api/buyer, /api/reviews
- Seller: /api/seller/dashboard, /api/seller/products, /api/seller/orders, /api/seller/coupons, /api/seller/analytics, /api/seller/inventory, /api/seller/profile
- Admin: /api/admin/dashboard, /api/admin/users, /api/admin/products, /api/admin/orders, /api/admin/payments, /api/admin/analytics
- AI/Intelligence: GET /api/search/autocomplete, POST /api/pricing/suggest, POST /api/support/chat
- Realtime chat REST companion: /api/chat/* + Socket.IO events

## 🤖 AI Features
### 1) Dynamic Pricing Suggestion Engine (Seller AI)
Endpoint: POST /api/pricing/suggest

What it does:
- Computes market context from similar approved products in the same category
- Uses order demand signals from revenue-recognized statuses (processing, confirmed, packed, shipped, delivered)
- Factors stock pressure and optional cost/input prices
- Produces recommendedPrice, minPrice, maxPrice, confidence, reason, warning, and priceStatus

How AI is applied:
- Hybrid architecture (deterministic + LLM)
- A robust fallback pricing model is always generated first
- If enabled, Groq LLM refines suggestion using structured payload
- LLM output is strictly parsed, validated, and normalized
- If AI output is invalid/unavailable/timeout, system safely falls back to deterministic pricing

Why it is production-safe:
- Bounded timeout for LLM calls
- Strict numeric validation and normalization
- Explicit response source indicator: ai or fallback
- In-memory market-stats caching with configurable TTL and size

### 2) AI Customer Support Chatbot (Buyer AI Concierge)
Endpoint: POST /api/support/chat

What it does:
- Answers buyer questions around shipping, returns, refunds, and order status
- Injects recent buyer order context into system prompt (status, items, tracking, return/refund state)
- Returns a concise, user-friendly response plus escalation signal

Escalation behavior:
- Model is instructed to append [ESCALATE] for complex/high-risk issues
- Backend strips marker and returns escalate: true
- Frontend surfaces escalation guidance for human support handoff

Resilience behavior:
- If Groq API key is missing or request fails, API returns a graceful fallback support response
- This prevents chatbot hard failures from blocking user support flows

### 3) Intelligent Search Autocomplete
Endpoint: GET /api/search/autocomplete?q=...

How it works:
- Prefix-based matching on product name and category
- Merges results with popular query signals from SearchHistory
- Returns:
  - Product suggestions
  - Category suggestions
  - Popular searches (frequency-ranked)
- Asynchronously updates search-history counters for continuous improvement

Note on recommendations:
- Product recommendation behavior in the current build is primarily rule-based (category/recent/rating-enriched), not a standalone personalized ML recommendation model.

## 🧱 Tech Stack
### Frontend
- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4
- Redux Toolkit + RTK Query
- Socket.IO Client
- Framer Motion, Recharts, React Hot Toast
- Stripe.js + React Stripe.js

### Backend
- Node.js 20
- Express 5
- MongoDB + Mongoose
- JWT authentication + Passport OAuth (Google, Facebook, GitHub)
- Socket.IO
- Zod validation
- Multer + Cloudinary upload pipeline
- Stripe SDK
- Winston logging

### AI + Intelligence Layer
- Groq API (LLM integration)
- Hybrid dynamic pricing service (heuristics + LLM refinement)
- Order-aware support chatbot prompt engineering
- Search-history driven autocomplete relevance

### DevOps / Deployment
- Render (backend blueprint via render.yaml)
- Railway (backend via railway.toml)
- Vercel (frontend)

## 📁 Project Structure
```text
LoopBazar/
├─ backend/
│  └─ app/
│     ├─ app.js
│     ├─ server.js
│     ├─ package.json
│     ├─ .env.example
│     ├─ DEPLOY_RENDER.md
│     ├─ DEPLOY_RAILWAY.md
│     ├─ tests/
│     │  ├─ auth.test.js
│     │  ├─ buyerCheckout.test.js
│     │  └─ seller.test.js
│     └─ src/
│        ├─ config/
│        ├─ controllers/
│        ├─ middleware/
│        ├─ models/
│        ├─ routes/
│        ├─ services/
│        ├─ sockets/
│        └─ utils/
├─ frontend/
│  ├─ app/
│  ├─ components/
│  ├─ public/
│  ├─ store/
│  ├─ styles/
│  ├─ utils/
│  ├─ package.json
│  ├─ .env.example
│  └─ DEPLOY_VERCEL.md
├─ render.yaml
├─ railway.toml
└─ README.md
```

## ⚙️ Setup
### Prerequisites
- Node.js 20.x
- npm 10+
- MongoDB (local or Atlas)
- Optional service keys:
  - Groq (AI features)
  - Cloudinary (image hosting)
  - Stripe (payments)
  - OAuth providers (social login)

### 1) Clone Repository
```bash
git clone <YOUR_REPOSITORY_URL>
cd Web_Hackathon
```

### 2) Setup Backend
```bash
cd backend/app
npm install
```

Create backend environment file:
```bash
cp .env.example .env
# PowerShell: Copy-Item .env.example .env
```

### 3) Setup Frontend
```bash
cd ../../frontend
npm install
```

Create frontend environment file:
```bash
cp .env.example .env.local
# PowerShell: Copy-Item .env.example .env.local
```

### 4) Run Locally (Two Terminals)
Terminal A (backend):
```bash
cd backend/app
npm run dev
```

Terminal B (frontend):
```bash
cd frontend
npm run dev
```

### 5) Access Applications
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health

### Optional Root-Level Backend Start
From repository root:
```bash
npm run dev:backend
```

## 🔐 Environment Variables
### Backend (.env)
Use backend/app/.env.example as canonical reference.

Required (core):
- PORT=5000
- NODE_ENV=development
- MONGODB_URI=your_mongodb_connection_string
- JWT_SECRET=your_secure_random_secret
- FRONTEND_URL=http://localhost:3000
- CORS_ORIGIN=http://localhost:3000

AI and pricing:
- GROQ_API_KEY=your_groq_api_key
- GROQ_PRICING_MODEL=llama-3.3-70b-versatile (optional override)
- GROQ_PRICING_TIMEOUT_MS=4000
- PRICING_AI_DISABLED=false
- PRICING_STATS_CACHE_TTL_MS=120000
- PRICING_STATS_CACHE_MAX_SIZE=200
- PRICING_SIMILAR_PRODUCTS_LIMIT=20

Payments and uploads:
- STRIPE_SECRET_KEY=your_stripe_secret
- WEBHOOK_SECRET=your_webhook_secret
- CLOUDINARY_CLOUD_NAME=your_cloud_name
- CLOUDINARY_API_KEY=your_api_key
- CLOUDINARY_API_SECRET=your_api_secret

OAuth providers (optional):
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL
- FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FACEBOOK_CALLBACK_URL
- GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL

Performance and ops (optional):
- LOW_STOCK_THRESHOLD=10
- SLOW_REQUEST_THRESHOLD_MS=300
- MONGO_MAX_POOL_SIZE
- MONGO_MIN_POOL_SIZE
- MONGO_MAX_IDLE_TIME_MS
- MONGO_CONNECT_TIMEOUT_MS
- MONGO_SOCKET_TIMEOUT_MS
- MONGO_SERVER_SELECTION_TIMEOUT_MS

### Frontend (.env.local)
Required:
- NEXT_PUBLIC_API_URL=http://localhost:5000/api

Note:
- Frontend API config normalizes NEXT_PUBLIC_API_URL so both origin-only and /api-suffixed values work.

## 🌐 Deployment Links
Replace these placeholders with your live deployments:

- Frontend (Vercel): FRONTEND_URL_HERE
- Backend API (Render/Railway): BACKEND_URL_HERE
- Live Project: LIVE_URL_HERE
- Backend Health Check: BACKEND_URL_HERE/health

Deployment docs in repository:
- Backend Render guide: backend/app/DEPLOY_RENDER.md
- Backend Railway guide: backend/app/DEPLOY_RAILWAY.md
- Frontend Vercel guide: frontend/DEPLOY_VERCEL.md



## 🔮 Future Improvements
- Personalized recommendation engine using user behavior and embeddings
- Multilingual AI support assistant with regional policy packs
- RAG-based support answers with policy/version grounding
- Advanced fraud and abuse detection for orders and payments
- Event-driven background jobs (queues) for notifications, analytics, and webhooks
- Caching layer (Redis) for high-volume listing/search workloads
- CI/CD pipelines with automated integration tests and preview environments


