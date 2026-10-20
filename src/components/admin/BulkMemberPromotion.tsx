import { useRef, useState } from 'react';
import { collection, getDocsFromServer, runTransaction } from 'firebase/firestore';
import { ArrowUp, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../lib/firebase';
import { useAppStore } from '../../store';
import { isSuperAdminProfile } from '../../lib/adminAccess';

const TIERS = [
  { value: 'bronze', label: 'عضو برونزي 🥉' },
  { value: 'silver', label: 'عضو فضي 🥈' },
  { value: 'gold', label: 'عضو ذهبي 🥇' },
  { value: 'diamond', label: 'عضو ماسي 💎' },
  { value: 'premium', label: 'عضو ملكي 👑' },
] as const;

export default function BulkMemberPromotion({ onComplete }: { onComplete: () => Promise<void> }) {
  const profile = useAppStore(state => state.profile);
  const users = useAppStore(state => state.users);
  const [tier, setTier] = useState<string>('bronze');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState('');
  const running = useRef(false);
  const allowed = isSuperAdminProfile(profile);
  const newCount = users.filter(user => !user.tier || user.tier === 'new').length;

  const promote = async () => {
    if (!allowed || running.current) return;
    const selected = TIERS.find(option => option.value === tier);
    if (!selected) return;
    running.current = true;
    setBusy(true);
    setResult('');
    setProgress({ done: 0, total: 0 });
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    let started = false;
    try {
      const snapshot = await getDocsFromServer(collection(db, 'users'));
      const candidates = snapshot.docs.filter(user => !user.data().tier || user.data().tier === 'new');
      if (!candidates.length) {
        setResult('لا يوجد أعضاء يحملون شارة عضو جديد حاليًا.');
        return;
      }
      if (!window.confirm('ترقية ' + candidates.length + ' عضو يحمل شارة «عضو جديد» إلى «' + selected.label + '»؟')) return;
      started = true;
      setProgress({ done: 0, total: candidates.length });
      // Bounded concurrency; recheck each current tier inside its transaction.
      for (let offset = 0; offset < candidates.length; offset += 5) {
        const outcomes = await Promise.allSettled(candidates.slice(offset, offset + 5).map(candidate =>
          runTransaction(db, async transaction => {
            const current = await transaction.get(candidate.ref);
            if (!current.exists()) return false;
            const currentTier = current.data().tier;
            if (currentTier && currentTier !== 'new') return false;
            transaction.update(candidate.ref, { tier: selected.value });
            return true;
          })
        ));
        for (const outcome of outcomes) {
          if (outcome.status === 'rejected') failed++;
          else if (outcome.value) updated++;
          else skipped++;
        }
        setProgress({ done: Math.min(offset + 5, candidates.length), total: candidates.length });
      }
      const summary = 'تمت ترقية ' + updated + ' عضو إلى «' + selected.label + '»'
        + (skipped ? '، وتخطي ' + skipped + ' عضو تغيّرت حالتهم' : '')
        + (failed ? '، وتعذّر تحديث ' + failed + ' عضو. يمكنك إعادة المحاولة للأعضاء المتبقين.' : '.');
      setResult(summary);
      if (failed) toast.error('اكتملت الترقية جزئيًا؛ راجع النتيجة.');
      else toast.success('تمت ترقية الأعضاء الجدد.');
    } catch (error) {
      console.error('Bulk member promotion failed:', error);
      setResult('تعذّر قراءة الأعضاء. تحقق من الاتصال وصلاحيات الحساب ثم أعد المحاولة.');
      toast.error('تعذّر تنفيذ الترقية الجماعية.');
    } finally {
      if (started) {
        try { await onComplete(); }
        catch { toast.error('تعذّر تحديث القائمة؛ استخدم زر مزامنة الأعضاء.'); }
      }
      running.current = false;
      setBusy(false);
    }
  };

  if (!allowed) return null;
  return (
    <section className="ds-content-card rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-card-dark p-4 space-y-3" aria-labelledby="bulk-member-promotion-title" aria-busy={busy}>
      <div>
        <h3 id="bulk-member-promotion-title" className="ds-content-heading text-sm font-bold">ترقية كل الأعضاء الجدد</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">الأعضاء الجدد في القائمة: {newCount}. تُطبّق الترقية على كل من يحمل شارة «عضو جديد»، بما فيهم غير الظاهرين بسبب البحث أو الفلاتر.</p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-2 flex-1 min-w-40 text-xs" htmlFor="bulk-member-tier">
          الرتبة الجديدة
          <select id="bulk-member-tier" value={tier} onChange={event => setTier(event.target.value)} disabled={busy} className="ds-form-control w-full rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-surface-dark p-3 text-sm">
            {TIERS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <button type="button" onClick={promote} disabled={busy} className="ds-control inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 py-3 text-xs font-bold text-white disabled:opacity-50">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
          {busy ? 'جاري الترقية…' : 'ترقية كل الأعضاء الجدد'}
        </button>
      </div>
      <div role="status" aria-live="polite" className="text-xs leading-relaxed">
        {busy && (progress.total ? 'تمت معالجة ' + progress.done + ' من ' + progress.total : 'جاري جلب الأعضاء الجدد…')}
        {!busy && result}
      </div>
    </section>
  );
}
