'use client';
import {useEffect,useState} from 'react';
import {ArrowUp} from 'lucide-react';
import {tmdb,Movie} from '@/lib/tmdb';
import {Grid} from '@/components/Lists';

export default function Top100(){
  const [movies,setMovies]=useState<Movie[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(false);const [retry,setRetry]=useState(0);const [showTop,setShowTop]=useState(false);
  useEffect(()=>{const update=()=>setShowTop(window.scrollY>500);update();window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update)},[]);
  useEffect(()=>{let active=true;setLoading(true);setError(false);
    (async()=>{try{
      const pages=await Promise.all(Array.from({length:5},(_,i)=>tmdb('/discover/movie',{language:'uk-UA',sort_by:'vote_average.desc','vote_count.gte':10000,'primary_release_date.gte':'1989-01-01',page:i+1,include_adult:'false'})));
      const unique=new Map<number,Movie>();for(const page of pages)for(const movie of (page.results||[]) as Movie[])if(movie.vote_count&&movie.vote_count>=10000)unique.set(movie.id,movie);
      if(active)setMovies([...unique.values()].slice(0,100));
    }catch{if(active)setError(true)}finally{if(active)setLoading(false)}})();
    return()=>{active=false};
  },[retry]);
  return <div className="mx-auto max-w-3xl px-5 pt-[calc(1rem+env(safe-area-inset-top))]">
    <h1 className="text-2xl font-extrabold">Топ 100 фільмів</h1>
    <p className="mb-5 mt-1 text-sm leading-relaxed text-mute">Рейтинг TMDB за оцінкою глядачів.</p>
    {error?<div className="mt-16 text-center text-mute"><p>Не вдалося завантажити рейтинг.</p><button className="chip mt-3" onClick={()=>setRetry(x=>x+1)}>Спробувати ще</button></div>:loading?<div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({length:8},(_,i)=><div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-panel"/>)}</div>:<Grid items={movies} kind="search" empty="Не вдалося знайти 100 фільмів із такою кількістю голосів."/>}
    {showTop&&<button type="button" aria-label="Повернутися нагору" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} className="glass fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-20 grid h-12 w-12 place-items-center rounded-full bg-black/80 text-bone shadow-xl"><ArrowUp size={20}/></button>}
  </div>;
}
