import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, AlertCircle } from 'lucide-react';
import { Attachment } from '../types';

interface MessageInputProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isPending: boolean;
}

export default function MessageInput({
  onSendMessage,
  isPending
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Resize input dynamically as the user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    
    const cleanText = text.trim();
    if (!cleanText && attachments.length === 0) return;

    onSendMessage(cleanText, attachments);
    
    // Reset inputs
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMsg(null);
    const newAttachments: Attachment[] = [];

    Array.from(files).forEach(file => {
      // Basic image validations
      if (!file.type.startsWith('image/')) {
        setErrorMsg(`"${file.name}" is not supported. Please upload high-quality PNG, JPEG, or WEBP images.`);
        return;
      }

      if (file.size > 4 * 1024 * 1024) {
        setErrorMsg(`"${file.name}" exceeds the 4MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const resultStr = reader.result as string;
        // Extract raw base64 contents
        const commaIdx = resultStr.indexOf(',');
        const base64Content = commaIdx > -1 ? resultStr.substring(commaIdx + 1) : resultStr;

        setAttachments(prev => [
          ...prev,
          {
            id: Math.random().toString(36).substring(7),
            name: file.name,
            type: file.type,
            size: file.size,
            base64: base64Content,
            mimeType: file.type
          }
        ]);
      };
      reader.onerror = () => {
        setErrorMsg(`Error loading file: ${file.name}`);
      };
      reader.readAsDataURL(file);
    });

    // Reset file input value so same files can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="mx-auto max-w-3xl space-y-3">
        
        {/* Error notification */}
        {errorMsg && (
          <div className="flex items-center space-x-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="p-0.5 rounded hover:bg-red-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Selected attachments previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2.5 py-1">
            {attachments.map((att) => (
              <div 
                key={att.id}
                className="group relative flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-0.5 shadow-3xs"
              >
                <img 
                  src={`data:${att.mimeType};base64,${att.base64}`} 
                  alt={att.name}
                  className="h-full w-full object-cover rounded-md"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-white hover:bg-gray-700 shadow-sm"
                  title="Remove uploaded image"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Text Form */}
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex flex-1 items-end rounded-xl border border-gray-200 bg-gray-50 p-1.5 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
            
            {/* Attachment paperclip trigger */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all cursor-pointer"
              title="Attach image (Vision Analysis)"
              disabled={isPending}
            >
              <Paperclip className="h-4.5 w-4.5" />
            </button>
            
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              multiple
            />

            {/* Input prompt Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isPending ? "Gemini is building response..." : "Ask AI or press Shift+Enter for newline..."}
              className="flex-1 max-h-[120px] min-h-[36px] bg-transparent border-0 py-1.5 px-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0 resize-none custom-scrollbar font-sans"
              disabled={isPending}
            />

            {/* Submit button inside input boundary */}
            <button
              type="submit"
              disabled={isPending || (!text.trim() && attachments.length === 0)}
              className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-500 disabled:bg-gray-150 disabled:text-gray-400 active:scale-95 transition-all cursor-pointer"
              title="Submit prompt"
            >
              <Send className="h-4 w-4" />
            </button>

          </div>
        </form>

        {/* Footer info label */}
        <div className="flex justify-between items-center text-[10px] text-gray-400 px-1">
          <span>Character count: {text.length}</span>
          <span>Google AI Studio App — Zero data tracking</span>
        </div>

      </div>
    </div>
  );
}
