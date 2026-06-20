# StayBoost — Step-by-Step Setup Guide (No Code)

This guide takes you from **nothing deployed** to a **live, working StayBoost**
that you can open in your browser. It is written for someone who has **never
deployed software before**. You will only **click buttons and copy-paste
values** — there is no code to write.

**The simplest path (chosen):** No custom domain yet. The public website and the
AI Property Analyzer will work fully. (Login + the private dashboard need a
custom domain — there is a short optional section at the end for when you are
ready for that.)

**What you will create (all free to start):**

| Tool | What it is | Why |
|---|---|---|
| GitHub | Where the code already lives | Railway & Vercel deploy from it |
| Railway | Runs the database + back-end services | The "engine room" |
| Vercel | Runs the website | What visitors see |
| Resend | Sends emails | Required for the API to start |
| Anthropic | Provides the AI | Powers the Analyzer |

**Total time:** about **45–60 minutes**. Take it one numbered step at a time.

---

## Before you start — create these 5 free accounts

Open each link, sign up (use "Continue with GitHub" where offered — it's
fastest), then come back. You do **not** need to do anything inside them yet.

1. **GitHub** — https://github.com (you likely already have this)
2. **Railway** — https://railway.app  → click **Login** → **Login with GitHub**
3. **Vercel** — https://vercel.com  → **Sign Up** → **Continue with GitHub**
4. **Resend** — https://resend.com  → **Sign Up**
5. **Anthropic Console** — https://console.anthropic.com  → **Sign Up**

> 💡 Keep a blank notes file (or a piece of paper) open. Throughout this guide
> you will collect a handful of **values** (web addresses and secret keys). I'll
> tell you exactly when to write one down and when to paste it back.

---

## Part A — Get your two secret keys (5 min)

### Step 1. Get your Anthropic API key

1. Go to https://console.anthropic.com
2. In the left menu click **API Keys**.
3. Click **Create Key**. Name it `stayboost`. Click **Create**.
4. **Copy the key** (it starts with `sk-ant-`). Paste it into your notes as
   **ANTHROPIC_API_KEY**.

> ⚠️ This key is shown **only once**. If you lose it, just create another.
> The AI Analyzer needs a small amount of paid credit — add ~$5 under
> **Billing** if you have not already.

### Step 2. Get your Resend email key

1. Go to https://resend.com and log in.
2. In the left menu click **API Keys** → **Create API Key**.
3. Name it `stayboost`, leave permission as **Full access**, click **Add**.
4. **Copy the key** (starts with `re_`). Save it in your notes as
   **RESEND_API_KEY**.

> 💡 You don't need to verify a domain for this guide. Resend lets new accounts
> send test emails right away, which is enough to get StayBoost running.

### Step 3. Make one more secret (a random password)

The API needs a long random secret to sign logins.

1. Open this page: https://www.uuidgenerator.net
2. Copy the long code shown (looks like `f47ac10b-58cc-4372-a567-0e02b2c3d479`).
3. Save it in your notes as **JWT_SECRET**.

Also invent a second random word/phrase (anything 20+ characters, e.g.
`stayboost-ai-link-9281`) and save it as **AI_SERVICE_TOKEN**. This is a private
password the two back-end services use to talk to each other.

✅ **At the end of Part A your notes should contain:**
ANTHROPIC_API_KEY, RESEND_API_KEY, JWT_SECRET, AI_SERVICE_TOKEN.

---

## Part B — Set up the database on Railway (10 min)

### Step 4. Create your Railway project

1. Go to https://railway.app and log in.
2. Click **New Project**.
3. Choose **Deploy PostgreSQL** (or **Provision PostgreSQL**).
4. Wait ~30 seconds. You now have a project with a database box in it.

### Step 5. Make the database AI-ready (pgvector)

StayBoost needs a database that supports AI search ("pgvector"). The easiest way
to guarantee this:

1. In your project, **delete the plain Postgres** box you just made
   (click it → **Settings** → scroll down → **Delete Service**).
2. Click **+ New** (or **Create**) → **Database** → look for **"PostgreSQL +
   pgvector"** or search the **Template** marketplace for **pgvector** and deploy
   that one.

> 💡 If you cannot find a pgvector option on Railway, use **Neon** instead — it
> includes pgvector by default and has a generous free tier:
> 1. Go to https://neon.tech → sign up → **Create project**.
> 2. After it's created, copy the **Connection string** it shows you.
> 3. Save it in your notes as **DATABASE_URL** and **skip to Step 7**.

### Step 6. Copy the database address

1. Click your Postgres box → open the **Variables** (or **Connect**) tab.
2. Find **DATABASE_URL** (a long line starting with `postgresql://`).
3. Copy it. Save it in your notes as **DATABASE_URL**.

