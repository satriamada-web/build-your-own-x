# EVO — Artificial Digital Life

Experimental adaptive digital agent. EVO is not conscious or general intelligence; this prototype demonstrates an inspectable interaction loop.

## v0.1 scope
- Browser-based interface.
- Intent classification and transparent rule-based responses.
- User-approved memory entries stored in the current browser using localStorage.
- Memory export/import as JSON backup.
- Response feedback signals stored locally for later evaluation.
- Recall of saved notes using keyword overlap.
- One suggested next step per interaction.
- Semi-autonomous boundary: suggest only; never execute external actions.

## Run
Open `index.html` in a modern browser, or publish this folder as a static site. No backend or API key is required for this prototype.

## Persistence and privacy
Memory is local to the browser profile and device. Clearing browser site data can erase it. It is not synchronized across devices and is not stored in GitHub. Feedback is recorded as evaluation data; it does not yet train or change the reasoning engine automatically. Do not enter passwords, secrets, or sensitive personal information.

## Roadmap
1. v0.1 — local prototype and transparent decision pipeline.
2. v0.2 — structured experience log and feedback-driven adaptation.
3. v0.3 — optional remote API and authenticated persistent storage.
4. Later — pluggable language-model reasoning and feedback-based adaptation.

## Safety
EVO may analyze and propose. External actions require explicit user approval. Never put credentials or private user memory in this repository.
