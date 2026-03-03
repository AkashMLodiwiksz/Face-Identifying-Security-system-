import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Bot, Send, Trash2, X, User, Copy, Check, 
  AlertCircle, ChevronDown, Zap, Maximize2, Minimize2
} from 'lucide-react';
import api from '../services/api';

const ChatBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [aiProvider, setAiProvider] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const username = localStorage.getItem('username') || 'anonymous';
  const location = useLocation();
  const navigate = useNavigate();

  // Hide bubble on the dedicated AI Assistant page
  const isOnAIPage = location.pathname === '/ai-assistant';

  // Welcome on first open
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm **SecureVision AI** — ask me anything about this system.`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnreadCount(0);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.post('/chat', { message: trimmed, username });
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.data.reply,
        timestamp: new Date().toLocaleTimeString()
      };
      if (res.data.provider) setAiProvider(res.data.provider);
      setMessages(prev => [...prev, assistantMsg]);
      if (!isOpen) setUnreadCount(prev => prev + 1);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to connect to AI service.';
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'error',
        content: errMsg,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    try { await api.post('/chat/clear', { username }); } catch (e) { /* ignore */ }
    setMessages([{
      id: 'cleared',
      role: 'assistant',
      content: 'Chat cleared! How can I help you?',
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Markdown renderer (compact version)
  const renderMarkdown = (text) => {
    if (!text) return '';
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const lines = part.slice(3, -3).split('\n');
        const lang = lines[0]?.trim() || '';
        const code = lines.slice(lang ? 1 : 0).join('\n');
        return (
          <div key={i} className="my-2 rounded-lg overflow-hidden border border-gray-700">
            {lang && <div className="bg-gray-800 px-2 py-1 text-xs text-gray-400 font-mono border-b border-gray-700">{lang}</div>}
            <pre className="bg-gray-900/80 p-2 overflow-x-auto text-xs">
              <code className="text-green-400 font-mono">{code}</code>
            </pre>
          </div>
        );
      }
      return part.split('\n').map((line, j) => {
        if (line.startsWith('### ')) return <h3 key={`${i}-${j}`} className="text-sm font-bold mt-2 mb-0.5 text-white">{processInline(line.slice(4))}</h3>;
        if (line.startsWith('## ')) return <h2 key={`${i}-${j}`} className="text-base font-bold mt-2 mb-0.5 text-white">{processInline(line.slice(3))}</h2>;
        if (line.startsWith('# ')) return <h1 key={`${i}-${j}`} className="text-lg font-bold mt-2 mb-0.5 text-white">{processInline(line.slice(2))}</h1>;
        if (line.match(/^[\s]*[•\-\*]\s/)) {
          return <div key={`${i}-${j}`} className="flex items-start gap-1.5 ml-1 my-0.5"><span className="text-violet-400 mt-0.5 shrink-0 text-xs">•</span><span>{processInline(line.replace(/^[\s]*[•\-\*]\s/, ''))}</span></div>;
        }
        if (line.match(/^\d+\.\s/)) {
          const num = line.match(/^(\d+)\./)[1];
          return <div key={`${i}-${j}`} className="flex items-start gap-1.5 ml-1 my-0.5"><span className="text-violet-400 font-semibold shrink-0 text-xs">{num}.</span><span>{processInline(line.replace(/^\d+\.\s/, ''))}</span></div>;
        }
        if (line.trim() === '') return <div key={`${i}-${j}`} className="h-1" />;
        return <p key={`${i}-${j}`} className="my-0.5">{processInline(line)}</p>;
      });
    });
  };

  const processInline = (text) => {
    if (!text) return text;
    const parts = [];
    let remaining = text;
    let key = 0;
    while (remaining.length > 0) {
      const codeMatch = remaining.match(/`([^`]+)`/);
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
      const italicMatch = remaining.match(/\*([^*]+)\*/);
      let earliest = null, earliestType = null;
      if (codeMatch && (!earliest || codeMatch.index < earliest.index)) { earliest = codeMatch; earliestType = 'code'; }
      if (boldMatch && (!earliest || boldMatch.index < earliest.index)) { earliest = boldMatch; earliestType = 'bold'; }
      if (italicMatch && earliestType !== 'bold' && (!earliest || italicMatch.index < earliest.index)) { earliest = italicMatch; earliestType = 'italic'; }
      if (!earliest) { parts.push(remaining); break; }
      if (earliest.index > 0) parts.push(remaining.slice(0, earliest.index));
      if (earliestType === 'code') parts.push(<code key={key++} className="bg-gray-700/60 text-pink-400 px-1 py-0.5 rounded text-xs font-mono">{earliest[1]}</code>);
      else if (earliestType === 'bold') parts.push(<strong key={key++} className="text-white font-semibold">{earliest[1]}</strong>);
      else parts.push(<em key={key++} className="text-gray-300 italic">{earliest[1]}</em>);
      remaining = remaining.slice(earliest.index + earliest[0].length);
    }
    return parts;
  };

  if (isOnAIPage) return null;

  return (
    <>
      {/* Floating Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white shadow-xl shadow-violet-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 group"
          title="Chat with AI Assistant"
        >
          <Bot className="w-7 h-7 group-hover:scale-110 transition-transform" />
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-bounce">
              {unreadCount}
            </span>
          )}
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-violet-400 animate-ping opacity-20"></span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div 
          className={`fixed z-50 flex flex-col bg-gray-900 border border-gray-700/60 shadow-2xl shadow-black/40 transition-all duration-300 ${
            isExpanded 
              ? 'bottom-0 right-0 w-full h-full rounded-none sm:bottom-4 sm:right-4 sm:w-[700px] sm:h-[85vh] sm:rounded-2xl' 
              : 'bottom-4 right-4 w-[380px] h-[560px] rounded-2xl'
          }`}
          style={{ maxHeight: isExpanded ? undefined : '80vh' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-gradient-to-r from-violet-600/20 to-purple-600/20 shrink-0 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">AI Assistant</h3>
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  {aiProvider || 'Online'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigate('/ai-assistant')}
                className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title="Open full page"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title={isExpanded ? 'Minimize' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 rotate-180" />}
              </button>
              <button
                onClick={() => { setIsOpen(false); setIsExpanded(false); }}
                className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5 ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                    : msg.role === 'error'
                    ? 'bg-gradient-to-br from-red-500 to-rose-600'
                    : 'bg-gradient-to-br from-violet-500 to-purple-600'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-3 h-3 text-white" />
                  ) : msg.role === 'error' ? (
                    <AlertCircle className="w-3 h-3 text-white" />
                  ) : (
                    <Bot className="w-3 h-3 text-white" />
                  )}
                </div>

                {/* Bubble */}
                <div className={`group relative max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-600/90 to-indigo-600/90 rounded-xl rounded-tr-sm px-3 py-2'
                    : msg.role === 'error'
                    ? 'bg-red-500/10 border border-red-500/30 rounded-xl rounded-tl-sm px-3 py-2'  
                    : 'bg-gray-800/70 border border-gray-700/50 rounded-xl rounded-tl-sm px-3 py-2'
                }`}>
                  <div className={`text-xs leading-relaxed ${
                    msg.role === 'user' ? 'text-white' : msg.role === 'error' ? 'text-red-300' : 'text-gray-200'
                  }`}>
                    {msg.role === 'user' ? msg.content : renderMarkdown(msg.content)}
                  </div>
                  <div className={`flex items-center gap-1.5 mt-1 text-[10px] ${
                    msg.role === 'user' ? 'text-blue-200/60 justify-end' : 'text-gray-500'
                  }`}>
                    <span>{msg.timestamp}</span>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-700"
                      >
                        {copiedId === msg.id ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading */}
            {isLoading && (
              <div className="flex gap-2">
                <div className="shrink-0 w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-gray-800/70 border border-gray-700/50 rounded-xl rounded-tl-sm px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-gray-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-700/50 p-3 bg-gray-900/80 shrink-0 rounded-b-2xl">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                rows={1}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 text-white placeholder-gray-500 text-xs resize-none outline-none transition-all"
                style={{ maxHeight: '80px', minHeight: '36px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  input.trim() && !isLoading
                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white shadow-md shadow-violet-500/25'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-600">
              <div className="flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" />
                <span>{aiProvider || 'AI'}</span>
              </div>
              <span>Enter ↵ to send</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBubble;
