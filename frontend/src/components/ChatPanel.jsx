import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Trash2, Loader, Scale } from 'lucide-react';
import SourceChip from './SourceChip';

export default function ChatPanel({
  messages,
  isLoading,
  sendMessage,
  clearChat,
  selectedDocCount,
  totalDocCount
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const exampleQuestions = [
    "What are the termination clauses?",
    "Are there any non-compete restrictions?",
    "What are the payment terms?",
    "Summarize the key obligations"
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'white', overflow: 'hidden' }}>
      
      {/* HEADER */}
      <div style={{
        padding: '14px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Contract Q&A
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {selectedDocCount > 0 
              ? `${selectedDocCount} contract${selectedDocCount > 1 ? 's' : ''} active` 
              : 'All contracts'}
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Trash2 size={15} /> Clear
          </button>
        )}
      </div>

      {/* MESSAGES AREA */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
        {messages.length === 0 ? (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <Scale size={36} color="var(--accent)" strokeWidth={1.5} />
            <div style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '12px' }}>
              What would you like to know?
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Ask anything about your uploaded contracts
            </div>

            <div style={{
              marginTop: '28px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '8px',
              maxWidth: '520px'
            }}>
              {exampleQuestions.map((q, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setInput(q);
                    textareaRef.current?.focus();
                  }}
                  style={{
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '9px 16px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.color = 'var(--accent)';
                    e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-strong)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  {q}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ paddingBottom: '24px' }}>
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className="fade-in"
                style={{
                  padding: '20px 24px',
                  background: msg.role === 'assistant' ? 'white' : 'transparent',
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                {msg.role === 'user' ? (
                  <div style={{ maxWidth: '65%' }}>
                    <div style={{
                      background: 'var(--accent)',
                      color: 'white',
                      borderRadius: '18px 18px 4px 18px',
                      padding: '11px 16px',
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    maxWidth: '760px',
                    margin: '0 auto',
                    width: '100%'
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: '28px',
                      height: '28px',
                      flexShrink: 0,
                      background: 'var(--accent)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Scale size={14} color="white" strokeWidth={2} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                        LexAI
                      </div>
                      
                      <div className="markdown-content">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                        {msg.isStreaming && <span className="streaming-cursor" />}
                      </div>

                      {!msg.isStreaming && msg.sources && msg.sources.length > 0 && (
                        <div style={{ marginTop: '14px' }}>
                          <div style={{ 
                            fontSize: '11px', 
                            textTransform: 'uppercase', 
                            fontWeight: '600', 
                            color: 'var(--text-muted)', 
                            letterSpacing: '0.05em', 
                            marginBottom: '6px' 
                          }}>
                            Sources
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {msg.sources.map((src, i) => (
                              <SourceChip key={i} {...src} />
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* INPUT SECTION */}
      <div style={{ padding: '16px 24px 20px', flexShrink: 0, borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', width: '100%' }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '8px',
            background: isFocused ? 'white' : 'var(--bg-input)',
            border: `1px solid ${isFocused ? 'var(--accent)' : 'var(--border-strong)'}`,
            borderRadius: 'var(--radius-xl)',
            padding: '8px 8px 8px 16px',
            transition: 'all 0.15s',
            boxShadow: isFocused ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none'
          }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask about your contracts..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontFamily: 'inherit',
                lineHeight: '1.5',
                resize: 'none',
                minHeight: '24px',
                maxHeight: '120px',
                padding: '4px 0'
              }}
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              style={{
                width: '34px',
                height: '34px',
                flexShrink: 0,
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (input.trim() && !isLoading) ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
                opacity: (input.trim() && !isLoading) ? 1 : 0.5
              }}
              onMouseEnter={(e) => {
                if (input.trim() && !isLoading) e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
              }}
              onMouseLeave={(e) => {
                if (input.trim() && !isLoading) e.currentTarget.style.backgroundColor = 'var(--accent)';
              }}
            >
              {isLoading ? <Loader size={15} className="spinning" /> : <Send size={15} />}
            </button>
          </div>
          <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Shift + Enter for new line · {selectedDocCount > 0 ? `${selectedDocCount} contract${selectedDocCount > 1 ? 's' : ''} active` : 'All contracts active'}
          </div>
        </div>
      </div>
    </div>
  );
}
