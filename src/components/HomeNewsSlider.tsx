import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useAppStore } from '../store';
import { SafeImage } from './SafeImage';

const newsTimestamp = (item: { date?: string; createdAt?: string }) => {
 const primary = item.date ? new Date(item.date).getTime() : NaN;
 if (Number.isFinite(primary)) return primary;
 const fallback = item.createdAt ? new Date(item.createdAt).getTime() : NaN;
 return Number.isFinite(fallback) ? fallback : 0;
};
const newsDate = (date: string) => {
 const parsed = new Date(date);
 return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('ar-EG', {day:'numeric',month:'long'});
};
export default function HomeNewsSlider() {
 const news = useAppStore(s => s.news);
 const slides = [...news].sort((a, b) => newsTimestamp(b) - newsTimestamp(a)).slice(0, 8);
 const [selected,setSelected]=useState(0);
 const [paused,setPaused]=useState(false);
 const [interacting,setInteracting]=useState(false);
 const [reducedMotion,setReducedMotion]=useState(true);
 const viewport=useRef<HTMLDivElement>(null);
 const active=useRef(0);
 const dragStart=useRef<number|null>(null);
 const swiped=useRef(false);
 const newestId=slides[0]?.id;
 const index=Math.min(selected,Math.max(0,slides.length-1));
 const select=(target:number)=>{
  const track=viewport.current;if(!track||!slides.length)return;
  const next=(target+slides.length)%slides.length;
  const card=track.children[next] as HTMLElement|undefined;if(!card)return;
  const box=track.getBoundingClientRect(),item=card.getBoundingClientRect();
  track.scrollBy({left:item.left+item.width/2-box.left-box.width/2,behavior:reducedMotion?'instant':'smooth'});
  active.current=next;setSelected(next);
 };
 const move=(step:number)=>{setPaused(true);select(index+step);};
 useEffect(()=>{const query=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReducedMotion(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 useEffect(()=>{if(paused||interacting||reducedMotion||slides.length<2)return;const timer=window.setInterval(()=>{if(!document.hidden)select(active.current+1);},6000);return()=>window.clearInterval(timer);},[paused,interacting,reducedMotion,slides.length]);
 useEffect(()=>{active.current=0;setSelected(0);if(viewport.current)viewport.current.scrollLeft=0;},[newestId,slides.length]);
 if(!slides.length)return null;
 return <div className="home-news-slider home-news-carousel" role="region" aria-roledescription="كاروسيل" aria-label="أبرز أخبار الاتحاد" dir="rtl"
  onMouseEnter={()=>setInteracting(true)} onMouseLeave={()=>setInteracting(false)}
  onFocusCapture={()=>setInteracting(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setInteracting(false);}}
  onKeyDown={e=>{if(e.key==='ArrowLeft'){e.preventDefault();move(1);}if(e.key==='ArrowRight'){e.preventDefault();move(-1);}}}>
  <div className="home-news-card-track" ref={viewport} onScroll={()=>{
   const track=viewport.current;if(!track)return;const box=track.getBoundingClientRect();const center=box.left+box.width/2;
   let nearest=0,distance=Infinity;Array.from(track.children).forEach((child,i)=>{const rect=child.getBoundingClientRect();const gap=Math.abs(rect.left+rect.width/2-center);if(gap<distance){nearest=i;distance=gap;}});
   active.current=nearest;setSelected(nearest);
  }} onTouchStart={e=>{dragStart.current=e.touches[0].clientX;swiped.current=false;setInteracting(true);}}
   onTouchEnd={e=>{swiped.current=dragStart.current!==null&&Math.abs(e.changedTouches[0].clientX-dragStart.current)>10;dragStart.current=null;setInteracting(false);}}
   onTouchCancel={()=>{dragStart.current=null;setInteracting(false);}}>
   {slides.map((story,i)=><article className="home-news-slide" key={story.id} role="group" aria-roledescription="شريحة" aria-label={`${i+1} من ${slides.length}`}>
    <Link to={`/news/${story.id}`} className="home-news-story" onClick={e=>{if(swiped.current){e.preventDefault();swiped.current=false;}}}>
     <div className="home-news-photo"><SafeImage src={story.image||undefined} alt="" className="w-full h-full object-cover" width={900}/></div>
     <div className="home-news-shade" aria-hidden="true"/>
     <span className="home-news-category">{story.category||'أخبار النادي'}</span>
     <div className="home-news-copy"><h2>{story.title}</h2><div className="home-news-meta"><span>{story.author||'قناة الاتحاد'}</span>{newsDate(story.date)&&<><i aria-hidden="true"/><time dateTime={story.date}>{newsDate(story.date)}</time></>}</div></div>
    </Link>
   </article>)}
  </div>
  {slides.length>1&&<div className="home-slider-controls"><button className="home-carousel-arrow" onClick={()=>move(-1)} aria-label="الخبر السابق"><ChevronRight size={18}/></button><div className="home-slider-dots">{slides.map((story,i)=><button key={story.id} aria-label={`عرض الخبر ${i+1}: ${story.title}`} aria-current={i===index?'true':undefined} onClick={()=>{setPaused(true);select(i);}}><span/></button>)}</div><button className="home-carousel-arrow" onClick={()=>move(1)} aria-label="الخبر التالي"><ChevronLeft size={18}/></button><button className="home-carousel-play" onClick={()=>setPaused(p=>!p)} aria-label={paused?'تشغيل الأخبار تلقائيًا':'إيقاف الأخبار مؤقتًا'}>{paused?<Play size={14}/>:<Pause size={14}/>}</button></div>}
 </div>;
}
