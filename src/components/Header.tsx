import React, { useState, useRef, useEffect } from 'react';
import { Bot, Search, BrainCircuit, Sliders, Download, FileText, FileCode, Check, ChevronDown } from 'lucide-react';
import { ModelConfig, ChatSession } from '../types';
import { exportSessionAsMarkdown, exportSessionAsJson } from '../utils/exportUtils';

interface HeaderProps {
  config: ModelConfig;
  setConfig: React.Dispatch<React.SetStateAction<ModelConfig>>;
  isPending: boolean;
  onShowSettings: () => void;
  showSettings: boolean;
  activeSession?: ChatSession;
}

export default function Header({
  config,
  setConfig,
  isPending,
  onShowSettings,
  showSettings,
  activeSession
}: HeaderProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [recentlyExported, setRecentlyExported] = useState<'md' | 'json' | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  const hasMessages = Boolean(activeSession && activeSession.messages.length > 0);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  const handleExportMarkdown = () => {
    if (!activeSession || !hasMessages) return;
    exportSessionAsMarkdown(activeSession, config);
    setRecentlyExported('md');
    setTimeout(() => {
      setRecentlyExported(null);
      setShowExportMenu(false);
    }, 1200);
  };

  const handleExportJson = () => {
    if (!activeSession || !hasMessages) return;
    exportSessionAsJson(activeSession, config);
    setRecentlyExported('json');
    setTimeout(() => {
      setRecentlyExported(null);
      setShowExportMenu(false);
    }, 1200);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Logo and title */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500/10">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-gray-900">
              AI Chat Space
            </h1>
            <div className="flex items-center space-x-1.5">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${isPending ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-[10px] font-mono tracking-wider uppercase text-gray-400">
                {isPending ? 'Thinking...' : 'Ready'}
              </span>
            </div>
          </div>
        </div>

        {/* Configurations Quick View */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 rounded-lg bg-gray-50 p-1 border border-gray-150">
            
            <button
              onClick={() => setConfig(prev => ({ ...prev, model: 'gemini-3.8-flash' }))}
              className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                config.model === 'gemini-3.8-flash'
                  ? 'bg-white text-gray-900 shadow-xs ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Fast, lightweight model perfect for general conversation"
            >
              <span>Flash 3.8</span>
            </button>

            <button
              onClick={() => setConfig(prev => ({ ...prev, model: 'gemini-3.1-pro-preview' }))}
              className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                config.model === 'gemini-3.1-pro-preview'
                  ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-indigo-600'
              }`}
              title="State-of-the-art model for complex reasoning and advanced tasks"
            >
              <BrainCircuit className="h-3 w-3" />
              <span>Pro 3.1</span>
            </button>
          </div>

          {/* Search grounding button */}
          <button
            onClick={() => setConfig(prev => ({ ...prev, useSearchGrounding: !prev.useSearchGrounding }))}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
              config.useSearchGrounding
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            title="Enable/Disable live Google Search Grounding to supply current facts"
          >
            <Search className={`h-3.5 w-3.5 ${config.useSearchGrounding ? 'text-blue-600 animate-pulse-soft' : 'text-gray-400'}`} />
            <span>Search Grounding</span>
            <span className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold ${config.useSearchGrounding ? 'bg-blue-200/50 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
              {config.useSearchGrounding ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Actions, Export & Settings button */}
        <div className="flex items-center space-x-2">
          {/* Mobile view config indicator icons */}
          <div className="flex md:hidden items-center space-x-1.5 text-gray-400 mr-1 text-xs">
            {config.useSearchGrounding && (
              <span title="Search active">
                <Search className="h-4 w-4 text-blue-600" />
              </span>
            )}
            <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700 text-[10px]">
              {config.model === 'gemini-3.8-flash' ? 'Flash' : 'Pro'}
            </span>
          </div>

          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={!hasMessages}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                !hasMessages
                  ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                  : showExportMenu
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-3xs'
              }`}
              title={hasMessages ? 'Export active session as Markdown or JSON backup' : 'Start a chat to export backup'}
              aria-expanded={showExportMenu}
              aria-label="Export chat session"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-2 shadow-lg ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-2 py-1.5 border-b border-gray-100 mb-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Export Chat Backup
                  </p>
                  <p className="text-xs text-gray-600 font-medium truncate mt-0.5" title={activeSession?.title}>
                    {activeSession?.title || 'Current Session'}
                  </p>
                </div>

                {/* Markdown Export Button */}
                <button
                  onClick={handleExportMarkdown}
                  className="w-full flex items-start space-x-2.5 p-2 rounded-lg hover:bg-indigo-50/70 text-left transition-colors group"
                >
                  <div className="mt-0.5 p-1.5 rounded-md bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 shrink-0">
                    {recentlyExported === 'md' ? (
                      <Check className="h-4 w-4 text-emerald-600 animate-scale" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-900">Markdown (.md)</span>
                      {recentlyExported === 'md' && (
                        <span className="text-[10px] text-emerald-600 font-medium">Downloaded</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                      Formatted chat with syntax code blocks and web citations.
                    </p>
                  </div>
                </button>

                {/* JSON Export Button */}
                <button
                  onClick={handleExportJson}
                  className="w-full flex items-start space-x-2.5 p-2 rounded-lg hover:bg-indigo-50/70 text-left transition-colors group mt-1"
                >
                  <div className="mt-0.5 p-1.5 rounded-md bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 shrink-0">
                    {recentlyExported === 'json' ? (
                      <Check className="h-4 w-4 text-emerald-600 animate-scale" />
                    ) : (
                      <FileCode className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-900">JSON (.json)</span>
                      {recentlyExported === 'json' && (
                        <span className="text-[10px] text-emerald-600 font-medium">Downloaded</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                      Complete raw structured session object for import or backup.
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onShowSettings}
            className={`p-2 rounded-lg border transition-all ${
              showSettings
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            aria-label="Toggle configurations sidebar"
            title="System prompt and settings instruction"
          >
            <Sliders className="h-4 w-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
