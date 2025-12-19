
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini with Server-Side Key
// Per guidelines: API key must be obtained exclusively from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export default async function handler(req, res) {
  // CORS Handling
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { action, payload } = req.body;

  try {
    let result;

    switch (action) {
      case 'parse_transaction':
        result = await handleParseTransaction(payload);
        break;
      case 'parse_receipt':
        result = await handleParseReceipt(payload);
        break;
      case 'financial_advice':
        result = await handleFinancialAdvice(payload);
        break;
      case 'generate_avatar':
        result = await handleGenerateAvatar(payload);
        break;
      default:
        throw new Error('Invalid action');
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

// --- Handlers ---

async function handleParseTransaction({ input }) {
  // Updated to gemini-3-flash-preview per coding guidelines
  // Use ai.models.generateContent properly
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", 
    contents: `Parse this financial transaction text into JSON: "${input}". 
      If no currency is specified, assume IDR (Indonesian Rupiah).
      Return fields: title (string), amount (number), type ('income' or 'expense'), category (string), date (ISO string).
      Today is ${new Date().toISOString()}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          type: { type: Type.STRING, enum: ['income', 'expense'] },
          category: { type: Type.STRING },
          date: { type: Type.STRING },
        },
        required: ['title', 'amount', 'type', 'category', 'date']
      }
    }
  });
  
  // Directly access .text
  const jsonStr = response.text || "{}";
  return JSON.parse(jsonStr);
}

async function handleParseReceipt({ imageBase64 }) {
  // Updated to gemini-3-flash-preview per coding guidelines
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
        { text: `Analyze this receipt. Return JSON: { title, amount (number), date (YYYY-MM-DD), category }.` }
      ]
    },
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                date: { type: Type.STRING },
                category: { type: Type.STRING }
            },
            required: ['title', 'amount', 'date', 'category']
        }
    }
  });
  
  const jsonStr = response.text || "{}";
  return JSON.parse(jsonStr);
}

async function handleFinancialAdvice({ query, context }) {
  // Updated to gemini-3-flash-preview per coding guidelines
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `You are a financial advisor for a mobile app. User currency: IDR.
      Keep answers short (under 100 words), actionable, and witty. Use emojis.
      Context: ${context}`
    }
  });
  
  // Use .sendMessage, not .generateContent for chat
  const result = await chat.sendMessage({ message: query });
  return { text: result.text };
}

async function handleGenerateAvatar({ prompt }) {
  // Stub for image generation if needed
  return { imageUrl: null }; 
}
