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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      // Close sidebar drawer on mobile after analyzing risks
      setIsSidebarOpen(false);
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
    <div className="app-container">
      {/* Backdrop overlay for mobile sidebar drawer */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <Sidebar
        {...docState}
        onAnalyzeRisks={handleAnalyzeRisks}
        isRiskLoading={isRiskLoading}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <ChatPanel
        {...chatState}
        sendMessage={handleSendMessage}
        selectedDocCount={docState.selectedDocIds.size}
        onMenuToggle={() => setIsSidebarOpen(true)}
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
