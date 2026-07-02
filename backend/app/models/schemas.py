from pydantic import BaseModel, Field
from typing import List, Optional

class DocumentUploadResponse(BaseModel):
    doc_id: str
    filename: str
    status: str
    chunk_count: int

class DocumentListItem(BaseModel):
    doc_id: str
    filename: str
    upload_date: str
    page_count: int
    status: str

class ChatRequest(BaseModel):
    query: str
    doc_ids: Optional[List[str]] = Field(default=None, description="List of document IDs to search. If empty, search all documents.")

class SourceCitation(BaseModel):
    doc_id: str
    filename: str
    page_number: int
    clause_text: str = Field(..., max_length=200, description="Exact clause text snippet, truncated to 200 characters.")
    chunk_id: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceCitation]
    query: str
