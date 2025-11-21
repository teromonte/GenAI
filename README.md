# NewsCenter RAG API 🤖🌍

Geo-aware Retrieval Augmented Generation platform that showcases an end-to-end GenAI stack: ingestion pipelines, multi-region vector stores, Groq-hosted LLMs, secure FastAPI backend, Next.js frontend, and a GitOps-friendly infrastructure footprint on AWS/K3s.

## Purpose & Outcomes
- Demonstrate a production-grade RAG architecture that segments knowledge bases by geography (Africa/Europe/Brazil) and routes queries intelligently.
- Surface the entire technology stack—including AI, data, backend, DevOps, and observability—in one place for stakeholders or hiring panels.
- Provide reproducible local dev flows, automated CI/CD, and live utilities so reviewers can validate the system quickly.

## Live Utilities & Shortcuts

| Utility | URL | Notes |
| --- | --- | --- |
| Public Frontend | `http://newsbot.local/` | Map `98.92.132.139 newsbot.local` in `/etc/hosts` (Linux/macOS) or `C:\Windows\System32\drivers\etc\hosts`. |
| Interactive Docs (Swagger) | `http://newsbot.local:8000/docs` | FastAPI OpenAPI UI for manual testing. |
| OpenAPI JSON | `http://newsbot.local:8000/openapi.json` | Useful for client generation. |
| Grafana Dashboards | `http://grafana.newsbot.local` | Traefik ingress `grafana.newsbot.local`; add to hosts file to access Loki/Prom metrics. |
| Direct IP fallback | `http://98.92.132.139/` | When DNS overrides are not possible; append `:8000/docs` for Swagger. |

> Update host entries locally before accessing utilities. All URLs are served via Traefik, so HTTPS offload can be layered in front if needed.

## Architecture Deep Dive

1. **Ingestion & Enrichment**
   - `scripts/ingest_data.py` pulls curated RSS feeds defined in `app/core/feeds.yaml`.
   - Text is chunked, embedded with Groq-hosted `llama-3.1-8b-instant` embeddings, and persisted inside multiple ChromaDB collections (`chroma_db/`), one per geography.
   - Embeddings are versioned on disk for reproducible rebuilds and synced to production via Docker volumes or persistent volumes.

2. **Semantic Routing & Retrieval**
   - `app/services/rag_service.py` selects the right regional vector store using intent classifiers.
   - Retrieval augments each user query with top-k passages before dispatching to Groq’s hosted LLM via LangChain, ensuring deterministic latency.

3. **API & Application Layer**
   - FastAPI (`app/main.py`) exposes auth and chat routers, enforces JWT-based security, and adds structured logging through `structlog`.
   - LangSmith tracing is toggled via environment to capture every prompt/response pair.
   - User sessions plus chat history are persisted in PostgreSQL (SQLAlchemy models + Alembic migrations).

4. **Frontend Experience**
   - Next.js 14 app (`frontend/`) streams responses via Server-Sent Events, provides auth UX, and proxies `/api/*` to the FastAPI backend in development.

5. **Persistence & Observability**
   - PostgreSQL runs both locally (`docker-compose.yml`) and in-cluster (`k8s/postgres.yaml`) with persistent volumes to retain chat history.
   - Loki + Promtail ship structured logs to Grafana dashboards (`k8s/logging/*`), giving real-time observability over request latency, error rates, and token usage.

6. **Runtime & Deployment**
   - AWS EC2 t3.medium node hosts a lightweight K3s cluster orchestrating backend, frontend, DB, and observability stack.
   - Traefik ingress handles routing (`/api` → FastAPI, `/` → Next.js, `grafana.*` → dashboards).
   - Terraform codifies network, compute, and storage resources, while GitHub Actions handles container builds and rolling deploys.

### Architecture Choices (Why)
- **Region-aware vector stores:** Keeps embeddings small and improves relevance by avoiding cross-continent mixing.
- **Groq-hosted Llama models:** Provides low-latency inference with generous rate limits vs. self-hosting GPUs.
- **FastAPI + LangChain:** Async API with first-class streaming support and straightforward LLM integrations.
- **PostgreSQL for auth/history:** Strong relational guarantees for audit trails and future analytics.
- **K3s on single EC2:** Balances cost with Kubernetes-level tooling (Traefik ingress, horizontal scaling, GitOps).
- **GitHub Actions CI/CD:** Declarative pipeline that builds/pushes Docker images, updates deployments via SSH, and runs Alembic migrations automatically.
- **Loki/Grafana/Promtail:** Keeps ops light while still delivering centralized logging and live dashboards.

