'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {motion,useAnimation,useMotionValue,useTransform} from 'framer-motion';
import {ArrowUpDown,Star,EyeOff,X,BookmarkPlus} from 'lucide-react';
import {Movie,GENRES,tmdb,img,genreNames} from '@/lib/tmdb';
import {useApp,Sort} from '@/lib/store';
import {Confirm,Sheet} from './Dialog';
import Details from './Details';
const SORTS:[Sort,string][]=[['random','Випадково'],['rating','Рейтинг: високий → низький'],['rating-asc','Рейтинг: низький → високий'],['year-desc','Нові → старі'],['year-asc','Старі → нові']];
const RANDOM_SORTS=['popularity.desc','vote_count.desc','revenue.desc','primary_release_date.desc'];
const YEAR_ROW_HEIGHT=40;

function minimumVotes(movie:Movie,sort:Sort){
  if(sort==='rating'||sort==='rating-asc'){
    if(!movie.release_date)return 1501;
    const released=new Date(`${movie.release_date}T00:00:00`);
    if(Number.isNaN(released.getTime()))return 1501;
    const twoYearsAgo=new Date();twoYearsAgo.setFullYear(twoYearsAgo.getFullYear()-2);
    return released>=twoYearsAgo?2500:1501;
  }
  if(!movie.release_date)return 1501;
  const released=new Date(`${movie.release_date}T00:00:00`);
  if(Number.isNaN(released.getTime()))return 1501;
  const now=new Date();
  if(released.getFullYear()===now.getFullYear())return 10;
  const oneYearAgo=new Date(now);oneYearAgo.setFullYear(now.getFullYear()-1);
  if(released>=oneYearAgo)return 150;
  const threeYearsAgo=new Date(now);threeYearsAgo.setFullYear(now.getFullYear()-3);
  if(released>=threeYearsAgo)return 500;
  return 1501;
}

function YearWheel({label,years,value,onChange}:{label:string;years:number[];value:number|null;onChange:(year:number|null)=>void}){
  const wheel=useRef<HTMLDivElement>(null);
  const options:(number|null)[]=[null,...years];
  const selectedIndex=Math.max(0,options.indexOf(value));

  useEffect(()=>{
    if(wheel.current)wheel.current.scrollTop=selectedIndex*YEAR_ROW_HEIGHT;
  },[selectedIndex]);

  function updateFromScroll(){
    if(!wheel.current)return;
    const index=Math.min(options.length-1,Math.max(0,Math.round(wheel.current.scrollTop/YEAR_ROW_HEIGHT)));
    onChange(options[index]);
  }

  return <div className="min-w-0 flex-1">
    <p className="mb-2 text-center text-xs font-medium text-bone/90">{label}</p>
    <div className="relative h-[120px] overflow-hidden rounded-2xl border border-white/10 bg-[#19191a]">
      <div className="pointer-events-none absolute inset-x-1 top-10 z-10 h-10 rounded-lg border-y border-white/10 bg-white/[0.07]"/>
      <div ref={wheel} onScroll={updateFromScroll} className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain text-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="h-10 snap-start"/>
        {options.map((year,index)=><button key={year??'all'} type="button" onClick={()=>wheel.current?.scrollTo({top:index*YEAR_ROW_HEIGHT,behavior:'smooth'})} className={`relative z-20 block h-10 w-full snap-center text-sm transition-colors ${selectedIndex===index?'font-semibold text-bone':'text-mute'}`}>
          {year??'Усі роки'}
        </button>)}
        <div className="h-10 snap-end"/>
      </div>
    </div>
  </div>;
}

