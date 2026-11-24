'use client';
import {useState} from 'react';
import {Check,Trash2,Pencil,Star} from 'lucide-react';
import {Movie,img,year} from '@/lib/tmdb';
import {useApp} from '@/lib/store';
import {Confirm,Rate} from './Dialog';
import Details from './Details';
export function Grid({items,kind,empty}:{items:Movie[];kind:'later'|'watched'|'search';empty:string}){
  const {watch,unlater,unwatch}=useApp();
  const [open,setOpen]=useState<Movie|null>(null);const [rate,setRate]=useState<Movie|null>(null);const [del,setDel]=useState<Movie|null>(null);
  if(!items.length)return <p className="mt-24 text-center text-mute">{empty}</p>;
  return <><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{items.map(m=><div key={m.id}>
    <button className="block w-full text-left" onClick={()=>setOpen(m)}>
      <div className="aspect-[2/3] overflow-hidden rounded-2xl bg-panel">{m.poster_path&&<img loading="lazy" src={img(m.poster_path,'w342')} alt={m.title} className="h-full w-full object-cover"/>}</div>
      <p className="mt-2 line-clamp-1 font-bold">{m.title}</p>
      <p className="flex items-center gap-1 text-xs text-mute">{year(m)} · <Star size={11} fill="currentColor"/>{m.vote_average.toFixed(1)}</p>
      {kind==='watched'&&<p className="text-sm font-semibold">Моя: {m.my}/10</p>}</button>
    {kind!=='search'&&<div className="mt-2 flex gap-2">
      <button className="chip flex-1 py-2" aria-label="rate" onClick={()=>setRate(m)}>{kind==='later'?<Check size={16} className="mx-auto"/>:<Pencil size={16} className="mx-auto"/>}</button>
      <button className="chip flex-1 py-2" aria-label="remove" onClick={()=>setDel(m)}><Trash2 size={16} className="mx-auto"/></button></div>}</div>)}</div>
    {open&&<Details movie={open} onClose={()=>setOpen(null)}/>}
    {rate&&<Rate initial={rate.my} onClose={()=>setRate(null)} onSave={r=>{watch(rate,r);setRate(null)}}/>}
    {del&&<Confirm text={`Видалити «${del.title}» зі списку?`} ok="Видалити" no="Скасувати" onNo={()=>setDel(null)} onOk={()=>{kind==='later'?unlater(del.id):unwatch(del.id);setDel(null)}}/>}</>;
}
export function ListScreen({kind}:{kind:'later'|'watched'}){
  const {s}=useApp();const [sort,setSort]=useState('new');
  const base=kind==='later'?s.later:s.watched;
  const items=[...base].sort((a,b)=>sort==='rating'?b.vote_average-a.vote_average:sort==='year'?(b.release_date||'').localeCompare(a.release_date||''):sort==='my'?(b.my||0)-(a.my||0):0);
  return <div className="mx-auto max-w-3xl px-5 pt-[calc(1rem+env(safe-area-inset-top))]">
    <div className="mb-4 flex items-center justify-between"><h1 className="text-2xl font-extrabold">{kind==='later'?'Дивитись пізніше':'Переглянуто'}</h1>
      <select value={sort} onChange={e=>setSort(e.target.value)} className="rounded-full bg-panel px-3 py-2 text-sm"><option value="new">Нещодавні</option><option value="rating">TMDB</option><option value="year">Рік</option>{kind==='watched'&&<option value="my">Моя оцінка</option>}</select></div>
    <Grid items={items} kind={kind} empty={kind==='later'?'Ваш список порожній.':'Ви ще не переглянули жодного фільму.'}/></div>;
}
