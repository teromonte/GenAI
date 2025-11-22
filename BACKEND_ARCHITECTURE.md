# Backend Architecture Guide

## 🏗️ Overview

Your backend is a **FastAPI** application that implements a **RAG (Retrieval-Augmented Generation)** system for chatting with news articles. It uses:
- **FastAPI** - Web framework for building APIs
- **PostgreSQL** - Relational database (users, feeds, articles, chat history)
- **ChromaDB** - Vector database (for semantic search of articles)
- **LangChain** - Framework for building LLM applications
- **Groq** - LLM provider (for generating answers)

---

## 📁 Project Structure

```
app/
├── main.py              # 🚀 Entry point - starts the server
├── core/                # Configuration and utilities
│   ├── config.py        # Settings (database, API keys, etc.)
│   ├── security.py      # Password hashing & JWT tokens
│   └── logging.py       # Logging setup
├── db/                  # Database layer
│   ├── models.py        # SQLAlchemy models (User, Feed, Article, ChatHistory)
│   ├── session.py       # Database connection management
│   └── vector_store.py  # ChromaDB setup for embeddings
├── api/                 # API endpoints (routes)
│   ├── routers/         # Route handlers
│   │   ├── auth.py      # Login, signup endpoints
│   │   ├── chat.py      # Chat endpoints
│   │   └── feeds.py     # RSS feed management
│   ├── schemas.py       # Request/Response data models (Pydantic)
│   └── deps.py          # Dependencies (authentication, database)
└── services/            # Business logic
    ├── rag_service.py   # RAG pipeline (retrieve + generate)
    ├── feed_service.py  # RSS feed operations
    ├── rss_fetcher.py   # Fetches RSS feeds
    └── vector_service.py # Vector database operations
```

---

## 🚀 Main Entry Point: `app/main.py`

This is where your application **starts**. Here's what it does:

### 1. **Setup & Configuration**
```python
# Sets up logging
setup_logging()

# Configures LangSmith (for tracing LLM calls)
os.environ["LANGCHAIN_TRACING_V2"] = settings.LANGCHAIN_TRACING_V2
```

### 2. **Creates FastAPI App**
```python
app = FastAPI(
    title="NewsBot RAG API",
    description="An API for chatting with recent news from Brazil and Europe.",
    version="1.0.6"
)
```

### 3. **Middleware**
- Logs every HTTP request with timing information
- Adds a unique `request_id` to each request

### 4. **Registers Routes**
```python
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(feeds.router, prefix="/api/feeds", tags=["Feeds"])
```

**This connects:**
- `/api/auth/*` → `auth.py` router
- `/api/chat/*` → `chat.py` router
- `/api/feeds/*` → `feeds.py` router

---

## 🔄 Request Flow: How a Chat Request Works

Let's trace what happens when a user asks a question:

```
1. User sends POST /api/chat
   ↓
2. FastAPI receives request → chat.py router
   ↓
3. Authentication check (get_current_user)
   - Extracts JWT token from header
   - Validates token
   - Returns User object
   ↓
4. Database session (get_db)
   - Creates a database connection
   ↓
5. RAG Service (get_rag_service)
   - Injects RAGService instance
   ↓
6. RAGService.ask_question()
   - Retrieves relevant articles from ChromaDB
   - Generates answer using LLM (Groq)
   ↓
7. Save to database
   - Creates ChatHistory record
   ↓
8. Return response
   - Answer + source documents + history_id
```

---

## 🧩 Key Classes & Their Roles

### 1. **Database Models** (`app/db/models.py`)

These represent your **database tables**:

#### `User`
- Stores user accounts (email, hashed password)
- **Relationship**: One user → Many chat history items

#### `ChatHistory`
- Stores Q&A pairs from conversations
- **Relationship**: Belongs to one user

#### `Feed`
- RSS feed sources (name, URL, category)
- **Relationship**: One feed → Many articles

#### `Article`
- News articles from RSS feeds
- **Relationship**: Belongs to one feed

**Key Concept**: SQLAlchemy uses these classes to interact with PostgreSQL. When you do `db.query(User)`, it translates to SQL queries.

---

### 2. **API Routers** (`app/api/routers/`)

These handle **HTTP requests**:

#### `auth.py` - Authentication
- **`POST /api/auth/signup`**: Creates new user account
- **`POST /api/auth/token`**: Logs in, returns JWT token

**Flow:**
```
Signup: UserCreate → Hash password → Save to DB → Return UserOut
Login: Email + Password → Verify → Create JWT → Return Token
```

#### `chat.py` - Chat Endpoints
- **`POST /api/chat`**: Ask a question (non-streaming)
- **`POST /api/chat/stream`**: Ask a question (streaming response)
- **`GET /api/chat/history`**: Get chat history
- **`DELETE /api/chat/history/{id}`**: Delete a history item