## Comprehensive Tech Stack

| Layer | Tools & Versions | Rationale |
| --- | --- | --- |
| LLM & Orchestration | Groq API (Llama-3.1-8b instant), LangChain, LangSmith | Deterministic latency, prompt tracing, and router support. |
| Retrieval | ChromaDB (persistent), custom semantic router | Lightweight, embeddable vector store per region. |
| Backend | FastAPI 0.111+, Python 3.11, Pydantic v2, structlog | Async APIs, type-safe configs, structured logging. |
| Auth & Security | JWT (HS256), OAuth-ready scaffolding in `app/api/routers/auth.py` | Token-based auth that aligns with frontend session handling. |
| Data Layer | PostgreSQL 15, SQLAlchemy, Alembic | Durable chat history + migrations. |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind, SWR | Streaming UI with app directory conventions. |
| Infrastructure | Terraform, AWS EC2 (t3.medium), K3s, Traefik Ingress | Repeatable provisioning + lightweight K8s. |
| Containers | Docker, Docker Compose, multi-arch Buildx | Consistent builds locally and in CI. |
| CI/CD | GitHub Actions, Docker Hub registry | Build → push → remote kubectl rollout with zero-downtime steps. |
| Observability | Grafana, Loki, Promtail, structlog JSON, LangSmith tracing | Unified dashboards + prompt analytics. |
| Testing | Pytest, httpx test clients, coverage-ready config | Regression safety for auth/chat/rag services. |

## Local Development

1. **Prerequisites**
   - Python 3.11, Node.js 18+, Docker Desktop, Make/PowerShell (for scripts), Groq + LangSmith API keys.

2. **Backend Setup**
   ```bash
   python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env  # create file if missing, see Config section below
   docker compose up db -d  # optional: start Postgres locally
   uvicorn app.main:app --reload
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Docker-first Workflow**
   ```bash
   docker compose up --build
   ```

5. **Seed Vector Stores**
   ```bash
   python scripts/ingest_data.py --region all
   ```

## Configuration Reference

Create a `.env` file with at least:

```
CHROMA_PATH=./chroma_db
GROQ_API_KEY=...
GROQ_MODEL_NAME=llama-3.1-8b-instant
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_DB=newscenter
SECRET_KEY=change_me
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_API_KEY=...
LANGCHAIN_PROJECT=newsbot-rag
```

## Testing & Quality Gates

- **Unit/Integration:** `pytest -q` (covers auth, chat, routing services).
- **Formatting/Lint (optional):** `ruff check`, `black`, `mypy`.
- **Contract testing:** Validate `/api/docs` schema anytime the FastAPI routers change.

## Deployment Workflow

1. **CI Build (GitHub Actions)**
   - Triggers on push/PR to `main`.
   - Builds `teromonte/newscenter-api` and `teromonte/newsbot-frontend` via Docker Buildx (linux/amd64) and pushes `latest` + SHA tags.

2. **CD Stage**
   - SSH into the K3s node, scales deployments to zero, prunes images, sets new image versions, scales back up, waits for rollout, then runs `alembic upgrade head`.

3. **Infrastructure as Code**
   - `terraform apply` provisions EC2, security groups, and storage.
   - `k8s/*.yaml` applied via `kubectl` or ArgoCD for manifests (API, frontend, Postgres, ingress, logging stack).

4. **Rollback**
   - Repoint deployments to the last known good Docker tags (`kubectl set image ...`) or run the scripted rollback flow in `DEPLOYMENT_CHEATSHEET.md`.

## Roadmap & Enhancements

- Add automated evaluation of RAG responses (LangSmith dataset runs).
- Introduce autoscaling (KEDA/HPA) once traffic patterns stabilize.
- Wire HTTPS certificates (Let’s Encrypt via Traefik) for public-facing hosts.
- Publish a Postman collection and embed it in the Utils section.

---

Questions or looking to extend the stack? Reach out or open an issue—this repo is intentionally transparent so reviewers can assess every architectural decision end-to-end.
