# LexAI — Legal Contract Intelligence Assistant

AI-powered contract analysis. Upload legal documents and ask plain-English
questions. Get clause-level citations, risk analysis, and instant answers.

## Live Demo
- **Frontend**: [Vercel URL — update after deploy]
- **Backend API**: [Render URL — update after deploy]

## Features
- Upload PDF and DOCX contracts
- Ask questions in plain English
- Get answers with exact clause + page citations
- One-click risk analysis (detects high/medium/low risk clauses)
- Streaming responses
- Multi-document search

## Tech Stack
**Backend**: FastAPI · LangChain · Qdrant Cloud · Groq (Llama 3.3 70B) ·
sentence-transformers · pdfplumber · Docker

**Frontend**: React · Vite · Lucide Icons · react-markdown

**Infrastructure**: Render (backend) · Vercel (frontend) · Qdrant Cloud

## Local Development

### Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # fill in your keys
uvicorn app.main:app --reload --port 8000

### Frontend
cd frontend
npm install
npm run dev

## Environment Variables

### Backend (.env)
GROQ_API_KEY=           # from console.groq.com
QDRANT_URL=             # from cloud.qdrant.io
QDRANT_API_KEY=         # from cloud.qdrant.io
QDRANT_COLLECTION_NAME=legal_contracts
