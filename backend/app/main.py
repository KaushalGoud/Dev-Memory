import os
import json
import asyncio
from datetime import date
from typing import List, Optional
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import openai
import cognee

# ---------------------------------------------------------------------------
# Load environment variables
# ---------------------------------------------------------------------------
ENV_PATH = os.path.join(os.path.dirname(__file__), "../.env")
load_dotenv(ENV_PATH)

app = FastAPI(title="DevMemory Backend API")

# CORS: "*" + allow_credentials=True is invalid per spec (browsers will reject
# the preflight). Since this is local dev with no cookies/auth headers, just
# turn credentials off. If you ever need credentials, list explicit origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# API keys / model config
# ---------------------------------------------------------------------------
LLM_API_KEY = os.getenv("LLM_API_KEY")  # your GitHub Models token (GH PAT with models:read)

# GitHub Models moved off the old Azure endpoint. Old:
#   https://models.inference.ai.azure.com
# New (current, use this):
#   https://models.github.ai/inference
# Model names on the new endpoint need the "openai/" prefix.
GITHUB_MODELS_ENDPOINT = "https://models.github.ai/inference"
GITHUB_MODELS_MODEL = "openai/gpt-4o-mini"

if not LLM_API_KEY:
    print("WARNING: LLM_API_KEY not found in environment. Reviews will fail.")
else:
    # --- Cognee LLM config ---
    # This is the actual fix for your "wrong endpoint" bug: if you only set
    # llm_provider/llm_model and never set the endpoint, Cognee/litellm falls
    # back to OpenAI's real endpoint — and your GH Models token gets rejected
    # there (or silently misbehaves on embeddings).
    os.environ["LLM_PROVIDER"] = "openai"
    os.environ["LLM_MODEL"] = GITHUB_MODELS_MODEL
    os.environ["LLM_ENDPOINT"] = GITHUB_MODELS_ENDPOINT
    os.environ["LLM_API_KEY"] = LLM_API_KEY

    # --- Cognee EMBEDDING config ---
    # GitHub Models does NOT serve embedding models. If you leave embedding
    # config unset, Cognee defaults it to OpenAI too (per Cognee docs: "if you
    # configure only LLM, embeddings default to OpenAI") — which will fail
    # since your key is a GH token, not an OpenAI key.
    # Fastembed runs 100% locally: free, no rate limits, no network calls.
    # It's also literally what Cognee's own docs recommend for codegraph
    # ingestion specifically because hosted embedding models rate-limit fast.
    os.environ["EMBEDDING_PROVIDER"] = "fastembed"
    os.environ["EMBEDDING_MODEL"] = "sentence-transformers/all-MiniLM-L6-v2"
    os.environ["EMBEDDING_DIMENSIONS"] = "384"

# ---------------------------------------------------------------------------
# Data persistence
# ---------------------------------------------------------------------------
DATASETS_FILE = os.path.join(os.path.dirname(__file__), "../datasets.json")
REVIEWS_FILE = os.path.join(os.path.dirname(__file__), "../reviews.json")

initial_datasets = [
    {
        "id": "auth-module",
        "name": "auth-module",
        "url": "github.com/devmemory/auth-module",
        "dateAdded": "2026-06-15",
        "nodeCount": 42,
        "description": "Authenticates users via JWT, handles OAuth2 configuration, and controls route guards.",
        "files": ["auth.service.ts", "jwt.strategy.ts", "oauth.controller.ts", "roles.guard.ts"],
        "code": "// Auth Module details\n// jwt.sign({ id }, 'secret') -> exposed token key",
    },
    {
        "id": "database-layer",
        "name": "database-layer",
        "url": "github.com/devmemory/database-layer",
        "dateAdded": "2026-06-20",
        "nodeCount": 89,
        "description": "Main database setup using Prisma, handles schema definitions, transactional locks, and connection pooling.",
        "files": ["schema.prisma", "db.service.ts", "transaction.utils.ts", "pool.config.ts"],
        "code": "// Database Layer details\n// db connection pools\n// prisma client created on findActiveUsers()",
    },
    {
        "id": "api-routes",
        "name": "api-routes",
        "url": "github.com/devmemory/api-routes",
        "dateAdded": "2026-06-28",
        "nodeCount": 56,
        "description": "Express/Next routing mapping endpoints for user profiles, dashboards, and reporting.",
        "files": ["route.ts", "middleware.ts", "user.router.ts", "billing.ts"],
        "code": "// API routing paths\n// raw queries: select * from users where id = + id",
    },
]

