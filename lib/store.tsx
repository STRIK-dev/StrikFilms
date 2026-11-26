'use client';
import {createContext,useContext,useEffect,useRef,useState,ReactNode} from 'react';
import type {Movie} from './tmdb';
export type Sort='random'|'rating'|'rating-asc'|'year-desc'|'year-asc';
export type State={name:string;later:Movie[];watched:Movie[];gameMovies:Movie[];hidden:Movie[];skipped:Movie[];skippedAt:Record<string,number>;retry:Movie[];genres:number[];sonia:boolean;yearFrom:number|null;yearTo:number|null;sort:Sort;page:number};
const init:State={name:'',later:[],watched:[],gameMovies:[],hidden:[],skipped:[],skippedAt:{},retry:[],genres:[],sonia:false,yearFrom:null,yearTo:null,sort:'random',page:1};
const KEY='strikfilms:v1';
type Ctx={s:State;set:(p:Partial<State>)=>void;addLater:(m:Movie)=>void;watch:(m:Movie,r:number)=>void;unlater:(id:number)=>void;unwatch:(id:number)=>void;hide:(m:Movie)=>void;markSkipped:(m:Movie)=>void;retrySkipped:(m:Movie)=>void;removeSkipped:(id:number)=>void;restore:(id?:number)=>void;replace:(s:State)=>void;reset:()=>void};
const C=createContext<Ctx>(null as any);
export const useApp=()=>useContext(C);
export function validate(d:any):State|null{
  if(!d||typeof d!=='object')return null;const a=(x:any)=>Array.isArray(x)&&x.every(m=>m&&typeof m.id==='number'&&typeof m.title==='string');
  if(!a(d.later??[])||!a(d.watched??[])||!a(d.gameMovies??[])||!a(d.hidden??[])||!a(d.skipped??[])||!a(d.retry??[]))return null;
  return {...init,...d,name:String(d.name||''),later:d.later??[],watched:d.watched??[],gameMovies:d.gameMovies??[],hidden:d.hidden??[],skipped:d.skipped??[],skippedAt:d.skippedAt&&typeof d.skippedAt==='object'?d.skippedAt:{},retry:d.retry??[],genres:Array.isArray(d.genres)?d.genres:[],yearFrom:Number.isInteger(d.yearFrom)?d.yearFrom:null,yearTo:Number.isInteger(d.yearTo)?d.yearTo:null};
}
export function Provider({children}:{children:ReactNode}){
  const [s,setS]=useState<State>(init);const [ready,setReady]=useState(false);const current=useRef(init);
  useEffect(()=>{try{const v=validate(JSON.parse(localStorage.getItem(KEY)||'null'));if(v){const now=Date.now(),skippedAt={...v.skippedAt};v.skipped=v.skipped.filter(m=>{const stamp=Number(skippedAt[m.id])||now;skippedAt[m.id]=stamp;return now-stamp<3600000});for(const id of Object.keys(skippedAt))if(!v.skipped.some(m=>String(m.id)===id))delete skippedAt[id];v.skippedAt=skippedAt;current.current=v;setS(v);try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}}}catch{}setReady(true)},[]);
  useEffect(()=>{if(!ready||!s.skipped.length)return;const nextExpiry=Math.min(...s.skipped.map(m=>(Number(s.skippedAt[m.id])||Date.now())+3600000));const timer=window.setTimeout(()=>up(p=>{const now=Date.now(),skipped=p.skipped.filter(m=>now-(Number(p.skippedAt[m.id])||now)<3600000),ids=new Set(skipped.map(m=>String(m.id))),skippedAt=Object.fromEntries(Object.entries(p.skippedAt).filter(([id])=>ids.has(id)));return{skipped,skippedAt}}),Math.max(0,nextExpiry-Date.now()));return()=>window.clearTimeout(timer)},[ready,s.skipped,s.skippedAt]);
  const up=(f:(s:State)=>Partial<State>)=>{const next={...current.current,...f(current.current)};current.current=next;setS(next);try{localStorage.setItem(KEY,JSON.stringify(next))}catch{}};
  const ctx:Ctx={s,
    set:p=>up(()=>p),
    addLater:m=>up(p=>p.later.some(x=>x.id===m.id)||p.watched.some(x=>x.id===m.id)?{}:{later:[m,...p.later]}),
    watch:(m,r)=>up(p=>({watched:[{...m,my:r},...p.watched.filter(x=>x.id!==m.id)],later:p.later.filter(x=>x.id!==m.id)})),
    unlater:id=>up(p=>({later:p.later.filter(m=>m.id!==id)})),
    unwatch:id=>up(p=>({watched:p.watched.filter(m=>m.id!==id)})),
    hide:m=>up(p=>({hidden:[m,...p.hidden.filter(x=>x.id!==m.id)],later:p.later.filter(x=>x.id!==m.id)})),
    markSkipped:m=>up(p=>({skipped:[m,...p.skipped.filter(x=>x.id!==m.id)],skippedAt:{...p.skippedAt,[m.id]:Date.now()}})),
    retrySkipped:m=>up(p=>{const skippedAt={...p.skippedAt};delete skippedAt[m.id];return{skipped:p.skipped.filter(x=>x.id!==m.id),skippedAt,retry:[m,...p.retry.filter(x=>x.id!==m.id)]}}),
    removeSkipped:id=>up(p=>{const skippedAt={...p.skippedAt};delete skippedAt[id];return{skipped:p.skipped.filter(x=>x.id!==id),skippedAt}}),
    restore:id=>up(p=>({hidden:id?p.hidden.filter(m=>m.id!==id):[]})),
    replace:v=>{current.current=v;setS(v);try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}},reset:()=>{current.current=init;setS(init);try{localStorage.setItem(KEY,JSON.stringify(init))}catch{}}};
  return ready?<C.Provider value={ctx}>{children}</C.Provider>:null;
}
