import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, MessageSquare, Trash2, Sliders, ChevronDown, 
  ChevronRight, Sparkles, BookOpen, UserCheck, Code, Compass, HelpCircle,
  Download, FileText, FileCode
} from 'lucide-react';
import { ChatSession, ModelConfig } from '../types';
import { exportSessionAsMarkdown, exportSessionAsJson } from '../utils/exportUtils';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  config: ModelConfig;
  setConfig: React.Dispatch<React.SetStateAction<ModelConfig>>;
  showSidebar: boolean;
  onToggleSidebar: () => void;
}

const PRESETS = [
  {
    name: 'General Assistant',
    desc: 'Versatile, polite, and helpful with standard conversation.',
    prompt: 'You are a helpful, professional, and precise AI assistant. Answer the user clearly and in simple language.',
    icon: Compass
  },
  {
    name: 'Software Engineer',
    desc: 'Expert in coding, optimization, debugging, and software design.',
    prompt: 'You are a Principal Software Engineer. Provide clean, well-commented code following industrial standards. Keep explanations focused around code optimization, security, and algorithmic complexity.',
    icon: Code
  },
  {
    name: 'Creative Brainstormer',
    desc: 'Imaginative writing, visual idea generations, and rich prose.',
    prompt: 'You are a highly creative and innovative brainstorming partner. Provide original concepts, metaphors, and rich descriptive answers that stimulate creative thought.',
    icon: Sparkles
  },
  {
    name: 'Friendly Mentor',
    desc: 'Warm, encouraging teacher style with structural study feedback.',
    prompt: 'You are an encouraging and warm teaching mentor. Break down complex topics into bite-sized analogies and support the user throughout their learning journey with motivating remarks.',
    icon: UserCheck
  }
];

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  config,
  setConfig,
  showSidebar,
  onToggleSidebar
}: SidebarProps) {
  const [showPresets, setShowPresets] = useState(true);
  const [customPrompt, setCustomPrompt] = useState(config.systemInstruction);
  const [exportMenuSessionId, setExportMenuSessionId] = useState<string | null>(null);
  const exportContainerRef = useRef<HTMLDivElement | null>(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportContainerRef.current && !exportContainerRef.current.contains(event.target as Node)) {
        setExportMenuSessionId(null);
      }
    }
    if (exportMenuSessionId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [exportMenuSessionId]);

  const applyPreset = (prompt: string) => {
    setCustomPrompt(prompt);
    setConfig(prev => ({ ...prev, systemInstruction: prompt }));
  };

  const handleCustomPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomPrompt(e.target.value);
    setConfig(prev => ({ ...prev, systemInstruction: e.target.value }));
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setConfig(prev => ({ ...prev, temperature: val }));
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <aside 
      className={`fixed inset-y-16 right-0 z-30 flex w-80 flex-col border-l border-gray-200 bg-white transition-transform duration-300 md:static ${
        showSidebar ? 'translate-x-0' : 'translate-x-full md:hidden'
      }`}
    >
      {/* Search and general options panel */}
      <div className="flex flex-1 flex-col overflow-y-auto p-4 custom-scrollbar space-y-6">
        
        {/* New Chat Trigger */}
        <div>
          <button
            onClick={onCreateSession}
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-[0.98] transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat Session</span>
          </button>
        </div>

        {/* Saved Conversations List */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2.5 px-1">
            Persisted Chats ({sessions.length})
          </h2>
          {sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-400">No active sessions. Creating a prompt will start one automatically.</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-1 relative" ref={exportContainerRef}>
              {sessions.map(sess => (
                <div
                  key={sess.id}
                  className={`group relative flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    sess.id === activeSessionId
                      ? 'bg-indigo-50 text-indigo-900 shadow-3xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <button
                    onClick={() => onSelectSession(sess.id)}
                    className="flex flex-1 items-center space-x-2.5 text-left truncate mr-1"
                  >
                    <MessageSquare className={`h-4 w-4 shrink-0 ${sess.id === activeSessionId ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <span className="truncate">{sess.title}</span>
                  </button>

                  <div className="flex items-center space-x-0.5 shrink-0">
                    {/* Export button */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExportMenuSessionId(prev => prev === sess.id ? null : sess.id);
                        }}
                        disabled={sess.messages.length === 0}
                        className={`p-1 rounded transition-all ${
                          sess.messages.length === 0
                            ? 'opacity-0 cursor-not-allowed text-gray-300'
                            : exportMenuSessionId === sess.id
                            ? 'opacity-100 bg-indigo-150 text-indigo-700'
                            : 'opacity-0 group-hover:opacity-100 hover:bg-gray-150 text-gray-400 hover:text-indigo-600'
                        }`}
                        title={sess.messages.length > 0 ? "Export session backup" : "No messages to export"}
                        aria-label="Export chat session"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>

                      {/* Floating export options menu for this session */}
                      {exportMenuSessionId === sess.id && (
                        <div 
                          className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-gray-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100 mb-1">
                            Export format
                          </div>
                          <button
                            onClick={() => {
                              exportSessionAsMarkdown(sess, config);
                              setExportMenuSessionId(null);
                            }}
                            className="w-full flex items-center space-x-2 px-2 py-1.5 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-800 rounded transition-colors text-left font-medium"
                          >
                            <FileText className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                            <span>Markdown (.md)</span>
                          </button>
                          <button
                            onClick={() => {
                              exportSessionAsJson(sess, config);
                              setExportMenuSessionId(null);
                            }}
                            className="w-full flex items-center space-x-2 px-2 py-1.5 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-800 rounded transition-colors text-left font-medium mt-0.5"
                          >
                            <FileCode className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                            <span>JSON (.json)</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(sess.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-150 text-gray-400 hover:text-red-600 transition-all"
                      title="Delete session"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Model Presets Selector */}
        <div className="border-t border-gray-100 pt-5">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 px-1 hover:text-gray-600"
          >
            <span>Preset Roles / Instructions</span>
            {showPresets ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>

          {showPresets && (
            <div className="space-y-2">
              {PRESETS.map((preset, idx) => {
                const Icon = preset.icon;
                const isSelected = config.systemInstruction === preset.prompt;
                return (
                  <button
                    key={idx}
                    onClick={() => applyPreset(preset.prompt)}
                    className={`flex w-full items-start space-x-3 rounded-lg border p-2.5 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`mt-0.5 rounded p-1 ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className={`text-xs font-semibold ${isSelected ? 'text-indigo-900' : 'text-gray-800'}`}>
                        {preset.name}
                      </div>
                      <div className="text-[10px] leading-relaxed text-gray-500">
                        {preset.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Manual Advanced Settings Card */}
        <div className="border-t border-gray-100 pt-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1">
            Manual Tuning
          </h3>

          {/* Temperature setting */}
          <div className="space-y-1.5 px-1">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="font-medium">Temperature</span>
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                {config.temperature.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.5"
              step="0.1"
              value={config.temperature}
              onChange={handleTemperatureChange}
              className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-gray-400">
              <span>More Precise (0.0)</span>
              <span>More Creative (1.5)</span>
            </div>
          </div>

          {/* System prompt textarea */}
          <div className="space-y-1.5 px-1">
            <label className="text-xs font-medium text-gray-600">
              Custom System Prompt
            </label>
            <textarea
              value={customPrompt}
              onChange={handleCustomPromptChange}
              placeholder="Inject hidden guidelines for the model..."
              className="w-full h-24 rounded-lg border border-gray-200 bg-gray-50 p-2 text-xs leading-relaxed text-gray-700 focus:bg-white focus:border-indigo-500 focus:outline-none resize-none custom-scrollbar"
            />
          </div>
        </div>

        {/* Quick Instructions Badge */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-center space-y-2 mt-auto">
          <div className="flex justify-center text-slate-400"><HelpCircle className="h-5 w-5" /></div>
          <h4 className="text-xs font-semibold text-slate-800">Need some help?</h4>
          <p className="text-[10px] leading-relaxed text-slate-500">
            Click <strong>Search Grounding</strong> to feed actual web page sources. Attach pictures below to perform visual analysis.
          </p>
        </div>

      </div>
    </aside>
  );
}
