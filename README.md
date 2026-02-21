# Variations App – Made By Mobbs

Lightweight web app for site supervisors to submit variation requests. Clients receive an email with a secure link to **approve**, **request edit**, or **decline**. Full audit trail (timestamp, IP, status).

**Subdomain:** [variations.madebymobbs.com.au](https://variations.madebymobbs.com.au)

---

## What you need to do before going live

**→ See [GOING-LIVE.md](./GOING-LIVE.md)** for a step-by-step checklist: Supabase setup, Resend, env vars, Vercel deploy, domain, and a quick test.

---

## Stack

- **Next.js** (App Router)
- **Supabase** (Postgres + Storage)
- **Resend** (email)
- **Vercel** (deployment)

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor** → run the contents of `supabase/schema.sql`.
3. **Storage** → New bucket → Name: `variations`, **Private** ✓.  
   (No extra policies needed; API uses service role.)
4. **Settings → API**: copy **Project URL** and **service_role** key.

### 2. Resend

1. Sign up at [resend.com](https://resend.com).
2. Add and verify your domain (e.g. `madebymobbs.com.au`).
3. Create an API key and set **From** address (e.g. `noreply@madebymobbs.com.au`).

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (keep secret) |
| `RESEND_API_KEY` | Resend API key |
| `FROM_EMAIL` | Sender for variation emails |
| `STEVE_EMAIL` | Recipient for approve/edit/decline notifications |
| `NEXT_PUBLIC_BASE_URL` | Full app URL (e.g. `https://variations.madebymobbs.com.au`) |

### 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Deploy (Vercel)

1. Push repo to GitHub (e.g. `mbm-variations-app`).
2. **Vercel** → Import project → add all env vars above.
3. Set domain: `variations.madebymobbs.com.au` (or your subdomain).

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Supervisor: submit variation (form + 1–10 photos) |
| `/submitted` | Confirmation after submit |
| `/v/[shortcode]` | Client: view variation, Approve / Request edit / Decline |
| `/v/[shortcode]/edit` | Client: request edit (description + notes + optional photos) |

## Security

- No public storage; images in private bucket with **signed URLs** (1h expiry).
- Shortcode validated server-side on approve/edit/decline.
- IP captured from `x-forwarded-for` / `x-real-ip` for audit.
- No querystring status updates; all state changes via POST APIs.

## Branding

- **Font:** Poppins
- **Colours:** Brand green (`#166534`), white background
- **Header:** “Made By Mobbs · Variations”

To use the same logo as Client Connect, add your logo asset under `public/` and reference it in `app/layout.tsx`.

## Future integration (not in MVP)

- Reference variation ID from Client Connect
- Pricing field, PDF generation, Simpro sync
- Client login tie-in, conversion to invoice

## License

Private – Made By Mobbs.
