import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Modality } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Standard middleware
app.use(express.json({ limit: '10mb' }));

// Lazy initializer for GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getAi() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Proxy Gemini Chat interface
app.post("/api/chat", async (req, res) => {
  try {
    const { history, config } = req.body;
    const ai = getAi();

    // Map history to Google GenAI format
    const contents = history.map((msg: any) => {
      const parts: any[] = [];
      
      // Inline images/attachments
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach((att: any) => {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.base64
            }
          });
        });
      }
      
      // Text segment
      parts.push({ text: msg.text || "" });
      
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: parts
      };
    });

    const selectedModel = config?.model || "gemini-3.8-flash";
    const tools: any[] = [];
    if (config?.useSearchGrounding) {
      tools.push({ googleSearch: {} });
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction: config?.systemInstruction || "You are a helpful, professional, and precise AI assistant.",
        temperature: config?.temperature !== undefined ? Number(config.temperature) : 0.7,
        tools: tools.length > 0 ? tools : undefined,
      }
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      text,
      groundingChunks
    });

  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    let errMsg = error.message || "An unexpected error occurred during chat.";
    
    // De-serialize JSON string error if nested as string in message
    if (typeof errMsg === 'string' && (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED"))) {
      errMsg = "Gemini API Quota Exceeded (429 Rate Limit): You have reached your current API usage limit. If you are on the Gemini API Free Tier, there is a rate limit of 15 requests per minute (RPM). Please wait a minute before sending your next request, or check your API usage details in Google AI Studio Settings under Secrets.";
    }
    
    res.status(500).json({ error: errMsg });
  }
});

// Proxy Gemini TTS interface (Text-to-Speech)
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice = 'Zephyr' } = req.body;
    const ai = getAi();

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: "Text is required for conversion." });
    }

    // Clean out code blocks, markdown links, and syntax tokens for smooth voice readout
    let speechText = text
      .replace(/```[\s\S]*?```/g, ' [code block omitted] ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/https?:\/\/[^\s/$.?#].[^\s]*/g, ' link ')
      .replace(/[#*~[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Limit text size for TTS to avoid massive processing latency
    const cleanText = speechText.length > 300 ? speechText.substring(0, 300) + "..." : speechText;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [{ parts: [{ text: `Say clearly: ${cleanText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: "No voice audio was generated." });
    }

    res.json({ audio: base64Audio });

  } catch (error: any) {
    console.error("Gemini TTS Error:", error);
    let errMsg = error.message || "An unexpected error occurred during speech summary.";
    
    if (typeof errMsg === 'string' && (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED"))) {
      errMsg = "Speech generation rate limit reached (Gemini API 429 Quota Exceeded). Please wait a moment and try again.";
    }
    
    res.status(500).json({ error: errMsg });
  }
});

// Setup Vite Dev server / Serve built files in production
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode with static assets...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on IP http://0.0.0.0:${PORT}`);
  });

  server.on("error", (err: any) => {
    console.error("Server listener error:", err);
  });

  const shutdown = () => {
    console.log("Shutting down dev server cleanly...");
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

bootstrap().catch(err => {
  console.error("Express startup failed:", err);
});