### Step 7. Add Redis

1. Back on the project canvas, click **+ New** → **Database** → **Redis**.
2. When it's ready, click it → **Variables** → copy **REDIS_URL**
   (starts with `redis://`). Save it in your notes as **REDIS_URL**.

✅ **Your notes now also have:** DATABASE_URL, REDIS_URL.

---

## Part C — Deploy the AI service on Railway (10 min)

We deploy the AI brain first, because the main API needs its address.

### Step 8. Add the AI service from GitHub

1. In the same Railway project click **+ New** → **GitHub Repo**.
2. If asked, click **Configure GitHub App** and give Railway access to your
   **stayboost-** repository, then come back.
3. Pick the **stayboost-** repository. A new service box appears and it will try
   to build — that's fine, we'll point it at the right folder next.

### Step 9. Tell it this is the AI service

1. Click the new service → **Settings**.
2. Find **Config-as-code / Railway Config File** and set it to:
   **`services/ai/railway.json`**
3. Leave **Root Directory** empty (the repository root).
4. Open the **Variables** tab and add these three (click **New Variable** for
   each — type the **NAME** on the left, paste the **value** on the right):

   | NAME | Value to paste |
   |---|---|
   | `ANTHROPIC_API_KEY` | your `sk-ant-…` key |
   | `AI_SERVICE_TOKEN` | your random link password |
   | `AI_MODEL` | `claude-opus-4-8` |

5. Click **Deploy** (top right) and wait for it to go **green / Active**.

### Step 10. Get the AI service address

1. Still in the AI service → **Settings** → **Networking**.
2. Click **Generate Domain**. A public address appears, like
   `stayboost-ai-production.up.railway.app`.
3. Copy it and save it as **AI_SERVICE_URL** — but add `https://` in front, e.g.
   `https://stayboost-ai-production.up.railway.app`.

✅ **Notes now have:** AI_SERVICE_URL.

---

## Part D — Deploy the main API on Railway (10 min)

### Step 11. Add the API service

1. In the **same** Railway project click **+ New** → **GitHub Repo** → pick
   **stayboost-** again. A second service box appears.

### Step 12. Configure the API

1. Click it → **Settings** → set **Railway Config File** to:
   **`services/api/railway.json`**  (leave Root Directory empty).
2. Open **Variables** and add all of these:

   | NAME | Value to paste |
   |---|---|
   | `DATABASE_URL` | your `postgresql://…` value |
   | `REDIS_URL` | your `redis://…` value |
   | `RESEND_API_KEY` | your `re_…` key |
   | `JWT_SECRET` | your random UUID |
   | `AI_SERVICE_TOKEN` | the **same** link password as the AI service |
   | `AI_SERVICE_URL` | your `https://…railway.app` AI address |
   | `AUTH_COOKIE_SECURE` | `true` |
   | `NODE_ENV` | `production` |

3. Click **Deploy** and wait for **green / Active**.

### Step 13. Get the API address

1. API service → **Settings** → **Networking** → **Generate Domain**.
2. Copy the address and save it as **NEXT_PUBLIC_API_URL**, with `https://` in
   front, e.g. `https://stayboost-api-production.up.railway.app`.

> 💡 The database tables are created **automatically** the first time the API
> starts (it runs the setup steps itself). If the API box shows red, open its
> **Deploy Logs**, read the last red line — it almost always names the one
> variable that is missing or mistyped. Fix it and click **Redeploy**.

✅ **Notes now have:** NEXT_PUBLIC_API_URL.

---

## Part E — Deploy the website on Vercel (10 min)

### Step 14. Import the project

1. Go to https://vercel.com and log in.
2. Click **Add New…** → **Project**.
3. Find **stayboost-** in the list and click **Import**.

### Step 15. Point Vercel at the web app

1. Under **Root Directory** click **Edit** and choose **`apps/web`**.
2. Vercel will auto-detect **Next.js** — leave the build settings as they are.

### Step 16. Add the website's variables

Still on the import screen, open **Environment Variables** and add:

| NAME | Value to paste |
|---|---|
| `NEXT_PUBLIC_API_URL` | your `https://…` API address |
| `APP_URL` | leave blank for now — you'll fill it in Step 18 |

(You can add `APP_URL` now with a placeholder; we correct it right after the
first deploy.)

### Step 17. Deploy

1. Click **Deploy**. Wait 2–3 minutes.
2. When it finishes, Vercel shows your live address, like
   `https://stayboost.vercel.app`. **Open it** — you should see the StayBoost
   landing page. 🎉

---

## Part F — Connect the two halves (5 min)

The website and the API must each know the other's address. Two quick fixes:

### Step 18. Tell the website its own address

