import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trash2, BookOpen } from 'lucide-react';
import type { NewsItem } from '../store';
import { listOfflineArticles, removeOfflineArticle } from '../lib/offlineArticles';

export default function OfflineReads() {
  const [items, setItems] = useState<NewsItem[]>([]);
  useEffect(() => { void listOfflineArticles().then(setItems); }, []);
  const remove = async (id: string) => {
    await removeOfflineArticle(id);
    setItems(previous => previous.filter(item => item.id !== id));
  };
  return <main dir="rtl" className="mx-auto min-h-screen max-w-3xl space-y-4 px-4 py-8 pb-32">
    <div className="flex items-center justify-between gap-3">
      <h1 className="flex items-center gap-2 text-xl font-bold"><BookOpen size={22}/> المحفوظة بدون إنترنت</h1>
      <Link to="/news" className="text-sm text-primary"> <ArrowRight size={14} className="inline"/> الأخبار</Link>
    </div>
    {!items.length && <p className="rounded-lg bg-slate-100 p-5 text-center text-sm dark:bg-slate-800">مفيش أخبار محفوظة لسه. افتح أي خبر واضغط حفظ بدون إنترنت.</p>}
    {items.map(article => <article key={article.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <Link to={`/news/${encodeURIComponent(article.id)}`} className="min-w-0 flex-1"><h2 className="font-bold">{article.title}</h2><p className="mt-1 line-clamp-2 text-xs text-slate-500">{article.summary}</p></Link>
      <button type="button" aria-label={`حذف ${article.title}`} onClick={() => void remove(article.id)} className="rounded-lg p-2 text-red-600"><Trash2 size={18}/></button>
    </article>)}
  </main>;
}
