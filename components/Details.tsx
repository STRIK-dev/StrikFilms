'use client';
import {useEffect,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight,Play,Star,EyeOff,X,Gamepad2} from 'lucide-react';
import {Movie,tmdb,img,year,upcoming,genreNames} from '@/lib/tmdb';
import {useApp} from '@/lib/store';
import {Confirm,Rate} from './Dialog';
export default function Details({movie,onClose,onAddToGame}:{movie:Movie;onClose:()=>void;onAddToGame?:()=>void}){
  const {s,set,addLater,watch,hide}=useApp();
  const [movieStack,setMovieStack]=useState<Movie[]>([movie]);const [d,setD]=useState<any>(null);const [collection,setCollection]=useState<any>(null);const [more,setMore]=useState(false);const [dlg,setDlg]=useState<''|'later'|'rate'|'hide'>('');const [trailer,setTrailer]=useState(false);const [leaving,setLeaving]=useState(false);
  const activeMovie=movieStack[movieStack.length-1]||movie;
  const franchiseScroller=useRef<HTMLDivElement>(null);const detailScroll=useRef<HTMLDivElement>(null);
  useEffect(()=>{setMovieStack([movie])},[movie.id]);
  useEffect(()=>{let active=true;if(detailScroll.current)detailScroll.current.scrollTop=0;setD(null);setCollection(null);setMore(false);setDlg('');setTrailer(false);tmdb(`/movie/${activeMovie.id}`,{append_to_response:'credits,videos',include_video_language:'en,null'}).then(v=>{if(active)setD(v)}).catch(()=>{});return()=>{active=false}},[activeMovie.id]);
  const collectionId=d?.belongs_to_collection?.id;
  useEffect(()=>{if(!collectionId){setCollection(null);return}let active=true;setCollection(null);tmdb(`/collection/${collectionId}`).then(v=>{if(active)setCollection(v)}).catch(()=>{});return()=>{active=false}},[collectionId]);
  const m:Movie={...activeMovie,...(d||{})};
  const mine=s.watched.find(x=>x.id===m.id)?.my;const inLater=s.later.some(x=>x.id===m.id);const inGame=s.gameMovies.some(x=>x.id===m.id);
  const vids:any[]=d?.videos?.results?.filter((v:any)=>v.site==='YouTube'&&v.type==='Trailer')||[];
  const tr=vids.find(v=>v.official)||vids[0];
  const cast:any[]=d?.credits?.cast?.slice(0,10)||[];
  const franchiseParts:any[]=collection?.parts?[...collection.parts]:[];
  if(collection&&!franchiseParts.some(p=>Number(p.id)===activeMovie.id))franchiseParts.push({...m,id:activeMovie.id,title:m.title,release_date:m.release_date});
  franchiseParts.sort((a,b)=>(a.release_date||'').localeCompare(b.release_date||''));
  const bg=img(m.backdrop_path||m.poster_path,'w780');
  const back=()=>{if(movieStack.length>1){setLeaving(false);setMovieStack(stack=>stack.slice(0,-1))}else onClose()};
  const openRelated=(part:Movie)=>{setLeaving(false);setMovieStack(stack=>[...stack,part])};
  const addToGame=()=>{if(inGame)return;set({gameMovies:[m,...s.gameMovies]});if(onAddToGame){setLeaving(true);window.setTimeout(onAddToGame,220)}};
  return <div ref={detailScroll} className="fixed inset-0 z-40 overflow-auto bg-ink" style={{opacity:leaving?0:1,transform:leaving?'translateY(12px) scale(.985)':'translateY(0) scale(1)',transition:'opacity 220ms ease, transform 220ms ease'}}>
    <div className="absolute inset-x-0 top-0 h-[60dvh] bg-cover bg-center opacity-40 blur-2xl" style={{backgroundImage:`url(${bg})`}}/>
    <div className="absolute inset-x-0 top-0 h-[70dvh] bg-gradient-to-b from-transparent to-ink"/>
    <div className="relative mx-auto max-w-md px-5 pb-10 pt-[calc(1rem+env(safe-area-inset-top))]">
      <div className="flex items-center justify-between gap-2">
        <button onClick={back} className="glass flex items-center gap-1 rounded-full py-2 pl-2 pr-4 text-sm"><ChevronLeft size={18}/>Назад</button>
        <div className="flex gap-2 text-xs">{genreNames(m)[0]&&<span className="glass rounded-full px-3 py-2">{genreNames(m)[0]}</span>}
          {m.runtime?<span className="glass rounded-full px-3 py-2">{Math.floor(m.runtime/60)}h {m.runtime%60}m</span>:null}
          <span className="glass flex items-center gap-1 rounded-full px-3 py-2"><Star size={12} fill="currentColor"/>{m.vote_average.toFixed(1)}</span></div></div>
      <div className="relative mt-5 aspect-[4/3] overflow-hidden rounded-3xl bg-panel">
        {bg&&<img src={bg} alt="" className="h-full w-full object-cover"/>}
        {tr&&<button onClick={()=>setTrailer(true)} className="btn btn-w absolute bottom-3 right-3 flex items-center gap-2 !py-2 text-sm"><Play size={14} fill="currentColor"/>Трейлер</button>}
        {upcoming(m)&&<span className="glass absolute left-3 top-3 rounded-full px-3 py-1 text-xs">Ще не вийшов</span>}</div>
      <h1 className="mt-5 text-3xl font-extrabold leading-tight">{m.title}</h1>
      <p className="mt-1 text-sm text-mute">{year(m)} · {genreNames(m).join(', ')}</p>
      {mine&&<p className="mt-2 font-semibold">Моя оцінка: {mine}/10</p>}
      <p className={`mt-3 text-[15px] leading-relaxed text-bone/80 ${more?'':'line-clamp-4'}`}>{m.overview||'—'}</p>
      {(m.overview?.length||0)>200&&<button onClick={()=>setMore(!more)} className="mt-1 text-sm font-semibold">{more?'Згорнути':'Читати далі'}</button>}
      {cast.length>0&&<><h2 className="mb-2 mt-6 text-lg font-bold">Актори</h2>
        <p className="text-[15px] leading-relaxed text-bone/80">{cast.map(c=>c.name).join(', ')}</p></>}
      {franchiseParts.length>1&&<section className="mt-7"><div className="mb-3 flex items-center justify-between gap-2"><h2 className="min-w-0 text-lg font-bold">Хронологія · {collection.name}</h2><div className="flex shrink-0 gap-1"><button className="chip px-2 py-1.5" aria-label="Прокрутити франшизу вліво" onClick={()=>franchiseScroller.current?.scrollBy({left:-220,behavior:'smooth'})}><ChevronLeft size={16}/></button><button className="chip px-2 py-1.5" aria-label="Прокрутити франшизу вправо" onClick={()=>franchiseScroller.current?.scrollBy({left:220,behavior:'smooth'})}><ChevronRight size={16}/></button></div></div><div ref={franchiseScroller} className="-mx-5 flex touch-pan-x gap-3 overflow-x-auto overscroll-x-contain px-5 pb-2" style={{touchAction:'pan-x'}}>{franchiseParts.map((p:any)=>{const isCurrent=Number(p.id)===activeMovie.id;const part:Movie={...p,...(isCurrent?m:{}),id:Number(p.id),title:isCurrent?m.title:p.title||p.name||p.original_title||p.original_name||'Без назви',poster_path:(isCurrent?m.poster_path:p.poster_path)||null,release_date:(isCurrent?m.release_date:p.release_date)||'',vote_average:Number((isCurrent?m.vote_average:p.vote_average))||0};return <button key={part.id} aria-current={isCurrent?'true':undefined} disabled={isCurrent} className={`w-28 shrink-0 text-left ${isCurrent?'cursor-default':''}`} onClick={()=>openRelated(part)}><div className={`relative aspect-[2/3] overflow-hidden rounded-xl bg-panel ${isCurrent?'ring-2 ring-bone':''}`}>{part.poster_path&&<img loading="lazy" src={img(part.poster_path,'w185')} alt={part.title} className="h-full w-full object-cover"/>}{isCurrent&&<span className="absolute inset-x-1 bottom-1 rounded-md bg-black/80 px-1 py-1 text-center text-[10px] font-semibold">Зараз відкрито</span>}</div><p className="mt-2 line-clamp-2 text-xs font-semibold">{part.title}</p><p className="text-[11px] text-mute">{year(part)} · {part.vote_average.toFixed(1)}</p></button>})}</div></section>}
      <div className="mt-7 grid gap-3">
        <button className="btn btn-g flex items-center justify-center gap-2" onClick={()=>inGame?set({gameMovies:s.gameMovies.filter(x=>x.id!==m.id)}):addToGame()}><Gamepad2 size={16}/>{inGame?'Прибрати з "Battles"':'Додати до "Battles"'}</button>
        {!inLater&&mine===undefined&&<button className="btn btn-w" onClick={()=>setDlg('later')}>Додати в «Дивитись пізніше»</button>}
        <button className="btn btn-g" onClick={()=>setDlg('rate')}>{mine===undefined?'Позначити переглянутим':'Змінити оцінку'}</button>
        <button className="btn flex items-center justify-center gap-2 text-mute" onClick={()=>setDlg('hide')}><EyeOff size={16}/>Ніколи не показувати</button></div></div>
    {dlg==='later'&&<Confirm text="Додати цей фільм у «Дивитись пізніше»?" ok="Додати" onNo={()=>setDlg('')} onOk={()=>{addLater(m);setDlg('')}}/>}
    {dlg==='rate'&&<Rate initial={mine} onClose={()=>setDlg('')} onSave={r=>{watch(m,r);setDlg('')}}/>}
    {dlg==='hide'&&<Confirm text="Приховати цей фільм назавжди? Він більше не з’являтиметься у ваших рекомендаціях." ok="Приховати" no="Скасувати" onNo={()=>setDlg('')} onOk={()=>{hide(m);onClose()}}/>}
    {trailer&&tr&&<div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-3" onClick={()=>setTrailer(false)}>
      <button className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] glass rounded-full p-2"><X/></button>
      <iframe className="aspect-video w-full max-w-3xl rounded-2xl" allow="autoplay; encrypted-media; fullscreen" allowFullScreen src={`https://www.youtube-nocookie.com/embed/${tr.key}?autoplay=1`}/></div>}
  </div>;
}
