'use client';
import {useRef,useState} from 'react';
import {useApp,validate} from '@/lib/store';
import {Movie,img,genreNames} from '@/lib/tmdb';
import {Confirm} from './Dialog';
import Details from './Details';
export default function Profile(){
  const {s,set,restore,replace,reset,retrySkipped,removeSkipped}=useApp();const [dlg,setDlg]=useState<''|'reset'|'import'>('');const [msg,setMsg]=useState('');const [open,setOpen]=useState<Movie|null>(null);const pending=useRef<any>(null);
  const my=s.watched.map(m=>m.my||0);const avg=my.length?(my.reduce((a,b)=>a+b,0)/my.length).toFixed(1):'—';
  const hi=[...s.watched].sort((a,b)=>(b.my||0)-(a.my||0))[0],lo=[...s.watched].sort((a,b)=>(a.my||0)-(b.my||0))[0];
  const gc:Record<string,number>={};s.watched.forEach(m=>genreNames(m).forEach(g=>gc[g]=(gc[g]||0)+1));
  const top=Object.entries(gc).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const exp=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(s,null,2)],{type:'application/json'}));a.download='strikfilms-backup.json';a.click()};
  const imp=async(f?:File)=>{if(!f)return;try{const v=validate(JSON.parse(await f.text()));if(!v)throw 0;pending.current=v;setDlg('import')}catch{setMsg('Файл пошкоджений або має невірний формат.')}};
  const Stat=({l,v}:{l:string;v:string|number})=><div className="rounded-2xl bg-panel p-4"><p className="text-2xl font-extrabold">{v}</p><p className="text-xs text-mute">{l}</p></div>;
  return <div className="mx-auto max-w-xl px-5 pt-[calc(1rem+env(safe-area-inset-top))]">
    <h1 className="text-2xl font-extrabold">{s.name?`Привіт, ${s.name} 🍿`:'Профіль'}</h1>
    <input value={s.name} onChange={e=>set({name:e.target.value})} placeholder="Ваше ім’я" className="mt-4 w-full rounded-2xl bg-panel p-3 outline-none"/>
    <div className="mt-5 grid grid-cols-2 gap-3"><Stat l="Переглянуто" v={s.watched.length}/><Stat l="Середня оцінка" v={avg}/><Stat l="Найвища" v={hi?`${hi.my} · ${hi.title}`:'—'}/><Stat l="Найнижча" v={lo?`${lo.my} · ${lo.title}`:'—'}/><Stat l="Дивитись пізніше" v={s.later.length}/></div>
    {top.length>0&&<p className="mt-3 text-sm text-mute">Улюблені жанри: {top.map(([g,n])=>`${g} (${n})`).join(', ')}</p>}
    <div className="mt-8 flex items-center justify-between"><h2 className="text-lg font-bold">Приховані ({s.hidden.length})</h2>{s.hidden.length>0&&<button className="chip" onClick={()=>restore()}>Відновити всі</button>}</div>
    <div className="mt-2 grid gap-2">{s.hidden.map(m=><div key={m.id} className="flex items-center gap-3 rounded-2xl bg-panel p-2"><img src={img(m.poster_path,'w92')} alt="" className="h-14 w-10 rounded-lg object-cover"/><p className="flex-1 line-clamp-1">{m.title}</p><button className="chip" onClick={()=>restore(m.id)}>Відновити</button></div>)}</div>
    <div className="mt-8 flex items-center justify-between"><h2 className="text-lg font-bold">Пропущені ({s.skipped.length})</h2>{s.skipped.length>0&&<button className="chip" onClick={()=>set({skipped:[]})}>Очистити</button>}</div>
    <div className="mt-2 grid gap-2">{s.skipped.map(m=><div key={m.id} className="flex items-center gap-2 rounded-2xl bg-panel p-2"><button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={()=>setOpen(m)} aria-label={`Відкрити опис фільму ${m.title}`}><img src={img(m.poster_path,'w92')} alt="" className="h-14 w-10 shrink-0 rounded-lg object-cover"/><span className="min-w-0 flex-1 line-clamp-2 text-sm font-medium">{m.title}</span></button><button className="chip shrink-0" onClick={()=>retrySkipped(m)}>Повернути</button><button className="chip shrink-0" aria-label={`Видалити ${m.title} з історії`} onClick={()=>removeSkipped(m.id)}>×</button></div>)}</div>
    <div className="mt-8 grid grid-cols-2 gap-3"><button className="btn btn-g" onClick={exp}>Експорт</button><label className="btn btn-g cursor-pointer text-center">Імпорт<input type="file" accept="application/json" hidden onChange={e=>imp(e.target.files?.[0])}/></label></div>
    {msg&&<p className="mt-2 text-sm">{msg}</p>}
    <button className="btn mt-3 w-full text-red-300" onClick={()=>setDlg('reset')}>Видалити всі дані</button>
    <p className="mt-6 text-xs leading-relaxed text-mute">Дані зберігаються лише в цьому браузері на цьому пристрої. Очищення сховища браузера або інший телефон — і списки зникнуть, якщо не зробити експорт.</p>
    <p className="mt-8 pb-4 text-center text-[10px] font-medium uppercase tracking-[.24em] text-mute/60">Designed &amp; made by STRIK</p>
    {open&&<Details movie={open} onClose={()=>setOpen(null)}/>}
    {dlg==='reset'&&<Confirm text="Видалити всі особисті дані? Це неможливо скасувати." ok="Видалити" no="Скасувати" onNo={()=>setDlg('')} onOk={()=>{reset();setDlg('')}}/>}
    {dlg==='import'&&<Confirm text="Імпорт замінить усі поточні дані. Продовжити?" ok="Імпортувати" no="Скасувати" onNo={()=>setDlg('')} onOk={()=>{replace(pending.current);setDlg('');setMsg('Дані імпортовано.')}}/>}
  </div>;
}
