import { useRef, useState } from 'react';
import { collection, getDocsFromServer, runTransaction } from 'firebase/firestore';
import { ArrowUpDown, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../lib/firebase';
import { useAppStore } from '../../store';
import { matchesMemberTier } from '../../lib/memberTierSelection';
import { isSuperAdminProfile } from '../../lib/adminAccess';

const TIERS = [
  { value: 'new', label: 'عضو جديد' },
  { value: 'bronze', label: 'عضو برونزي 🥉' },
  { value: 'silver', label: 'عضو فضي 🥈' },
  { value: 'gold', label: 'عضو ذهبي 🥇' },
  { value: 'diamond', label: 'عضو ماسي 💎' },
  { value: 'premium', label: 'عضو ملكي 👑' },
] as const;

export default function BulkMemberPromotion({ onComplete }: { onComplete: () => Promise<void> }) {
  const profile = useAppStore(state => state.profile);
  const users = useAppStore(state => state.users);
  const [sourceTier, setSourceTier] = useState<string>('new');
  const [tier, setTier] = useState<string>('bronze');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState('');
  const running = useRef(false);
  const allowed = isSuperAdminProfile(profile);
  const source = TIERS.find(option => option.value === sourceTier);
  const selectedCount = users.filter(user => matchesMemberTier(user.tier, sourceTier)).length;

  const promote = async () => {
    if (!allowed || running.current) return;
    const selected = TIERS.find(option => option.value === tier);
    if (!selected || !source || sourceTier === tier) return;
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
      const candidates = snapshot.docs.filter(user => matchesMemberTier(user.data().tier, sourceTier));
      if (!candidates.length) {
        setResult('لا يوجد أعضاء برتبة «' + source.label + '» حاليًا.');
        return;
      }
      if (!window.confirm('تغيير رتبة ' + candidates.length + ' عضو من «' + source.label + '» إلى «' + selected.label + '»؟ يشمل جميع أعضاء هذه الرتبة حتى غير الظاهرين في القائمة.')) return;
      started = true;
      setProgress({ done: 0, total: candidates.length });
      // Bounded concurrency; recheck each current tier inside its transaction.
      for (let offset = 0; offset < candidates.length; offset += 5) {
        const outcomes = await Promise.allSettled(candidates.slice(offset, offset + 5).map(candidate =>
          runTransaction(db, async transaction => {
            const current = await transaction.get(candidate.ref);
            if (!current.exists()) return false;
            const currentTier = current.data().tier;
            if (!matchesMemberTier(currentTier, sourceTier)) return false;
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
      const summary = 'تم تغيير رتبة ' + updated + ' عضو إلى «' + selected.label + '»'
        + (skipped ? '، وتخطي ' + skipped + ' عضو تغيّرت حالتهم' : '')
        + (failed ? '، وتعذّر تحديث ' + failed + ' عضو. يمكنك إعادة المحاولة للأعضاء المتبقين.' : '.');
      setResult(summary);
      if (failed) toast.error('اكتمل تغيير الرتب جزئيًا؛ راجع النتيجة.');
      else toast.success('تم تغيير رتب الأعضاء.');
    } catch (error) {
      console.error('Bulk member promotion failed:', error);
      setResult('تعذّر قراءة الأعضاء. تحقق من الاتصال وصلاحيات الحساب ثم أعد المحاولة.');
      toast.error('تعذّر تغيير الرتب جماعيًا.');
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
        <h3 id="bulk-member-promotion-title" className="ds-content-heading text-sm font-bold">تغيير رتب الأعضاء جماعيًا</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">أعضاء رتبة «{source?.label}» في القائمة: {selectedCount}. اختَر الرتبة الحالية والرتبة المطلوبة للترقية أو التخفيض. يشمل التغيير جميع أعضاء الرتبة حتى غير الظاهرين بسبب البحث أو الفلاتر.</p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-2 flex-1 min-w-0 w-full sm:min-w-40 text-xs" htmlFor="bulk-member-source-tier">
          رتبة الأعضاء الحالية
          <select id="bulk-member-source-tier" value={sourceTier} onChange={event => { setSourceTier(event.target.value); setResult(''); }} disabled={busy} className="ds-form-control w-full rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-surface-dark p-3 text-sm">
            {TIERS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-2 flex-1 min-w-0 w-full sm:min-w-40 text-xs" htmlFor="bulk-member-tier">
          الرتبة الجديدة
          <select id="bulk-member-tier" value={tier} onChange={event => { setTier(event.target.value); setResult(''); }} disabled={busy} className="ds-form-control w-full rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-surface-dark p-3 text-sm">
            {TIERS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <button type="button" onClick={promote} disabled={busy || sourceTier === tier} className="ds-control inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 py-3 text-xs font-bold text-white disabled:opacity-50">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpDown size={16} />}
          {busy ? 'جاري تغيير الرتب…' : 'تغيير رتب الأعضاء جماعيًا'}
        </button>
      </div>
      <div role="status" aria-live="polite" className="text-xs leading-relaxed">
        {busy && (progress.total ? 'تمت معالجة ' + progress.done + ' من ' + progress.total : 'جاري جلب الأعضاء…')}
        {!busy && sourceTier === tier && <p>اختَر رتبة مختلفة عن الرتبة الحالية.</p>}
        {!busy && result}
      </div>
    </section>
  );
}
