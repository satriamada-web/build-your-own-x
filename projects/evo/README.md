# EVO — Artificial Digital Life

Experimental adaptive digital agent. EVO is not conscious or general intelligence; this prototype demonstrates an inspectable interaction loop.

## v0.1 scope
- Browser-based interface.
- Intent classification and transparent rule-based responses.
- User-approved memory entries stored in the current browser using localStorage.
- Memory export/import as JSON backup.
- Response feedback signals stored locally for later evaluation.
- Episodic memory records each interaction, detected intent, retrieved memory references, and selected strategy.
- Explainable adaptive rules adjust response strategy per intent after at least three feedback ratings.
- Recall of saved notes using keyword overlap.
- One suggested next step per interaction.
- Semi-autonomous boundary: suggest only; never execute external actions.

## Run
Open `index.html` in a modern browser, or publish this folder as a static site. Without a backend URL, EVO uses its local rule-based engine.

## Optional language-model reasoning
An optional Node.js 20+ API adapter is in `server/`. Deploy it as a separate backend, configure `OPENAI_API_KEY` as a server-side secret, then enter the backend base URL in the frontend's **Mesin penalaran** panel. The frontend calls `/api/chat`; `/api/health` checks service readiness. Never put provider credentials in browser storage or repository files. Set `ALLOWED_ORIGIN` to the exact frontend origin before public deployment. Read `server/README.md` for setup and limitations.

Remote reasoning is not active until the backend is deployed, configured with a valid key, and connected from the frontend. GitHub stores the code; it does not run this backend by itself.

## Persistence and privacy
Memory is local to the browser profile and device. Clearing browser site data can erase it. It is not synchronized across devices and is not stored in GitHub. Feedback and episodes are stored locally. After at least three ratings for an intent, a transparent rule selects a response strategy (baseline, clarify, balanced, or maintain). This changes templates only; it does not train model weights or create general intelligence. Do not enter passwords, secrets, or sensitive personal information.

## Roadmap
1. v0.1 — local prototype and transparent decision pipeline.
2. v0.2 — richer structured experience analysis and feedback-driven adaptation.
3. v0.2 — optional server-side language-model reasoning adapter (requires separate backend deployment).
4. v0.3 — authenticated persistent storage and synchronized memory.
4. Later — pluggable language-model reasoning and feedback-based adaptation.

## Safety
EVO may analyze and propose. External actions require explicit user approval. Never put credentials or private user memory in this repository.


## Verification status and remaining setup

The repository includes a GitHub Actions syntax-check workflow at `.github/workflows/evo-check.yml`. It runs `node --check` on the frontend and API source and validates the backend package metadata when GitHub Actions is enabled for the branch.

### Before using remote reasoning

1. Deploy `projects/evo/server` to a Node.js 20+ host.
2. Add `OPENAI_API_KEY` as a private environment secret in that host. Never commit the real key.
3. Set `ALLOWED_ORIGIN` to the exact deployed frontend origin (scheme + hostname, no path).
4. Deploy the static frontend from `projects/evo`.
5. Paste the backend service base URL into the frontend's Mesin Penalaran panel and run Periksa Koneksi.
6. Send a test prompt and verify that the response is marked remote.

The deployment host and credentials are not configured by this repository. The API currently has basic in-memory per-IP rate limiting and origin checks; it is an experimental single-user backend, not yet production-ready for an unrestricted public audience. Add authentication, durable abuse controls, quotas, and data-retention policy before inviting other users.

### What remains intentionally unconfigured

- Hosting account/service creation and public deployment.
- Provider API key and billing configuration.
- Frontend public URL and matching CORS origin.
- Authenticated cloud database for cross-device memory sync.
- Browser-level end-to-end test after deployment.
