
import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../constants';
import { ChatMessage } from '../types';
import { getAIResponse } from '../geminiService';

const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! I am TaxWatch AI. How can I help you understand your tax contributions today?', timestamp: Date.now() }
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

    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const response = await getAIResponse(input);
    const aiMsg: ChatMessage = { role: 'assistant', content: response || "I couldn't get a response. Please try again.", timestamp: Date.now() };
    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-80 sm:w-96 glossy-card rounded-2xl shadow-2xl flex flex-col h-[500px] border border-[#00d4ff]/30 animate-in fade-in slide-in-from-bottom-10">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#0a1929]/50 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#00d4ff]/20 rounded-lg text-[#00d4ff]">
                <ICONS.Robot />
              </div>
              <span className="font-bold text-white">TaxWatch Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  m.role === 'user' 
                    ? 'bg-[#00d4ff] text-white rounded-tr-none' 
                    : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-800 p-3 rounded-2xl rounded-tl-none border border-gray-700">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about tax usage..."
                className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#00d4ff] outline-none"
              />
              <button onClick={handleSend} className="p-2 bg-[#00d4ff] text-white rounded-xl hover:bg-[#00b0d4] transition-colors">
                <ICONS.Send />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-[#00d4ff] text-white rounded-full flex items-center justify-center shadow-lg cyan-glow animate-pulse-cyan hover:scale-110 transition-transform"
        >
          <ICONS.Robot />
        </button>
      )}
    </div>
  );
};

export default AIChat;
