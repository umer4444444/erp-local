import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Sparkles, X, Send, Minimize2, Maximize2 } from 'lucide-react';

const GlobalAIAssistant = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-ai', handleOpen);
    return () => window.removeEventListener('open-ai', handleOpen);
  }, []);

  if (!user || user.role === 'driver') return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.filter(m => m.sender !== 'system').map(m => ({
        role: m.sender === 'ai' ? 'assistant' : 'user',
        content: m.text
      }));

      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/ai/query`, {
        prompt: userMessage.text,
        history
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setMessages(prev => [...prev, { text: response.data.response, sender: 'ai' }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: 'Sorry, I encountered an error. Please try again.', sender: 'system' }]);
      console.error('AI Query Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #0a84ff, #4f46e5)',
          color: 'white',
          padding: 16,
          borderRadius: '50%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Sparkles size={24} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      borderRadius: 24,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid #f3f4f6',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s ease',
      zIndex: 9999,
      overflow: 'hidden',
      width: isMinimized ? 280 : 384,
      height: isMinimized ? 64 : 500,
    }}>
      
      {/* Header */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #0a84ff, #4f46e5)',
          color: 'white',
          padding: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={20} />
          <h3 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>AI Assistant</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16, background: '#f8fafc' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 40 }}>
                <Sparkles size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                <p style={{ margin: 0, fontWeight: 800 }}>Hello {user.name}!</p>
                <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 600 }}>Ask me about your sales, inventory, or customers.</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  lineHeight: 1.5,
                  borderRadius: 16,
                  borderBottomRightRadius: msg.sender === 'user' ? 0 : 16,
                  borderBottomLeftRadius: msg.sender === 'user' ? 16 : 0,
                  background: msg.sender === 'user' ? '#0a84ff' : (msg.sender === 'system' ? '#fef2f2' : '#ffffff'),
                  color: msg.sender === 'user' ? '#ffffff' : (msg.sender === 'system' ? '#dc2626' : '#0f172a'),
                  border: msg.sender === 'system' ? '1px solid #fee2e2' : (msg.sender === 'ai' ? '1px solid #e2e8f0' : 'none'),
                  boxShadow: msg.sender === 'ai' ? '0 2px 4px rgba(0,0,0,0.02)' : 'none'
                }}>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  borderBottomLeftRadius: 0,
                  padding: '12px 16px',
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center'
                }}>
                  <div style={{ width: 6, height: 6, background: '#0a84ff', borderRadius: '50%', opacity: 0.5 }} />
                  <div style={{ width: 6, height: 6, background: '#0a84ff', borderRadius: '50%', opacity: 0.7 }} />
                  <div style={{ width: 6, height: 6, background: '#0a84ff', borderRadius: '50%', opacity: 1 }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{ padding: 16, background: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your assistant..."
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 9999,
                  padding: '12px 48px 12px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  outline: 'none',
                  color: '#0f172a',
                  boxSizing: 'border-box'
                }}
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                style={{
                  position: 'absolute',
                  right: 8,
                  background: (isLoading || !input.trim()) ? '#cbd5e1' : '#0a84ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default GlobalAIAssistant;
