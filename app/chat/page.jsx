
'use client';
import { useState } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  async function send() {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    setMessages(prev => [...prev, {role:'user',text}]);

    try {
      const res = await fetch('/api/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({message:text})
      });
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      setMessages(prev => [...prev, {
        role:'assistant',
        text:data.reply || 'No response'
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role:'assistant',
        text:'Chat API is not connected yet.'
      }]);
    }
  }

  return (
    <main style={{maxWidth:700,margin:'auto',padding:20}}>
      <h1>Hello Streaming AI Chat</h1>
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
    </main>
  );
}
