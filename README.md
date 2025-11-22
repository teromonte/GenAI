# NewsCenter RAG API 🤖🌍

Geo-aware Retrieval Augmented Generation platform that showcases an end-to-end GenAI stack: ingestion pipelines, multi-region vector stores, Groq-hosted LLMs, secure FastAPI backend, Next.js frontend, and a GitOps-friendly infrastructure footprint on AWS/K3s.

## Purpose & Outcomes

- Demonstrate a production-grade RAG architecture that segments knowledge bases by geography (Africa/Europe/Brazil) and routes queries intelligently.
- Surface the entire technology stack—including AI, data, backend, DevOps, and observability—in one place for stakeholders or hiring panels.
- Provide reproducible local dev flows, automated CI/CD, and live utilities so reviewers can validate the system quickly.

## Live Utilities & Shortcuts

| Utility | URL | Notes |
| --- | --- | --- |
| Public Frontend | `https://247newsbot.monteiro.dev.br/` | Production frontend with SSL certificate (Let's Encrypt). |
| Interactive Docs (Swagger) | `https://247newsbot.monteiro.dev.br/api/docs` | FastAPI OpenAPI UI for manual testing. |
| OpenAPI JSON | `https://247newsbot.monteiro.dev.br/openapi.json` | Useful for client generation. |
| API Base | `https://247newsbot.monteiro.dev.br/api` | Backend API endpoints (JWT-protected routes under `/api/auth` and `/api/chat`). |
| Grafana Dashboards | `http://grafana.newsbot.local` | Traefik ingress `grafana.newsbot.local`; add to hosts file to access Loki/Prom metrics. |
| Local Development | `http://newsbot.local/` | Map `98.92.132.139 newsbot.local` in `/etc/hosts` (Linux/macOS) or `C:\Windows\System32\drivers\etc\hosts` for local testing. |
| LangsSmith | `https://smith.langchain.com/` | LLM logs and metrics |

> Production URLs use HTTPS with automatic SSL certificate management via cert-manager and Let's Encrypt. Local development URLs require hosts file configuration.

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

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Python 3.11+
- Node.js 18+
- Groq + LangSmith API keys

### 🚀 Quick Start (Recommended)

Simply run the helper script to start everything at once:

```powershell
.\start-dev.ps1
```

### 🛠️ Manual Setup

You will need **3 terminal windows**.

#### Terminal 1: Database (One-time setup)

Start the local PostgreSQL database:

```powershell
docker-compose up -d
```

Run migrations to create tables (only needed first time or after model changes):

```powershell
python -m alembic upgrade head
```

**Note**: The local database runs on port **5432** (user: `genai_user`, pass: `genai_password`, db: `genai_db`).

#### Terminal 2: Backend API

Start the FastAPI server. Logs will appear here.

```powershell
# Make sure venv is activated
python -m uvicorn app.main:app --reload --port 8000
```

#### Terminal 3: Frontend

Start the Next.js development server. Logs will appear here.

```powershell
cd frontend
npm run dev
```

### 🌐 Accessing the App

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Database**: `localhost:5432` (user: `genai_user`, pass: `genai_password`, db: `genai_db`)

### 🧪 Testing Workflow

1. **Login/Signup**: Go to [http://localhost:3000/signup](http://localhost:3000/signup) to create a local account.
2. **Feeds**: Add RSS feeds in the sidebar.
3. **Write**: Generate articles.
4. **Chat**: Use the RAG chat.

### 📊 Viewing Logs

All logs are visible in the terminal windows:

- **Backend logs**: Terminal 2 (API requests, database queries, errors)
- **Frontend logs**: Terminal 3 (page renders, client-side errors)
- **Database logs**: Run `docker-compose logs postgres -f` to see PostgreSQL logs

### 🧹 Cleanup

To stop the database:

```powershell
docker-compose down
```

To stop and remove all data:

```powershell
docker-compose down -v
```

### Seed Vector Stores

```bash
python scripts/ingest_data.py --region all
```

## Configuration Reference

Create a `.env` file with at least:

```bash
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

### Quick Deploy (Recommended)

#### Full-Stack Deployment

```powershell
# Update versions in scripts/deploy-fullstack.ps1, then run:
.\scripts\deploy-fullstack.ps1
```

#### Frontend Only

```powershell
# Update VERSION in scripts/deploy-frontend.ps1, then run:
.\scripts\deploy-frontend.ps1
```

### Manual Deployment Steps

#### Build & Deploy

**Step 1: Build Locally**

```powershell
cd frontend
$VERSION = "v1"
docker build --platform linux/amd64 -t teromonte/newsbot-frontend:$VERSION .
docker push teromonte/newsbot-frontend:$VERSION
cd ..
```

**Step 2: Deploy to K8s**

```powershell
$SERVER_IP = "98.92.132.139"
$KEY = "genai-key.pem"

# Copy manifests
scp -i $KEY k8s/frontend-deployment.yaml ubuntu@${SERVER_IP}:~/
scp -i $KEY k8s/frontend-service.yaml ubuntu@${SERVER_IP}:~/
scp -i $KEY k8s/ingress.yaml ubuntu@${SERVER_IP}:~/

# Apply
ssh -i $KEY ubuntu@$SERVER_IP "
  sudo kubectl apply -f frontend-deployment.yaml
  sudo kubectl apply -f frontend-service.yaml
  sudo kubectl apply -f ingress.yaml
"
```

#### "Nuclear Option" (Fail-Safe for Large Images)

Use when deploying massive AI images to resource-constrained servers.

**Phase 1: Build & Push**

```powershell
$VERSION = "v12"
docker build --platform linux/amd64 -t teromonte/newscenter-api:$VERSION .
docker push teromonte/newscenter-api:$VERSION
```

**Phase 2: Remote Cleanup**

```powershell
$SERVER_IP = "98.92.132.139"
$KEY = "genai-key.pem"

ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl scale deployment newscenter-deployment --replicas=0"
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl wait --for=delete pod -l app=newscenter --timeout=60s"
ssh -i $KEY ubuntu@$SERVER_IP "sudo crictl rmi --prune"
ssh -i $KEY ubuntu@$SERVER_IP "sudo crictl pull teromonte/newscenter-api:$VERSION"
```

**Phase 3: Deploy**

```powershell
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl set image deployment/newscenter-deployment newscenter-api=teromonte/newscenter-api:$VERSION"
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl scale deployment newscenter-deployment --replicas=1"
```

**Phase 4: Database Migration**

```powershell
$POD = (ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl get pods -l app=newscenter -o jsonpath='{.items[0].metadata.name}'")
ssh -i $KEY ubuntu@$SERVER_IP "sudo kubectl exec -it $POD -- alembic upgrade head"
```

### Verification Commands

#### Check Pod Status

```powershell
ssh -i genai-key.pem ubuntu@98.92.132.139 "sudo kubectl get pods -l app=newscenter"
ssh -i genai-key.pem ubuntu@98.92.132.139 "sudo kubectl get pods -l app=newsbot-frontend"
```

#### View Logs

```powershell
ssh -i genai-key.pem ubuntu@98.92.132.139 "sudo kubectl logs -l app=newscenter --tail=50"
ssh -i genai-key.pem ubuntu@98.92.132.139 "sudo kubectl logs -l app=newsbot-frontend -f"
```

#### Get Running Versions

```powershell
ssh -i genai-key.pem ubuntu@98.92.132.139 "sudo kubectl get pods -l app=newscenter -o jsonpath='{.items[0].spec.containers[0].image}'"
```

### Troubleshooting

#### Disk Space Issues

```powershell
ssh -i genai-key.pem ubuntu@98.92.132.139 "df -h /"
ssh -i genai-key.pem ubuntu@98.92.132.139 "sudo crictl rmi --prune"
```

#### Pod Not Starting (Common Issue)

```powershell
ssh -i genai-key.pem ubuntu@98.92.132.139 "
  POD=\$(sudo kubectl get pods -l app=newsbot-frontend -o jsonpath='{.items[0].metadata.name}')
  sudo kubectl describe pod \$POD
"
```

### Rollback

```powershell
$BACKEND_VERSION = "v16"
$FRONTEND_VERSION = "v1"

ssh -i genai-key.pem ubuntu@98.92.132.139 "
  sudo kubectl set image deployment/newscenter-deployment newscenter-api=teromonte/newscenter-api:$BACKEND_VERSION
  sudo kubectl set image deployment/newsbot-frontend-deployment newsbot-frontend=teromonte/newsbot-frontend:$FRONTEND_VERSION
  sudo kubectl rollout restart deployment newscenter-deployment
  sudo kubectl rollout restart deployment newsbot-frontend-deployment
"
```

### CI/CD Pipeline

1. **CI Build (GitHub Actions)**
   - Triggers on push/PR to `main`.
   - Builds `teromonte/newscenter-api` and `teromonte/newsbot-frontend` via Docker Buildx (linux/amd64) and pushes `latest` + SHA tags.

2. **CD Stage**
   - SSH into the K3s node, scales deployments to zero, prunes images, sets new image versions, scales back up, waits for rollout, then runs `alembic upgrade head`.

3. **Infrastructure as Code**
   - `terraform apply` provisions EC2, security groups, and storage.
   - `k8s/*.yaml` applied via `kubectl` or ArgoCD for manifests (API, frontend, Postgres, ingress, logging stack).

### CI/CD Pipeline Gate

The pipeline has a **gate** to prevent automatic deployment on every push. It only runs when:

1. **Manually triggered** from GitHub Actions UI, OR
2. **Commit message contains `[deploy]`**

#### Manual Trigger (Recommended)

1. Go to GitHub → **Actions** tab
2. Select **CI/CD Pipeline**
3. Click **Run workflow**
4. Choose environment (`production` or `staging`)
5. Click **Run workflow**

#### Commit Message Tag

```bash
# This WILL trigger deployment
git commit -m "Added new feature [deploy]"
git push origin main

# This will NOT trigger deployment
git commit -m "Updated README"
git push origin main
```

**Benefits:**

- Cost savings (fewer unnecessary builds)
- Faster commits (no waiting for builds)
- Controlled deployments (deploy only when ready)
- Less disk space usage on server

### Hosts File Configuration (Local Development Only)

For local development/testing, you can map the IP to a local hostname:

**Windows:** Edit `C:\Windows\System32\drivers\etc\hosts` (as Administrator)

**Linux/Mac:** Edit `/etc/hosts` (with sudo)

```text
98.92.132.139 newsbot.local
```

Then access: **<http://newsbot.local>**

> **Note:** For production access, use `https://247newsbot.monteiro.dev.br` - no hosts file configuration needed!

## DevOps Command Reference

### 🐳 Docker Commands

| Command | Description |
| --- | --- |
| `docker build --platform linux/amd64 -t user/app:v1 .` | Build image for Linux servers (amd64 architecture) |
| `docker push user/app:v1` | Upload image to Docker Hub |
| `docker images` | List all local images |
| `docker system prune -a` | Clean unused images and containers |

### ☸️ Kubernetes Commands

| Command | Description |
| --- | --- |
| `kubectl get pods -w` | Watch pod status in real-time |
| `kubectl logs <pod_name>` | Read application logs |
| `kubectl describe pod <name>` | Inspect pod details (debug ImagePullBackOff/Pending) |
| `kubectl delete pod <name>` | Kill pod (K8s auto-restarts) |
| `kubectl rollout restart deployment <name>` | Graceful restart of all pods |
| `kubectl exec -it <pod> -- <cmd>` | Execute command inside pod |

### 🏗️ Terraform Commands

| Command | Description |
| --- | --- |
| `terraform init` | Initialize and download AWS plugins |
| `terraform plan` | Preview changes (dry run) |
| `terraform apply` | Execute changes |
| `terraform destroy` | Delete all infrastructure |

### 🔧 Server Commands

| Command | Description |
| --- | --- |
| `df -h` | Check disk space |
| `sudo crictl images` | List images (K3s uses crictl) |
| `sudo crictl rmi --prune` | Remove unused images |
| `sudo k3s kubectl get nodes` | Verify K3s cluster |

### 🧠 Critical Engineering Concepts

- **Image Caching**: Kubernetes caches images. Always use unique version tags (`:v1`, `:v2`) instead of `:latest`.
- **Disk Pressure**: GenAI images are large (4GB+). If disk fills up (>85%), K8s evicts pods. Always check `df -h`.
- **Architecture Mismatch**: AWS servers are `amd64`. Always build with `--platform linux/amd64`.

## Roadmap & Enhancements

- Add automated evaluation of RAG responses (LangSmith dataset runs).
- Introduce autoscaling (KEDA/HPA) once traffic patterns stabilize.
- Configure Grafana subdomain with SSL certificate for secure dashboard access.
- Publish a Postman collection and embed it in the Utils section.

---

Questions or looking to extend the stack? Reach out or open an issue—this repo is intentionally transparent so reviewers can assess every architectural decision end-to-end.
