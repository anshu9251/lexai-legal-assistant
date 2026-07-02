import React from 'react';
import { X, Loader, ShieldCheck } from 'lucide-react';

export default function RiskPanel({ risks, onClose, isLoading }) {
  return (
    <div 
      className="fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: 'min(620px, 94vw)',
          maxHeight: '82vh',
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Risk Analysis
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              AI-powered review of your contracts
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px' }}>
              <Loader size={28} color="var(--accent)" className="spinning" />
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '14px' }}>
                Scanning contracts...
              </div>
            </div>
          ) : risks && risks.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px' }}>
              <ShieldCheck size={28} color="var(--success)" />
              <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '12px' }}>
                No significant risks found
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Your contracts appear clean.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {risks && risks.map((risk, index) => {
                const isHigh = risk.risk_level.toLowerCase() === 'high';
                const isMedium = risk.risk_level.toLowerCase() === 'medium';
                const isLow = risk.risk_level.toLowerCase() === 'low';

                let borderColor = '#e5e7eb';
                let bgColor = '#f9f9f9';
                let badgeBg = '#6b7280';
                
                if (isHigh) {
                  borderColor = '#fca5a5';
                  bgColor = '#fff5f5';
                  badgeBg = '#dc2626';
                } else if (isMedium) {
                  borderColor = '#fcd34d';
                  bgColor = '#fffdf0';
                  badgeBg = '#d97706';
                } else if (isLow) {
                  borderColor = '#6ee7b7';
                  bgColor = '#f0fdf9';
                  badgeBg = '#10b981';
                }

                const animationDelay = `${index * 50}ms`;

                return (
                  <div 
                    key={index} 
                    className="fade-in"
                    style={{
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${borderColor}`,
                      padding: '14px 16px',
                      background: bgColor,
                      animationDelay
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        backgroundColor: badgeBg,
                        color: 'white',
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)'
                      }}>
                        {risk.risk_level}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {risk.clause_ref}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        📄 {risk.filename}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {risk.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}>
          ⚖ LexAI uses AI to flag potential risks. Always consult a qualified lawyer.
        </div>
      </div>
    </div>
  );
}
