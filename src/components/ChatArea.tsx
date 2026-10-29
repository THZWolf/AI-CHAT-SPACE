import React, { useState, useRef } from 'react';
import { 
  Bot, User, Image as ImageIcon, Volume2, VolumeX, Check, Copy, ExternalLink, RefreshCw 
} from 'lucide-react';
import Markdown from 'react-markdown';
import CodeBlock from './CodeBlock';
import { Message, GroundingChunk } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ChatAreaProps {
  messages: Message[];
  isPending: boolean;
  onQuickPrompt: (text: string) => void;
}

export default function ChatArea({
  messages,
  isPending,
  onQuickPrompt
}: ChatAreaProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll logic inside active frames
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  // Clean speaking status when unmounting
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeech = async (text: string, messageId: string) => {
    if (playingId === messageId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingId(null);
      return;
    }

    // Stop anything currently speaking or playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setPlayingId(messageId);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error("High fidelity TTS API failed with status: " + res.status);
      }

      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
        audioRef.current = audio;
        audio.onended = () => {
          setPlayingId(null);
        };
        audio.play();
      } else {
        throw new Error("Empty audio payload received from server gateway");
      }
    } catch (err) {
      console.warn("Gemini TTS high-fidelity playback failed, fallback to native high-quality browser Speech Synthesis...", err);
      
      if ('speechSynthesis' in window) {
        try {
          // Robust text cleanup to remove markdown, brackets, urls and backticks for smoother listening experience
          const cleanText = text
            .replace(/https?:\/\/[^\s/$.?#].[^\s]*/g, 'link')
            .replace(/[#*`_~[\]()]/g, ' ')
            .replace(/[-+]\s+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          const utterance = new SpeechSynthesisUtterance(cleanText);
          
          utterance.onend = () => {
            setPlayingId(null);
          };
          utterance.onerror = (e) => {
            console.error("Browser synthesis finished with error status:", e);
            setPlayingId(null);
          };

          window.speechSynthesis.speak(utterance);
        } catch (synthErr) {
          console.error("Speech Synthesis failed completely:", synthErr);
          setPlayingId(null);
        }
      } else {
        setPlayingId(null);
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 custom-scrollbar bg-gray-50/50">
      <div className="mx-auto max-w-3xl space-y-6">
        
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-3xs">
              <Bot className="h-6 w-6" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">AI Conversational Space</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Connect and interact with advanced Gemini models. Ask questions, analyze uploaded attachments, or activate real-time search grounding below.
              </p>
            </div>

            {/* Prompt starters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md pt-4">
              <button
                onClick={() => onQuickPrompt("Summarize the top 3 discoveries in quantum chemistry.")}
                className="text-left p-3 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 hover:bg-slate-50 transition-all text-xs"
              >
                <div className="font-semibold text-gray-800">Summarize Top Discoveries</div>
                <div className="text-gray-400 mt-0.5 text-[10px]">Quantum chemistry findings.</div>
              </button>
              <button
                onClick={() => onQuickPrompt("Provide a step-by-step optimized algorithm for a binary search tree.")}
                className="text-left p-3 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 hover:bg-slate-50 transition-all text-xs"
              >
                <div className="font-semibold text-gray-800">Coding Algorithm</div>
                <div className="text-gray-400 mt-0.5 text-[10px]">Optimized binary search tree.</div>
              </button>
              <button
                onClick={() => onQuickPrompt("What are some eye-safe high-contrast UI design tips?")}
                className="text-left p-3 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 hover:bg-slate-50 transition-all text-xs"
              >
                <div className="font-semibold text-gray-800">UI Design Tips</div>
                <div className="text-gray-400 mt-0.5 text-[10px]">Eye-safe high-contrast panels.</div>
              </button>
              <button
                onClick={() => onQuickPrompt("Explain gravity fields using a modern cooking analogy.")}
                className="text-left p-3 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 hover:bg-slate-50 transition-all text-xs"
              >
                <div className="font-semibold text-gray-800">Analogies Explanations</div>
                <div className="text-gray-400 mt-0.5 text-[10px]">Explain gravity via recipe cooking.</div>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex space-x-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Model avatar */}
                  {msg.role === 'model' && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-3xs">
                      <Bot className="h-4.5 w-4.5" />
                    </div>
                  )}

                  <div className={`space-y-2 max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {/* Attachment displays */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-end">
                        {msg.attachments.map(att => (
                          <div 
                            key={att.id} 
                            className="relative overflow-hidden rounded-lg border border-gray-200 bg-white p-1 hover:shadow-xs transition-shadow"
                          >
                            <img 
                              src={`data:${att.mimeType};base64,${att.base64}`} 
                              alt={att.name}
                              className="max-h-32 max-w-48 object-cover rounded" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="p-1 text-[9px] text-gray-500 font-medium truncate max-w-32">{att.name}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Chat Bubble container */}
                    <div className={`relative px-4 py-3 rounded-2xl shadow-3xs ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-150'
                    }`}>
                      
                      {/* Message Content */}
                      <div className={`prose prose-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                        {msg.role === 'user' ? (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        ) : (
                          <div className="markdown-body">
                            <Markdown
                              components={{
                                pre({ children }) {
                                  return <>{children}</>;
                                },
                                code({ node, className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const rawText = String(children || '').replace(/\n$/, '');
                                  const isMultiLine = rawText.includes('\n') || !!match;

                                  if (isMultiLine) {
                                    return (
                                      <CodeBlock className={className} {...props}>
                                        {rawText}
                                      </CodeBlock>
                                    );
                                  }

                                  return (
                                    <code 
                                      className="rounded bg-indigo-50/90 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[12px] font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-100/60" 
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  );
                                },
                                a({ href, children, ...props }) {
                                  return (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-indigo-600 hover:text-indigo-800 underline font-medium inline-flex items-center gap-1"
                                      {...props}
                                    >
                                      {children}
                                      <ExternalLink className="h-3 w-3 inline shrink-0" />
                                    </a>
                                  );
                                },
                                table({ children }) {
                                  return (
                                    <div className="my-3 overflow-x-auto rounded-lg border border-gray-200">
                                      <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
                                        {children}
                                      </table>
                                    </div>
                                  );
                                },
                                th({ children }) {
                                  return <th className="bg-gray-50 px-3 py-2 font-semibold text-gray-700">{children}</th>;
                                },
                                td({ children }) {
                                  return <td className="px-3 py-2 border-t border-gray-100 text-gray-600">{children}</td>;
                                }
                              }}
                            >
                              {msg.text}
                            </Markdown>
                          </div>
                        )}
                      </div>

                      {/* Utility Bar for Model Output */}
                      {msg.role === 'model' && (
                        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2 text-[10px] text-gray-400">
                          {/* Timestamp details */}
                          <span className="font-mono text-[9px]">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          
                          {/* Interactive tool buttons */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleSpeech(msg.text, msg.id)}
                              className={`p-1 rounded hover:bg-gray-100 transition-colors ${playingId === msg.id ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                              title={playingId === msg.id ? "Pause reading" : "Read response aloud"}
                            >
                              {playingId === msg.id ? <VolumeX className="h-3.5 w-3.5 animate-pulse" /> : <Volume2 className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(msg.text, msg.id)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Copy text"
                            >
                              {copiedId === msg.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Google Search Grounding metadata citations panel */}
                    {msg.role === 'model' && msg.groundingChunks && msg.groundingChunks.length > 0 && (
                      <div className="rounded-xl border border-blue-100 bg-blue-50/35 p-3 space-y-1.5 text-[11px]">
                        <div className="font-semibold text-blue-800 flex items-center space-x-1">
                          <span>Google Search grounding sources:</span>
                        </div>
                        <ul className="space-y-1">
                          {msg.groundingChunks.map((chunk, cidx) => {
                            if (!chunk.web) return null;
                            return (
                              <li key={cidx} className="flex items-center space-x-1.5 truncate">
                                <ExternalLink className="h-3 w-3 text-blue-500 shrink-0" />
                                <a
                                  href={chunk.web.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline hover:text-blue-800 truncate"
                                  title={chunk.web.title || chunk.web.uri}
                                >
                                  {chunk.web.title || chunk.web.uri}
                                </a>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                  </div>

                  {/* User avatar */}
                  {msg.role === 'user' && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-gray-700">
                      <User className="h-4.5 w-4.5" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Spinner/Skeleton loader when waiting for reply */}
            {isPending && (
              <div className="flex space-x-4 justify-start">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-3xs animate-pulse-soft">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div className="space-y-2 max-w-[80%]">
                  <div className="rounded-2xl rounded-bl-none border border-gray-150 bg-white px-4 py-3 shadow-3xs">
                    <div className="flex space-x-1.5 py-1">
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 italic">
                    Reading facts and constructing response...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
        
      </div>
    </div>
  );
}
