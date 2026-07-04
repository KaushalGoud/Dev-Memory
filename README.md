# DevMemory 🧠
> AI Code Review Assistant that Never Forgets

DevMemory gives your AI reviewer permanent memory across 
all sessions using Cognee's hybrid graph-vector memory layer.

## The Problem
Normal AI reviewers forget everything after each session.
DevMemory remembers past bugs, coding patterns, and reviews — forever.

## Features
- 🔍 Ingest codebase into persistent memory graph
- 🤖 AI reviews with historical context awareness  
- ⚠️ Recurring bug warnings from past PRs
- 📊 Interactive knowledge graph visualization
- 🗑️ Surgical memory deletion per dataset

## Tech Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Python FastAPI + Cognee
- **Memory**: Cognee hybrid graph-vector layer
- **LLM**: GPT-4o-mini

## Cognee Memory Lifecycle Used
| API | Usage |
|-----|-------|
| `cognee.remember()` | Ingest codebase files |
| `cognee.recall()` | Fetch past review context |
| `cognee.improve()` | Learn from feedback |
| `cognee.forget()` | Delete old datasets |

## Setup
\```bash
# Frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
\```

## Environment Variables
\```env
COGNEE_API_KEY=your_key
LLM_API_KEY=your_key
LLM_MODEL=gpt-4o-mini
\```

## Hackathon
Built for WeMakeDevs x Cognee Hackathon 2026