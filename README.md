# DevMemory 🧠

**AI-powered code review assistant with persistent memory.**

DevMemory remembers your codebase — architecture, past mistakes, security patterns — across sessions using a knowledge graph, and uses that memory to give context-aware code reviews instead of generic linting feedback.

Built for the **WeMakeDevs x Cognee Hackathon**.

---

## The Problem

Most AI code review tools have no memory. Every PR gets reviewed in isolation — the same JWT-hardcoding mistake, the same connection-leak pattern, the same SQL injection risk gets flagged fresh every time, with no awareness that your team already made (and fixed) this exact mistake in a previous PR.

## The Solution

DevMemory ingests your codebase into a **persistent knowledge graph** (via [Cognee](https://www.cognee.ai/)), then cross-references every new code review against that graph — surfacing recurring bugs, architectural context, and past mistakes automatically.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | FastAPI (Python) |
| Memory / Knowledge Graph | [Cognee](https://www.cognee.ai/) (local SQLite + graph store) |
| Embeddings | [Fastembed](https://github.com/qdrant/fastembed) (local, free, no rate limits) |
| LLM | GPT-4o-mini via [GitHub Models](https://docs.github.com/en/github-models) |

---

## Features

- **Ingest Codebase Memory** — paste code or a repo URL, DevMemory builds a knowledge graph (entities, relationships, semantic chunks) from it.
- **Memory Dashboard** — interactive visualization of the knowledge graph: which files, which codebases, how they connect.
- **Review with Memory** — paste a code diff, get an AI audit that's aware of your project's history: past bugs, architectural conventions, security patterns already on file.
- **Recurring Bug Warnings** — flags when incoming code repeats a mistake already seen in memory.
- **Forget / Purge** — remove a codebase from memory and cleanly re-index the rest.

---

## Prerequisites

- Node.js 18+
- Python 3.12+
- A [GitHub Personal Access Token](https://github.com/settings/tokens) with the **`models:read`** scope (used to call GitHub Models for free — no OpenAI key needed)

---

## Setup

### 1. Clone & install frontend

```bash
git clone https://github.com/KaushalGoud/Dev-Memory.git
cd Dev-Memory
npm install
```

### 2. Backend setup (virtual environment required — Ubuntu 24+ blocks global pip installs)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install 'cognee[fastembed]'
```

### 3. Environment variables

Copy [.env.example](.env.example) to `.env` and fill in the required values:

```env
COGNEE_API_KEY=
LLM_API_KEY=your_github_personal_access_token_here
```

> This must be a GitHub PAT with `models:read` scope — DevMemory routes all LLM calls through GitHub Models (`https://models.github.ai/inference`), which is free and doesn't need a separate OpenAI key. Embeddings run locally via Fastembed, so no embedding API key is needed either.

### 4. Run the backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload --reload-exclude "*.json"
```

> ⚠️ The `--reload-exclude "*.json"` flag is required. The backend writes to `datasets.json`/`reviews.json` on every request — without excluding them, `--reload` detects its own writes as file changes and restarts mid-request, causing socket hang-ups.

### 5. Run the frontend

In a separate terminal:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```text
src/
  app/
    page.tsx           # Dashboard for ingesting codebases
    memory/page.tsx    # Memory graph dashboard
    review/page.tsx    # Review UI with memory-aware analysis
  components/
  context/
backend/
  app/main.py         # FastAPI server and API routes
  datasets.json       # Local sample dataset storage
  reviews.json        # Local sample review storage
  requirements.txt
```

### API Endpoints

The backend exposes these main routes:

- `GET /api/datasets` — fetch saved codebase datasets
- `GET /api/reviews` — fetch saved review results
- `POST /api/remember` — ingest a codebase into memory
- `POST /api/review` — run a memory-informed code review
- `DELETE /api/forget/{dataset_id}` — remove a dataset from memory
- `POST /api/reviews/{review_id}/feedback` — submit feedback for a review

### Troubleshooting

- Make sure your GitHub token is stored in `backend/.env` as `LLM_API_KEY`.
- Activate the Python virtual environment before running the backend.
- If you are using `uvicorn --reload`, keep the `--reload-exclude "*.json"` flag so the backend does not restart on its own JSON writes.
- If dependencies fail to install, ensure `python3-venv` is available on your Linux system.

---

## How It Works

1. **Ingest** — `POST /api/remember` sends code to Cognee's `remember()`, which chunks it, extracts entities/relationships via LLM, embeds it locally with Fastembed, and stores it in a knowledge graph.
2. **Review** — `POST /api/review` calls Cognee's `recall()` to pull relevant graph context for the incoming code, then sends that context + the new code to GPT-4o-mini (via GitHub Models) for a structured security/architecture audit.
3. **Forget** — `DELETE /api/forget/{id}` wipes the graph and re-ingests the remaining codebases to keep memory consistent.

---

## Known Limitations

- Local SQLite-backed graph store — not meant for multi-user production use as-is.
- GitHub Models free tier has rate limits (~10 RPM for GPT-4o-mini) — the backend retries with exponential backoff, but heavy concurrent use may still throttle.
- `.env` and `venv/` are gitignored — never commit your GitHub token.

---

## Built For

WeMakeDevs x Cognee Hackathon — July 2026.

## License

MIT