import json
import re
from typing import Generator
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchAny, MatchValue
from groq import Groq

from app.config import settings
from app.services.document_service import _embedding_model

class RAGService:
    def __init__(self):
        self.qdrant_client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY
        )
        self.groq_client = Groq(api_key=settings.GROQ_API_KEY)

    def retrieve_chunks(self, query: str, doc_ids: list[str] | None, top_k: int = 6, session_id: str | None = None) -> list[dict]:
        query_vector = _embedding_model.encode(query).tolist()
        
        must_conditions = []
        if doc_ids:
            must_conditions.append(
                FieldCondition(
                    key="doc_id",
                    match=MatchAny(any=doc_ids)
                )
            )
        if session_id:
            must_conditions.append(
                FieldCondition(
                    key="session_id",
                    match=MatchValue(value=session_id)
                )
            )
            
        filter_obj = None
        if must_conditions:
            filter_obj = Filter(must=must_conditions)
            
        results = self.qdrant_client.query_points(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            query=query_vector,
            query_filter=filter_obj,
            limit=top_k,
            with_payload=True
        )
        
        chunks = []
        for result in results.points:
            payload = result.payload
            chunks.append({
                "chunk_id": payload.get("chunk_id", ""),
                "doc_id": payload.get("doc_id", ""),
                "filename": payload.get("filename", ""),
                "page_number": payload.get("page_number", 1),
                "text": payload.get("text", ""),
                "score": result.score
            })
        return chunks

    def build_context(self, chunks: list[dict]) -> str:
        context = ""
        for i, chunk in enumerate(chunks):
            context += f"""
[Source {i+1}: {chunk['filename']}, Page {chunk['page_number']}]
{chunk['text']}
---
"""
        return context.strip()

    def build_prompt(self, query: str, context: str) -> str:
        return f"""You are a legal contract analysis assistant. You help users understand 
legal contracts by answering their questions clearly and precisely.

You have been provided with relevant excerpts from legal documents. 
Use ONLY the provided context to answer the question. 
If the answer is not found in the context, say: 
"I could not find information about this in the provided contracts."

Always cite which document and page number your answer comes from.
Be concise but thorough. Use plain English, not legal jargon.

CONTEXT FROM CONTRACTS:
{context}

USER QUESTION:
{query}

ANSWER:"""

    def ask_groq(self, prompt: str) -> str:
        response = self.groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024,
            temperature=0.1
        )
        return response.choices[0].message.content

    def ask_groq_stream(self, prompt: str) -> Generator:
        stream = self.groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024,
            temperature=0.1,
            stream=True
        )
        for chunk in stream:
            token = chunk.choices[0].delta.content
            if token:
                yield token

    def analyze_risks(self, chunks: list[dict]) -> list[dict]:
        risk_prompt = f"""You are a legal risk analyst. Analyze these contract excerpts 
and identify risky or unusual clauses the user should pay attention to.

CONTRACT EXCERPTS:
{self.build_context(chunks)}

Return ONLY a JSON array (no markdown, no explanation, just raw JSON).
Each item must have exactly these fields:
- "risk_level": "high", "medium", or "low"
- "clause_ref": short reference like "Clause 8.2" or "Section 3" or 
  "Page 4" — extract from context if visible, else use "See document"
- "explanation": one sentence explaining why this clause is risky, 
  in plain English, max 120 characters
- "filename": which document this is from

Return between 2 and 5 risk items. Return [] if nothing risky is found.
Example format:
[
  {{"risk_level": "high", "clause_ref": "Section 5.1", 
    "explanation": "Non-compete spans 3 years globally with no geographic limit.",
    "filename": "NDA_Acme.pdf"}}
]"""
        
        response = self.ask_groq(risk_prompt)
        
        try:
            clean = re.sub(r'```json|```', '', response).strip()
            return json.loads(clean)
        except Exception:
            return []
