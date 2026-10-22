import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Gamepad2, Play, Trophy } from 'lucide-react';
import { useAppStore } from '../../store';

interface GameAdWidgetProps {
  title?: string;
  className?: string;
}

export default function GameAdWidget({ title, className = '' }: GameAdWidgetProps) {
  const enabled = useAppStore(state => state.sectionFlags?.game !== false);
  if (!enabled) return null;

  return (
    <section dir="rtl" aria-label={title || 'لعبة اتحاداوي'} className={`ittihad-game-card ${className}`}>
      <style>{`
        .ittihad-game-card{--game-surface:#fff;--game-ink:#153c30;--game-muted:#667b71;--game-line:#dce6de;position:relative;overflow:hidden;border:1px solid var(--game-line);border-radius:18px;background:var(--game-surface);color:var(--game-ink);isolation:isolate}
        .dark .ittihad-game-card{--game-surface:#102a25;--game-ink:#f3f6ee;--game-muted:#acc2b5;--game-line:#294039}
        .ittihad-game-card .game-main{display:grid;grid-template-columns:minmax(0,1fr) 180px;gap:24px;align-items:center;padding:24px}
        .ittihad-game-card .game-label{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:600;color:var(--game-muted)}
        .ittihad-game-card .game-label svg{color:#38986c}
        .ittihad-game-card .game-title{font-size:clamp(20px,2.5vw,27px);font-weight:750;line-height:1.6;margin:9px 0 6px;overflow-wrap:anywhere}
        .ittihad-game-card .game-description{max-width:440px;font-size:12px;line-height:1.9;color:var(--game-muted);margin:0}
        .ittihad-game-card .game-actions{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin-top:19px}
        .ittihad-game-card .game-play{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:44px;padding:10px 18px;border-radius:10px;background:#176447;color:#fff;font-size:12px;font-weight:700;white-space:nowrap;transition:background .2s}
        .dark .ittihad-game-card .game-play{background:#cddd9d;color:#143b2b}
        .ittihad-game-card .game-play:hover{background:#207c59}
        .dark .ittihad-game-card .game-play:hover{background:#e0edb7}
        .ittihad-game-card .game-external{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:44px;padding:10px 12px;color:var(--game-muted);font-size:11px;white-space:nowrap;border-radius:10px}
        .ittihad-game-card .game-external:hover{color:var(--game-ink);background:color-mix(in srgb,var(--game-muted) 10%,transparent)}
        .ittihad-game-card a:focus-visible{outline:2px solid #3ca876;outline-offset:4px}
        .ittihad-game-card .game-art{position:relative;height:166px;display:grid;place-items:center;border-radius:16px;background:#edf3e6;overflow:hidden}
        .dark .ittihad-game-card .game-art{background:#193e30}
        .ittihad-game-card .game-orbit{position:absolute;width:130px;height:130px;border:1px solid #86a87844;border-radius:50%}
        .ittihad-game-card .game-orbit:after{content:"";position:absolute;inset:15px;border:1px solid #86a87833;border-radius:50%}
        .ittihad-game-card .game-controller{position:relative;color:#276347;transform:rotate(-12deg);filter:drop-shadow(0 9px 0 #1c513011)}
        .dark .ittihad-game-card .game-controller{color:#cddd9d}
        .ittihad-game-card .game-trophy{position:absolute;top:17px;left:17px;display:grid;place-items:center;width:33px;height:33px;border-radius:10px;background:var(--game-surface);color:#a57b2b;transform:rotate(10deg)}
        .ittihad-game-card .game-art-label{position:absolute;bottom:13px;font-size:9px;letter-spacing:2px;color:var(--game-muted)}
        .ittihad-game-card .game-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 24px;border-top:1px solid var(--game-line);font-size:10px;color:var(--game-muted)}
        .ittihad-game-card .game-footer span{display:inline-flex;align-items:center;gap:6px}
        .ittihad-game-card .game-dot{width:5px;height:5px;border-radius:50%;background:#38986c}
        @media(max-width:480px){
          .ittihad-game-card .game-main{grid-template-columns:minmax(0,1fr) 78px;gap:10px;padding:18px 16px}
          .ittihad-game-card .game-art{height:100px;border-radius:12px;align-self:start;margin-top:30px}
          .ittihad-game-card .game-controller{width:59px;height:59px}
          .ittihad-game-card .game-orbit{width:90px;height:90px}
          .ittihad-game-card .game-trophy,.ittihad-game-card .game-art-label{display:none}
          .ittihad-game-card .game-title{font-size:20px}
          .ittihad-game-card .game-description{font-size:11px}
          .ittihad-game-card .game-actions{gap:4px;margin-top:14px}
          .ittihad-game-card .game-play{padding:9px 12px;gap:7px}
          .ittihad-game-card .game-external{padding:8px 4px;font-size:10px}
          .ittihad-game-card .game-footer{padding:11px 16px;flex-wrap:wrap;gap:7px}
        }
      `}</style>
      <div className="game-main">
        <div className="min-w-0">
          <div className="game-label"><Gamepad2 size={15} aria-hidden="true" /><span>استراحة المشجع</span></div>
          <h3 className="game-title">{title || 'لعبة اتحاداوي'}</h3>
          <p className="game-description">شوارع إسكندرية مستنياك. اختار بطلك، اجمع الكؤوس وتحدّى نفسك في كل جولة.</p>
          <div className="game-actions">
            <Link to="/game" className="game-play"><Play size={14} fill="currentColor" aria-hidden="true" /><span>العب الآن</span><ArrowLeft size={15} aria-hidden="true" /></Link>
            <a href="/games/ittihadawy/index.html" target="_blank" rel="noopener noreferrer" className="game-external" aria-label="فتح اللعبة في نافذة مستقلة"><span>شاشة مستقلة</span><ExternalLink size={13} aria-hidden="true" /></a>
          </div>
        </div>
        <div className="game-art" aria-hidden="true">
          <div className="game-orbit" />
          <Gamepad2 className="game-controller" size={100} strokeWidth={1.25} />
          <span className="game-trophy"><Trophy size={18} strokeWidth={1.6} /></span>
          <span className="game-art-label">ITTIHADAWY</span>
        </div>
      </div>
      <div className="game-footer">
        <span><span className="game-dot" />العب مباشرة · بدون تحميل</span>
        <span>مغامرة في قلب إسكندرية</span>
      </div>
    </section>
  );
}
