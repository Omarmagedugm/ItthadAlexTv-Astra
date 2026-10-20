import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { MatchItem } from '../store';
import { SafeImage } from './SafeImage';

export default function UpcomingMatchesCarousel({ matches, title }: { matches: MatchItem[]; title?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const id = useId();
  const [edges, setEdges] = useState({ previous: false, next: false });
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const update = () => {
      const offset = Math.abs(element.scrollLeft);
      const limit = element.scrollWidth - element.clientWidth;
      setEdges({ previous: offset > 2, next: offset < limit - 2 });
    };
    element.addEventListener('scroll', update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(element);
    update();
    return () => { element.removeEventListener('scroll', update); resize.disconnect(); };
  }, [matches]);

  const move = (step: number) => {
    const element = track.current;
    if (!element) return;
    const card = element.querySelector<HTMLElement>('.fixture-carousel-card');
    const width = (card?.getBoundingClientRect().width || element.clientWidth) + 12;
    element.scrollBy({ left: -step * width, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  return <div className="fixture-carousel" dir="rtl" role="region" aria-roledescription="كاروسيل" aria-labelledby={`${id}-heading`}>
    <header className="fixture-carousel-heading"><h2 id={`${id}-heading`}>{title || 'مباريات مرتقبة'}</h2><div className="fixture-carousel-actions"><Link to="/matches">كل المباريات</Link>{(edges.previous || edges.next) && <div className="fixture-carousel-buttons"><button type="button" disabled={!edges.previous} onClick={() => move(-1)} aria-label="المباريات السابقة" aria-controls={id}><ChevronRight size={17}/></button><button type="button" disabled={!edges.next} onClick={() => move(1)} aria-label="المباريات التالية" aria-controls={id}><ChevronLeft size={17}/></button></div>}</div></header>
    <div id={id} className="fixture-carousel-track" ref={track} tabIndex={0} aria-label="اسحب لعرض المباريات المرتقبة" onKeyDown={event => { if (event.key === 'ArrowLeft') { event.preventDefault(); move(1); } else if (event.key === 'ArrowRight') { event.preventDefault(); move(-1); } }}>
      {matches.map((match, index) => <article key={match.id} className="fixture-carousel-card" role="group" aria-roledescription="شريحة" aria-label={`مباراة ${index + 1} من ${matches.length}`}><Link to="/matches">
        <div className="fixture-carousel-teams">{[{ name: match.homeTeam, logo: match.homeLogo }, { name: match.awayTeam, logo: match.awayLogo }].map((team, teamIndex) => <div className="fixture-carousel-team" key={teamIndex}><SafeImage teamName={team.name} src={team.logo} alt="" className="fixture-carousel-logo"/><span>{team.name}</span></div>)}</div>
        <div className="fixture-carousel-details"><strong>{match.competition?.replace(/الممتاز/g, '').replace(/\s+/g, ' ').trim()}</strong><span><CalendarDays size={12} aria-hidden="true"/>{format(new Date(match.date), 'd MMMM yyyy', { locale: ar })}</span><span><Clock3 size={12} aria-hidden="true"/>{format(new Date(match.date), 'h:mm a', { locale: ar })}</span></div>
      </Link></article>)}
    </div>
  </div>;
}
