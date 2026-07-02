import { useState, useEffect, useCallback } from 'react';
import { listDocuments, uploadDocument as apiUploadDocument, deleteDocument as apiDeleteDocument } from '../api/client';

export const useDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState(new Set());
  const [uploading, setUploading] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      const data = await listDocuments();
      setDocuments(data);
    } catch (error) {
      console.error("Failed to load documents", error);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const uploadFile = async (file) => {
    setUploading(true);
    try {
      await apiUploadDocument(file);
      await loadDocuments();
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = async (docId) => {
    try {
      await apiDeleteDocument(docId);
      setDocuments(prev => prev.filter(doc => doc.doc_id !== docId));
      setSelectedDocIds(prev => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    } catch (error) {
      console.error("Failed to delete document", error);
    }
  };

  const toggleSelectDoc = (docId) => {
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const selectAll = () => {
    const allIds = new Set(documents.map(doc => doc.doc_id));
    setSelectedDocIds(allIds);
  };

  const clearSelection = () => {
    setSelectedDocIds(new Set());
  };

  return {
    documents,
    selectedDocIds,
    uploading,
    loadDocuments,
    uploadFile,
    removeDocument,
    toggleSelectDoc,
    selectAll,
    clearSelection
  };
};
