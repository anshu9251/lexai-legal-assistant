from datetime import datetime
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Header
from app.models.schemas import DocumentUploadResponse, DocumentListItem
from app.config import settings
from app.services.document_service import DocumentService
from app.services.storage_service import StorageService

router = APIRouter()

# Instantiate services
document_service = DocumentService()
storage_service = StorageService()

@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_document(file: UploadFile = File(...), x_session_id: str | None = Header(None)):
    # Validate extension
    filename = file.filename or ""
    if not (filename.lower().endswith(".pdf") or filename.lower().endswith(".docx")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF and DOCX files are supported."
        )
    
    # Validate file size
    if file.size is not None:
        max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if file.size > max_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds the limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )
            
    # Generate doc_id and upload date
    doc_id = str(uuid.uuid4())
    upload_date = datetime.utcnow().isoformat()
    
    try:
        # Save file locally using storage service
        file_path = storage_service.save_upload(file, doc_id)
        
        # Parse document
        pages = document_service.parse_document(file_path, filename)
        
        if not pages:
            # If document has no text content
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file contains no readable text."
            )
            
        # Chunk document pages
        chunks = document_service.chunk_pages(pages)
        
        # Add doc_id, upload_date, and session_id to every chunk
        for chunk in chunks:
            chunk["doc_id"] = doc_id
            chunk["upload_date"] = upload_date
            chunk["session_id"] = x_session_id
            
        # Embed and store in Qdrant
        chunk_count = document_service.embed_and_store(chunks, doc_id)
        
        return DocumentUploadResponse(
            doc_id=doc_id,
            filename=filename,
            status="indexed",
            chunk_count=chunk_count
        )
    except HTTPException:
        # Re-raise HTTP exceptions to preserve their status code
        raise
    except Exception as e:
        # Ensure cleanup of stored files on failure
        storage_service.delete_upload(doc_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during document ingestion: {str(e)}"
        )

@router.get("/list", response_model=list[DocumentListItem])
async def list_documents(x_session_id: str | None = Header(None)):
    try:
        docs = document_service.list_documents(x_session_id)
        # Map list_documents payload to DocumentListItem
        return [
            DocumentListItem(
                doc_id=d["doc_id"],
                filename=d["filename"],
                upload_date=d["upload_date"],
                page_count=d["page_count"],
                status="indexed"
            )
            for d in docs
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve document list: {str(e)}"
        )

@router.delete("/{doc_id}")
async def delete_document(doc_id: str, x_session_id: str | None = Header(None)):
    try:
        # Delete from Qdrant, restricting to user's session ID
        document_service.delete_document(doc_id, x_session_id)
        
        # Delete local files
        storage_service.delete_upload(doc_id)
        
        return {"deleted": True}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}"
        )
