'use client';
import {ReactNode,useState} from 'react';
export function Sheet({children,onClose,z=50}:{children:ReactNode;onClose:()=>void;z?:number}){
  return <div className="fixed inset-0 flex items-end justify-center bg-black/70 md:items-center" style={{zIndex:z}} onClick={onClose}>
    <div className="max-h-[90dvh] w-full max-w-md overflow-auto rounded-t-3xl bg-panel p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:rounded-3xl" onClick={e=>e.stopPropagation()}>{children}</div></div>;
}
export function Confirm({text,ok,no='Назад',onOk,onNo}:{text:string;ok:string;no?:string;onOk:()=>void;onNo:()=>void}){
  return <Sheet onClose={onNo} z={70}><p className="mb-5 text-lg font-semibold leading-snug">{text}</p>
    <div className="flex gap-3"><button className="btn btn-g flex-1" onClick={onNo}>{no}</button><button className="btn btn-w flex-1" onClick={onOk}>{ok}</button></div></Sheet>;
}
export function Rate({initial=7,onSave,onClose}:{initial?:number;onSave:(r:number)=>void;onClose:()=>void}){
  const [v,setV]=useState(initial);
  return <Sheet onClose={onClose} z={70}><p className="text-lg font-semibold">Ваша оцінка</p>
    <p className="my-4 text-center text-5xl font-extrabold">{v.toFixed(1)}<span className="text-xl text-mute"> / 10</span></p>
    <input type="range" min={1} max={10} step={0.1} value={v} onChange={e=>setV(+e.target.value)} className="w-full accent-[#ece9e1]"/>
    <input type="number" min={1} max={10} step={0.1} value={v} onChange={e=>setV(Math.min(10,Math.max(1,+e.target.value||1)))} className="mt-3 w-full rounded-2xl bg-white/10 p-3 text-center"/>
    <div className="mt-5 flex gap-3"><button className="btn btn-g flex-1" onClick={onClose}>Скасувати</button><button className="btn btn-w flex-1" onClick={()=>onSave(Math.round(v*10)/10)}>Зберегти</button></div></Sheet>;
}
