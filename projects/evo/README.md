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
Open `index.html` in a modern browser, or publish this folder as a static site. No backend or API key is required for this prototype.

## Persistence and privacy
Memory is local to the browser profile and device. Clearing browser site data can erase it. It is not synchronized across devices and is not stored in GitHub. Feedback and episodes are stored locally. After at least three ratings for an intent, a transparent rule selects a response strategy (baseline, clarify, balanced, or maintain). This changes templates only; it does not train model weights or create general intelligence. Do not enter passwords, secrets, or sensitive personal information.

## Roadmap
1. v0.1 — local prototype and transparent decision pipeline.
2. v0.2 — richer structured experience analysis and feedback-driven adaptation.
3. v0.3 — optional remote API and authenticated persistent storage.
4. Later — pluggable language-model reasoning and feedback-based adaptation.

## Safety
EVO may analyze and propose. External actions require explicit user approval. Never put credentials or private user memory in this repository.