initial_reviews = [
    {
        "id": "rev-1",
        "code": "// db.service.ts\nexport class DBService {\n  private client: any;\n  async connect() {\n    this.client = await createClient();\n  }\n}",
        "summary": "Potential database connection leak in db.service.ts helper",
        "date": "2026-06-21",
        "status": "resolved",
        "bullets": [
            "No client.disconnect() found in DBService.",
            "Database connection pooling limits might be reached if multiple instances connect.",
            "Recommendation: implement a clean-up method or use Prisma connection sharing.",
        ],
        "contextUsed": ["database-layer"],
        "pastBugsWarning": "You made this mistake in PR #3 where a database pool leak caused an API outage in database-layer.",
        "feedback": "up",
    },
    {
        "id": "rev-2",
        "code": "// auth.service.ts\nconst token = jwt.sign({ id }, 'secret');",
        "summary": "Hardcoded secret key in JWT token signing",
        "date": "2026-06-16",
        "status": "resolved",
        "bullets": [
            "Hardcoded 'secret' is used for token signing.",
            "Highly vulnerable to reverse engineering and spoofed tokens.",
            "Recommendation: replace with process.env.JWT_SECRET.",
        ],
        "contextUsed": ["auth-module"],
        "pastBugsWarning": "In auth-module, private developer secrets were exposed in a previous commit and needed a rotational key migration.",
        "feedback": None,
    },
    {
        "id": "rev-3",
        "code": "// user.router.ts\nrouter.get('/profile/:id', async (req, res) => {\n  const user = await db.query('SELECT * FROM users WHERE id = ' + req.params.id);\n});",
        "summary": "Critical SQL Injection risk on user profile endpoint",
        "date": "2026-06-29",
        "status": "warning",
        "bullets": [
            "Raw string concatenation creates a high SQL Injection vulnerability.",
            "Any attacker can access arbitrary database tables by crafting the :id param.",
            "Recommendation: Use parameterized queries like db.query('SELECT * FROM users WHERE id = $1', [req.params.id]).",
        ],
        "contextUsed": ["database-layer", "api-routes"],
        "pastBugsWarning": "A similar raw query vulnerability was flagged in PR #12 database-layer changes which triggered a security review.",
        "feedback": "down",
    },
]


def load_json(filepath: str, default_data):
    if not os.path.exists(filepath):
        with open(filepath, "w") as f:
            json.dump(default_data, f, indent=2)
        return default_data
    try:
        with open(filepath, "r") as f:
            return json.load(f)
    except Exception:
        return default_data


def save_json(filepath: str, data):
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class CodebaseRemember(BaseModel):
    name: str
    url: Optional[str] = None
    code: str


class CodeReviewRequest(BaseModel):
    code: str


class FeedbackRequest(BaseModel):
    feedback: str  # "up" or "down"


# ---------------------------------------------------------------------------
# Helper: call GitHub Models with retry/backoff (fixes rate-limit crashes)
# ---------------------------------------------------------------------------
def get_github_models_client() -> openai.AsyncOpenAI:
    return openai.AsyncOpenAI(
        api_key=LLM_API_KEY,
        base_url=GITHUB_MODELS_ENDPOINT,
    )


async def call_llm_with_retry(client: openai.AsyncOpenAI, **kwargs):
    """Retries on 429 (rate limit) and transient 5xx with exponential backoff.
    GH Models free tier is strict on RPM, so a single quick retry loop covers
    the vast majority of hackathon-demo failures."""
    max_attempts = 4
    delay = 2
    last_err = None
    for attempt in range(max_attempts):
        try:
            return await client.chat.completions.create(**kwargs)
        except openai.RateLimitError as e:
            last_err = e
            print(f"Rate limited (attempt {attempt + 1}/{max_attempts}), retrying in {delay}s...")
            await asyncio.sleep(delay)
            delay *= 2
        except openai.APIStatusError as e:
            if e.status_code >= 500:
                last_err = e
                await asyncio.sleep(delay)
                delay *= 2
            else:
                raise
    raise last_err


def safe_parse_json(raw_text: str) -> dict:
    """Structured-output validation error fix: some GH Models responses wrap
    JSON in markdown fences or add stray text even when asked not to. Strip
    fences before parsing, and fail loudly with the raw text for debugging
    instead of an opaque JSONDecodeError."""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI returned invalid JSON: {e}. Raw output: {cleaned[:300]}",
        )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/api/datasets")
async def get_datasets():
    return load_json(DATASETS_FILE, initial_datasets)


@app.get("/api/reviews")
async def get_reviews():
    return load_json(REVIEWS_FILE, initial_reviews)


@app.post("/api/remember")
async def remember_codebase(payload: CodebaseRemember):
    if not LLM_API_KEY:
        raise HTTPException(status_code=500, detail="LLM_API_KEY not configured in backend .env file.")

    try:
        remember_content = f"Codebase: {payload.name}\n"
        if payload.url:
            remember_content += f"Repository URL: {payload.url}\n"
        remember_content += f"Source Code Snippets:\n{payload.code}"

        await cognee.remember(remember_content)

        datasets = load_json(DATASETS_FILE, initial_datasets)

        file_list = [
            f"{payload.name.replace('-', '_')}_main.py",
            "utils.py",
            "config.py",
        ]

        new_dataset = {
            "id": f"{payload.name.lower().replace(' ', '-')}-{int(asyncio.get_event_loop().time())}",
            "name": payload.name,
            "url": payload.url,
            # Fixed: asyncio.subprocess has no `datetime` attribute — this
            # crashed every single /api/remember call.
            "dateAdded": date.today().isoformat(),
            "nodeCount": len(payload.code.split("\n")) // 2 + 10,
            "description": f"Cognee vectorized memory module for {payload.name}. Embedded source references.",
            "files": file_list,
            "code": payload.code,
        }

        datasets.insert(0, new_dataset)
        save_json(DATASETS_FILE, datasets)

        return {"status": "success", "dataset": new_dataset}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cognee Ingestion Error: {str(e)}")


