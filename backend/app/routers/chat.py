from fastapi import APIRouter, Header
from fastapi.responses import StreamingResponse
import json
from app.models.schemas import ChatRequest, ChatResponse, SourceCitation
from app.services.rag_service import RAGService

router = APIRouter()

@router.post("/ask", response_model=ChatResponse)
async def ask_question(request: ChatRequest, x_session_id: str | None = Header(None)):
    rag = RAGService()
    chunks = rag.retrieve_chunks(request.query, request.doc_ids, top_k=6, session_id=x_session_id)
    
    if not chunks:
        return ChatResponse(
            answer="I could not find any relevant information in the uploaded contracts for your question.",
            sources=[],
            query=request.query
        )
        
    context = rag.build_context(chunks)
    prompt = rag.build_prompt(request.query, context)
    answer = rag.ask_groq(prompt)
    
    sources = [
        SourceCitation(
            doc_id=c["doc_id"],
            filename=c["filename"],
            page_number=c["page_number"],
            clause_text=c["text"][:200],
            chunk_id=c["chunk_id"]
        )
        for c in chunks
    ]
    
    seen = set()
    unique_sources = []
    for s in sources:
        key = (s.filename, s.page_number)
        if key not in seen:
            seen.add(key)
            unique_sources.append(s)
            
    return ChatResponse(answer=answer, sources=unique_sources, query=request.query)

@router.post("/risks")
async def analyze_risks_endpoint(request: dict, x_session_id: str | None = Header(None)):
    doc_ids = request.get("doc_ids")
    rag = RAGService()
    chunks = rag.retrieve_chunks(
        query="termination penalty liability indemnity non-compete confidentiality breach damages",
        doc_ids=doc_ids,
        top_k=10,
        session_id=x_session_id
    )
    risks = rag.analyze_risks(chunks)
    return {"risks": risks}

@router.get("/stream")
async def ask_question_stream(query: str, doc_ids: str = None, session_id: str | None = None):
    doc_id_list = doc_ids.split(",") if doc_ids else None
    
    def generate():
        rag = RAGService()
        chunks = rag.retrieve_chunks(query, doc_id_list, top_k=6, session_id=session_id)
        
        if not chunks:
            yield "data: I could not find relevant information.\n\n"
            yield "data: [DONE]\n\n"
            return
            
        sources = [
            {
                "doc_id": c["doc_id"],
                "filename": c["filename"],
                "page_number": c["page_number"],
                "clause_text": c["text"][:200],
                "chunk_id": c["chunk_id"]
            }
            for c in chunks
        ]
        
        seen = set()
        unique_sources = []
        for s in sources:
            key = (s["filename"], s["page_number"])
            if key not in seen:
                seen.add(key)
                unique_sources.append(s)
                
        yield f"event: sources\ndata: {json.dumps(unique_sources)}\n\n"

        context = rag.build_context(chunks)
        prompt = rag.build_prompt(query, context)
        
        for token in rag.ask_groq_stream(prompt):
            yield f"data: {token}\n\n"
            
        yield "data: [DONE]\n\n"
        
    return StreamingResponse(
        generate(), 
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )
