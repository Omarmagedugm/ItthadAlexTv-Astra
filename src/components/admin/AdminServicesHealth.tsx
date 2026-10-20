import { useEffect, useState } from 'react';
import { Activity, RefreshCw, CheckCircle2, AlertCircle, Clock3 } from 'lucide-react';
import { doc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { isSuperAdminProfile } from '../../lib/adminAccess';
import { useAppStore } from '../../store';
type Result = {name:string;state:'ok'|'issue';detail:string};
export default function AdminServicesHealth(){
 const profile = useAppStore(s => s.profile);
 const [results,setResults] = useState<Result[]>([]);
 const [busy,setBusy] = useState(false);
 const [checked,setChecked] = useState('');
 const [online,setOnline] = useState(navigator.onLine);
 useEffect(() => {const update=()=>setOnline(navigator.onLine);window.addEventListener('online',update);window.addEventListener('offline',update);return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update);};},[]);
 const run = async () => {
  setBusy(true);setResults([]);
  const rows:Result[]=[];
  rows.push({name:'اتصال الجهاز',state:navigator.onLine?'ok':'issue',detail:navigator.onLine?'الجهاز متصل بالشبكة؛ تُختبر الخدمات بشكل منفصل.':'الجهاز غير متصل بالإنترنت.'});
  rows.push({name:'جلسة المدير',state:auth.currentUser?.uid===profile.uid && isSuperAdminProfile(profile)?'ok':'issue',detail:auth.currentUser?.uid===profile.uid?'جلسة Firebase مطابقة للحساب الحالي.':'الجلسة غير متاحة؛ سجّل الدخول مجددًا.'});
  try {
   await Promise.race([getDocFromServer(doc(db,'users',profile.uid!)),new Promise((_,reject)=>setTimeout(()=>reject(new Error('انتهت مهلة الاتصال بقاعدة البيانات')),8000))]);
   rows.push({name:'قاعدة البيانات',state:'ok',detail:'نجحت قراءة ملف الحساب من خادم Firestore. عمليات الكتابة لم تُختبر.'});
  } catch(e:any){rows.push({name:'قاعدة البيانات',state:'issue',detail:e.code==='permission-denied'?'الخادم رفض القراءة؛ راجع صلاحيات الحساب وقواعد Firestore.':e.message||'تعذر الاتصال بقاعدة البيانات.'});}
  try {
   const token=await auth.currentUser?.getIdToken();
   const response=await fetch('/api/firebase-storage/status',{headers:token?{Authorization:`Bearer ${token}`}:{},signal:AbortSignal.timeout(8000)});
   if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('خدمة أدوات نقل الصور غير متاحة على هذا النشر. رفع الصور المعتاد يستخدم Firebase مباشرة.');
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||`تعذر الوصول إلى خدمة التخزين (${response.status})`);
   rows.push({name:'خادم أدوات نقل الصور',state:'ok',detail:'مسار حالة الخدمة يستجيب. النقل والرفع لم يُنفّذا أثناء الفحص.'});
  }catch(e:any){rows.push({name:'خادم أدوات نقل الصور',state:'issue',detail:e.name==='TimeoutError'?'انتهت مهلة الاتصال بالخدمة.':e.message||'خدمة الخادم غير متاحة.'});}
  setResults(rows);setChecked(new Date().toLocaleString('ar-EG'));setBusy(false);
 };
 return <section className="admin-health">
  <div className="admin-health-heading"><span className="admin-brand-icon"><Activity size={24}/></span><div><h2>فحص الخدمات</h2><p>اختبارات قراءة فقط، بدون تغيير بيانات أو إرسال إشعارات.</p></div><button className="admin-primary-button" onClick={run} disabled={busy}><RefreshCw size={16} className={busy?'animate-spin':''}/>{busy?'جاري الفحص':'ابدأ الفحص'}</button></div>
  <p className="admin-health-note">{online?'الجهاز متصل بالشبكة':'الجهاز غير متصل'} · {checked?`آخر فحص: ${checked}`:'لم يبدأ الفحص بعد'}</p>
  {results.length===0 && <div className="admin-health-placeholder"><Clock3 size={28}/><p>{busy?'جاري التحقق من الخدمات…':'اضغط «ابدأ الفحص» لعرض نتائج الاتصال الحالية.'}</p></div>}
  <div className="admin-health-results">{results.map(r=><article key={r.name} data-state={r.state}>{r.state==='ok'?<CheckCircle2 size={21}/>:<AlertCircle size={21}/>}<div><h3>{r.name}<small>{r.state==='ok'?'نجح الفحص':'يحتاج مراجعة'}</small></h3><p>{r.detail}</p></div></article>)}</div>
  <p className="admin-health-note">رفع الملفات، إرسال الإشعارات، توليد الصور، والحفظ الفعلي تحتاج تجربة مستقلة بحساب مصرح. نجاح الاتصال لا يؤكد نجاح هذه العمليات.</p>
 </section>;
}
