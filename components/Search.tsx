'use client';
import {useEffect,useState} from 'react';
import {Search as I} from 'lucide-react';
import {Movie,tmdb} from '@/lib/tmdb';
import {Grid} from './Lists';
export default function Search(){
  const [q,setQ]=useState('');const [r,setR]=useState<Movie[]>([]);const [st,setSt]=useState<'idle'|'load'|'err'|'ok'>('idle');
  useEffect(()=>{if(!q.trim()){setSt('idle');setR([]);return}setSt('load');
    const t=setTimeout(()=>{tmdb('/search/movie',{query:q.trim(),include_adult:'false'}).then(d=>{setR((d.results||[]).filter((m:Movie)=>m.vote_average>0));setSt('ok')}).catch(()=>setSt('err'))},400);return()=>clearTimeout(t)},[q]);
  return <div className="mx-auto max-w-3xl px-5 pt-[calc(1rem+env(safe-area-inset-top))]">
    <div className="glass flex items-center gap-2 rounded-full px-4"><I size={18}/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Назва фільму" className="w-full bg-transparent py-3 outline-none"/></div>
    <div className="mt-5">{st==='load'?<p className="mt-16 text-center text-mute">Шукаємо…</p>:st==='err'?<p className="mt-16 text-center text-mute">Помилка пошуку. Спробуйте ще раз.</p>:<Grid items={r} kind="search" empty={st==='idle'?'Введіть назву фільму.':'Фільмів не знайдено.'}/>}</div></div>;
}