**Flow:**
```
Question → RAGService → Retrieve articles → Generate answer → Save history → Return
```

#### `feeds.py` - Feed Management
- **`POST /api/feeds`**: Add new RSS feed
- **`GET /api/feeds`**: List all feeds
- **`DELETE /api/feeds/{id}`**: Delete feed
- **`POST /api/feeds/{id}/refresh`**: Fetch new articles from feed

---

### 3. **Services** (`app/services/`)

These contain **business logic** (the "how" of your app):

#### `RAGService` - The Brain 🧠
**Purpose**: Implements the RAG pipeline

**Key Methods:**
- `ask_question(question)` - Non-streaming chat
- `ask_question_stream(question)` - Streaming chat
- `generate_article(topic)` - Generate article from topic

**How it works:**
```python
1. Retrieve: vector_service.get_retriever() → Finds relevant articles
2. Generate: LLM (Groq) → Creates answer based on retrieved articles
3. Return: Answer + source documents
```

**Dependencies:**
- `VectorService` - For retrieving articles
- `ChatGroq` - LLM for generating answers
- Prompts from `prompts.yaml`

#### `FeedService` - Feed Manager
**Purpose**: Manages RSS feeds and articles

**Key Methods:**
- `create_feed()` - Add new feed
- `update_feed_articles()` - Fetch & save new articles
- `get_feeds()` - List all feeds
- `delete_feed()` - Remove feed

**How it works:**
```python
1. RSSFetcher.fetch(url) → Gets articles from RSS feed
2. Check if article exists in DB
3. Save new articles to PostgreSQL
4. Create embeddings → Save to ChromaDB (via VectorService)
```

**Dependencies:**
- `RSSFetcher` - Fetches RSS feeds
- `VectorService` - Stores article embeddings
- Database session

#### `RSSFetcher` - RSS Parser
**Purpose**: Fetches and parses RSS feeds

**Key Method:**
- `fetch(url)` - Returns list of feed entries

**Uses**: `feedparser` library

#### `VectorService` - Vector Database Manager
**Purpose**: Manages ChromaDB (vector database)

**Key Methods:**
- `add_documents()` - Store article embeddings
- `get_retriever()` - Get retriever for semantic search

**How it works:**
- Uses **HuggingFace embeddings** to convert text → vectors
- Stores vectors in **ChromaDB**
- Enables **semantic search** (finding similar articles by meaning)

---

### 4. **Core Utilities** (`app/core/`)

#### `config.py` - Settings
**Purpose**: Centralized configuration

**Key Properties:**
- Database connection string
- API keys (Groq, LangSmith)
- Embedding model name
- JWT secret key

**Uses**: `pydantic-settings` to load from `.env` file

#### `security.py` - Security Functions
**Purpose**: Password hashing & JWT tokens

**Key Functions:**
- `get_password_hash()` - Hash passwords (bcrypt)
- `verify_password()` - Check if password matches hash
- `create_access_token()` - Generate JWT token

#### `logging.py` - Logging Setup
**Purpose**: Configures structured logging (JSON format)

---

### 5. **Database Layer** (`app/db/`)

#### `session.py` - Database Connection
**Purpose**: Manages database connections

**Key Function:**
- `get_db()` - Dependency that provides database session

**How it works:**
```python
# Creates connection pool
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

# Creates session factory
SessionLocal = sessionmaker(bind=engine)

# Dependency used in routes
def get_db():
    db = SessionLocal()
    try:
        yield db  # Provides session to route
    finally:
        db.close()  # Closes after request
```

#### `vector_store.py` - Vector DB Setup
**Purpose**: Configures ChromaDB

**Key Functions:**
- `get_embedding_function()` - Returns HuggingFace embeddings
- `get_retriever()` - Creates retriever for a collection

---

### 6. **API Layer** (`app/api/`)

#### `schemas.py` - Data Models
**Purpose**: Defines request/response shapes

**Key Models:**
- `ChatRequest` - Input for chat endpoint
- `ChatResponse` - Output from chat endpoint
- `UserCreate` - Input for signup
- `UserOut` - Output for user info
- `Token` - JWT token response

**Uses**: Pydantic for validation

#### `deps.py` - Dependencies
**Purpose**: Reusable dependencies for routes

**Key Function:**
- `get_current_user()` - Validates JWT token, returns User

**How it works:**
```python
# Used in routes like this:
@router.post("/chat")
async def chat(
    current_user: User = Depends(get_current_user),  # ← Dependency injection
    ...
):
    # current_user is automatically provided if token is valid
```

---

## 🔗 How Classes Are Related

### Dependency Graph

