import React, { useState, useMemo } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

// Core and common web languages
import 'prismjs/components/prism-markup'; // HTML/XML
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';

// Popular backend & systems languages
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';

import { Check, Copy, Terminal, Code2 } from 'lucide-react';

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  jsx: 'jsx',
  tsx: 'tsx',
  py: 'python',
  python: 'python',
  sh: 'bash',
  shell: 'bash',
  bash: 'bash',
  zsh: 'bash',
  html: 'markup',
  xml: 'markup',
  svg: 'markup',
  css: 'css',
  scss: 'css',
  json: 'json',
  sql: 'sql',
  md: 'markdown',
  markdown: 'markdown',
  yml: 'yaml',
  yaml: 'yaml',
  c: 'c',
  cpp: 'cpp',
  'c++': 'cpp',
  cs: 'csharp',
  csharp: 'csharp',
  java: 'java',
  go: 'go',
  golang: 'go',
  rs: 'rust',
  rust: 'rust',
};

const DISPLAY_NAMES: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  jsx: 'React JSX',
  tsx: 'React TSX',
  python: 'Python',
  bash: 'Bash / Shell',
  markup: 'HTML / XML',
  css: 'CSS',
  json: 'JSON',
  sql: 'SQL',
  markdown: 'Markdown',
  yaml: 'YAML',
  c: 'C',
  cpp: 'C++',
  csharp: 'C#',
  java: 'Java',
  rust: 'Rust',
  go: 'Go',
};

export default function CodeBlock({ inline, className, children, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  // Extract raw code string
  const rawCode = useMemo(() => {
    if (typeof children === 'string') {
      return children.replace(/\n$/, '');
    }
    if (Array.isArray(children)) {
      return children.join('').replace(/\n$/, '');
    }
    return String(children || '').replace(/\n$/, '');
  }, [children]);

  // Determine language
  const match = /language-(\w+)/.exec(className || '');
  const rawLang = match ? match[1].toLowerCase() : '';
  const normalizedLang = LANGUAGE_ALIASES[rawLang] || rawLang || 'javascript';
  const displayName = DISPLAY_NAMES[normalizedLang] || rawLang.toUpperCase() || 'Code';

  // Compute line count
  const lines = useMemo(() => rawCode.split('\n'), [rawCode]);

  // Syntax highlighting
  const highlightedHtml = useMemo(() => {
    try {
      const grammar = Prism.languages[normalizedLang] || Prism.languages.javascript;
      if (grammar) {
        return Prism.highlight(rawCode, grammar, normalizedLang);
      }
      return rawCode;
    } catch {
      return rawCode;
    }
  }, [rawCode, normalizedLang]);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Inline code snippet
  if (inline) {
    return (
      <code 
        className="rounded bg-indigo-50 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[12px] font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-100/60" 
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="my-3.5 overflow-hidden rounded-xl border border-slate-700/80 bg-[#181825] shadow-xl text-left">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-700/60 bg-[#11111b] px-4 py-2 text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <Terminal className="h-3.5 w-3.5 text-indigo-400" />
          <span className="font-mono text-[11px] font-semibold tracking-wider text-slate-200">
            {displayName}
          </span>
          <span className="rounded bg-slate-800/90 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 rounded-md bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content with Line Numbers */}
      <div className="overflow-x-auto p-4 custom-scrollbar text-[13px] leading-relaxed font-mono">
        <pre className="!bg-transparent !p-0 !m-0 flex">
          {lines.length > 2 && (
            <div 
              aria-hidden="true" 
              className="select-none pr-4 text-right text-slate-600 font-mono text-[12px] leading-relaxed border-r border-slate-800 mr-3"
            >
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
          )}
          <code
            className={`language-${normalizedLang} flex-1 overflow-x-auto`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </pre>
      </div>
    </div>
  );
}
