
import { Transaction } from "../types";

// Helper to call our own backend (Proxy)
const callApi = async (action: string, payload: any) => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    });
    
    if (!response.ok) throw new Error('API Call Failed');
    return await response.json();
  } catch (error) {
    console.error(`Error in ${action}:`, error);
    return null;
  }
};

export const parseTransactionInput = async (input: string): Promise<Partial<Transaction> | null> => {
  const data = await callApi('parse_transaction', { input });
  if (!data) return null;
  
  return {
    ...data,
    date: new Date(data.date)
  };
};

export const parseReceipt = async (base64Image: string): Promise<Partial<Transaction> | null> => {
  const cleanBase64 = base64Image.split(',')[1];
  const data = await callApi('parse_receipt', { imageBase64: cleanBase64 });
  
  if (!data) return null;

  return {
    title: data.title,
    amount: data.amount,
    type: 'expense',
    category: data.category || 'Other',
    date: new Date(data.date || new Date())
  };
};

export const getFinancialAdvice = async (userQuery: string, contextTransactions: Transaction[]) => {
  // Simplify context to save bandwidth
  const recentTx = contextTransactions.slice(0, 15).map(t => 
    `${t.date}: ${t.title} (${t.type}) - ${t.amount}`
  ).join('\n');

  const data = await callApi('financial_advice', { 
    query: userQuery, 
    context: recentTx 
  });

  if (!data) {
    return { text: "Connection error. Please try again later.", sources: [] };
  }
  
  return {
    text: data.text,
    sources: [] // Search grounding handled by backend if configured
  };
};

export const generateAvatar = async (prompt: string): Promise<string | null> => {
  const data = await callApi('generate_avatar', { prompt });
  return data?.imageUrl || null;
};
