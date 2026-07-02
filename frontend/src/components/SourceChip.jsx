import React, { useState } from 'react';
import { FileText } from 'lucide-react';

export default function SourceChip({ filename, page_number, clause_text }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'var(--bg-tag)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-full)',
          padding: '3px 10px 3px 8px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          cursor: 'default',
          transition: 'all 0.15s'
        }}
        onMouseEnter={(e) => {
          setIsHovered(true);
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.color = 'var(--accent-text)';
          e.currentTarget.style.backgroundColor = 'var(--accent-light)';
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.backgroundColor = 'var(--bg-tag)';
        }}
      >
        <FileText size={11} />
        {filename} · p.{page_number}
      </div>

      {isHovered && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: 0,
          background: 'white',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          padding: '10px 12px',
          width: '260px',
          zIndex: 200,
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {filename}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {clause_text}
          </div>
        </div>
      )}
    </div>
  );
}
