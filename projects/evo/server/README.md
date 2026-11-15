# EVO API backend

A small Node.js 20+ backend for the optional language-model reasoning layer.

## Configure

Set these environment variables in the backend host (never commit secrets):

- `OPENAI_API_KEY` — required secret, stored only in the server environment.
- `OPENAI_MODEL` — optional; defaults to `gpt-4o-mini`.
- `OPENAI_BASE_URL` — optional; defaults to `https://api.openai.com/v1`.
- `ALLOWED_ORIGIN` — set to the exact deployed frontend origin in production. The default `*` is for local experimentation only.
- `PORT` — supplied by most hosting providers; defaults to 8787.

## Run locally

```bash
cd projects/evo/server
npm start
```

Health check: `GET http://localhost:8787/api/health`.

The frontend sends user messages to `POST /api/chat`. The server adds only user-approved memory context and a bounded strategy note. It has no tools and cannot execute external actions.

## Security notes

- Never place provider keys in frontend JavaScript, HTML, GitHub, or browser localStorage.
- Configure an exact CORS origin before public deployment.
- The included in-memory rate limit is a basic prototype guard, not production-grade abuse protection.
- Add authentication, durable rate limiting, usage limits, and privacy/retention controls before public multi-user use.
- Do not send sensitive personal data in prompts.