1. In **Vercel** → your project → **Settings** → **Environment Variables**.
2. Set **APP_URL** to your live Vercel address (from Step 17), e.g.
   `https://stayboost.vercel.app`.
3. Save.

### Step 19. Tell the API to trust the website

1. In **Railway** → your **API** service → **Variables**.
2. Add a new variable:
   - NAME: `WEB_ORIGIN`
   - Value: your Vercel address, e.g. `https://stayboost.vercel.app`
3. The API will redeploy automatically. Wait for green.

### Step 20. Redeploy the website once

1. Back in **Vercel** → **Deployments** → click the **…** menu on the latest
   one → **Redeploy** (so it picks up the `APP_URL` you just set).

---

## Part G — Test it (5 min)

1. **Open your Vercel address** → the landing page loads. ✅
2. **Try the AI Property Analyzer** (the "Analyze" / "Get my report" box on the
   home page). Enter a sample listing and submit. After a few seconds you should
   get a **report**, not an error. ✅
3. If the Analyzer shows *"We couldn't generate your report right now"*, it's
   almost always one of these — check in this order:
   - `NEXT_PUBLIC_API_URL` on **Vercel** doesn't exactly match the API's
     Railway address (no trailing slash, includes `https://`).
   - `AI_SERVICE_URL` or `AI_SERVICE_TOKEN` differ between the two Railway
     services — they must match.
   - The Anthropic account has no credit — add ~$5 in the Anthropic Console.

   After any change, **redeploy** the service you changed and test again.

🎉 **That's a live StayBoost.** The public site and AI Analyzer are working.

---

## Optional — Turn on Login & the Dashboard later

Login and the private dashboard need the website and API to **share one parent
domain** (browsers block the login "cookie" across two unrelated `.vercel.app` /
`.railway.app` names). You don't need this to demo StayBoost, but when you're
ready:

1. **Buy a domain** (e.g. on https://www.namecheap.com or
   https://porkbun.com) — about $10/year. Say you buy `mystayboost.com`.
2. **In Vercel:** project → **Settings** → **Domains** → add
   `app.mystayboost.com`. Vercel shows a DNS record to add; copy it.
3. **In Railway:** API service → **Settings** → **Networking** → **Custom
   Domain** → add `api.mystayboost.com`. Railway shows a DNS record; copy it.
4. **At your domain registrar:** open **DNS settings** and paste in the two
   records from Vercel and Railway. Wait ~15 minutes.
5. **Update these variables** to use the new addresses, then redeploy each:
   - Vercel `APP_URL` → `https://app.mystayboost.com`
   - Vercel `NEXT_PUBLIC_API_URL` → `https://api.mystayboost.com`
   - Railway API `WEB_ORIGIN` → `https://app.mystayboost.com`
   - Railway API `APP_URL` → `https://app.mystayboost.com`
   - Railway API add `AUTH_COOKIE_DOMAIN` → `.mystayboost.com`
6. Now **Sign up / Log in** works, and the dashboard (channels, reservations,
   sync) is reachable.

---

## Your values cheat-sheet

Keep these somewhere safe (a password manager is ideal). Never share or commit
them.

| Name | Where you got it | Used in |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic Console | Railway → AI |
| `RESEND_API_KEY` | Resend | Railway → API |
| `JWT_SECRET` | uuidgenerator.net | Railway → API |
| `AI_SERVICE_TOKEN` | you invented it | Railway → AI **and** API (same value) |
| `DATABASE_URL` | Railway/Neon Postgres | Railway → API |
| `REDIS_URL` | Railway Redis | Railway → API |
| `AI_SERVICE_URL` | Railway → AI → Networking | Railway → API |
| `NEXT_PUBLIC_API_URL` | Railway → API → Networking | Vercel + Railway → API redeploy |
| `WEB_ORIGIN` / `APP_URL` | Vercel → your site address | Railway → API + Vercel |

---

## Quick troubleshooting

| Symptom | Most likely cause | Fix |
|---|---|---|
| A Railway box is **red** | A variable is missing/mistyped | Open its **Deploy Logs**, read the last red line, fix that variable, **Redeploy** |
| Website loads but **Analyzer errors** | `NEXT_PUBLIC_API_URL` wrong, or AI token mismatch | Re-check Steps 13, 16, 9; redeploy |
| **"CORS" / blocked** error in browser | `WEB_ORIGIN` doesn't match your Vercel address | Fix Step 19, wait for redeploy |
| Build fails on Vercel | Root Directory not set to `apps/web` | Step 15 |
| Can't log in | Expected without a custom domain | See the **Optional** section |

> Stuck on a specific red error line? Copy that exact line and ask — it almost
> always points to one missing value.
