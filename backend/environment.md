# CampusFlow Backend — Environment Variable Reference

> **For the team:** Every variable the backend reads is documented here.  
> Before running the server locally or deploying to Render, ensure all **Required** variables are set.  
> The backend validates the environment on startup and will print a clear error and exit if anything is missing.

---

## How to Set Up

```bash
# 1. Copy the example file
cp .env.example .env

# 2. Open .env and fill in every value
# 3. Never commit .env to Git — it is already in .gitignore
```

---

## Variable Reference

### SERVER

| Variable | Type | Required | Default | Owner | Purpose |
|---|---|---|---|---|---|
| `PORT` | `integer` | No | `3000` | Backend | The port Express listens on. Render sets this automatically in production. |
| `NODE_ENV` | `string` | Yes | — | Backend | Controls logging format and error verbosity. Accepted: `development`, `production`, `test`. |

---

### SUPABASE

| Variable | Type | Required | Default | Owner | Purpose |
|---|---|---|---|---|---|
| `SUPABASE_URL` | `string (URL)` | Yes | — | Backend | Full URL of the Supabase project. Found in: Supabase Dashboard → Settings → API → Project URL. |
| `SUPABASE_ANON_KEY` | `string` | Yes | — | Backend | Supabase anon/public key. This is **also the token the frontend sends** in `Authorization: Bearer <token>`. Found in: Supabase Dashboard → Settings → API → anon public. |
| `SUPABASE_SERVICE_ROLE_KEY` | `string` | Yes | — | Backend | Supabase service role key. Grants admin access and bypasses RLS. Used **only for internal backend operations**. **Never expose to the frontend.** Found in: Supabase Dashboard → Settings → API → service_role secret. |

---

### n8n WEBHOOKS

> **These URLs come from your n8n teammate.** Leave them as placeholders until the n8n teammate shares their deployed webhook URLs.

| Variable | Type | Required | Default | Owner | Purpose |
|---|---|---|---|---|---|
| `N8N_DEADLINE_WEBHOOK` | `string (URL)` | Yes | — | n8n Teammate | The webhook URL for the deadline reminder workflow. The backend POSTs a deadline payload to this URL when a student's reminder is triggered. |
| `N8N_NOTICE_WEBHOOK` | `string (URL)` | Yes | — | n8n Teammate | The webhook URL for the notice broadcast workflow. The backend POSTs a notice payload to this URL when a new notice is published. |

**Payload the backend sends to `N8N_DEADLINE_WEBHOOK`:**
```json
{
  "studentName": "string",
  "phone": "string (E.164)",
  "subject": "string",
  "taskTitle": "string",
  "deadline": "ISO-8601 datetime string",
  "reminderOffsetHours": 24
}
```

**Payload the backend sends to `N8N_NOTICE_WEBHOOK`:**
```json
{
  "title": "string",
  "noticeText": "string",
  "eventDate": "ISO-8601 datetime string | null"
}
```

---

### PYTHON AI SERVICE

> **This URL comes from your Python AI teammate.** Leave it as `http://localhost:8000` until they share their deployed service URL.

| Variable | Type | Required | Default | Owner | Purpose |
|---|---|---|---|---|---|
| `PYTHON_AI_BASE_URL` | `string (URL)` | Yes | — | AI Teammate | Base URL of the Python FastAPI AI service. The backend forwards AI queries to `<PYTHON_AI_BASE_URL>/query`. |

**How the backend uses this:**
```
POST <PYTHON_AI_BASE_URL>/query
Body: { "query": "...", "studentId": "uuid", "context": {} }
```

---

### CORS

| Variable | Type | Required | Default | Owner | Purpose |
|---|---|---|---|---|---|
| `ALLOWED_ORIGINS` | `string` | Yes | — | Backend | Comma-separated list of allowed origins for CORS. Must include the frontend URL. Example: `http://localhost:3001,https://campusflow.vercel.app` |

> **Frontend teammate:** Add your local dev port and your Vercel deployment URL to this variable. No spaces between entries.

---

### RATE LIMITING

| Variable | Type | Required | Default | Owner | Purpose |
|---|---|---|---|---|---|
| `RATE_LIMIT_WINDOW_MS` | `integer` | No | `900000` | Backend | Duration of the rate limit window in milliseconds. Default is 15 minutes. |
| `RATE_LIMIT_MAX` | `integer` | No | `100` | Backend | Maximum number of requests per IP per window. |

---

### LOGGING

| Variable | Type | Required | Default | Owner | Purpose |
|---|---|---|---|---|---|
| `LOG_LEVEL` | `string` | No | `info` | Backend | Pino log level. Accepted values: `trace`, `debug`, `info`, `warn`, `error`, `fatal`, `silent`. Use `debug` locally, `info` in production. |

---

## Environment by Stage

| Variable | Local Dev | Production (Render) |
|---|---|---|
| `PORT` | `3000` | Set by Render automatically |
| `NODE_ENV` | `development` | `production` |
| `SUPABASE_URL` | Same project URL | Same project URL |
| `SUPABASE_ANON_KEY` | Dev project key | Prod project key |
| `SUPABASE_SERVICE_ROLE_KEY` | Dev project key | Prod project key |
| `N8N_DEADLINE_WEBHOOK` | n8n local/cloud URL | n8n cloud URL |
| `N8N_NOTICE_WEBHOOK` | n8n local/cloud URL | n8n cloud URL |
| `PYTHON_AI_BASE_URL` | `http://localhost:8000` | Render AI service URL |
| `ALLOWED_ORIGINS` | `http://localhost:3001` | Vercel frontend URL |
| `LOG_LEVEL` | `debug` | `info` |

---

## Render Deployment

Set all required variables in the Render dashboard:

```
Render Dashboard → Your Service → Environment → Add Environment Variable
```

The backend's `render.yaml` pre-configures `NODE_ENV=production`.  
All other secrets must be added manually in the Render dashboard — never hard-code them in `render.yaml`.

---

## Security Notes

- `.env` is listed in `.gitignore` — it will never be committed.
- `SUPABASE_SERVICE_ROLE_KEY` must never be sent to the frontend or logged.
- `SUPABASE_ANON_KEY` is semi-public (the frontend already has it) but still should not appear in logs.
- All variables are validated on startup via Zod in `src/config/env.js`. If any required variable is absent or malformed, the server exits with a descriptive error message rather than starting in a broken state.
