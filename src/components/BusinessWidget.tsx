import { Link } from 'react-router-dom';
import { Building2, MapPin, ArrowLeft, Plus } from 'lucide-react';
import { useAppStore } from '../store';
import { SafeImage } from './SafeImage';

export default function BusinessWidget({ title }: { title?: string }) {
  const businesses = useAppStore(s => s.businesses).filter(b => b.status === 'approved');
  const featured = businesses.filter(b => b.featured);
  const items = (featured.length ? featured : businesses).slice(0, 4);
  return <section className="home-simple-widget" dir="rtl" aria-label={title || 'اتحاداوي بيزنس'}>
    <header className="home-simple-header"><div className="home-simple-title"><Building2 size={21}/><div><h2>{title || 'اتحاداوي بيزنس'}</h2><p>مشروعات من جمهور الاتحاد</p></div></div><Link to="/business" className="home-simple-all">الكل <ArrowLeft size={16}/></Link></header>
    {items.length ? <div className="home-business-list">{items.map(bus => <Link key={bus.id} to={`/business/${bus.id}`} className="home-business-row"><SafeImage src={bus.coverImage || undefined} alt="" width={120} className="home-business-thumb"/><div><h3>{bus.businessName}</h3><span>{bus.category}</span>{bus.address && <p><MapPin size={12}/><span>{bus.address}</span></p>}</div><ArrowLeft size={16}/></Link>)}</div> : <p className="home-simple-empty">عندك مشروع؟ كن أول من يضيفه للدليل.</p>}
    <footer className="home-simple-footer"><Link to="/business"><Plus size={16}/> أضف مشروعك مجانًا</Link></footer>
  </section>;
}
