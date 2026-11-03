# 🎬 HelloStreaming — Offline-First & AI-Powered Hybrid Video Platform

**HelloStreaming** is a modern, lightweight, and disconnected-capable video aggregator and AI companion platform[cite: 1, 8, 10]. It allows users to search and watch videos from multiple sources like YouTube and Bilibili, while offering transcript-based AI summarization, voice commenting, and browser-cached offline support[cite: 1, 6, 8, 10].

This has made by RAG through extracting the data from Commoncrawl. 
---

## 🚀 Key Features

## Learn More

+-----------------------------------------------------------------------+
|                             Client Layer                              |
|   (Multi-Language UI | Custom Reactions | Voice & Text Comments)      |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                    Unified Media Abstraction Layer                    |
|       +-------------------+-------------------+------------------+    |
|       |   YouTube API     |   Bilibili API    | Local Video/PWA  |    |
|       +-------------------+-------------------+------------------+    |
+-----------------------------------------------------------------------+
                                   |
                  +----------------+----------------+
                  |                                 |
                  v                                 v
+----------------------------------+    +-------------------------------+
|    Edge Storage Engine           |    |    AI Processing Pipeline     |
|    (IndexedDB / Offline Cache)   |    |    (Transcript & Summary)    |
+----------------------------------+    +-------------------------------+

### 1. 🌐 Disconnected-Capable & Offline-First Architecture
* **Offline Playback:** Once loaded online, the entire application interface and cached data are stored in the browser, allowing it to function seamlessly even during network outages[cite: 10].
* **Local Video Library:** Manages and plays local video files stored on the user's device offline using the browser's `IndexedDB`[cite: 10].

* **Bookmark YouTube videos:** There is a facility of bookmarking YouTube videos, which will also store in both online and offline.
  
### 2. 🤖 AI-Powered Video Studio & Chat
* **Transcript Summarization:** Processes manually pasted transcripts from YouTube or other sources to generate accurate summaries and key takeaways[cite: 1, 2].
* **AI Chat Assistant:** Features an integrated chat assistant to answer questions and discuss topics directly based on the video transcript[cite: 3, 17].
* **Custom API Key Support:** Users can safely connect their own provider API keys to power AI features[cite: 3].

### 3. 🎙️ Voice Commenting & Interaction
* **Audio Comments:** In addition to traditional text and emoji reactions, users can record and post audio comments directly from the browser[cite: 6, 7].

### 4. 🔎 Multi-Platform Video Search
* **YouTube & Bilibili Hub:** Search and access content from both YouTube and the Chinese social video platform Bilibili within a single dashboard[cite: 8, 9, 16].
* **Date Filtering:** Filter YouTube video searches by specific date ranges[cite: 16].

### 5. 💰 Creator Revenue Calculator & Easy Publishing
* **Instant Publishing:** Publish any YouTube video directly to the platform simply by pasting its URL (HTTPS)[cite: 11].
* **Monetization Simulation:** Built-in revenue calculator simulating creator (60%) and platform (40%) revenue splits[cite: 15].
* **Multilingual UI:** One-click language switching across English, Bengali, and Hindi[cite: 13, 16].

---

## 🛠️ Tech Stack

* **Frontend Framework:** Next.js / React
* **Styling:** Tailwind CSS (Dark Theme UI)
* **Storage & Caching:** Service Workers, Cache API, IndexedDB
* **AI Integration:** OpenAI API (Custom Key Support)
* **Video Sources:** YouTube IFrame API, Bilibili Open Embeds

---

## ⚙️ Getting Started (Local Setup)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open (https://hello-streaming.vercel.app/) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more detLicense

📄 License

This project is licensed under the MIT License.

## Server configuration

All secrets below are server-only environment variables. Never prefix a secret with `NEXT_PUBLIC_`, commit it, put it in client JavaScript, or save it in `localStorage`.

### AI providers

Configure any provider you want to use; the video AI route and `/chat` route use the matching server key:

```dotenv
OPENAI_API_KEY=
MISTRAL_API_KEY=
ANTHROPIC_API_KEY=
DEEPSEEK_API_KEY=
XAI_API_KEY=
GEMINI_API_KEY=
NARAROUTER_API_KEY=
POLLINATIONS_API_KEY=
OPENAI_CHAT_MODEL=
MISTRAL_CHAT_MODEL=
CLAUDE_CHAT_MODEL=
DEEPSEEK_CHAT_MODEL=
GROK_CHAT_MODEL=
GEMINI_CHAT_MODEL=
```

Provider requests are made server-side. Bing/Copilot are not silently claimed as supported because they require a separate Microsoft/Azure integration.

### Payments

`NEXT_PUBLIC_SITE_URL` must be the public `http(s)` origin used for callbacks. Live payments require HTTPS.

```dotenv
NEXT_PUBLIC_SITE_URL=https://example.com
SSLCOMMERZ_MODE=sandbox
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=

# Reserved direct-provider configuration. These adapters intentionally return
# unsupported until their exact merchant contracts/signing are implemented.
BKASH_BASE_URL=
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_USERNAME=
BKASH_PASSWORD=
PAYTM_MERCHANT_ID=
PAYTM_MERCHANT_KEY=
PAYTM_WEBSITE=
ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=
ALIPAY_PUBLIC_KEY=
GOOGLE_PAY_MERCHANT_ID=
```

### Callback and webhook setup

- SSLCommerz uses `/api/payment/callback` for success/fail/cancel and `/api/payment/ipn` for IPN. Its hosted page exposes bKash, Nagad, and Rocket only when those methods are enabled on the merchant account.
- Stripe uses `/api/payment/webhook/stripe`; subscribe it to `checkout.session.completed` and set its signing secret as `STRIPE_WEBHOOK_SECRET`. Entitlement activation is webhook-driven.
- PayPal uses `/api/payment/paypal/callback`; the server captures and verifies the order before activating the subscription.

The payment API is `POST /api/payment/create` with `{ planId, provider, customer: { name, email, phone } }`. `GET /api/payment/providers` exposes provider names and configuration status without exposing secrets. Missing credentials and unsupported adapters return safe Bengali/English errors.

Direct bKash, Paytm, and Alipay are scaffolds, not fake success paths: their merchant APIs, token/signature rules, settlement, and callbacks vary by account and region. Google Pay is a wallet/tokenization method and does not directly settle a web payment; use it through a supported processor.

### Payment storage limitation

`lib/payment-store.js` is an intentionally small store interface with a local JSON implementation for development and single-instance demonstrations. Vercel/serverless filesystems are not durable or shared, so production must replace this implementation behind the same interface with a persistent database and unique/idempotency constraints. Do not treat the local JSON file as the sole production payment ledger.
