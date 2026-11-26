'use client';
import {useEffect,useRef,useState} from 'react';
import {Check,ChevronDown,ChevronRight,Trash2,Pencil,Star,Search} from 'lucide-react';
import {Movie,img,year,tmdb} from '@/lib/tmdb';
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
function WatchedFranchises({items,visibleItems}:{items:Movie[];visibleItems:Movie[]}){
  const {watch,unwatch}=useApp();
  const [groups,setGroups]=useState<{id:number;name:string;poster:string|null;parts:Movie[]}[]>([]);
  const [loading,setLoading]=useState(true);const [expanded,setExpanded]=useState<number|null>(null);
  const [open,setOpen]=useState<Movie|null>(null);const [rate,setRate]=useState<Movie|null>(null);const [del,setDel]=useState<Movie|null>(null);
  const source=useRef(items);source.current=items;const ids=items.map(m=>`${m.id}:${m.my??''}`).join(',');
  useEffect(()=>{let active=true;
    (async()=>{setLoading(true);try{
      const watched=source.current;const details:{movie:Movie;collection:{id:number;name:string;poster_path?:string|null}|null}[]=[];
      for(let i=0;i<watched.length;i+=5){const batch=await Promise.all(watched.slice(i,i+5).map(async movie=>{try{const detail=movie.belongs_to_collection===undefined?await tmdb(`/movie/${movie.id}`):movie;return{movie,collection:detail.belongs_to_collection||null}}catch{return{movie,collection:null}}}));details.push(...batch)}
      const unique=new Map<number,{id:number;name:string;poster_path?:string|null}>();details.forEach(x=>{if(x.collection)unique.set(x.collection.id,x.collection)});
      const collections=new Map<number,any>();const collectionList=[...unique.values()];
      for(let i=0;i<collectionList.length;i+=5){const batch=await Promise.all(collectionList.slice(i,i+5).map(async c=>{try{return await tmdb(`/collection/${c.id}`)}catch{return null}}));batch.forEach((d,index)=>{if(d?.id)collections.set(d.id,d)})}
      const watchedById=new Map(watched.map(m=>[m.id,m]));const grouped=new Map<number,{id:number;name:string;poster:string|null;parts:Movie[]}>();
      for(const x of details){if(!x.collection)continue;const collection=collections.get(x.collection.id);if(!collection)continue;
        if(!grouped.has(x.collection.id))grouped.set(x.collection.id,{id:x.collection.id,name:collection.name||x.collection.name,poster:collection.poster_path||x.collection.poster_path||null,parts:[]});
        const group=grouped.get(x.collection.id)!;for(const p of collection.parts||[]){const id=Number(p.id);if(group.parts.some(m=>m.id===id))continue;const seen=watchedById.get(id);group.parts.push(seen||{...p,id,title:p.title||p.name||p.original_title||p.original_name||'Без назви',poster_path:p.poster_path||null,release_date:p.release_date||'',vote_average:Number(p.vote_average)||0})}
        if(!group.parts.some(m=>m.id===x.movie.id))group.parts.push(x.movie);
      }
      grouped.forEach(g=>g.parts.sort((a,b)=>(a.release_date||'').localeCompare(b.release_date||'')));
      if(active){setGroups([...grouped.values()]);setLoading(false)}
    }catch{if(active){setGroups([]);setLoading(false)}}})();
    return()=>{active=false};
  },[ids]);
  if(loading)return <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({length:4},(_,i)=><div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-panel"/>)}</div>;
  if(!items.length)return <p className="mt-24 text-center text-mute">Ви ще не переглянули жодного фільму.</p>;
  const watchedIds=new Set(items.map(m=>m.id));const groupByMovie=new Map<number,typeof groups[number]>();groups.forEach(g=>g.parts.forEach(m=>groupByMovie.set(m.id,g)));
  const cards:{key:string;name:string;poster:string|null;parts:Movie[];collection:boolean}[]=[];const addedGroups=new Set<number>();
  for(const m of visibleItems){const group=groupByMovie.get(m.id);if(group){if(!addedGroups.has(group.id)){cards.push({key:`collection-${group.id}`,name:group.name,poster:group.poster,parts:group.parts,collection:true});addedGroups.add(group.id)}}else cards.push({key:`movie-${m.id}`,name:m.title,poster:m.poster_path,parts:[m],collection:false})}
  if(!cards.length)return <p className="mt-16 text-center text-mute">За цим запитом нічого не знайдено.</p>;
  return <>
    <div className="grid gap-3">{cards.map(card=>{const count=card.parts.filter(m=>watchedIds.has(m.id)).length;const isOpen=card.collection&&expanded===Number(card.key.replace('collection-',''));const groupId=card.collection?Number(card.key.replace('collection-','')):null;return <section key={card.key} className="overflow-hidden rounded-2xl bg-panel">
      <div className="flex items-center gap-3 p-3"><button className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={card.collection?isOpen:undefined} onClick={()=>card.collection?setExpanded(isOpen?null:groupId):setOpen(card.parts[0])}>{card.poster?<img src={img(card.poster,'w185')} alt="" className="h-16 w-12 shrink-0 rounded-lg object-cover"/>:<div className="h-16 w-12 shrink-0 rounded-lg bg-white/10"/>}<span className="min-w-0 flex-1"><span className="block line-clamp-2 font-bold">{card.collection?`${card.name} | Колекція`:card.name}</span>{card.parts.length===1?<span className="mt-1 flex items-center gap-1 text-xs text-mute"><Star size={12} fill="currentColor" className="text-bone/70"/>Моя оцінка: {card.parts[0].my??'—'}/10</span>:<><span className="mt-1 block text-xs text-mute">Переглянуто {count} з {card.parts.length}</span><span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-bone/80" style={{width:`${count/card.parts.length*100}%`}}/></span></>}</span>{card.collection&&isOpen?<ChevronDown size={18}/>:<ChevronRight size={18}/>}</button>{!card.collection&&<button className="chip shrink-0 px-2" aria-label={`Прибрати ${card.name} зі списку переглянутих`} onClick={()=>setDel(card.parts[0])}><Trash2 size={14}/></button>}</div>
      {card.collection&&isOpen&&<div className="grid gap-2 border-t border-white/10 p-2">{card.parts.map(m=>{const seen=watchedIds.has(m.id);return <div key={m.id} className="flex items-center gap-2 rounded-xl bg-black/20 p-2"><button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={()=>setOpen(m)}><img src={img(m.poster_path,'w92')} alt="" className="h-14 w-10 shrink-0 rounded-lg object-cover"/><span className="min-w-0 flex-1"><span className="block line-clamp-2 text-sm font-medium">{m.title}</span><span className={`mt-1 block text-xs ${seen?'text-green-300':'text-mute'}`}>{seen?`Переглянуто${m.my!==undefined?` · ${m.my}/10`:''}`:'Ще не переглянуто'}</span></span></button>{seen&&<><button className="chip shrink-0 px-2" aria-label={`Змінити оцінку ${m.title}`} onClick={()=>setRate(m)}><Pencil size={14}/></button><button className="chip shrink-0 px-2" aria-label={`Прибрати ${m.title} зі списку переглянутих`} onClick={()=>setDel(m)}><Trash2 size={14}/></button></>}</div>})}</div>}
    </section>})}</div>
    {open&&<Details movie={open} onClose={()=>setOpen(null)}/>}
    {rate&&<Rate initial={rate.my} onClose={()=>setRate(null)} onSave={r=>{watch(rate,r);setRate(null)}}/>}
    {del&&<Confirm text={`Прибрати «${del.title}» зі списку переглянутих?`} ok="Прибрати" no="Скасувати" onNo={()=>setDel(null)} onOk={()=>{unwatch(del.id);setDel(null)}}/>}
  </>;
}
export function ListScreen({kind}:{kind:'later'|'watched'}){
  const {s}=useApp();const [sort,setSort]=useState('new');const [query,setQuery]=useState('');
  const base=kind==='later'?s.later:s.watched;
  const items=[...base].sort((a,b)=>sort==='rating'?b.vote_average-a.vote_average:sort==='year'?(b.release_date||'').localeCompare(a.release_date||''):sort==='my'?(b.my||0)-(a.my||0):0);
  const visibleItems=kind==='watched'&&query.trim()?items.filter(m=>m.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())):items;
  return <div className="mx-auto max-w-3xl px-5 pt-[calc(1rem+env(safe-area-inset-top))]">
    <div className="mb-4 flex items-center justify-between"><h1 className="text-2xl font-extrabold">{kind==='later'?'Дивитись пізніше':'Переглянуто'}</h1>
      <select value={sort} onChange={e=>setSort(e.target.value)} className="rounded-full bg-panel px-3 py-2 text-sm"><option value="new">Нещодавні</option><option value="rating">TMDB</option><option value="year">Рік</option>{kind==='watched'&&<option value="my">Моя оцінка</option>}</select></div>
    {kind==='watched'&&<label className="mb-4 flex items-center gap-2 rounded-2xl bg-panel px-3 py-2.5 text-mute"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Пошук серед переглянутих" className="min-w-0 flex-1 bg-transparent text-sm text-bone outline-none placeholder:text-mute"/><span className="sr-only">Пошук переглянутих фільмів</span></label>}
    {kind==='watched'?<WatchedFranchises items={items} visibleItems={visibleItems}/>:<Grid items={items} kind="later" empty="Ваш список порожній."/>}</div>;
}
