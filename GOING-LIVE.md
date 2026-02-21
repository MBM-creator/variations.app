# Going live – Variations App

Use this checklist so the app is ready for supervisors and clients.

---

## 1. Supabase

- [ ] **Create project** at [supabase.com](https://supabase.com) (or use an existing one).
- [ ] **Run the schema**  
  - Dashboard → **SQL Editor** → New query  
  - Paste the full contents of **`supabase/schema.sql`**  
  - Run it.
- [ ] **Create storage bucket**  
  - **Storage** → **New bucket**  
  - Name: **`variations`**  
  - Turn **Private** ON (no public access).  
  - Create.
- [ ] **Get API details**  
  - **Settings** → **API**  
  - Copy **Project URL** and **service_role** key (keep the key secret).

---

## 2. Resend (email)

- [ ] Sign up at [resend.com](https://resend.com).
- [ ] **Verify your domain** (e.g. `madebymobbs.com.au`) so “From” is your domain.
- [ ] **Create an API key** (e.g. for “Variations app”).
- [ ] Decide **From** address, e.g. `Variations <noreply@madebymobbs.com.au>` or `noreply@madebymobbs.com.au`.

---

## 3. Environment variables

**Local (`.env.local`):**  
Copy from `.env.example` and fill in real values.

**Vercel (production):**  
Project → **Settings** → **Environment Variables** → add each of these for **Production** (and Preview if you use it):

| Variable | Where to get it | Example |
|----------|-----------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (service_role) | `eyJ...` |
| `RESEND_API_KEY` | Resend → API Keys | `re_xxxx` |
| `FROM_EMAIL` | Your chosen sender | `Variations <noreply@madebymobbs.com.au>` |
| `STEVE_EMAIL` | Where to receive approve/edit/decline notifications | `steve@madebymobbs.com.au` |
| `NEXT_PUBLIC_BASE_URL` | Your live app URL | `https://variations.madebymobbs.com.au` |

Redeploy after changing env vars.

---

## 4. Deploy on Vercel

- [ ] Push the repo to GitHub (e.g. `mbm-variations-app`).
- [ ] In Vercel: **Add New** → **Project** → import the repo.
- [ ] Add all environment variables (step 3).
- [ ] Deploy.
- [ ] **Add domain:** Project → **Settings** → **Domains** → add **`variations.madebymobbs.com.au`** (or your subdomain).  
  - Add the CNAME record your host tells you (e.g. `cname.vercel-dns.com`).

---

## 5. Quick test

- [ ] Open your live URL (e.g. `https://variations.madebymobbs.com.au`).
- [ ] Submit a **test variation**:  
  - Use a real email you can access for “Client email”.  
  - Upload 1–2 photos.  
  - Submit.
- [ ] Check **client inbox**: email with “View & respond” link should arrive (check spam if not).
- [ ] Open the link: you should see the variation and **Approve** / **Request edit** / **Decline**.
- [ ] Click **Approve** (or **Decline**): page should update and you should get the “already responded” message.
- [ ] Check **Steve’s inbox**: notification email for approve/decline should arrive.

If any step fails, check Vercel **Functions** and **Logs** and Supabase **Logs** for errors.

---

## 6. Optional

- [ ] **Logo**  
  Add your logo under `public/` (e.g. `public/logo.svg`) and reference it in `app/layout.tsx` in the header.
- [ ] **Resend domain**  
  Ensure DKIM/SPF is set up so emails are less likely to go to spam.

---

You’re done when: supervisors can submit, clients get the email and can approve/edit/decline, and Steve gets notified on each outcome.
