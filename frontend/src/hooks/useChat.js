import { useState, useRef } from 'react';
import { streamAnswer, askQuestion } from '../api/client';

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const streamCleanupRef = useRef(null);

  const sendMessage = async (query, docIds) => {
    setIsLoading(true);

    const userMessageId = Date.now().toString();
    const assistantMessageId = (Date.now() + 1).toString();

    setMessages(prev => [
      ...prev,
      {
        id: userMessageId,
        role: "user",
        content: query,
        timestamp: new Date()
      },
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        isStreaming: true,
        sources: [],
        timestamp: new Date()
      }
    ]);

    const docIdsArray = docIds ? Array.from(docIds) : [];

    // Setup streaming
    streamCleanupRef.current = streamAnswer(
      query,
      docIdsArray,
      (token) => {
        // We get \n in tokens, need to make sure we parse properly. 
        // The SSE sends tokens exactly as text.
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: msg.content + token.replace(/\\n/g, '\n') } 
            : msg
        ));
      },
      (sources) => {
        // onSources
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId ? { ...msg, sources } : msg
        ));
      },
      () => {
        // onDone
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
        ));
        setIsLoading(false);
        streamCleanupRef.current = null;
      },
      (error) => {
        // onError
        console.error("Stream error:", error);
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: msg.content + "\n\n[Connection Error]", isStreaming: false } 
            : msg
        ));
        setIsLoading(false);
        streamCleanupRef.current = null;
      }
    );
  };

  const clearChat = () => {
    if (streamCleanupRef.current) {
      streamCleanupRef.current();
      streamCleanupRef.current = null;
    }
    setMessages([]);
    setIsLoading(false);
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat
  };
};
