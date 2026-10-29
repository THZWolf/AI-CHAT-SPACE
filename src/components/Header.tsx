import React from 'react';
import { Bot, Search, BrainCircuit, Sliders, Volume2, HelpCircle } from 'lucide-react';
import { ModelConfig } from '../types';

interface HeaderProps {
  config: ModelConfig;
  setConfig: React.Dispatch<React.SetStateAction<ModelConfig>>;
  isPending: boolean;
  onShowSettings: () => void;
  showSettings: boolean;
}

export default function Header({
  config,
  setConfig,
  isPending,
  onShowSettings,
  showSettings
}: HeaderProps) {
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

        {/* Settings button & Actions */}
        <div className="flex items-center space-x-2">
          {/* Mobile view config indicator icons */}
          <div className="flex md:hidden items-center space-x-1.5 text-gray-400 mr-2 text-xs">
            {config.useSearchGrounding && (
              <span title="Search active">
                <Search className="h-4 w-4 text-blue-600" />
              </span>
            )}
            <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700 text-[10px]">
              {config.model === 'gemini-3.8-flash' ? 'Flash' : 'Pro'}
            </span>
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
