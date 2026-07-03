import uuid
import logging
from uuid import UUID
from fastapi import HTTPException
import pdfplumber
import docx
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, Filter, FieldCondition, MatchValue

from app.config import settings

logger = logging.getLogger("backend")

# Initialize the embedding model once at module level
_embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

class DocumentService:
    def parse_document(self, file_path: str, filename: str) -> list[dict]:
        """
        Parses PDF or DOCX file and extracts text page-by-page.
        Returns a list of dicts: {"text": str, "page_number": int, "filename": str}
        """
        pages = []
        
        if filename.lower().endswith(".pdf"):
            try:
                with pdfplumber.open(file_path) as pdf:
                    for i, page in enumerate(pdf.pages):
                        text = page.extract_text()
                        if text and text.strip():
                            pages.append({
                                "text": text.strip(),
                                "page_number": i + 1,
                                "filename": filename
                            })
            except Exception as e:
                logger.error(f"Error parsing PDF file {filename}: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to parse PDF file: {str(e)}"
                )
                
        elif filename.lower().endswith(".docx"):
            try:
                doc = docx.Document(file_path)
                paragraphs = [p.text.strip() for p in doc.paragraphs if p.text and p.text.strip()]
                
                # Group every 3 paragraphs as one "page" with an incremented page_number
                current_group = []
                page_num = 1
                for p in paragraphs:
                    current_group.append(p)
                    if len(current_group) == 3:
                        text_content = "\n\n".join(current_group)
                        if text_content.strip():
                            pages.append({
                                "text": text_content.strip(),
                                "page_number": page_num,
                                "filename": filename
                            })
                        current_group = []
                        page_num += 1
                
                # Add remainder paragraphs
                if current_group:
                    text_content = "\n\n".join(current_group)
                    if text_content.strip():
                        pages.append({
                            "text": text_content.strip(),
                            "page_number": page_num,
                            "filename": filename
                        })
            except Exception as e:
                logger.error(f"Error parsing DOCX file {filename}: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to parse DOCX file: {str(e)}"
                )
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format. Only PDF and DOCX are supported."
            )
            
        return pages

    def chunk_pages(self, pages: list[dict], chunk_size: int = 800, chunk_overlap: int = 150) -> list[dict]:
        """
        Chunks text from pages using RecursiveCharacterTextSplitter.
        """
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len
        )
        
        chunks = []
        for page in pages:
            page_text = page["text"]
            page_num = page["page_number"]
            filename = page["filename"]
            
            split_texts = splitter.split_text(page_text)
            for t in split_texts:
                if not t.strip():
                    continue
                chunks.append({
                    "chunk_id": str(uuid.uuid4()),
                    "doc_id": "", # Will be filled by router / caller
                    "text": t.strip(),
                    "page_number": page_num,
                    "filename": filename,
                    "char_count": len(t.strip())
                })
        return chunks

    def embed_and_store(self, chunks: list[dict], doc_id: str) -> int:
        """
        Embeds chunk texts and stores them in Qdrant.
        """
        if not chunks:
            return 0
            
        try:
            texts = [c["text"] for c in chunks]
            embeddings = _embedding_model.encode(texts, batch_size=32)
            
            client = QdrantClient(
                url=settings.QDRANT_URL,
                api_key=settings.QDRANT_API_KEY
            )
            
            points = []
            for chunk, embedding in zip(chunks, embeddings):
                chunk_id = chunk["chunk_id"]
                # Convert string UUID to proper string UUID for Qdrant
                point_uuid = str(UUID(chunk_id))
                
                # Payload contains all chunk fields
                payload = dict(chunk)
                
                points.append(
                    PointStruct(
                        id=point_uuid,
                        vector=embedding.tolist(),
                        payload=payload
                    )
                )
                
            client.upsert(
                collection_name=settings.QDRANT_COLLECTION_NAME,
                points=points
            )
            return len(chunks)
        except Exception as e:
            logger.error(f"Error upserting points to Qdrant for doc_id {doc_id}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to index document chunks: {str(e)}"
            )

    def delete_document(self, doc_id: str) -> bool:
        """
        Deletes all points in Qdrant belonging to doc_id.
        """
        try:
            client = QdrantClient(
                url=settings.QDRANT_URL,
                api_key=settings.QDRANT_API_KEY
            )
            
            # Using delete_points with Filter and FieldCondition
            delete_filter = Filter(
                must=[
                    FieldCondition(
                        key="doc_id",
                        match=MatchValue(value=doc_id)
                    )
                ]
            )
            
            client.delete(
                collection_name=settings.QDRANT_COLLECTION_NAME,
                points_selector=delete_filter
            )
            return True
        except Exception as e:
            logger.error(f"Error deleting points for doc_id {doc_id} from Qdrant: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to delete document from vector database: {str(e)}"
            )

    def list_documents(self) -> list[dict]:
        """
        Retrieves unique documents in Qdrant collection.
        Returns unique docs with: doc_id, filename, page_count (max page number), chunk_count, upload_date
        """
        try:
            client = QdrantClient(
                url=settings.QDRANT_URL,
                api_key=settings.QDRANT_API_KEY
            )
            
            docs = {}
            offset = None
            
            while True:
                # Scroll through points
                records, offset = client.scroll(
                    collection_name=settings.QDRANT_COLLECTION_NAME,
                    limit=100,
                    offset=offset,
                    with_payload=True,
                    with_vectors=False
                )
                
                for record in records:
                    payload = record.payload
                    if not payload:
                        continue
                        
                    doc_id = payload.get("doc_id")
                    if not doc_id:
                        continue
                        
                    filename = payload.get("filename", "unknown")
                    page_number = payload.get("page_number", 1)
                    upload_date = payload.get("upload_date", "unknown")
                    
                    if doc_id not in docs:
                        docs[doc_id] = {
                            "doc_id": doc_id,
                            "filename": filename,
                            "page_count": page_number,
                            "chunk_count": 1,
                            "upload_date": upload_date
                        }
                    else:
                        docs[doc_id]["chunk_count"] += 1
                        docs[doc_id]["page_count"] = max(docs[doc_id]["page_count"], page_number)
                        
                if offset is None:
                    break
                    
            return list(docs.values())
        except Exception as e:
            logger.error(f"Error scrolling documents from Qdrant: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to list documents from vector database: {str(e)}"
            )
