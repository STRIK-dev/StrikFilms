'use client';
import {useEffect,useState} from 'react';
import {ChevronLeft,Play,Star,EyeOff,X} from 'lucide-react';
import {Movie,tmdb,img,year,upcoming,genreNames} from '@/lib/tmdb';
import {useApp} from '@/lib/store';
import {Confirm,Rate} from './Dialog';
export default function Details({movie,onClose}:{movie:Movie;onClose:()=>void}){
  const {s,addLater,watch,hide}=useApp();
  const [d,setD]=useState<any>(null);const [more,setMore]=useState(false);const [dlg,setDlg]=useState<''|'later'|'rate'|'hide'>('');const [trailer,setTrailer]=useState(false);
  useEffect(()=>{tmdb(`/movie/${movie.id}`,{append_to_response:'credits,videos',include_video_language:'en,null'}).then(setD).catch(()=>{})},[movie.id]);
  const m:Movie={...movie,...(d||{})};
  const mine=s.watched.find(x=>x.id===m.id)?.my;const inLater=s.later.some(x=>x.id===m.id);
  const vids:any[]=d?.videos?.results?.filter((v:any)=>v.site==='YouTube'&&v.type==='Trailer')||[];
  const tr=vids.find(v=>v.official)||vids[0];
  const cast:any[]=d?.credits?.cast?.slice(0,10)||[];
  const bg=img(m.backdrop_path||m.poster_path,'w780');
  return <div className="fixed inset-0 z-40 overflow-auto bg-ink">
    <div className="absolute inset-x-0 top-0 h-[60dvh] bg-cover bg-center opacity-40 blur-2xl" style={{backgroundImage:`url(${bg})`}}/>
    <div className="absolute inset-x-0 top-0 h-[70dvh] bg-gradient-to-b from-transparent to-ink"/>
    <div className="relative mx-auto max-w-md px-5 pb-10 pt-[calc(1rem+env(safe-area-inset-top))]">
      <div className="flex items-center justify-between gap-2">
        <button onClick={onClose} className="glass flex items-center gap-1 rounded-full py-2 pl-2 pr-4 text-sm"><ChevronLeft size={18}/>Назад</button>
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
      <div className="mt-7 grid gap-3">
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
