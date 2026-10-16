import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  Database
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { aiApi } from '../services/api';
import EmptyState from '../components/EmptyState';

const AIChat = () => {
  const { dataset } = useApp();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your AI Business Analyst. I evaluate your dataset's actual calculated statistical aggregates to provide zero-hallucination, data-backed insights, root-cause diagnostics, and strategic recommendations. What would you like to investigate?",
      stats: null
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    "Why did profit decrease?",
    "Which region performs best in terms of profit?",
    "Which products have high sales but low profit?",
    "What are the major trends in the dataset?",
    "What should management investigate?",
    "Explain the sales trend.",
    "Give me a summary of this dataset."
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText = input) => {
    if (!queryText.trim() || loading) return;

    const userMessage = { role: 'user', content: queryText };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await aiApi.chat(queryText);
      const botMessage = {
        role: 'assistant',
        content: res.data.response,
        stats: res.data.supporting_stats
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: "I encountered an error calculating dataset metrics. Please ensure the backend server is running and a dataset is loaded." 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!dataset || dataset.status !== 'ready') {
    return <EmptyState title="No Dataset" message="Please upload or load a dataset to interact with the AI Business Analyst." />;
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto flex flex-col h-[calc(100vh-7.5rem)]">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>AI Business Analyst</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Intelligent conversational advisor strictly grounded in verified statistical calculations (Zero Hallucinations).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Grounded Architecture Active</span>
          </span>
        </div>
      </div>

      {/* Suggested Questions Pills */}
      <div className="flex-shrink-0 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          <span>Try asking:</span>
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:text-brand-600 dark:hover:text-brand-400 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap transition-colors text-[11px] shadow-2xs"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message Chat Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-brand-600 text-white shadow-xs rounded-tr-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs rounded-tl-xs whitespace-pre-line'
                }`}
              >
                <div>{msg.content}</div>

                {/* Supporting Verified Stats Pill */}
                {msg.stats && Object.keys(msg.stats).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-[11px]">
                    <span className="font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      Verified Supporting Calculations:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(msg.stats).map(([k, v], i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 font-mono text-[10px] text-slate-600 dark:text-slate-300">
                          {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center flex-shrink-0 shadow-xs mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
              <span>Querying statistical analytics engine and formulating grounded answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex-shrink-0 relative flex items-center"
      >
        <input
          type="text"
          placeholder="Ask any question about your data (e.g., 'Why did profit decrease?')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="w-full pl-4 pr-12 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="absolute right-2 p-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default AIChat;
