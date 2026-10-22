import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { Gamepad2 } from 'lucide-react';
import { db } from '../../lib/firebase';

type Visit = { visitorId: string; member: boolean; createdAt: Timestamp | null };
export default function GameAnalytics({ since }: { since: Date }) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => onSnapshot(collection(db, 'game_visits'), snapshot => {
    setVisits(snapshot.docs.map(item => item.data() as Visit)); setState('ready');
  }, () => setState('error')), []);
  const stats = useMemo(() => {
    const selected = visits.filter(visit => visit.createdAt && visit.createdAt.toDate() >= since);
    return [new Set(selected.map(visit => visit.visitorId)).size, selected.length,
      new Set(selected.filter(visit => visit.member).map(visit => visit.visitorId)).size];
  }, [visits, since]);
  return <section className="rounded-2xl border border-emerald-500/20 bg-white p-5 dark:bg-card-dark" aria-labelledby="game-analytics">
    <h3 id="game-analytics" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Gamepad2 size={21} className="text-emerald-500"/>إحصائيات دخول اللعبة</h3>
    <p className="mt-2 text-xs leading-6 text-slate-500">من وقت تفعيل الإحصاء. دخول الضيف يُميّز حسب المتصفح؛ إعادة التحميل خلال ٣٠ دقيقة لا تضيف زيارة.</p>
    {state === 'error' ? <p className="mt-4 text-sm text-amber-600">تعذّر قراءة إحصائيات اللعبة. راجع الاتصال وقواعد Firebase المنشورة.</p> : <div className="mt-4 grid grid-cols-3 gap-2">{['زوار مختلفون', 'مرات الدخول', 'أعضاء دخلوا اللعبة'].map((label, index) => <div key={label} className="rounded-xl bg-emerald-500/5 p-3 text-center"><strong className="block text-2xl font-bold text-emerald-600 dark:text-emerald-400">{state === 'loading' ? '…' : stats[index].toLocaleString('ar-EG')}</strong><span className="mt-2 block text-xs text-slate-500 dark:text-slate-300">{label}</span></div>)}</div>}
  </section>;
}
