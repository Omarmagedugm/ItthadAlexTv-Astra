import type { MatchItem } from '../store';
import { SafeImage } from './SafeImage';
import ScoreSelector from './ScoreSelector';

interface Props {
  match: MatchItem;
  home: number;
  away: number;
  hasPrediction: boolean;
  disabled?: boolean;
  onChange: (home: number, away: number) => void;
}

export default function PredictionMatchPicker({ match, home, away, hasPrediction, disabled = false, onChange }: Props) {
  const isBasketball = match.sport === 'basketball';
  const teams = [
    { name: match.homeTeam, logo: match.homeLogo, score: home, selected: hasPrediction && home > away },
    { name: match.awayTeam, logo: match.awayLogo, score: away, selected: hasPrediction && away > home },
  ];
  return <div className="prediction-picker" dir="rtl">
    <div className="prediction-picker-teams">
      {teams.map((team, index) => <div className="prediction-picker-team" key={index}>
        <div className="prediction-picker-logo"><SafeImage teamName={team.name} src={team.logo} width={120} className="prediction-team-image object-contain" alt=""/></div>
        <h4>{team.name}</h4>
        {!isBasketball && <ScoreSelector value={team.score} min={0} max={10} disabled={disabled} ariaLabel={team.name} onChange={score => onChange(index === 0 ? score : home, index === 1 ? score : away)}/>}
        <button type="button" className={`ds-control prediction-choice ${team.selected ? 'is-selected' : ''}`} disabled={disabled} aria-pressed={team.selected} aria-label={`توقع فوز ${team.name}`} onClick={() => onChange(index === 0 ? 1 : 0, index === 1 ? 1 : 0)}>توقع الفوز</button>
      </div>)}
    </div>
    {!isBasketball && <button type="button" className={`ds-control prediction-choice prediction-draw ${hasPrediction && home === away ? 'is-selected' : ''}`} disabled={disabled} aria-pressed={hasPrediction && home === away} onClick={() => onChange(1, 1)}>توقع التعادل</button>}
  </div>;
}
