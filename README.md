# NewsCenter RAG API 🤖🌍

A Geo-Aware Retrieval Augmented Generation (RAG) chatbot that intelligently routes questions to specific knowledge bases (Africa/Europe) and persists conversation history.

## 🏗 Tech Stack

*   **LLM:** Groq (Llama-3.1-8b) via LangChain
*   **Vector DB:** ChromaDB (Local persistence)
*   **Database:** PostgreSQL (User auth & History)
*   **Backend:** FastAPI (Python 3.11)
*   **Infrastructure:** AWS EC2 (t3.medium), Terraform, Kubernetes (K3s)
*   **DevOps:** Docker, Docker Compose, Alembic Migrations

## 🚀 Architecture

1.  **Ingestion:** Python scripts fetch RSS feeds, chunk text, and embed vectors into ChromaDB.
2.  **Routing:** A semantic router decides which vector store to query based on the user's intent.
3.  **Retrieval:** Context is fetched and passed to Llama 3.1 for answer generation.
4.  **Persistence:** User chats are authenticated (JWT) and saved to Postgres.

## ☁️ Deployment

The infrastructure is fully automated using **Terraform** and **Kubernetes**.

1.  `terraform apply` provisions the AWS Cloud environment.
2.  `kubectl apply` orchestrates the Microservices (API + DB).
