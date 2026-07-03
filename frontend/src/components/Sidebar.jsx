import React, { useRef, useState } from 'react';
import { Scale, Plus, CheckCircle, Loader, FileText, Trash2, Zap } from 'lucide-react';
import UploadZone from './UploadZone';

export default function Sidebar({
  documents,
  selectedDocIds,
  uploading,
  uploadFile,
  removeDocument,
  toggleSelectDoc,
  selectAll,
  clearSelection,
  onAnalyzeRisks,
  isRiskLoading,
  isOpen,
  onClose
}) {
  const uploadZoneRef = useRef(null);
  const [localUploading, setLocalUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleUploadClick = () => {
    uploadZoneRef.current?.triggerUpload();
  };

  const handleUploadWrapper = async (file) => {
    setLocalUploading(true);
    setUploadSuccess(false);
    try {
      await uploadFile(file);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setLocalUploading(false);
    }
  };

  return (
    <div 
      className={`app-sidebar ${isOpen ? 'open' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* TOP LOGO AREA */}
      <div style={{ padding: '16px 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            backgroundColor: 'var(--accent)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Scale size={16} color="white" strokeWidth={2} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
              LexAI
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Contract Intelligence
            </span>
          </div>
        </div>
        <div style={{ borderBottom: '1px solid var(--border)', marginTop: '12px' }} />
      </div>

      {/* NEW UPLOAD BUTTON */}
      <div style={{ padding: '10px 12px' }}>
        <button
          onClick={handleUploadClick}
          disabled={localUploading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '9px 14px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: localUploading ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
            opacity: localUploading ? 0.7 : 1
          }}
          onMouseEnter={(e) => !localUploading && (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
          onMouseLeave={(e) => !localUploading && (e.currentTarget.style.backgroundColor = 'var(--accent)')}
        >
          <Plus size={16} /> Upload Contract
        </button>
        <UploadZone ref={uploadZoneRef} onUpload={handleUploadWrapper} />
      </div>

      {/* UPLOAD STATUS */}
      {(localUploading || uploadSuccess) && (
        <div style={{ padding: '0 12px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {localUploading ? (
            <>
              <Loader size={14} color="var(--accent)" className="spinning" />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Indexing...</span>
            </>
          ) : (
            <>
              <CheckCircle size={14} color="var(--success)" />
              <span style={{ fontSize: '12px', color: 'var(--success)' }}>Document indexed!</span>
            </>
          )}
        </div>
      )}

      {/* CONTRACTS SECTION */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '6px 8px', marginBottom: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Contracts
          </span>
          {documents.length > 0 && (
            <span style={{
              fontSize: '10px',
              backgroundColor: 'var(--bg-tag)',
              borderRadius: 'var(--radius-full)',
              padding: '1px 6px',
              color: 'var(--text-muted)'
            }}>
              {documents.length}
            </span>
          )}
        </div>

        {documents.length === 0 ? (
          <div style={{ padding: '20px 10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <FileText size={24} color="var(--text-muted)" />
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
              No contracts yet
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Click Upload Contract above
            </div>
          </div>
        ) : (
          documents.map(doc => {
            const isSelected = selectedDocIds.has(doc.doc_id);
            const isPdf = doc.filename.toLowerCase().endsWith('.pdf');
            
            return (
              <div 
                key={doc.doc_id}
                className="doc-item"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '9px 10px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'background 0.12s',
                  position: 'relative',
                  marginBottom: '1px',
                  background: isSelected ? 'var(--bg-active)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  const trashBtn = e.currentTarget.querySelector('.trash-btn');
                  if (trashBtn) trashBtn.style.display = 'block';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  const trashBtn = e.currentTarget.querySelector('.trash-btn');
                  if (trashBtn) trashBtn.style.display = 'none';
                }}
                onClick={() => toggleSelectDoc(doc.doc_id)}
              >
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '6px',
                    bottom: '6px',
                    width: '2px',
                    background: 'var(--accent)',
                    borderRadius: '1px'
                  }} />
                )}

                <div style={{
                  width: '15px',
                  height: '15px',
                  flexShrink: 0,
                  marginTop: '1px',
                  border: isSelected ? '1.5px solid var(--accent)' : '1.5px solid var(--border-strong)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--accent)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isSelected && <span style={{ color: 'white', fontSize: '10px' }}>✓</span>}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: '13px', 
                    color: 'var(--text-primary)', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    fontWeight: isSelected ? '500' : 'normal'
                  }}>
                    {doc.filename}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{
                      fontSize: '9px',
                      textTransform: 'uppercase',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      fontWeight: '600',
                      background: isPdf ? '#fee2e2' : '#e0e7ff',
                      color: isPdf ? '#dc2626' : '#4f46e5'
                    }}>
                      {isPdf ? 'PDF' : 'DOCX'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                      {doc.chunk_count} chunks
                    </span>
                  </div>
                </div>

                <button
                  className="trash-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDocument(doc.doc_id);
                  }}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    background: 'transparent',
                    border: 'none',
                    padding: '3px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'none',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--danger)';
                    e.currentTarget.style.backgroundColor = 'var(--danger-bg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* SELECT ROW */}
      {documents.length > 0 && (
        <div style={{ 
          padding: '6px 10px', 
          borderTop: '1px solid var(--border)', 
          borderBottom: '1px solid var(--border)' 
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Select: </span>
          <button 
            onClick={selectAll} 
            style={{ fontSize: '11px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            All
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}> · </span>
          <button 
            onClick={clearSelection} 
            style={{ fontSize: '11px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            None
          </button>
        </div>
      )}

      {/* ANALYZE RISKS BUTTON */}
      <div style={{ padding: '10px 12px', marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onAnalyzeRisks}
          disabled={isRiskLoading || documents.length === 0}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            background: 'transparent',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: '9px',
            fontSize: '13px',
            fontWeight: '500',
            color: 'var(--text-secondary)',
            cursor: (isRiskLoading || documents.length === 0) ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            opacity: (isRiskLoading || documents.length === 0) ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!isRiskLoading && documents.length > 0) {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.color = 'var(--accent)';
              e.currentTarget.style.backgroundColor = 'var(--accent-light)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isRiskLoading && documents.length > 0) {
              e.currentTarget.style.borderColor = 'var(--border-strong)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {isRiskLoading ? (
            <>
              <Loader size={15} className="spinning" /> Analyzing...
            </>
          ) : (
            <>
              <Zap size={15} /> Analyze Risks
            </>
          )}
        </button>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
          Detects risky clauses with AI
        </div>
      </div>
    </div>
  );
}
