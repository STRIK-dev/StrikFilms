'use client';
import {useState} from 'react';
import {AnimatePresence,motion} from 'framer-motion';
import {ChevronLeft,RotateCcw,Trash2,X} from 'lucide-react';
import {useApp} from '@/lib/store';
import {Movie,img} from '@/lib/tmdb';
import Details from './Details';

export default function SkippedDrawer(){
  const {s,retrySkipped,removeSkipped,set}=useApp();
  const [open,setOpen]=useState(false);const [details,setDetails]=useState<Movie|null>(null);
  return <>
    <button onClick={()=>setOpen(true)} aria-label={`Показати пропущені фільми (${s.skipped.length})`} className="fixed left-0 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-1.5 rounded-r-xl border border-l-0 border-white/10 bg-black/75 px-1 py-2.5 text-bone shadow-xl backdrop-blur-xl">
      <ChevronLeft size={14}/><span className="[writing-mode:vertical-rl] text-[10px] font-semibold">Пропущені</span><span className="rounded-full bg-white/10 px-1 py-0.5 text-[9px]">{s.skipped.length}</span>
    </button>
    <AnimatePresence>
      {open&&<>
        <motion.button aria-label="Закрити пропущені" className="fixed inset-0 z-40 bg-black/45" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setOpen(false)}/>
        <motion.aside role="dialog" aria-modal="true" aria-label="Пропущені фільми" initial={{x:'-100%'}} animate={{x:0}} exit={{x:'-100%'}} transition={{type:'tween',duration:.24}} className="fixed inset-y-0 left-0 z-50 flex w-[min(25vw,340px)] min-w-[260px] flex-col border-r border-white/10 bg-[#111113] shadow-2xl max-sm:w-[82vw] max-sm:min-w-0" style={{paddingTop:'env(safe-area-inset-top)',paddingBottom:'env(safe-area-inset-bottom)'}}>
          <header className="flex items-center gap-2 border-b border-white/10 px-3 py-3"><div className="min-w-0 flex-1"><h2 className="text-sm font-bold">Пропущені</h2><p className="text-xs text-mute">{s.skipped.length} фільмів · скидання за годину</p></div>{s.skipped.length>0&&<button className="chip px-2 py-2" aria-label="Очистити список" onClick={()=>set({skipped:[],skippedAt:{}})}><Trash2 size={15}/></button>}<button className="chip px-2 py-2" aria-label="Закрити" onClick={()=>setOpen(false)}><X size={16}/></button></header>
          <div className="flex-1 overflow-y-auto p-3">{s.skipped.length===0?<p className="mt-10 text-center text-sm text-mute">Тут з’являться фільми, які ви пропустили.</p>:<div className="grid gap-2">{s.skipped.map(m=><div key={m.id} className="flex items-center gap-2 rounded-xl bg-white/[.05] p-2"><button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={()=>{setDetails(m);setOpen(false)}}><img src={img(m.poster_path,'w92')} alt="" className="h-14 w-10 shrink-0 rounded-lg object-cover"/><span className="line-clamp-2 min-w-0 text-xs font-medium">{m.title}</span></button><button className="chip shrink-0 px-2" aria-label={`Повернути ${m.title} у добірку`} onClick={()=>retrySkipped(m)}><RotateCcw size={14}/></button><button className="chip shrink-0 px-2" aria-label={`Прибрати ${m.title} зі списку`} onClick={()=>removeSkipped(m.id)}><X size={14}/></button></div>)}</div>}</div>
        </motion.aside>
      </>}
    </AnimatePresence>
    {details&&<Details movie={details} onClose={()=>setDetails(null)}/>}
  </>;
}