@app.post("/api/review")
async def review_code(payload: CodeReviewRequest):
    if not LLM_API_KEY:
        raise HTTPException(status_code=500, detail="LLM_API_KEY not configured in backend .env file.")

    try:
        # 1. Recall related context from Cognee
        recalled = []
        try:
            recalled_results = await cognee.recall(query_text=payload.code)
            if recalled_results:
                for item in recalled_results:
                    if hasattr(item, "text"):
                        recalled.append(item.text)
                    elif isinstance(item, dict) and "text" in item:
                        recalled.append(item["text"])
                    else:
                        recalled.append(str(item))
        except Exception as recall_err:
            print(f"Non-blocking recall error: {recall_err}")

        recalled_context = "\n---\n".join(recalled) if recalled else "No matching historical patterns found in vector database."

        # 2. Invoke GitHub Models GPT-4o-mini — FIXED: was hitting real OpenAI
        # before because base_url was never passed and the model name lacked
        # the "openai/" prefix that the new GH Models endpoint requires.
        client = get_github_models_client()

        system_prompt = f"""You are DevMemory's AI assistant, an expert code auditor that never forgets.
You have access to the following recalled contextual codebase memory:
{recalled_context}

Analyze the developer's incoming code diff. Compare it with the historical code design patterns, database architectures, and past connection settings above.
Search for vulnerabilities, raw injection flaws, cryptographic key leaks, or connection leaks.

Output your audit response in JSON format. The JSON MUST contain these exact keys:
1. "summary": A brief 1-line description summarizing the main warning or approval.
2. "bullets": A JSON list of 2-3 specific feedback bullet points describing the security risk and recommendations.
3. "pastBugsWarning": A string warning the user if this matches a mistake from past reviews or repository context. If no matching issue is found in memory, set this to null.
4. "contextUsed": A list of strings matching the IDs of memory modules retrieved (you can infer matching modules like "database-layer" if DB patterns match, "auth-module" if tokens/keys match, or "api-routes" if endpoints match).

Output ONLY the raw JSON string. Do not wrap in markdown ```json blocks.
"""

        response = await call_llm_with_retry(
            client,
            model=GITHUB_MODELS_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Review this code snippet:\n{payload.code}"},
            ],
            temperature=0.1,
            # NOTE: response_format={"type": "json_object"} is dropped here.
            # GitHub Models' gpt-4o-mini deployment doesn't reliably honor it
            # the way OpenAI's own API does — that's your "structured output
            # validation errors". We rely on the prompt instruction instead
            # and parse defensively below.
        )

        review_data = safe_parse_json(response.choices[0].message.content)

        reviews = load_json(REVIEWS_FILE, initial_reviews)
        new_review = {
            "id": f"rev-{int(asyncio.get_event_loop().time())}",
            "code": payload.code,
            "summary": review_data.get("summary", "AI Audit Report"),
            "date": date.today().isoformat(),
            "status": "warning" if review_data.get("pastBugsWarning") else "resolved",
            "bullets": review_data.get("bullets", ["Review complete."]),
            "contextUsed": review_data.get("contextUsed", ["api-routes"]),
            "pastBugsWarning": review_data.get("pastBugsWarning"),
            "feedback": None,
        }

        reviews.insert(0, new_review)
        save_json(REVIEWS_FILE, reviews)

        return new_review
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Review Execution Error: {str(e)}")


@app.delete("/api/forget/{dataset_id}")
async def forget_dataset(dataset_id: str):
    try:
        datasets = load_json(DATASETS_FILE, initial_datasets)

        survivors = [d for d in datasets if d["id"] != dataset_id]
        if len(survivors) == len(datasets):
            raise HTTPException(status_code=404, detail="Dataset not found.")

        save_json(DATASETS_FILE, survivors)

        await cognee.forget(everything=True)

        async def reingest():
            for d in survivors:
                code_data = d.get("code", "")
                if code_data:
                    remember_content = f"Codebase: {d['name']}\nSource Code Snippets:\n{code_data}"
                    try:
                        await cognee.remember(remember_content)
                    except Exception as re_err:
                        print(f"Error re-ingesting {d['name']}: {re_err}")

        asyncio.create_task(reingest())

        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cognee Forget Error: {str(e)}")


@app.post("/api/reviews/{review_id}/feedback")
async def post_feedback(review_id: str, payload: FeedbackRequest):
    reviews = load_json(REVIEWS_FILE, initial_reviews)
    updated = False
    for r in reviews:
        if r["id"] == review_id:
            r["feedback"] = payload.feedback
            updated = True
            break

    if not updated:
        raise HTTPException(status_code=404, detail="Review not found.")

    save_json(REVIEWS_FILE, reviews)
    return {"status": "success"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)