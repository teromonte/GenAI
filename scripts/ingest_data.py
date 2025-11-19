import feedparser
import logging
import os
import json
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

# Load .env file
load_dotenv()

CHROMA_PATH = os.getenv("CHROMA_PATH", "chroma_db")
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")

RSS_FEEDS = [
    {"name": "brazil_news", "url": "https://www.nytimes.com/svc/collections/v1/publish/https://www.nytimes.com/topic/destination/brazil/rss.xml"},
    {"name": "europe_news", "url": "https://rss.nytimes.com/services/xml/rss/nyt/Europe.xml"}
]

# --- Configuration ---
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

def parse_rss_feed(feed_url: str) -> list[Document]:
    try:
        feed = feedparser.parse(feed_url)
        if feed.bozo:
            logging.warning(f"Error parsing feed {feed_url}: {feed.bozo_exception}")
            return []

        logging.info(f"Found {len(feed.entries)} entries in feed {feed_url}")

        documents = []
        for entry in feed.entries:
            doc = Document(
                page_content=str(entry.get("summary", "")),
                metadata={
                    "title": str(entry.get("title", "No Title")),
                    "source": str(entry.get("link", "")),
                    "published": str(entry.get("published", "N/A")),
                },
            )
            documents.append(doc)
        return documents

    except Exception as e:
        logging.error(f"An unexpected error occurred while parsing {feed_url}: {e}")
        return []


def ingest_data():
    logging.info("Starting data ingestion process...")

    embedding_function = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200, length_function=len)

    for feed_info in RSS_FEEDS:
        name = feed_info["name"]
        url = feed_info["url"]
        logging.info(f"--- Processing collection: {name} from {url} ---")

        docs = parse_rss_feed(url)
        if not docs:
            logging.warning(f"No articles found for {name}. Skipping.")
            continue

        chunks = text_splitter.split_documents(docs)
        logging.info(f"Split {len(docs)} articles into {len(chunks)} chunks.")

        try:
            vector_store = Chroma.from_documents(
                documents=chunks,
                embedding=embedding_function,  # ✅ correct name
                collection_name=name,
                persist_directory=CHROMA_PATH,
            )       

            logging.info(f"Successfully ingested {len(chunks)} chunks into '{name}'.")
        except Exception as e:
            logging.error(f"Failed to ingest into Chroma for collection {name}: {e}")

    logging.info("--- Data ingestion process finished successfully! ---")


if __name__ == "__main__":
    ingest_data()
