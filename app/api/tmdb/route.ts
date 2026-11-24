export async function GET(req:Request){
  const u=new URL(req.url);const path=u.searchParams.get('path')||'';
  if(!/^\/(discover\/movie|search\/movie|movie\/\d+)$/.test(path))return Response.json({error:'bad path'},{status:400});
  const token=process.env.TMDB_TOKEN;
  if(!token)return Response.json({error:'TMDB_TOKEN is not configured. Add your TMDB API Read Access Token to .env.local and restart the app.'},{status:503});
  u.searchParams.delete('path');
  try{
    const r=await fetch(`https://api.themoviedb.org/3${path}?${u.searchParams}`,{headers:{Authorization:`Bearer ${token}`},next:{revalidate:3600}});
    const data=await r.json();
    return Response.json(data,{status:r.status});
  }catch{return Response.json({error:'TMDB is temporarily unavailable.'},{status:502})}
}
