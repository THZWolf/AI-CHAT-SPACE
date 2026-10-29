import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bot, AlertCircle, RefreshCw, Layers, ShieldAlert, Wifi, Info, Globe, MessageSquare 
} from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import MessageInput from './components/MessageInput';
import { ChatSession, Message, ModelConfig, Attachment } from './types';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [apiActive, setApiActive] = useState<boolean | null>(null);

  const [config, setConfig] = useState<ModelConfig>({
    model: 'gemini-3.8-flash',
    systemInstruction: 'You are a helpful, professional, and precise AI assistant. Answer the user clearly and in simple language.',
    temperature: 0.7,
    useSearchGrounding: false
  });

  // Check health and connectivity on load
  useEffect(() => {
    async function checkSystem() {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          setApiActive(true);
        } else {
          setApiActive(false);
        }
      } catch (err) {
        setApiActive(false);
        setGlobalError("Local Gateway offline. Ensure application is booting correctly.");
      }
    }
    checkSystem();
  }, []);

  // Load chat sessions from client Storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('GEMINI_SESSIONS_V1');
      if (stored) {
        const parsed = JSON.parse(stored) as ChatSession[];
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to read storage sessions", e);
    }
  }, []);

  // Sync sessions with localstorage
  const saveSessionsToStorage = (updatedSessions: ChatSession[]) => {
    try {
      localStorage.setItem('GEMINI_SESSIONS_V1', JSON.stringify(updatedSessions));
    } catch (e) {
      console.error("Failed to write storage sessions", e);
    }
  };

  const handleCreateSession = useCallback(() => {
    const newSession: ChatSession = {
      id: Math.random().toString(36).substring(7),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString()
    };

    const next = [newSession, ...sessions];
    setSessions(next);
    setActiveSessionId(newSession.id);
    saveSessionsToStorage(next);
  }, [sessions]);

  const handleDeleteSession = useCallback((id: string) => {
    const next = sessions.filter(s => s.id !== id);
    setSessions(next);
    saveSessionsToStorage(next);
    
    // Reset active ID if deleted active
    if (activeSessionId === id) {
      if (next.length > 0) {
        setActiveSessionId(next[0].id);
      } else {
        setActiveSessionId(null);
      }
    }
  }, [sessions, activeSessionId]);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  const handleSendMessage = async (text: string, incomingAttachments: Attachment[]) => {
    setGlobalError(null);
    setIsPending(true);

    let currentSessionId = activeSessionId;
    let fallbackSessions = [...sessions];

    // Create session on the fly if none is active
    if (!currentSessionId) {
      const newSession: ChatSession = {
        id: Math.random().toString(36).substring(7),
        title: text.substring(0, 30) || 'Image Query',
        messages: [],
        createdAt: new Date().toISOString()
      };
      fallbackSessions = [newSession, ...fallbackSessions];
      currentSessionId = newSession.id;
      setSessions(fallbackSessions);
      setActiveSessionId(currentSessionId);
    }

    const targetSessionIndex = fallbackSessions.findIndex(s => s.id === currentSessionId);
    if (targetSessionIndex === -1) {
      setIsPending(false);
      return;
    }

    const targetSession = fallbackSessions[targetSessionIndex];

    // Construct the User Message object
    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      text: text,
      timestamp: new Date().toISOString(),
      attachments: incomingAttachments
    };

    // Update active state list instantly for snappy local reactions
    const updatedMessages = [...targetSession.messages, userMsg];
    
    // Auto rename clean sessions to the user prompt header
    let updatedTitle = targetSession.title;
    if (targetSession.title === 'New Conversation' && text) {
      updatedTitle = text.length > 32 ? text.substring(0, 30) + "..." : text;
    }

    const updatedSession: ChatSession = {
      ...targetSession,
      title: updatedTitle,
      messages: updatedMessages
    };

    const nextSessions = [...fallbackSessions];
    nextSessions[targetSessionIndex] = updatedSession;
    setSessions(nextSessions);
    saveSessionsToStorage(nextSessions);

    try {
      // Send historical conversation frame to server to process
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: updatedMessages,
          config: config
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const replyData = await res.json();

      // Formulate AI text and grounding chunk representations
      const botMsg: Message = {
        id: Math.random().toString(36).substring(7),
        role: 'model',
        text: replyData.text || "I was unable to assemble a description response.",
        timestamp: new Date().toISOString(),
        groundingChunks: replyData.groundingChunks || []
      };

      const finalMessages = [...updatedMessages, botMsg];
      const finalSession: ChatSession = {
        ...updatedSession,
        messages: finalMessages
      };

      const finalSessions = [...nextSessions];
      finalSessions[targetSessionIndex] = finalSession;
      setSessions(finalSessions);
      saveSessionsToStorage(finalSessions);

    } catch (err: any) {
      console.error("Chat proxy failure:", err);
      setGlobalError(err.message || "A networking error prevented communicating with Gemini backend.");
      
      // Keep state intact so prompt response isn't lost
    } finally {
      setIsPending(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    handleSendMessage(promptText, []);
  };

  const activeSessionData = sessions.find(s => s.id === activeSessionId);
  const activeMessages = activeSessionData ? activeSessionData.messages : [];

  return (
    <div className="flex h-screen flex-col bg-white overflow-hidden selection:bg-indigo-100">
      
      {/* Universal header bar */}
      <Header 
        config={config} 
        setConfig={setConfig} 
        isPending={isPending}
        showSettings={showSettings}
        onShowSettings={() => setShowSettings(!showSettings)}
        activeSession={activeSessionData}
      />

      {/* Main app panel */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Chat / interaction core body */}
        <main className="flex flex-1 flex-col overflow-hidden justify-between">
          
          {/* Active gateway error cards */}
          {globalError && (
            <div className="bg-red-50 border-y border-red-150 p-4 shrink-0 transition-all flex items-start space-x-3">
              <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <h3 className="text-sm font-semibold text-red-800">Connection Failed</h3>
                <p className="text-xs text-red-700 leading-relaxed max-w-2xl">{globalError}</p>
              </div>
              <button 
                onClick={() => setGlobalError(null)}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-800 font-semibold px-2.5 py-1 rounded"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Active Offline Alert */}
          {apiActive === false && (
            <div className="bg-amber-50 border-y border-amber-100 px-4 py-2 text-xs text-amber-800 flex items-center space-x-2 shrink-0">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping shrink-0" />
              <span>Gemini proxy server is currently initializing or offline. Verify you have supplied a valid <strong>Settings &gt; Secrets &gt; GEMINI_API_KEY</strong> environment key.</span>
            </div>
          )}

          {/* Messages list viewer */}
          <ChatArea 
            messages={activeMessages} 
            isPending={isPending}
            onQuickPrompt={handleQuickPrompt}
          />

          {/* Messages input text bar */}
          <MessageInput 
            onSendMessage={handleSendMessage} 
            isPending={isPending}
          />

        </main>

        {/* Configurations Tuning Sidebar */}
        <Sidebar 
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onCreateSession={handleCreateSession}
          onDeleteSession={handleDeleteSession}
          config={config}
          setConfig={setConfig}
          showSidebar={showSettings}
          onToggleSidebar={() => setShowSettings(!showSettings)}
        />

      </div>
    </div>
  );
}
