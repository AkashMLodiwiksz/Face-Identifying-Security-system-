import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  Bot, Send, Trash2, Sparkles, User, Copy, Check, 
  AlertCircle, Cpu, ChevronDown, MessageSquare, Zap,
  Shield, Camera, Brain, HelpCircle
} from 'lucide-react';
import api from '../services/api';

const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [aiProvider, setAiProvider] = useState('');
  const [lastUserIntent, setLastUserIntent] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const username = localStorage.getItem('username') || 'anonymous';

  // Welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `👋 Hello! I'm **SecureVision AI Assistant**, your intelligent support companion for this security system.\n\nI know everything about this system — from the **React frontend** to the **Flask backend**, **PostgreSQL database**, **face recognition**, **YOLO object detection**, **recording system**, **camera management**, and more.\n\nAsk me anything! Here are some ideas:\n- *"How does face recognition work?"*\n- *"What API endpoints are available?"*\n- *"How do I add a new camera?"*\n- *"Explain the database schema"*\n- *"Who developed this system?"*`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Scroll detection for "scroll to bottom" button
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    setError(null);

    const userIntent = detectIntent(trimmed);
    if (userIntent && userIntent.type === 'do_it' && lastUserIntent) {
      setIsLoading(true);
      const result = await executeIntent(lastUserIntent);
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        role: 'assistant',
        content: result.success ? `✅ ${result.message}` : `⚠️ ${result.message}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setIsLoading(false);
      setLastUserIntent(result.success ? null : lastUserIntent);
      return;
    }

    if (userIntent && userIntent.type === 'delete_camera') {
      setLastUserIntent(userIntent);
      setIsLoading(true);
      const result = await executeIntent(userIntent);
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        role: 'assistant',
        content: result.success ? `✅ ${result.message}` : `⚠️ ${result.message}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setIsLoading(false);
      if (!result.success) {
        // Fall back to AI text answer if action can't be completed automatically.
        const res = await api.post('/chat', { message: trimmed, username });
        const assistantMsg = {
          id: Date.now() + 3,
          role: 'assistant',
          content: res.data.reply,
          provider: res.data.provider || '',
          timestamp: new Date().toLocaleTimeString()
        };
        if (res.data.provider) setAiProvider(res.data.provider);
        setMessages(prev => [...prev, assistantMsg]);
      }
      return;
    }

    try {
      const res = await api.post('/chat', { message: trimmed, username });
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.data.reply,
        provider: res.data.provider || '',
        timestamp: new Date().toLocaleTimeString()
      };
      if (res.data.provider) setAiProvider(res.data.provider);
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to connect to AI service. Make sure the backend is running.';
      setError(errMsg);
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

  const detectIntent = (text) => {
    const lower = text.toLowerCase();

    if (/delete\s+.*camera|remove\s+.*camera|delete camera|remove camera/.test(lower)) {
      return { type: 'delete_camera', label: 'Delete camera' };
    }

    if (/^do it$/i.test(text.trim()) || /do it/.test(lower) || /execute/.test(lower)) {
      return { type: 'do_it', label: 'Execute previous intent' };
    }

    return null;
  };

  const executeIntent = async (intent) => {
    if (!intent) {
      return { success: false, message: 'No action intent to execute.' };
    }

    if (intent.type === 'delete_camera') {
      try {
        const cameras = (await api.get(`/cameras?username=${username}`)).data;

        if (!Array.isArray(cameras) || cameras.length === 0) {
          return { success: false, message: 'No cameras found to delete.' };
        }

        if (cameras.length > 1) {
          const ids = cameras.map((cam) => `${cam.id} (${cam.name || 'unnamed'})`).join(', ');
          return {
            success: false,
            message: `Multiple cameras found (${ids}). Please ask with a specific camera id.`,
          };
        }

        const cameraId = cameras[0].id;
        await api.delete(`/cameras/${cameraId}?username=${username}`);

        return { success: true, message: `Camera ${cameraId} deleted successfully.` };
      } catch (error) {
        console.error('executeIntent delete_camera error:', error);
        const msg = error.response?.data?.error || error.message || 'Failed to delete camera.';
        return { success: false, message: msg };
      }
    }

    return { success: false, message: `Intent type ${intent.type} not implemented` };
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    try {
      await api.post('/chat/clear', { username });
    } catch (e) { /* ignore */ }
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: '🔄 Chat cleared! How can I help you?',
      timestamp: new Date().toLocaleTimeString()
    }]);
    setError(null);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickQuestions = [
    { icon: Brain, text: 'How does face recognition work?', color: 'from-purple-500 to-indigo-500' },
    { icon: Camera, text: 'How to add a new camera?', color: 'from-blue-500 to-cyan-500' },
    { icon: Shield, text: 'Explain the security features', color: 'from-emerald-500 to-teal-500' },
    { icon: HelpCircle, text: 'What technologies are used?', color: 'from-amber-500 to-orange-500' },
  ];

  // Simple markdown renderer
  const renderMarkdown = (text) => {
    if (!text) return '';
    
    // Split by code blocks first
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, i) => {
      // Code blocks
      if (part.startsWith('```')) {
        const lines = part.slice(3, -3).split('\n');
        const lang = lines[0]?.trim() || '';
        const code = lines.slice(lang ? 1 : 0).join('\n');
        return (
          <div key={i} className="my-3 rounded-lg overflow-hidden border border-gray-700">
            {lang && (
              <div className="bg-gray-800 px-3 py-1.5 text-xs text-gray-400 font-mono border-b border-gray-700">
                {lang}
              </div>
            )}
            <pre className="bg-gray-900/80 p-3 overflow-x-auto text-sm">
              <code className="text-green-400 font-mono">{code}</code>
            </pre>
          </div>
        );
      }
      
      // Inline formatting
      const lines = part.split('\n');
      return lines.map((line, j) => {
        // Headers
        if (line.startsWith('### ')) return <h3 key={`${i}-${j}`} className="text-lg font-bold mt-3 mb-1 text-white">{processInline(line.slice(4))}</h3>;
        if (line.startsWith('## ')) return <h2 key={`${i}-${j}`} className="text-xl font-bold mt-3 mb-1 text-white">{processInline(line.slice(3))}</h2>;
        if (line.startsWith('# ')) return <h1 key={`${i}-${j}`} className="text-2xl font-bold mt-3 mb-1 text-white">{processInline(line.slice(2))}</h1>;
        
        // Bullet points
        if (line.match(/^[\s]*[•\-\*]\s/)) {
          const content = line.replace(/^[\s]*[•\-\*]\s/, '');
          return <div key={`${i}-${j}`} className="flex items-start gap-2 ml-2 my-0.5"><span className="text-blue-400 mt-1 shrink-0">•</span><span>{processInline(content)}</span></div>;
        }
        
        // Numbered lists
        if (line.match(/^\d+\.\s/)) {
          const num = line.match(/^(\d+)\./)[1];
          const content = line.replace(/^\d+\.\s/, '');
          return <div key={`${i}-${j}`} className="flex items-start gap-2 ml-2 my-0.5"><span className="text-blue-400 font-semibold shrink-0">{num}.</span><span>{processInline(content)}</span></div>;
        }
        
        // Empty lines
        if (line.trim() === '') return <div key={`${i}-${j}`} className="h-2" />;
        
        // Regular text
        return <p key={`${i}-${j}`} className="my-0.5">{processInline(line)}</p>;
      });
    });
  };

  const processInline = (text) => {
    if (!text) return text;
    // Process bold, italic, inline code
    const parts = [];
    let remaining = text;
    let key = 0;
    
    while (remaining.length > 0) {
      // Inline code
      const codeMatch = remaining.match(/`([^`]+)`/);
      // Bold
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
      // Italic  
      const italicMatch = remaining.match(/\*([^*]+)\*/);
      
      // Find earliest match
      let earliest = null;
      let earliestType = null;
      
      if (codeMatch && (!earliest || codeMatch.index < earliest.index)) { earliest = codeMatch; earliestType = 'code'; }
      if (boldMatch && (!earliest || boldMatch.index < earliest.index)) { earliest = boldMatch; earliestType = 'bold'; }
      if (italicMatch && earliestType !== 'bold' && (!earliest || italicMatch.index < earliest.index)) { earliest = italicMatch; earliestType = 'italic'; }
      
      if (!earliest) {
        parts.push(remaining);
        break;
      }
      
      // Add text before match
      if (earliest.index > 0) {
        parts.push(remaining.slice(0, earliest.index));
      }
      
      // Add formatted element
      if (earliestType === 'code') {
        parts.push(<code key={key++} className="bg-gray-700/60 text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono">{earliest[1]}</code>);
      } else if (earliestType === 'bold') {
        parts.push(<strong key={key++} className="text-white font-semibold">{earliest[1]}</strong>);
      } else if (earliestType === 'italic') {
        parts.push(<em key={key++} className="text-gray-300 italic">{earliest[1]}</em>);
      }
      
      remaining = remaining.slice(earliest.index + earliest[0].length);
    }
    
    return parts;
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-2rem)] flex flex-col max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                AI Assistant
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </h1>
              <p className="text-sm text-gray-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                {aiProvider ? `Powered by ${aiProvider}` : 'Powered by AI'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/50 text-xs text-gray-400">
              <Cpu className="w-3.5 h-3.5" />
              <span>{messages.filter(m => m.role === 'user').length} messages</span>
            </div>
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 hover:bg-red-500/20 border border-gray-700 hover:border-red-500/50 text-gray-400 hover:text-red-400 text-sm transition-all duration-200"
              title="Clear chat history"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-gray-700/50 bg-gray-900/50 backdrop-blur-sm overflow-hidden">
          {/* Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
          >
            {/* Quick questions (shown only with welcome message) */}
            {messages.length === 1 && messages[0].id === 'welcome' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(q.text); inputRef.current?.focus(); }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 text-left text-sm text-gray-300 hover:text-white transition-all duration-200 group"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${q.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      <q.icon className="w-4 h-4 text-white" />
                    </div>
                    {q.text}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}
              >
                {/* Avatar */}
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                    : msg.role === 'error'
                    ? 'bg-gradient-to-br from-red-500 to-rose-600'
                    : 'bg-gradient-to-br from-violet-500 to-purple-600'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : msg.role === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Message bubble */}
                <div className={`group relative max-w-[80%] ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-600/90 to-indigo-600/90 rounded-2xl rounded-tr-sm px-4 py-3'
                    : msg.role === 'error'
                    ? 'bg-red-500/10 border border-red-500/30 rounded-2xl rounded-tl-sm px-4 py-3'  
                    : 'bg-gray-800/70 border border-gray-700/50 rounded-2xl rounded-tl-sm px-4 py-3'
                }`}>
                  <div className={`text-sm leading-relaxed ${
                    msg.role === 'user' ? 'text-white' : msg.role === 'error' ? 'text-red-300' : 'text-gray-200'
                  }`}>
                    {msg.role === 'user' ? msg.content : renderMarkdown(msg.content)}
                  </div>
                  
                  <div className={`flex items-center gap-2 mt-2 text-xs ${
                    msg.role === 'user' ? 'text-blue-200/70 justify-end' : 'text-gray-500'
                  }`}>
                    <span>{msg.timestamp}</span>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-700"
                        title="Copy response"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 animate-fade-in">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-800/70 border border-gray-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-gray-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
              <button
                onClick={scrollToBottom}
                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 border border-gray-600 shadow-lg transition-all"
              >
                <ChevronDown className="w-4 h-4 text-gray-300" />
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-700/50 p-4 bg-gray-900/70">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about the system..."
                  rows={1}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-800 border border-gray-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 text-white placeholder-gray-500 text-sm resize-none outline-none transition-all"
                  style={{ maxHeight: '120px', minHeight: '46px' }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                />
                <div className="absolute right-2 bottom-2 text-xs text-gray-600">
                  Enter ↵
                </div>
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  input.trim() && !isLoading
                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>{aiProvider || 'AI'} • Knows entire system architecture</span>
              </div>
              <span>Shift+Enter for new line</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AIAssistant;
