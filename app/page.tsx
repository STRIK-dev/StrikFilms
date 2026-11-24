'use client';
import {useEffect,useState} from 'react';
import {AnimatePresence,motion} from 'framer-motion';
import {Clapperboard,Compass,Search as S,Bookmark,CheckCircle2,User} from 'lucide-react';
import {Provider} from '@/lib/store';
import Discover from '@/components/Discover';
import Search from '@/components/Search';
import {ListScreen} from '@/components/Lists';
import Profile from '@/components/Profile';
const tabs=[['discover','Добірка',Compass],['search','Пошук',S],['later','Пізніше',Bookmark],['watched','Переглянуто',CheckCircle2],['me','Профіль',User]] as const;
export default function Home(){
  const [t,setT]=useState<string>('discover');
  const [welcome,setWelcome]=useState(true);
  useEffect(()=>{const timer=window.setTimeout(()=>setWelcome(false),2500);return()=>window.clearTimeout(timer)},[]);
  return <Provider>
    <AnimatePresence>{welcome&&<motion.div initial={{opacity:1}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.45}} className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-ink">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(224,170,96,0.12),transparent_48%)]"/>
      <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.65,ease:'easeOut'}} className="relative flex flex-col items-center px-6 text-center">
        <div className="relative mb-9 h-36 w-36">
          <motion.div animate={{rotate:[-12,-9,-12],y:[2,-2,2]}} transition={{duration:4,repeat:Infinity,ease:'easeInOut'}} className="absolute inset-3 rounded-[26px] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] shadow-xl"/>
          <motion.div animate={{rotate:[11,8,11],y:[-2,2,-2]}} transition={{duration:4.5,repeat:Infinity,ease:'easeInOut'}} className="absolute inset-3 rounded-[26px] border border-white/10 bg-gradient-to-bl from-white/[0.08] to-white/[0.02] shadow-xl"/>
          <motion.div animate={{y:[0,-4,0]}} transition={{duration:2.8,repeat:Infinity,ease:'easeInOut'}} className="absolute inset-3 flex flex-col items-center justify-center gap-2 rounded-[26px] border border-white/15 bg-[#171719] shadow-2xl shadow-black/40">
            <Clapperboard size={29} strokeWidth={1.4} className="text-bone/85"/>
            <span className="text-[30px] leading-none">🍿</span>
          </motion.div>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[.34em] text-bone/50">StrikFilms</p>
        <h1 className="mt-3 text-[26px] font-semibold tracking-tight">Радий тебе бачити</h1>
        <p className="mt-2 text-sm text-mute">Знайдемо фільм для твого вечора</p>
        <div className="mt-8 h-[2px] w-32 overflow-hidden rounded-full bg-white/10" aria-label="Завантаження">
          <motion.div className="h-full w-1/2 origin-left rounded-full bg-bone/80" animate={{x:['-100%','200%']}} transition={{duration:1.15,repeat:Infinity,ease:'easeInOut'}}/>
        </div>
      </motion.div>
    </motion.div>}</AnimatePresence>
    <main className={t==='discover'?'h-dvh overflow-hidden':'min-h-dvh pb-28'}>
    <div className={t==='discover'?'':'hidden'}><Discover/></div>
    {t==='search'&&<Search/>}{t==='later'&&<ListScreen kind="later"/>}{t==='watched'&&<ListScreen kind="watched"/>}{t==='me'&&<Profile/>}
    <nav className="glass fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 gap-1 rounded-full bg-black/70 p-2 shadow-2xl">
      {tabs.map(([k,l,Ic])=><button key={k} aria-label={l} onClick={()=>setT(k)} className={`flex items-center gap-2 rounded-full px-3.5 py-3 text-sm transition-all ${t===k?'bg-white/12 font-bold text-bone':'text-mute'}`}><Ic size={22} strokeWidth={t===k?2.4:1.7}/>{t===k&&l}</button>)}</nav>
  </main></Provider>;
}
