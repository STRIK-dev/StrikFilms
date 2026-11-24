'use client';
import {createContext,useContext,useEffect,useState,ReactNode} from 'react';
import type {Movie} from './tmdb';
export type Sort='random'|'rating'|'rating-asc'|'year-desc'|'year-asc';
export type State={name:string;later:Movie[];watched:Movie[];hidden:Movie[];genres:number[];sonia:boolean;yearFrom:number|null;yearTo:number|null;sort:Sort;page:number};
const init:State={name:'',later:[],watched:[],hidden:[],genres:[],sonia:false,yearFrom:null,yearTo:null,sort:'random',page:1};
const KEY='strikfilms:v1';
type Ctx={s:State;set:(p:Partial<State>)=>void;addLater:(m:Movie)=>void;watch:(m:Movie,r:number)=>void;unlater:(id:number)=>void;unwatch:(id:number)=>void;hide:(m:Movie)=>void;restore:(id?:number)=>void;replace:(s:State)=>void;reset:()=>void};
const C=createContext<Ctx>(null as any);
export const useApp=()=>useContext(C);
export function validate(d:any):State|null{
  if(!d||typeof d!=='object')return null;const a=(x:any)=>Array.isArray(x)&&x.every(m=>m&&typeof m.id==='number'&&typeof m.title==='string');
  if(!a(d.later??[])||!a(d.watched??[])||!a(d.hidden??[]))return null;
  return {...init,...d,name:String(d.name||''),later:d.later??[],watched:d.watched??[],hidden:d.hidden??[],genres:Array.isArray(d.genres)?d.genres:[],yearFrom:Number.isInteger(d.yearFrom)?d.yearFrom:null,yearTo:Number.isInteger(d.yearTo)?d.yearTo:null};
}
export function Provider({children}:{children:ReactNode}){
  const [s,setS]=useState<State>(init);const [ready,setReady]=useState(false);
  useEffect(()=>{try{const v=validate(JSON.parse(localStorage.getItem(KEY)||'null'));if(v)setS(v)}catch{}setReady(true)},[]);
  useEffect(()=>{if(ready)try{localStorage.setItem(KEY,JSON.stringify(s))}catch{}},[s,ready]);
  const up=(f:(s:State)=>Partial<State>)=>setS(p=>({...p,...f(p)}));
  const ctx:Ctx={s,
    set:p=>up(()=>p),
    addLater:m=>up(p=>p.later.some(x=>x.id===m.id)||p.watched.some(x=>x.id===m.id)?{}:{later:[m,...p.later]}),
    watch:(m,r)=>up(p=>({watched:[{...m,my:r},...p.watched.filter(x=>x.id!==m.id)],later:p.later.filter(x=>x.id!==m.id)})),
    unlater:id=>up(p=>({later:p.later.filter(m=>m.id!==id)})),
    unwatch:id=>up(p=>({watched:p.watched.filter(m=>m.id!==id)})),
    hide:m=>up(p=>({hidden:[m,...p.hidden.filter(x=>x.id!==m.id)],later:p.later.filter(x=>x.id!==m.id)})),
    restore:id=>up(p=>({hidden:id?p.hidden.filter(m=>m.id!==id):[]})),
    replace:v=>setS(v),reset:()=>{setS(init)}};
  return ready?<C.Provider value={ctx}>{children}</C.Provider>:null;
}
