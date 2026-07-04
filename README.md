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

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                            BROWSER (Next.js)                        │
│                                                                       │
│   /            /memory              /review                        │
│   Ingest UI    Knowledge graph       Code review UI                 │
│   + stats      visualization         + AI audit report              │
│                                                                       │
│              DevMemoryContext (React Context)                       │
│         addDataset() · deleteDataset() · addReview()                │
└───────────────────────────────┬───────────────────────────────────┘
                                 │  fetch("/api/...")
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND (main.py)                      │
│                                                                       │
│   POST /api/remember  ──────►  cognee.remember(code)                │
│   POST /api/review    ──────►  cognee.recall(query) + LLM audit     │
│   DELETE /api/forget  ──────►  cognee.forget(everything=True)       │
│                                 + re-ingest survivors                │
│                                                                       │
│   datasets.json / reviews.json  ← local persistence (survives       │
│                                     restarts, independent of graph)  │
└─────────┬─────────────────────────────────────────┬─────────────────┘
          │                                          │
          ▼                                          ▼
┌───────────────────────────┐          ┌─────────────────────────────┐
│   COGNEE (local, OSS)      │          │   GitHub Models API          │
│                             │          │   (https://models.github.ai) │
│  add → cognify → search     │          │                               │
│  (wrapped as remember/      │          │   GPT-4o-mini                │
│   recall/forget)            │          │   → structured JSON audit    │
│                             │          │     (summary, bullets,       │
│  ┌───────────────────────┐ │          │      pastBugsWarning,        │
│  │ Fastembed (local)      │ │          │      contextUsed)            │
│  │ → embeddings, no       │ │          └─────────────────────────────┘
│  │   network call needed  │ │
│  └───────────────────────┘ │
│                             │
│  ┌───────────────────────┐ │
│  │ SQLite knowledge graph │ │
│  │ → entities, edges,     │ │
│  │   semantic chunks      │ │
│  └───────────────────────┘ │
└───────────────────────────┘
```

**Key design decision:** the LLM (GitHub Models) only handles *reasoning* — extracting entities during ingestion and writing the audit during review. Embeddings run **entirely locally** via Fastembed. This matters because GitHub Models is free but rate-limited, and doesn't serve embedding models at all — splitting the two workloads is what makes the whole pipeline reliable.

---

## How It Works (Workflow)

### 1. Ingest — "teaching" DevMemory a codebase

```
User pastes code/repo URL
        │
        ▼
POST /api/remember { name, url, code }
        │
        ▼
cognee.remember(content)
   ├─ add()      → stores raw text
   ├─ cognify()  → LLM (GPT-4o-mini) extracts entities & relationships
   │               → Fastembed embeds each chunk locally
   │               → builds/updates the knowledge graph (nodes + edges)
   └─ improve()  → self-improvement pass on the graph
        │
        ▼
Metadata saved to datasets.json (id, name, files, description, nodeCount)
        │
        ▼
Frontend refetches /api/datasets → Memory Dashboard graph updates
```

### 2. Review — asking DevMemory to audit new code

```
User pastes a code diff
        │
        ▼
POST /api/review { code }
        │
        ▼
cognee.recall(query_text=code)
   → searches the knowledge graph for related context
   → e.g. "this touches the same DB pattern as database-layer"
        │
        ▼
Recalled context + new code  →  GPT-4o-mini (GitHub Models)
        │
        ▼
Structured JSON response:
   { summary, bullets[], pastBugsWarning, contextUsed[] }
        │
        ▼
Saved to reviews.json → shown in Review page with
recurring-bug warning + feedback (👍/👎) buttons
```

### 3. Forget — removing a codebase cleanly

```
DELETE /api/forget/{id}
        │
        ▼
Remove from datasets.json
        │
        ▼
cognee.forget(everything=True)   → wipes entire graph
        │
        ▼
Re-ingest all *surviving* datasets (background task)
        → keeps the graph consistent, no orphaned/stale nodes
```

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

- **Ingest Codebase Memory** — paste code or a repo URL, DevMemory builds a knowledge graph from it.
- **Memory Dashboard** — interactive visualization of the knowledge graph: which files, which codebases, how they connect.
- **Review with Memory** — paste a code diff, get an AI audit aware of your project's history.
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

### 2. Backend setup

> Ubuntu 24+ blocks global `pip install` — a virtual environment is required.

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install 'cognee[fastembed]'
```

### 3. Environment variables

Create `backend/.env` (do **not** commit this file):

```env
# ── LLM Configuration (GitHub Models — free, GPT-4o-mini) ──────────────────
LLM_PROVIDER=openai
LLM_MODEL=openai/gpt-4o-mini
LLM_ENDPOINT=https://models.github.ai/inference
LLM_API_KEY=your_github_pat_here

# ── Embedding Configuration (local, free, no rate limits) ──────────────────
# GitHub Models does NOT serve embedding models — Fastembed runs locally
# instead, so no endpoint or API key is needed here at all.
EMBEDDING_PROVIDER=fastembed
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DIMENSIONS=384
```

> This must be a GitHub PAT with `models:read` scope. No OpenAI key, no Cognee Cloud key needed — LLM calls route through GitHub Models (free), and embeddings run locally via Fastembed.

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
    page.tsx           # Dashboard — ingest form, stats, latest review
    memory/page.tsx    # Memory Dashboard — knowledge graph visualization
    review/page.tsx    # Review UI with memory-aware analysis
  components/
  context/
    dev-memory-context.tsx   # Shared state, all API calls

backend/
  app/main.py          # FastAPI server: ingest, review, forget, feedback
  venv/                 # Python virtual environment (gitignored)
  datasets.json          # Persisted codebase metadata
  reviews.json            # Persisted review history
  requirements.txt
  .env                     # LLM_API_KEY etc. (gitignored)
```

### API Endpoints

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/datasets` | Fetch saved codebase datasets |
| `GET` | `/api/reviews` | Fetch saved review results |
| `POST` | `/api/remember` | Ingest a codebase into memory |
| `POST` | `/api/review` | Run a memory-informed code review |
| `DELETE` | `/api/forget/{dataset_id}` | Remove a dataset from memory |
| `POST` | `/api/reviews/{review_id}/feedback` | Submit 👍/👎 feedback for a review |

---

## Troubleshooting

- **`LLM_API_KEY not found`** → check `backend/.env` exists and is being loaded from the right path (`main.py`'s `ENV_PATH` should point one level up from `app/`, not two).
- **`fastembed is required...`** → run `pip install 'cognee[fastembed]'` inside the activated venv.
- **`ECONNRESET` / socket hang up on `/api/remember`** → missing `--reload-exclude "*.json"` flag; the reload watcher is restarting the server on its own JSON writes.
- **`ECONNREFUSED 127.0.0.1:8000`** → backend isn't running; start it before the frontend makes requests.
- **Structured output / invalid JSON errors** → GitHub Models' GPT-4o-mini doesn't reliably honor `response_format={"type": "json_object"}`; the backend relies on prompt instructions + defensive JSON parsing instead.
- **`pip install` fails with "externally-managed-environment"** → you're not inside the activated venv; run `source venv/bin/activate` first.

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