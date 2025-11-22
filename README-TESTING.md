# 🚀 Local Development Guide

This guide explains how to run the GenAI application locally with full visibility into logs.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Python 3.11+
- Node.js 18+

## 🛠️ Quick Start (Recommended)

Simply run the helper script to start everything at once:

```powershell
.\start-dev.ps1
```

Or follow the manual steps below.

## 🛠️ Manual Start

You will need **2 terminal windows**.

### Terminal 1: Database (One-time setup)

Start the local PostgreSQL database:

```powershell
docker-compose up -d
```

Run migrations to create tables (only needed first time or after model changes):

```powershell
python -m alembic upgrade head
```

**Note**: The local database runs on port **5433** (not 5432) to avoid conflicts.

### Terminal 2: Backend API

Start the FastAPI server. Logs will appear here.

```powershell
# Make sure venv is activated
python -m uvicorn app.main:app --reload --port 8000
```

### Terminal 3: Frontend

Start the Next.js development server. Logs will appear here.

```powershell
cd frontend
npm run dev
```

## 🌐 Accessing the App

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Database**: `localhost:5432` (user: `genai_user`, pass: `genai_password`, db: `genai_db`)

## 🧪 Testing Workflow

1. **Login/Signup**: Go to [http://localhost:3000/signup](http://localhost:3000/signup) to create a local account.
2. **Feeds**: Add RSS feeds in the sidebar.
3. **Write**: Generate articles.
4. **Chat**: Use the RAG chat.

## 📊 Viewing Logs

All logs are visible in the terminal windows:

- **Backend logs**: Terminal 2 (API requests, database queries, errors)
- **Frontend logs**: Terminal 3 (page renders, client-side errors)
- **Database logs**: Run `docker-compose logs postgres -f` to see PostgreSQL logs

## 🧹 Cleanup

To stop the database:

```powershell
docker-compose down
```

To stop and remove all data:

```powershell
docker-compose down -v
```
