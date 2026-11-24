import './globals.css';import {Onest} from 'next/font/google';import type {Viewport} from 'next';
const f=Onest({subsets:['latin','cyrillic'],variable:'--f'});
export const metadata={title:'StrikFilms'};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#0c0c0d'};
export default function L({children}:{children:React.ReactNode}){return <html lang="uk"><body className={`${f.variable} font-sans`}>{children}</body></html>}
