import { Gamepad2, Play, ArrowRight, ChevronLeft, Trophy, Zap, Move } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import GameLeaderboard from '../components/game/GameLeaderboard';
export default function Game() {
  return <div className="min-h-screen bg-slate-50 pb-24 pt-4 dark:bg-background-dark" dir="rtl">
    <SEOHead title="لعبة اتحاداوي" description="اختار شخصيتك، العب ونافس أعضاء قناة الاتحاد على أعلى سكور."/>
    <div className="mx-auto max-w-4xl space-y-5 px-4 sm:px-6">
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-600"><ArrowRight size={15}/>العودة للتطبيق</Link>
      <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-500/20 dark:bg-card-dark sm:p-8">
        <div className="pointer-events-none absolute -left-12 -top-16 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl"/>
        <div className="relative flex items-start justify-between gap-4">
          <div><span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">من المدرج للمنافسة</span><h1 className="mt-3 text-4xl font-black text-slate-900 dark:text-white">اتحاداوي</h1><p className="mt-3 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-300">اختار نجمك، اجمع النقاط وعدّي العوائق. كل جولة فرصة جديدة ترفع اسمك في ترتيب الأعضاء.</p></div>
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 sm:h-20 sm:w-20"><Gamepad2 className="h-9 w-9"/></span>
        </div>
        <a href="/games/ittihadawy/index.html" className="relative mt-6 flex w-full items-center justify-center gap-3 whitespace-nowrap rounded-2xl bg-emerald-600 px-6 py-4 text-base font-bold text-white transition hover:bg-emerald-700 active:scale-[.99]"><Play size={20} fill="currentColor"/>يلا نلعب<ChevronLeft size={18}/></a>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400"><span>٣ شخصيات</span><span>٣٧ منطقة</span><span className="inline-flex items-center gap-1"><Trophy size={14}/>سكور باسمك</span></div>
      </section>
      <GameLeaderboard/>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-card-dark">
        <h2 className="font-bold text-slate-900 dark:text-white">اختار طريقتك في اللعب</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">{[
          ['عادل شكل', 'زمارة ٦ إلا تلت', 'adel-horn.png'], ['جمال الدولي', 'المبخرة', 'gamal-avatar.jpg'], ['حميدو', 'أبو جلمبو', 'hamido.png'],
        ].map(([name, ability, image]) => <div key={name} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-white/5"><img src={`/games/ittihadawy/references/${image}`} alt="" className="h-12 w-12 rounded-xl object-cover"/><div><h3 className="text-sm font-bold text-slate-800 dark:text-white">{name}</h3><p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{ability}</p></div></div>)}</div>
        <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 text-xs leading-6 text-slate-500 dark:border-white/10 dark:text-slate-400 sm:grid-cols-2"><p className="flex items-start gap-2"><Move size={17} className="mt-1 shrink-0"/>اسحب على الموبايل، أو استخدم الأسهم على الكمبيوتر للحركة والقفز والتزحلق.</p><p className="flex items-start gap-2"><Zap size={17} className="mt-1 shrink-0"/>زر E لقدرة الشخصية، وعلامة البرق بتديك سرعة وحماية مؤقتة.</p></div>
      </section>
    </div>
  </div>;
}
