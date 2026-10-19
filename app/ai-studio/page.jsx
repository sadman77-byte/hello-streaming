'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';

const STARTER_MODELS=['auto/bynara','deepseek-v4-flash'];
const MODES={discuss:'General Chat',summary:'Summary Expert',translate:'Translation Expert',quiz:'Study & Quiz',fact:'Critical Analyst',code:'Coding Assistant',research:'Research Assistant',creative:'Creative Writer',teacher:'AI Teacher'};

export default function AIStudio(){
 const [transcript,setTranscript]=useState('');
 const [showTranscript,setShowTranscript]=useState(false);
 const [question,setQuestion]=useState('');
 const [mode,setMode]=useState('discuss');
 const [model,setModel]=useState('auto/bynara');
 const [models,setModels]=useState(STARTER_MODELS);
 const [messages,setMessages]=useState([]);
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState('');
 const [online,setOnline]=useState(true);
 const [modelSource,setModelSource]=useState('fallback');
 const [apiKey,setApiKey]=useState('');

 useEffect(()=>{
  try{
   setTranscript(localStorage.getItem('hello-ai-transcript')||'');
   setMessages(JSON.parse(localStorage.getItem('hello-ai-chat')||'[]'));
  }catch{}
  setOnline(navigator.onLine);
  const on=()=>setOnline(navigator.onLine);
  window.addEventListener('online',on);
  window.addEventListener('offline',on);
  return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',on)};
 },[]);
 useEffect(()=>{try{localStorage.setItem('hello-ai-transcript',transcript)}catch{}},[transcript]);
 useEffect(()=>{try{localStorage.setItem('hello-ai-chat',JSON.stringify(messages.slice(-20)))}catch{}},[messages]);

 async function loadModels(){
  try{
   const headers={};
   if(apiKey.trim())headers['x-nararouter-api-key']=apiKey.trim();
   const response=await fetch('/api/ai/nararouter',{headers,cache:'no-store'});
   const data=await response.json();
   if(Array.isArray(data.models)&&data.models.length){
    setModels(data.models);
    setModelSource(data.source||'unknown');
    if(!data.models.includes(model))setModel(data.models.includes('auto/bynara')?'auto/bynara':data.models[0]);
   }
   if(data.warning)setStatus('Model তালিকা লোড হয়নি; default model দিয়ে চেষ্টা করা যাবে। '+data.warning);
  }catch{setModelSource('fallback')}
 }

 async function ask(){
  if(!question.trim()){setStatus('প্রথমে প্রশ্ন লিখো।');return}
  if(!online){setStatus('Offline: AI উত্তর পেতে ইন্টারনেট প্রয়োজন।');return}
  setBusy(true);setStatus('');
  const q=question.trim();
  const history=messages.slice(-8);
  setMessages(v=>[...v,{role:'user',content:q}]);
  setQuestion('');
  try{
   const headers={'Content-Type':'application/json'};
   if(apiKey.trim())headers['x-nararouter-api-key']=apiKey.trim();
   const response=await fetch('/api/ai/nararouter',{method:'POST',headers,body:JSON.stringify({transcript:showTranscript?transcript:'',question:q,mode,model,history})});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||('AI unavailable (HTTP '+response.status+')'));
   setMessages(v=>[...v,{role:'assistant',content:data.answer||'No answer'}]);
   if(data.model)setStatus('উত্তর এসেছে · Model: '+data.model);
  }catch(error){setStatus(error.message||'NaraRouter request failed.')}
  finally{setBusy(false)}
 }

 return <main className="min-h-screen bg-[#080b14] p-5 text-white"><div className="mx-auto max-w-4xl space-y-5">
  <Link href="/" className="text-rose-400">← Hello Streaming</Link>
  <h1 className="text-3xl font-bold">AI Studio · Multi-Model AI Assistants</h1>
  <p className="text-slate-300">একটি NaraRouter API সংযোগ দিয়ে সমর্থিত AI মডেলে চ্যাট, গবেষণা, অনুবাদ, কোডিং ও পড়াশোনা করো। মডেল অ্যাক্সেস ও ক্রেডিট NaraRouter-এর account plan-এর ওপর নির্ভরশীল।</p>
  <p role="status" className="text-sm text-amber-300">{online?'Online · NaraRouter':'Offline · Saved transcript and chat available'}</p>
  <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
   <label htmlFor="nararouter-key" className="block font-semibold">NaraRouter API Key</label>
   <input id="nararouter-key" type="password" autoComplete="off" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-nry-… (optional if configured on Vercel)" className="w-full rounded-xl border border-slate-600 bg-slate-900 p-3 text-white"/>
   <div className="flex flex-wrap items-center gap-3">
    <a href="https://router.bynara.id/" target="_blank" rel="noreferrer" className="rounded-xl bg-rose-600 px-4 py-2 font-semibold">NaraRouter Dashboard ↗</a>
    <a href="https://router.bynara.id/docs" target="_blank" rel="noreferrer" className="text-sm text-rose-300 underline">API documentation</a>
    <button type="button" onClick={loadModels} className="rounded-xl bg-slate-700 px-4 py-2">Load my models</button>
   </div>
   <p className="text-xs leading-5 text-slate-400">Key এই পেজের memory-তে থাকে, browser storage-এ save হয় না এবং refresh করলে মুছে যায়। আরও নিরাপদ বিকল্প: Vercel → Project Settings → Environment Variables-এ NARAROUTER_API_KEY সেট করো। Secret key কখনো public GitHub code-এ রেখো না।</p>
  </section>
  <label className="flex items-center gap-2"><input type="checkbox" checked={showTranscript} onChange={e=>setShowTranscript(e.target.checked)}/> Transcript / context যুক্ত করো</label>
  {showTranscript&&<label className="block">Transcript<textarea className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 p-3" rows={10} value={transcript} onChange={e=>setTranscript(e.target.value)} placeholder="ঐচ্ছিক: লেখা, নোট বা transcript পেস্ট করো।"/></label>}
  <div className="flex flex-wrap gap-3">
   <label>Assistant<select className="ml-2 rounded bg-slate-800 p-2" value={mode} onChange={e=>setMode(e.target.value)}>{Object.entries(MODES).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
   <label>Model<select className="ml-2 max-w-60 rounded bg-slate-800 p-2" value={model} onChange={e=>setModel(e.target.value)}>{[...new Set([model,...models])].map(m=><option key={m} value={m}>{m}</option>)}</select></label>
  </div>
  <p className="text-xs text-slate-400">{modelSource==='live'?'Model list loaded from your NaraRouter account.':modelSource==='fallback'?'Default models shown. Tap “Load my models” after adding your API key to load your entitled models.':'Loading model list...'}</p>
  <div className="space-y-3">{messages.map((message,index)=><div key={index} className="whitespace-pre-wrap rounded-xl bg-slate-900 p-4"><strong>{message.role==='user'?'You':'Assistant'}: </strong>{message.content}</div>)}</div>
  <textarea className="w-full rounded-xl border border-slate-600 bg-slate-900 p-3" rows={3} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="যেকোনো প্রশ্ন করো, কোড লিখতে বলো, অনুবাদ বা গবেষণা করতে বলো..."/>
  <div className="flex gap-3"><button disabled={busy||!online} onClick={ask} className="rounded-xl bg-rose-600 px-5 py-3 disabled:opacity-50">{busy?'Thinking...':'Ask AI'}</button><button onClick={()=>{setMessages([]);setStatus('চ্যাট মুছে ফেলা হয়েছে।')}} className="rounded-xl bg-slate-700 px-5 py-3">Clear chat</button></div>
  {status&&<p role="alert" className="whitespace-pre-wrap text-amber-300">{status}</p>}
  <p className="text-sm text-slate-400">AI responses need internet and a valid NaraRouter API key (or a configured server key). Avoid sharing sensitive information.</p>
 </div></main>
}
