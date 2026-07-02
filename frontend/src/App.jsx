import { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import RiskPanel from './components/RiskPanel';
import { useDocuments } from './hooks/useDocuments';
import { useChat } from './hooks/useChat';

function App() {
  const docState = useDocuments();
  const chatState = useChat();
  
  const [isRiskLoading, setIsRiskLoading] = useState(false);
  const [riskData, setRiskData] = useState(null);

  const handleAnalyzeRisks = async () => {
    setIsRiskLoading(true);
    setRiskData(null);

    try {
      const docIdsArray = docState.selectedDocIds.size > 0
        ? Array.from(docState.selectedDocIds)
        : [];
      
      const { analyzeRisks } = await import('./api/client');
      const result = await analyzeRisks(docIdsArray);
      
      setRiskData(result.risks || []);
    } catch (error) {
      console.error("Failed to analyze risks", error);
      setRiskData([]); 
    } finally {
      setIsRiskLoading(false);
    }
  };

  const handleSendMessage = (query) => {
    chatState.sendMessage(query, docState.selectedDocIds);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', overflow: 'hidden', background: 'var(--bg-page)' }}>
      <Sidebar
        {...docState}
        onAnalyzeRisks={handleAnalyzeRisks}
        isRiskLoading={isRiskLoading}
      />

      <ChatPanel
        {...chatState}
        sendMessage={handleSendMessage}
        selectedDocCount={docState.selectedDocIds.size}
      />

      {(riskData !== null || isRiskLoading) && (
        <RiskPanel 
          risks={riskData} 
          onClose={() => setRiskData(null)}
          isLoading={isRiskLoading}
        />
      )}
    </div>
  );
}

export default App;
