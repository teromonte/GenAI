# Quick Reference Guide

## 🚀 Starting the Application

```bash
# The main entry point is:
app/main.py

# Run with:
uvicorn app.main:app --reload
```

---

## 📍 Main Entry Point

**File**: `app/main.py`

**What it does**:
- Creates FastAPI application
- Sets up logging
- Configures LangSmith tracing
- Registers all API routes
- Adds request logging middleware

---

## 🗺️ API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/token` - Login, get JWT token

### Chat (`/api/chat`)
- `POST /api/chat` - Ask question (non-streaming)
- `POST /api/chat/stream` - Ask question (streaming)
- `GET /api/chat/history` - Get chat history
- `DELETE /api/chat/history/{id}` - Delete history item

### Feeds (`/api/feeds`)
- `POST /api/feeds` - Add new RSS feed
- `GET /api/feeds` - List all feeds
- `DELETE /api/feeds/{id}` - Delete feed
- `POST /api/feeds/{id}/refresh` - Fetch new articles

---

## 🏛️ Database Models

| Model | Table | Purpose |
|-------|-------|---------|
| `User` | `users` | User accounts |
| `ChatHistory` | `chat_history` | Conversation history |
| `Feed` | `feeds` | RSS feed sources |
| `Article` | `articles` | News articles |

**Location**: `app/db/models.py`

---

## 🔧 Services

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| `RAGService` | RAG pipeline | `ask_question()`, `ask_question_stream()` |
| `FeedService` | Feed management | `create_feed()`, `update_feed_articles()` |
| `RSSFetcher` | RSS parsing | `fetch(url)` |
| `VectorService` | Vector DB ops | `add_documents()`, `get_retriever()` |

**Location**: `app/services/`

---

## 🔐 Security

**Password Hashing**: `app/core/security.py`
- `get_password_hash()` - Hash password
- `verify_password()` - Verify password

**JWT Tokens**: `app/core/security.py`
- `create_access_token()` - Generate JWT

**Authentication**: `app/api/deps.py`
- `get_current_user()` - Validate token, return User

---

## 📊 Data Flow Summary

### Chat Request
```
Client → Router → Auth Check → RAGService → VectorService → ChromaDB
                                                      ↓
Client ← Router ← Save History ← Generate Answer ← LLM (Groq)
```

### Feed Refresh
```
Client → Router → FeedService → RSSFetcher → Parse RSS
                                           ↓
PostgreSQL ← FeedService ← Create Articles ← For each entry
                                           ↓
ChromaDB ← VectorService ← Embed Articles
```

---

## 🔗 Key Dependencies

| Component | Depends On |
|-----------|------------|
| `RAGService` | `VectorService`, `ChatGroq`, Prompts |
| `FeedService` | `RSSFetcher`, `VectorService`, Database |
| `VectorService` | ChromaDB, HuggingFace Embeddings |
| Routers | `get_current_user()`, `get_db()`, Services |

---

## 📝 Configuration

**File**: `app/core/config.py`

**Key Settings**:
- `SQLALCHEMY_DATABASE_URI` - PostgreSQL connection
- `CHROMA_PATH` - ChromaDB storage location
- `GROQ_API_KEY` - LLM API key
- `EMBEDDING_MODEL_NAME` - Embedding model
- `SECRET_KEY` - JWT signing key

**Source**: `.env` file (loaded via `pydantic-settings`)

---

## 🗄️ Database Connection

**File**: `app/db/session.py`

**Function**: `get_db()`
- Creates database session
- Yields to route handler
- Closes after request

**Usage in routes**:
```python
@router.post("/endpoint")
def my_endpoint(db: Session = Depends(get_db)):
    # Use db here
    pass
```

---

## 🧠 RAG Pipeline

1. **Retrieve**: `VectorService.get_retriever()` → Finds similar articles
2. **Augment**: Add articles to prompt as context
3. **Generate**: `ChatGroq` LLM creates answer

**Location**: `app/services/rag_service.py`

---

## 📦 External Dependencies

| Library | Purpose |
|---------|---------|
| FastAPI | Web framework |
| SQLAlchemy | ORM (database) |
| ChromaDB | Vector database |
| LangChain | LLM framework |
| Groq | LLM provider |
| feedparser | RSS parsing |
| HuggingFace | Embeddings |

---

## 🎯 Common Patterns

### Dependency Injection
```python
@router.post("/endpoint")
def my_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Dependencies automatically provided
```

### Database Query
```python
# Find user
user = db.query(User).filter(User.email == email).first()

# Create record
new_item = Model(field=value)
db.add(new_item)
db.commit()
```

### Service Usage
```python
# In router
service = FeedService(db)
result = service.create_feed(name, url, category)
```

---

## 🐛 Debugging Tips

1. **Check logs**: Structured JSON logs via `structlog`
2. **Database**: Check PostgreSQL connection in `session.py`
3. **Vector DB**: Check ChromaDB path in `config.py`
4. **Auth**: Verify JWT token in `deps.py`
5. **RAG**: Check LangSmith traces for LLM calls

---

## 📚 File Locations Quick Reference

| What | Where |
|------|-------|
| Main app | `app/main.py` |
| Database models | `app/db/models.py` |
| API routes | `app/api/routers/` |
| Business logic | `app/services/` |
| Configuration | `app/core/config.py` |
| Security | `app/core/security.py` |
| Database connection | `app/db/session.py` |
| Request/Response models | `app/api/schemas.py` |
| Authentication | `app/api/deps.py` |

---

## 🔄 Request Lifecycle

1. **Request arrives** → FastAPI receives it
2. **Middleware** → Logs request, adds ID
3. **Router** → Matches URL to handler
4. **Dependencies** → Auth, DB session injected
5. **Handler** → Calls service methods
6. **Service** → Business logic execution
7. **Database/Vector** → Data operations
8. **Response** → Return to client

---

## 💡 Key Concepts

- **Dependency Injection**: FastAPI automatically provides dependencies
- **ORM**: SQLAlchemy maps Python classes to database tables
- **Vector Embeddings**: Text converted to numbers for semantic search
- **RAG**: Retrieve relevant docs → Generate answer with context
- **JWT**: Token-based authentication (no server-side sessions)

---

Use this as a cheat sheet when working with the codebase!

