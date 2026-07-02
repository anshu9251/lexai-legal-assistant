from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import documents, chat
from app.config import settings
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing LegalContract Intelligence Assistant backend...")
    logger.info(f"Loaded config: QDRANT_COLLECTION_NAME={settings.QDRANT_COLLECTION_NAME}, MAX_UPLOAD_SIZE_MB={settings.MAX_UPLOAD_SIZE_MB}")
    
    # Initialize Qdrant collection
    try:
        from qdrant_client import QdrantClient
        from qdrant_client.models import VectorParams, Distance
        
        client = QdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY)
        
        # Check if collection exists
        exists = False
        try:
            if hasattr(client, "collection_exists"):
                exists = client.collection_exists(collection_name=settings.QDRANT_COLLECTION_NAME)
            else:
                collections = client.get_collections().collections
                exists = any(c.name == settings.QDRANT_COLLECTION_NAME for c in collections)
        except Exception:
            # Fallback
            try:
                client.get_collection(collection_name=settings.QDRANT_COLLECTION_NAME)
                exists = True
            except Exception:
                exists = False
                
        if not exists:
            logger.info(f"Creating Qdrant collection: {settings.QDRANT_COLLECTION_NAME}")
            client.create_collection(
                collection_name=settings.QDRANT_COLLECTION_NAME,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE)
            )
        
        # Ensure payload index for doc_id exists to support filtering/deletes
        try:
            logger.info("Ensuring payload index exists for field 'doc_id'...")
            client.create_payload_index(
                collection_name=settings.QDRANT_COLLECTION_NAME,
                field_name="doc_id",
                field_schema="keyword"
            )
        except Exception as idx_err:
            logger.warning(f"Could not create payload index for doc_id: {idx_err}")
            
        logger.info("Qdrant collection ready")
    except Exception as e:
        logger.warning(f"Qdrant is unreachable or failed to initialize: {e}")
        
    yield
    # Shutdown actions
    logger.info("Cleaning up backend resources...")

app = FastAPI(
    title="LegalContract Intelligence Assistant API",
    description="FastAPI scaffold for RAG-based contract question-answering",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

@app.get("/", tags=["System"])
async def root():
    return {"status": "LexAI Backend API is running perfectly!"}

# Health check endpoint
@app.get("/api/health", tags=["System"])
async def health_check():
    return {"status": "ok"}
