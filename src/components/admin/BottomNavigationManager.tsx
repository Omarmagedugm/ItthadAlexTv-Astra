import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../../lib/firebase';
import { useAppStore } from '../../store';
import { resolveBottomNavigation, type BottomNavigationItem } from '../../lib/bottomNavigation';
import BottomNavigationEditor from './BottomNavigationEditor';
export default function BottomNavigationManager() {
  const saved = useAppStore(state => state.appSettings.bottomNavItems);
  const [draft,setDraft] = useState<BottomNavigationItem[] | undefined>();
  const [saving,setSaving] = useState(false);
  const save = async () => {
    const items = resolveBottomNavigation(draft ?? saved);
    if(items.filter(item=>item.active).length>6 || items.some(item=>item.active&&!item.label)){toast.error('اكتب أسماء العناصر واختار حتى ٦ عناصر ظاهرة');return;}
    setSaving(true);
    try {
      await setDoc(doc(db,'settings','global'),{bottomNavItems:items},{merge:true});
      useAppStore.getState().setSettings({bottomNavItems:items});setDraft(undefined);
      toast.success('تم حفظ القائمة السفلية');
    } catch { toast.error('تعذر حفظ القائمة، حاول مرة أخرى'); }
    finally {setSaving(false);}
  };
  return <div className="ds-content-card p-4 sm:p-6 rounded-xl space-y-4" dir="rtl">
    <h2 className="ds-content-heading text-lg font-bold">القائمة السفلية</h2>
    <fieldset disabled={saving} className="min-w-0"><BottomNavigationEditor value={draft ?? saved} onChange={setDraft}/></fieldset>
    <div className="flex flex-wrap gap-2"><button type="button" onClick={save} disabled={saving} className="ds-control bg-primary text-white px-4 py-3 rounded-xl font-bold whitespace-nowrap disabled:opacity-50">{saving?'جاري الحفظ…':'حفظ القائمة السفلية'}</button><button type="button" disabled={saving} onClick={()=>setDraft(undefined)} className="ds-control border px-4 py-3 rounded-xl whitespace-nowrap">إلغاء التعديلات</button></div>
  </div>;
}
