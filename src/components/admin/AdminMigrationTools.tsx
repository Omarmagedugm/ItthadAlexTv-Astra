import { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { CloudinaryMigrationManager } from './CloudinaryMigrationManager';
export default function AdminMigrationTools({onHealth}:{onHealth:()=>void}){
 const [status,setStatus]=useState<'loading'|'ready'|'unavailable'>('loading');
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{const controller=new AbortController();let active=true;
  const check=async()=>{setStatus('loading');try{const token=await auth.currentUser?.getIdToken();const response=await fetch('/api/firebase-storage/status',{headers:token?{Authorization:`Bearer ${token}`}:{},signal:AbortSignal.any([controller.signal,AbortSignal.timeout(8000)])});if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw new Error('Unavailable');await response.json();if(active)setStatus('ready');}catch{if(active)setStatus('unavailable');}};
  check();return()=>{active=false;controller.abort();};
 },[attempt]);
 if(status==='ready')return <CloudinaryMigrationManager/>;
 return <section className="admin-health"><div className="admin-health-heading">{status==='loading'?<Loader2 className="animate-spin" size={24}/>:<AlertCircle size={24}/>}<h2>أدوات نقل الصور</h2></div><p>{status==='loading'?'جاري التحقق من توفر الخدمة…':'خادم أدوات النقل غير متاح أو لم يسمح بالوصول. هذه الأدوات تحتاج خدمة خادم مفعّلة؛ رفع الصور المعتاد متاح من محرر كل قسم.'}</p>{status==='unavailable'&&<div className="flex gap-3 mt-4 flex-wrap"><button className="admin-primary-button" onClick={()=>setAttempt(a=>a+1)}>إعادة المحاولة</button><button className="admin-primary-button" onClick={onHealth}>فحص الخدمات</button></div>}</section>;
}
