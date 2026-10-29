export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  base64: string; // Base64 data string (excluding prefix data:image/png;base64,)
  mimeType: string;
}

export type Role = 'user' | 'model';

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: string;
  attachments?: Attachment[];
  groundingChunks?: GroundingChunk[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

export interface ModelConfig {
  model: 'gemini-3.8-flash' | 'gemini-3.1-pro-preview';
  systemInstruction: string;
  temperature: number;
  useSearchGrounding: boolean;
}
