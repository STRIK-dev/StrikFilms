export type Movie={id:number;title:string;original_title?:string;poster_path:string|null;backdrop_path?:string|null;release_date?:string;vote_average:number;vote_count?:number;genre_ids?:number[];genres?:{id:number;name:string}[];overview?:string;runtime?:number;my?:number};
export const GENRES:Record<number,string>={28:'Бойовик',12:'Пригоди',16:'Анімація',35:'Комедія',80:'Кримінал',99:'Документальний',18:'Драма',10751:'Сімейний',14:'Фентезі',36:'Історичний',27:'Жахи',10402:'Музичний',9648:'Детектив',10749:'Мелодрама',878:'Наукова фантастика',10770:'Телефільм',53:'Трилер',10752:'Воєнний',37:'Вестерн'};
export const img=(p?:string|null,s='w500')=>p?`https://image.tmdb.org/t/p/${s}${p}`:'';
export const year=(m:Movie)=>m.release_date?.slice(0,4)||'—';
export const upcoming=(m:Movie)=>!!m.release_date&&m.release_date>new Date().toISOString().slice(0,10);
export const genreNames=(m:Movie)=>(m.genres?.map(g=>GENRES[g.id]||g.name)||m.genre_ids?.map(i=>GENRES[i])||[]).filter(Boolean) as string[];
const cache=new Map<string,Promise<any>>();
export function tmdb(path:string,params:Record<string,string|number>={}):Promise<any>{
  const q=new URLSearchParams({language:'uk-UA',...Object.fromEntries(Object.entries(params).map(([k,v])=>[k,String(v)]))});
  const url=`/api/tmdb?path=${encodeURIComponent(path)}&${q}`;
  if(!cache.has(url))cache.set(url,fetch(url).then(r=>{if(!r.ok)throw new Error('tmdb');return r.json()}).catch(e=>{cache.delete(url);throw e}));
  return cache.get(url)!;
}
