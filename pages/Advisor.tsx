
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Link as LinkIcon, Search } from 'lucide-react';
import { getFinancialAdvice } from '../services/geminiService';
import { getTransactions as getDbTransactions } from '../services/storageService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  sources?: any[];
}

const Advisor: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi Farel! I'm your AI financial advisor. Ask me anything about your spending or the market! 💸",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Get context from DB
    const transactions = await getDbTransactions();
    const result = await getFinancialAdvice(userMsg.text, transactions);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      text: result.text || "I'm thinking...",
      sender: 'ai',
      timestamp: new Date(),
      sources: result.sources
    };

    setIsTyping(false);
    setMessages(prev => [...prev, aiMsg]);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="flex flex-col h-full bg-background"
    >
      <div className="p-4 border-b border-white/5 bg-surface/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-primary flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white">Gemini Advisor</h2>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Online + Search Enabled
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar" ref={scrollRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`
                max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed
                ${msg.sender === 'user' 
                  ? 'bg-primary text-white rounded-br-none' 
                  : 'bg-surface border border-white/5 text-slate-200 rounded-bl-none'}
              `}
            >
              {msg.text}
            </div>

            {/* Display Sources for AI messages */}
            {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 max-w-[85%] flex flex-wrap gap-2">
                    {msg.sources.map((chunk, idx) => {
                        if (!chunk.web?.uri) return null;
                        return (
                            <a 
                                key={idx} 
                                href={chunk.web.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full px-2 py-1 text-[10px] text-slate-400 hover:text-white transition-colors"
                            >
                                <Search size={10} />
                                {chunk.web.title || 'Source'}
                            </a>
                        );
                    })}
                </div>
            )}
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start">
             <div className="bg-surface border border-white/5 p-3 rounded-2xl rounded-bl-none flex gap-1">
               <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
               <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75" />
               <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150" />
             </div>
           </div>
        )}
      </div>

      <div className="p-3 bg-surface border-t border-white/5 pb-24">
        <div className="flex items-center gap-2 bg-background rounded-full border border-white/10 p-1 pl-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your spending..."
            className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm"
          />
          <button 
            onClick={handleSend}
            className="p-2.5 bg-primary rounded-full text-white hover:bg-primary/90 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Advisor;
