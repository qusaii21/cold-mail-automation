# Job Application Mailer — Vercel Edition

Web version of the desktop mailer. Enter a recruiter's email and a job
role; the subject/body are filled from your template and sent from your
Gmail account, with your resume attached automatically.

## What changed from the desktop version

| Desktop app | Web app (this) |
|---|---|
| Tkinter GUI | Next.js page |
| `keyring` (OS keychain) for the App Password | Gmail credentials live in **Vercel environment variables**, never touch the browser |
| `config.json` on local disk | Templates & contact info saved in **browser localStorage** (per-browser, edited from Settings) |
| Resume picked via file browser | Resume is **bundled at `public/Qusai_Shergardwala.pdf`** — replace the file and redeploy to update it |
| Single user on one machine | Anyone with the URL can open the page, so an **access code** gates the send button |

## 1. Add your resume

Replace `public/Qusai_Shergardwala.pdf` with your actual resume (same filename), then
redeploy. There's a placeholder PDF in there now as a reminder.

## 2. Get a Gmail App Password

1. Turn on 2-Step Verification: <https://myaccount.google.com/security>
2. Generate an App Password: <https://myaccount.google.com/apppasswords>
3. Copy the 16-character password — you'll paste it into Vercel, not the app itself.

## 3. Deploy to Vercel

```bash
npm install -g vercel   # if you don't have it
cd job-email-web
vercel                  # follow the prompts, link/create a project
```

Or push this folder to a GitHub repo and import it at
<https://vercel.com/new> — either works.

## 4. Set environment variables

In the Vercel dashboard: **Project → Settings → Environment Variables**,
add:

| Key | Value |
|---|---|
| `GMAIL_USER` | your Gmail address |
| `GMAIL_APP_PASSWORD` | the App Password from step 2 |
| `APP_ACCESS_CODE` | any password you choose — protects the send button |

Redeploy after adding them (Vercel → Deployments → ⋯ → Redeploy), since
env vars only apply to new deployments.

## 5. Use it

Open your deployed URL. In **Settings & Template**:
- Paste the same `APP_ACCESS_CODE` you set in Vercel, under **Access**.
- Fill in your name, phone, email, LinkedIn, GitHub.
- Adjust the subject/body templates if you like.

These are saved to your browser automatically. Then just enter a
recruiter email + job role and hit **Send Email**.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your real values
npm run dev
```

Visit <http://localhost:3000>.

## Notes

- **Settings are per-browser** (localStorage), not per-account — if you
  use the app from a different browser or device, you'll re-enter your
  info once there too.
- **Rate limits**: Gmail SMTP allows roughly 500 sends/day on a standard
  account.
- **Extending to bulk sending**: loop over a list of `{ to, jobRole }`
  pairs client-side and call `/api/send` for each — the API route
  already does one send per request.