```
main.py
  ├── FastAPI app
  │
  ├── Routers (auth, chat, feeds)
  │   ├── Depend on: get_current_user, get_db
  │   └── Use: Services (RAGService, FeedService)
  │
  ├── Services
  │   ├── RAGService
  │   │   └── Uses: VectorService, ChatGroq, Prompts
  │   │
  │   ├── FeedService
  │   │   ├── Uses: RSSFetcher, VectorService
  │   │   └── Uses: Database (models: Feed, Article)
  │   │
  │   ├── VectorService
  │   │   └── Uses: ChromaDB, Embeddings
  │   │
  │   └── RSSFetcher
  │       └── Uses: feedparser library
  │
  └── Core
      ├── config.py (used everywhere)
      ├── security.py (used by auth router)
      └── logging.py (used at startup)
```

### Example: Complete Flow for "What's the latest news?"

```
1. User → POST /api/chat {"question": "What's the latest news?"}
   ↓
2. chat.py router receives request
   ↓
3. get_current_user() validates JWT token
   ↓
4. get_db() provides database session
   ↓
5. get_rag_service() provides RAGService instance
   ↓
6. RAGService.ask_question()
   ├── VectorService.get_retriever()
   │   └── ChromaDB searches for similar articles
   ├── Retrieves top 3-5 relevant articles
   ├── ChatGroq generates answer using articles
   └── Returns answer + source documents
   ↓
7. chat.py saves to ChatHistory table
   ↓
8. Returns ChatResponse to user
```

---

## 🎯 Key Concepts for Beginners

### 1. **Dependency Injection**
FastAPI automatically provides dependencies to your route functions:

```python
@router.post("/chat")
async def chat(
    current_user: User = Depends(get_current_user),  # ← FastAPI calls this
    db: Session = Depends(get_db),                    # ← FastAPI calls this
):
    # current_user and db are automatically provided!
```

### 2. **ORM (Object-Relational Mapping)**
SQLAlchemy lets you use Python classes instead of SQL:

```python
# Instead of: SELECT * FROM users WHERE email = '...'
user = db.query(User).filter(User.email == email).first()
```

### 3. **Vector Embeddings**
Text is converted to numbers (vectors) so computers can find similar meaning:

```
"Brazil election" → [0.1, 0.5, -0.3, ...] (vector)
"Brazilian vote" → [0.12, 0.48, -0.28, ...] (similar vector)
```

### 4. **RAG (Retrieval-Augmented Generation)**
1. **Retrieve**: Find relevant articles from vector database
2. **Augment**: Add articles to LLM prompt as context
3. **Generate**: LLM creates answer based on context

### 5. **JWT Tokens**
Instead of storing login sessions, you use tokens:
- User logs in → Gets token
- User sends token with each request
- Server validates token → Knows who the user is

---

## 🗄️ Database Schema

```
users
├── id (PK)
├── email (unique)
└── hashed_password

chat_history
├── id (PK)
├── user_id (FK → users.id)
├── question
├── answer
└── timestamp

feeds
├── id (PK)
├── name
├── url (unique)
├── category
├── is_active
└── last_fetched

articles
├── id (PK)
├── feed_id (FK → feeds.id)
├── title
├── content
├── url (unique)
├── published_date
└── created_at
```

---

## 🔐 Security Flow

1. **Signup**: Password → Hash (bcrypt) → Store in DB
2. **Login**: Email + Password → Verify → Create JWT → Return token
3. **Protected Routes**: Token → Validate → Extract user email → Query DB → Return User

---

## 📊 Data Flow: Adding a New Feed

```
1. POST /api/feeds
   ↓
2. FeedService.create_feed()
   ├── Creates Feed record in PostgreSQL
   └── Returns Feed object
   ↓
3. POST /api/feeds/{id}/refresh
   ↓
4. FeedService.update_feed_articles()
   ├── RSSFetcher.fetch(url) → Gets articles
   ├── For each new article:
   │   ├── Save to Article table (PostgreSQL)
   │   └── Create Document → VectorService.add_documents()
   │       └── Embedding → ChromaDB
   └── Update feed.last_fetched
```

---

## 🎓 Summary

**Main Class**: `FastAPI` app in `main.py` - This is your application.

**Architecture Pattern**: **Layered Architecture**
- **API Layer** (routers) - Handles HTTP requests
- **Service Layer** - Business logic
- **Data Layer** - Database & vector store

**Key Design Principles**:
1. **Separation of Concerns** - Each module has one job
2. **Dependency Injection** - FastAPI provides dependencies automatically
3. **Service Pattern** - Business logic in services, not routes
4. **Repository Pattern** - Database access through models

**Flow**: Request → Router → Service → Database/Vector Store → Response

---

This architecture makes your code:
- ✅ **Testable** - Each layer can be tested independently
- ✅ **Maintainable** - Clear separation of responsibilities
- ✅ **Scalable** - Easy to add new features
- ✅ **Secure** - Authentication & password hashing built-in