export default function Discover(){
  const {s,set,addLater,hide,markSkipped}=useApp();
  const [queue,setQueue]=useState<Movie[]>([]);const [err,setErr]=useState(false);const [loading,setLoading]=useState(true);
  const [open,setOpen]=useState<Movie|null>(null);const [confirm,setConfirm]=useState(false);const [banConfirm,setBanConfirm]=useState(false);const [panel,setPanel]=useState<''|'f'|'s'>('');const [draft,setDraft]=useState({g:[] as number[],so:false,yearFrom:null as number|null,yearTo:null as number|null});
  const busy=useRef(false),visited=useRef(new Set<number>()),total=useRef(500),page=useRef(s.page),mode=useRef<'and'|'or'>('and'),seen=useRef(new Set<number>()),cfg=useRef(s);cfg.current=s;
  const blocked=useCallback((id:number)=>[s.later,s.watched,s.hidden].some(l=>l.some(m=>m.id===id)),[s.later,s.watched,s.hidden]);
  const cards=queue.filter(m=>!blocked(m.id));const cur=cards[0];
  useEffect(()=>{if(s.retry.length){const ids=new Set(s.retry.map(m=>m.id));setQueue(q=>[...s.retry,...q.filter(m=>!ids.has(m.id))]);set({retry:[]})}},[s.retry,set]);
  const load=useCallback(async()=>{
    if(busy.current)return;busy.current=true;setErr(false);
    try{
      for(let t=0;t<8;t++){
        const c=cfg.current;const rnd=c.sort==='random';
        if(page.current>total.current){
          if(c.genres.length>1&&mode.current==='and'){
            mode.current='or';
            visited.current.clear();
            seen.current.clear();
            page.current=1;
            total.current=500;
          }else{
            break;
          }
        }
        const p=page.current;
        const q:Record<string,string|number>={include_adult:'false',page:p,
          sort_by:rnd?RANDOM_SORTS[Math.floor(Math.random()*RANDOM_SORTS.length)]:c.sort==='rating'?'vote_average.desc':c.sort==='rating-asc'?'vote_average.asc':c.sort==='year-desc'?'primary_release_date.desc':'primary_release_date.asc'};
        q['vote_average.gte']=0.1;
        q['vote_count.gte']=c.sort==='rating'||c.sort==='rating-asc'?1501:10;
        q['primary_release_date.gte']=c.yearFrom!==null&&c.yearFrom>1989?`${c.yearFrom}-01-01`:'1989-01-01';
        if(c.sonia)q['vote_average.lte']=6.5;
        if(c.yearTo!==null)q['primary_release_date.lte']=`${c.yearTo}-12-31`;
        if(c.genres.length)q.with_genres=c.genres.join(mode.current=== 'and'?',':'|');
        const d=await tmdb('/discover/movie',q);
        total.current=Math.min(500,d.total_pages||1);visited.current.add(p);
        page.current=p+1;
        set({page:page.current});
        const results:Movie[]=[...(d.results||[])];
        if(rnd){
          for(let i=results.length-1;i>0;i--){
            const j=Math.floor(Math.random()*(i+1));
            [results[i],results[j]]=[results[j],results[i]];
          }
        }
        const fresh:Movie[]=results.filter((m:Movie)=>m.poster_path&&m.vote_average>0&&(m.vote_count||0)>=minimumVotes(m,c.sort)&&(!cfg.current.sonia||m.vote_average<=6.5)&&!seen.current.has(m.id));
        fresh.forEach(m=>seen.current.add(m.id));
        if(fresh.length){setQueue(x=>[...x,...fresh]);break}
      }
    }catch{setErr(true)}
    busy.current=false;setLoading(false);
  },[set]);
  const key=JSON.stringify([s.sort,s.genres,s.sonia,s.yearFrom,s.yearTo]);const prev=useRef(key);
  useEffect(()=>{if(prev.current!==key){prev.current=key;page.current=1;set({page:1});visited.current.clear();total.current=500;mode.current='and';seen.current.clear();setQueue([]);setLoading(true)}},[key,set]);
  useEffect(()=>{if(cards.length<6&&!busy.current)load()},[cards.length,key,load]);
  const x=useMotionValue(0),rot=useTransform(x,[-200,200],[-12,12]),skipO=useTransform(x,[-120,-20],[1,0]),laterO=useTransform(x,[20,120],[0,1]),ctl=useAnimation();
  async function skip(){if(!cur)return;await ctl.start({x:-520,opacity:0,transition:{duration:.22}});markSkipped(cur);setQueue(q=>q.filter(m=>m.id!==cur.id));ctl.set({x:0,opacity:1})}
  async function advanceAfterGameAdd(){if(!cur)return;const id=cur.id;setOpen(null);await new Promise<void>(resolve=>window.setTimeout(resolve,70));const card=document.querySelector('[data-discover-card="true"]')?.getBoundingClientRect();const target=document.querySelector('[data-nav-item="games"]')?.getBoundingClientRect();const dx=card&&target?target.left+target.width/2-(card.left+card.width/2):0;const dy=card&&target?target.top+target.height/2-(card.top+card.height/2):180;await ctl.start({x:dx,y:dy,scale:.08,rotate:10,opacity:0,transition:{duration:.52,ease:[.22,.65,.32,1]}});setQueue(q=>q.filter(m=>m.id!==id));ctl.set({x:0,y:0,scale:1,rotate:0,opacity:1})}
  function later(){ctl.start({x:0,transition:{type:'spring',stiffness:400,damping:30}});setConfirm(true)}
  const sortLabel=SORTS.find(x=>x[0]===s.sort)![1];
  const openF=()=>{setDraft({g:s.genres,so:s.sonia,yearFrom:s.yearFrom,yearTo:s.yearTo});setPanel('f')};
  const currentYear=new Date().getFullYear();
  const years=Array.from({length:currentYear-1899},(_,index)=>currentYear-index);
  const invalidYearRange=draft.yearFrom!==null&&draft.yearTo!==null&&draft.yearFrom>draft.yearTo;
  return <div className="mx-auto max-w-md md:max-w-lg">
    <header className="relative overflow-hidden pt-[env(safe-area-inset-top)]">
      {cur&&<div className="absolute inset-0 scale-150 bg-cover bg-center opacity-80 blur-2xl transition-[background-image] duration-500" style={{backgroundImage:`url(${img(cur.poster_path,'w185')})`}}/>}
      <div className="relative h-[120px]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 390 120" preserveAspectRatio="none"><path d="M0 120V90C0 70 15 62 38 62H92C133 62 118 24 164 24H356C375 24 390 39 390 58V120Z" fill="#0c0c0d"/></svg>
        <button onClick={openF} className="absolute left-9 top-[32px] text-sm font-semibold text-bone/90">Жанри{s.genres.length?` · ${s.genres.length}`:''}</button>
        <button onClick={()=>setPanel('s')} className="absolute right-9 top-[32px] text-sm font-semibold"><ArrowUpDown size={13} className="mr-1 inline"/>{sortLabel}</button>
        <p className="absolute inset-x-0 top-[72px] z-10 mx-auto w-fit max-w-[85%] truncate rounded-full border border-white/20 bg-black/65 px-3 py-0.5 text-center text-xs font-medium tracking-wide text-bone shadow-md shadow-black/25 backdrop-blur-md">{s.name?`Привіт, ${s.name} 🍿`:'Добірка для тебе'}</p>
      </div></header>
    <div className="relative isolate mx-5 mt-8 h-[clamp(300px,calc(100dvh-350px),500px)]">
      {[3,2,1].map(i=>cards[i]&&<div key={cards[i].id} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px] bg-panel shadow-xl transition-transform duration-500" style={{transform:`translateY(${-i*24}px) scale(${1-i*.04})`,zIndex:4-i}}>
        <img src={img(cards[i].poster_path,'w500')} alt="" loading="eager" decoding="async" className="h-full w-full object-cover brightness-[.48]"/></div>)}
      {cur?<motion.div key={cur.id} data-discover-card="true" className="absolute inset-0 z-10 touch-pan-y overflow-hidden rounded-[28px] bg-panel shadow-2xl" style={{x,rotate:rot}} animate={ctl} drag="x" dragSnapToOrigin dragElastic={.9}
        initial={{scale:.95,opacity:0}} whileInView={{scale:1,opacity:1}}
        onDragEnd={(_,i)=>{if(i.offset.x<-110)skip();else if(i.offset.x>110)later()}}>
        <img src={img(cur.poster_path,'w500')} alt={cur.title} draggable={false} loading="eager" fetchPriority="high" decoding="async" className="h-full w-full object-cover"/>
        <button type="button" aria-label={`Деталі фільму ${cur.title}`} onClick={e=>{e.stopPropagation();setOpen(cur)}} className="absolute inset-0 z-[1] cursor-pointer" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20"/>
        <div className="absolute left-3 top-3 flex flex-col items-start gap-2 text-sm font-semibold">
          {genreNames(cur)[0]&&<span className="rounded-full bg-black/85 px-3 py-1.5">{genreNames(cur)[0]}</span>}
          <span className="flex items-center gap-1 rounded-full bg-black/85 px-3 py-1.5"><Star size={13} fill="currentColor"/>{cur.vote_average.toFixed(1)}</span></div>
        <motion.span style={{opacity:skipO}} className="absolute right-4 top-6 rounded-xl border-2 border-bone px-3 py-1 font-extrabold rotate-12">ПРОПУСТИТИ</motion.span>
        <motion.span style={{opacity:laterO}} className="absolute left-24 top-6 rounded-xl border-2 border-bone px-3 py-1 font-extrabold -rotate-12">ПІЗНІШЕ</motion.span>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5"><h2 className="text-2xl font-extrabold leading-tight">{cur.title}</h2>
          <p className="mt-1 text-xs text-bone/70">{genreNames(cur).slice(0,3).join(', ')}</p></div>
      </motion.div>:<div className="absolute inset-0 grid place-items-center rounded-[28px] bg-panel text-center">{err?<div><p>Не вдалося завантажити фільми.</p><button className="btn btn-w mt-3" onClick={load}>Спробувати ще</button></div>:loading?<div className="h-full w-full animate-pulse rounded-[28px] bg-white/5"/>:<div className="px-6"><p>За цими фільтрами збігів не знайдено.</p><button className="btn btn-g mt-3" onClick={()=>setPanel('f')}>Змінити фільтри</button></div>}</div>}
    </div>
    <p className="mt-2 text-center text-[11px] text-mute">← пропустити ·  →   дивитись пізніше</p>
    <div className="mt-1 flex items-center justify-center gap-8 px-4">
      <button className="flex min-w-0 flex-col items-center gap-0.5 py-0.5 text-mute transition hover:text-bone active:scale-95 disabled:opacity-40" onClick={skip} disabled={!cur}>
        <X size={17} strokeWidth={1.8}/><span className="text-[10px]">Пропустити</span>
      </button>
      <button className="flex min-w-0 flex-col items-center gap-0.5 py-0.5 text-mute transition hover:text-bone active:scale-95 disabled:opacity-40" onClick={()=>setBanConfirm(true)} disabled={!cur}>
        <EyeOff size={17} strokeWidth={1.8}/><span className="text-[10px]">Не показувати</span>
      </button>
      <button className="flex min-w-0 flex-col items-center gap-0.5 py-0.5 text-bone/85 transition hover:text-white active:scale-95 disabled:opacity-40" onClick={later} disabled={!cur}>
        <BookmarkPlus size={17} strokeWidth={1.8}/><span className="text-[10px]">Пізніше</span>
      </button>
    </div>
    {confirm&&cur&&<Confirm text="Додати цей фільм у «Дивитись пізніше»?" ok="Додати" onNo={()=>setConfirm(false)} onOk={()=>{addLater(cur);setConfirm(false)}}/>}
    {banConfirm&&cur&&<Confirm text={`Більше не показувати «${cur.title}» у рекомендаціях?`} ok="Заблокувати" no="Скасувати" onNo={()=>setBanConfirm(false)} onOk={()=>{hide(cur);setBanConfirm(false)}}/>}
    {open&&<Details movie={open} onClose={()=>setOpen(null)} onAddToGame={advanceAfterGameAdd}/>}
    {panel==='s'&&<Sheet onClose={()=>setPanel('')}><p className="mb-1 text-lg font-bold">Сортування</p><p className="mb-3 text-xs leading-relaxed text-mute">Для сортування за рейтингом враховуються лише фільми з достатньою кількістю оцінок: від 2&nbsp;500 для фільмів останніх двох років і від 1&nbsp;501 для старіших.</p><div className="grid gap-2">{SORTS.map(([k,l])=><button key={k} className={`chip py-3 text-left ${s.sort===k?'on':''}`} onClick={()=>{set({sort:k});setPanel('')}}>{l}</button>)}</div></Sheet>}
    {panel==='f'&&<Sheet onClose={()=>setPanel('')}><p className="mb-3 text-lg font-bold">Жанри</p>
      <div className="flex flex-wrap gap-2">{Object.entries(GENRES).map(([id,n])=>{const i=+id;return <button key={id} className={`chip ${draft.g.includes(i)?'on':''}`} onClick={()=>setDraft(d=>({...d,g:d.g.includes(i)?d.g.filter(v=>v!==i):[...d.g,i]}))}>{n}</button>})}</div>
      <h3 className="mb-2 mt-5 text-sm font-semibold text-mute">Роки виходу</h3>
      <div className="flex gap-4">
        <YearWheel label="Від" years={years} value={draft.yearFrom} onChange={yearFrom=>setDraft(d=>({...d,yearFrom}))}/>
        <YearWheel label="До" years={years} value={draft.yearTo} onChange={yearTo=>setDraft(d=>({...d,yearTo}))}/>
      </div>
      {invalidYearRange&&<p className="mt-2 text-xs text-red-300">Початковий рік має бути не пізніше кінцевого.</p>}
      <button className={`chip mt-4 ${draft.so?'on':''}`} onClick={()=>setDraft(d=>({...d,so:!d.so}))}>Для Соні</button>
      <div className="mt-6 grid grid-cols-3 gap-2"><button className="btn btn-g" onClick={()=>setPanel('')}>Скасувати</button><button className="btn btn-g" onClick={()=>setDraft({g:[],so:false,yearFrom:null,yearTo:null})}>Скинути</button><button className="btn btn-w" disabled={invalidYearRange} onClick={()=>{set({genres:draft.g,sonia:draft.so,yearFrom:draft.yearFrom,yearTo:draft.yearTo});setPanel('')}}>Застосувати</button></div></Sheet>}
  </div>;
}
