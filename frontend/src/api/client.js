import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' }
});

// Session ID Generation & Storage
let sessionId = localStorage.getItem('lexai_session_id');
if (!sessionId) {
  sessionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'sess_' + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('lexai_session_id', sessionId);
}

// Request interceptor to inject Session ID header
client.interceptors.request.use(
  (config) => {
    config.headers['X-Session-ID'] = sessionId;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default client;

export const uploadDocument = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error;
  }
};

export const listDocuments = async () => {
  try {
    const response = await client.get('/api/documents/list');
    return response.data;
  } catch (error) {
    console.error("Error listing documents:", error);
    throw error;
  }
};

export const deleteDocument = async (docId) => {
  try {
    const response = await client.delete(`/api/documents/${docId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

export const askQuestion = async (query, docIds) => {
  try {
    const response = await client.post('/api/chat/ask', {
      query,
      doc_ids: docIds?.length > 0 ? docIds : null
    });
    return response.data;
  } catch (error) {
    console.error("Error asking question:", error);
    throw error;
  }
};

export const analyzeRisks = async (docIds) => {
  try {
    const response = await client.post('/api/chat/risks', {
      doc_ids: docIds?.length > 0 ? docIds : null
    });
    return response.data;
  } catch (error) {
    console.error("Error analyzing risks:", error);
    throw error;
  }
};

export const streamAnswer = (query, docIds, onToken, onSources, onDone, onError) => {
  const url = new URL('/api/chat/stream', API_BASE);
  url.searchParams.set('query', query);
  if (docIds && docIds.length > 0) {
    url.searchParams.set('doc_ids', docIds.join(','));
  }
  url.searchParams.set('session_id', sessionId);
  const eventSource = new EventSource(url.toString());

  eventSource.addEventListener('sources', (event) => {
    try {
      const sources = JSON.parse(event.data);
      onSources(sources);
    } catch (e) {
      console.error("Failed to parse sources", e);
    }
  });

  eventSource.onmessage = (event) => {
    if (event.data === '[DONE]') {
      eventSource.close();
      onDone();
    } else {
      onToken(event.data);
    }
  };

  eventSource.onerror = (error) => {
    eventSource.close();
    onError(error);
  };

  return () => {
    eventSource.close();
  };
};
