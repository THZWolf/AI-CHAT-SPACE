import { ChatSession, ModelConfig, Message } from '../types';

/**
 * Sanitizes a title string into a filesystem-safe file slug.
 */
export function sanitizeFilename(title: string): string {
  const sanitized = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return sanitized.slice(0, 50) || 'chat-backup';
}

/**
 * Generates formatted Markdown string representation of a ChatSession.
 */
export function formatSessionAsMarkdown(session: ChatSession, config?: ModelConfig): string {
  const lines: string[] = [];
  const exportDate = new Date().toLocaleString();
  const createdDate = session.createdAt ? new Date(session.createdAt).toLocaleString() : 'Unknown';

  lines.push(`# ${session.title || 'Chat Conversation'}`);
  lines.push('');
  lines.push(`> **Exported:** ${exportDate}`);
  lines.push(`> **Created:** ${createdDate}`);
  lines.push(`> **Session ID:** \`${session.id}\``);
  lines.push(`> **Total Messages:** ${session.messages.length}`);
  if (config) {
    lines.push(`> **Model:** \`${config.model}\` | **Temperature:** \`${config.temperature}\` | **Search Grounding:** \`${config.useSearchGrounding ? 'Enabled' : 'Disabled'}\``);
    if (config.systemInstruction) {
      lines.push('');
      lines.push('### System Instruction');
      lines.push('```text');
      lines.push(config.systemInstruction);
      lines.push('```');
    }
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  if (session.messages.length === 0) {
    lines.push('_No messages in this chat session._');
    return lines.join('\n');
  }

  session.messages.forEach((msg: Message, index: number) => {
    const isUser = msg.role === 'user';
    const author = isUser ? '👤 User' : '🤖 Assistant (Gemini)';
    const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '';

    lines.push(`### ${author}${time ? ` · ${time}` : ''}`);
    lines.push('');

    // Attachments if any
    if (msg.attachments && msg.attachments.length > 0) {
      lines.push('**Attachments:**');
      msg.attachments.forEach(att => {
        const sizeKb = (att.size / 1024).toFixed(1);
        lines.push(`- 📎 **${att.name}** (\`${att.mimeType || att.type}\`, ${sizeKb} KB)`);
      });
      lines.push('');
    }

    // Message body
    lines.push(msg.text || '_No text content_');
    lines.push('');

    // Search grounding citations if any
    if (msg.groundingChunks && msg.groundingChunks.length > 0) {
      lines.push('**Sources & Grounding References:**');
      msg.groundingChunks.forEach(chunk => {
        if (chunk.web?.uri) {
          const title = chunk.web.title || chunk.web.uri;
          lines.push(`- [${title}](${chunk.web.uri})`);
        }
      });
      lines.push('');
    }

    if (index < session.messages.length - 1) {
      lines.push('---');
      lines.push('');
    }
  });

  return lines.join('\n');
}

/**
 * Triggers a client-side file download using a temporary Blob URL.
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    if (document.body.contains(anchor)) {
      document.body.removeChild(anchor);
    }
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Exports a chat session to Markdown file (.md).
 */
export function exportSessionAsMarkdown(session: ChatSession, config?: ModelConfig): void {
  const markdown = formatSessionAsMarkdown(session, config);
  const slug = sanitizeFilename(session.title);
  const dateTag = new Date().toISOString().split('T')[0];
  const filename = `${slug}-${dateTag}.md`;
  triggerFileDownload(markdown, filename, 'text/markdown;charset=utf-8');
}

/**
 * Exports a chat session to JSON file (.json).
 */
export function exportSessionAsJson(session: ChatSession, config?: ModelConfig): void {
  const exportPayload = {
    exportVersion: '1.0',
    exportedAt: new Date().toISOString(),
    session,
    config: config ? {
      model: config.model,
      temperature: config.temperature,
      useSearchGrounding: config.useSearchGrounding,
      systemInstruction: config.systemInstruction
    } : undefined
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const slug = sanitizeFilename(session.title);
  const dateTag = new Date().toISOString().split('T')[0];
  const filename = `${slug}-${dateTag}.json`;
  triggerFileDownload(jsonString, filename, 'application/json;charset=utf-8');
}
