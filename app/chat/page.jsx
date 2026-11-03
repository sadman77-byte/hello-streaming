
'use client';
import { useState } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState('openai');
  const [error, setError] = useState('');

  async function send() {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    setMessages(prev => [...prev, {role:'user',text}]);

    try {
      setError('');
      const res = await fetch('/api/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({message:text, provider})
      });
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      setMessages(prev => [...prev, {
        role:'assistant',
        text:data.answer || data.reply || 'No response'
      }]);
    } catch (err) {
      setError(err.message || 'AI chat ব্যর্থ হয়েছে।');
    }
  }

  return (
    <main style={{maxWidth:700,margin:'auto',padding:20}}>
      <h1>Hello Streaming AI Chat</h1>
      <p>Server-side API key configured থাকলে provider নির্বাচন করে সাধারণ chat করো।</p>
      <select value={provider} onChange={e => setProvider(e.target.value)} style={{padding:12,color:'black'}}>
        {['openai','mistral','claude','deepseek','grok','gemini'].map(item => <option key={item} value={item}>{item}</option>)}
      </select>
      <div style={{minHeight:300}}>
        {messages.map((m,i) =>
          <p key={i}><b>{m.role}:</b> {m.text}</p>
        )}
      </div>
      <input value={input}
        onChange={e=>setInput(e.target.value)}
        onKeyDown={e=>e.key==='Enter'&&send()}
        placeholder="Write a message..."
        style={{padding:12,width:'70%',color:'black'}} />
      <button onClick={send} style={{padding:12}}>
        Send
      </button>
      {error && <p role="alert" style={{color:'#fda4af'}}>{error}</p>}
    </main>
  );
}
