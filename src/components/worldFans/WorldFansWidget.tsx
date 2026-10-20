import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowLeft, Plus } from 'lucide-react';
import { useAppStore } from '../../store';
import { CountryFlag } from './CountryFlag';

// Helper to guarantee accurate country emoji flag for any country
export const getCountryFlag = (countryIdOrName?: string, fallbackFlag?: string): string => {
  if (!countryIdOrName && !fallbackFlag) return '🌍';
  const val = (countryIdOrName || '').toLowerCase().trim();

  const flagMap: Record<string, string> = {
    ae: '🇦🇪', uae: '🇦🇪', 'الإمارات': '🇦🇪', 'الإمارات العربية المتحدة': '🇦🇪',
    sa: '🇸🇦', ksa: '🇸🇦', 'السعودية': '🇸🇦', 'المملكة العربية السعودية': '🇸🇦',
    kw: '🇰🇼', kuwait: '🇰🇼', 'الكويت': '🇰🇼',
    gb: '🇬🇧', uk: '🇬🇧', 'المملكة المتحدة': '🇬🇧', 'بريطانيا': '🇬🇧', 'انجلترا': '🇬🇧', 'إنجلترا': '🇬🇧',
    us: '🇺🇸', usa: '🇺🇸', 'الولايات المتحدة': '🇺🇸', 'الولايات المتحدة الأمريكية': '🇺🇸', 'امريكا': '🇺🇸', 'أمريكا': '🇺🇸',
    eu: '🇪🇺', europe: '🇪🇺', 'الاتحاد الأوروبي': '🇪🇺', 'أوروبا': '🇪🇺', 'اوروبا': '🇪🇺',
    east_asia: '🌏', 'east asia': '🌏', 'شرق آسيا': '🌏', 'شرق اسيا': '🌏', 'آسيا': '🌏',
    de: '🇩🇪', germany: '🇩🇪', 'ألمانيا': '🇩🇪', 'المانيا': '🇩🇪',
    qa: '🇶🇦', qatar: '🇶🇦', 'قطر': '🇶🇦',
    om: '🇴🇲', oman: '🇴🇲', 'عمان': '🇴🇲', 'سلطنة عمان': '🇴🇲', 'سلطنة عُمان': '🇴🇲',
    bh: '🇧🇭', bahrain: '🇧🇭', 'البحرين': '🇧🇭',
    eg: '🇪🇬', egypt: '🇪🇬', 'مصر': '🇪🇬',
    fr: '🇫🇷', france: '🇫🇷', 'فرنسا': '🇫🇷',
    it: '🇮🇹', italy: '🇮🇹', 'إيطاليا': '🇮🇹', 'ايطاليا': '🇮🇹',
    es: '🇪🇸', spain: '🇪🇸', 'إسبانيا': '🇪🇸', 'اسبانيا': '🇪🇸',
    ca: '🇨🇦', canada: '🇨🇦', 'كندا': '🇨🇦',
    au: '🇦🇺', australia: '🇦🇺', 'أستراليا': '🇦🇺', 'استراليا': '🇦🇺',
    tr: '🇹🇷', turkey: '🇹🇷', 'تركيا': '🇹🇷',
    jo: '🇯🇴', jordan: '🇯🇴', 'الأردن': '🇯🇴', 'الاردن': '🇯🇴',
    lb: '🇱🇧', lebanon: '🇱🇧', 'لبنان': '🇱🇧',
    iq: '🇮🇶', iraq: '🇮🇶', 'العراق': '🇮🇶',
    sd: '🇸🇩', sudan: '🇸🇩', 'السودان': '🇸🇩',
    nl: '🇳🇱', netherlands: '🇳🇱', 'هولندا': '🇳🇱',
    se: '🇸🇪', sweden: '🇸🇪', 'السويد': '🇸🇪',
  };

  if (flagMap[val]) return flagMap[val];

  if (fallbackFlag && fallbackFlag !== '🏳️' && fallbackFlag !== '🌍') {
    return fallbackFlag;
  }

  return '🌍';
};

export default function WorldFansWidget({ title }: { title?: string }) {
  const navigate = useNavigate();
  const { worldCountries, worldGroups } = useAppStore();

  const activeGroups = (worldGroups || []).filter(g => g.active !== false && g.status !== 'rejected');
  const activeCountries = (worldCountries || []).filter(c => c.active !== false);

  // Group actual groups by country to get exact dynamic numbers
  const countryStatsMap = React.useMemo(() => {
    const map = new Map<string, {
      countryId: string;
      countryName: string;
      countryFlag: string;
      groupsCount: number;
      fanCount: number;
    }>();

    // First populate from active countries
    activeCountries.forEach(c => {
      map.set(c.id, {
        countryId: c.id,
        countryName: c.name,
        countryFlag: getCountryFlag(c.id, c.flag),
        groupsCount: 0,
        fanCount: 0,
      });
    });

    // Aggregate actual group counts and member sums
    activeGroups.forEach(g => {
      const cId = g.countryId || 'other';
      const flag = getCountryFlag(g.countryId || g.countryName, g.countryFlag);
      const name = g.countryName || 'دولة أخرى';
      const members = Number(g.memberCount) || 0;

      if (!map.has(cId)) {
        map.set(cId, {
          countryId: cId,
          countryName: name,
          countryFlag: flag,
          groupsCount: 0,
          fanCount: 0,
        });
      }

      const entry = map.get(cId)!;
      entry.groupsCount += 1;
      entry.fanCount += members;
    });

    return map;
  }, [activeGroups, activeCountries]);

  // Actual dynamic list of countries that have actual groups or fans
  const dynamicCountriesList = React.useMemo(() => {
    const list = Array.from(countryStatsMap.values());
    
    // Sort so countries with active groups appear first, then by fan count
    return list
      .filter(item => item.groupsCount > 0 || item.fanCount > 0)
      .sort((a, b) => (b.groupsCount - a.groupsCount) || (b.fanCount - a.fanCount));
  }, [countryStatsMap]);

  // Dynamic Metrics
  const approvedGroupsCount = activeGroups.length;
  const representedCountriesCount = dynamicCountriesList.length > 0 ? dynamicCountriesList.length : activeCountries.length;
  
  const totalFans = activeGroups.reduce((acc, g) => acc + (Number(g.memberCount) || 0), 0) ||
    dynamicCountriesList.reduce((acc, c) => acc + (c.fanCount || 0), 0);

  return <section id="world-fans-widget" className="home-simple-widget" dir="rtl" aria-label={title || 'رابطة اتحاداوية العالم'}>
    <header className="home-simple-header"><div className="home-simple-title"><Globe size={21}/><div><h2>{title || 'رابطة اتحاداوية العالم'}</h2><p>الاقي اتحاداوية في بلدك</p></div></div><button id="btn-open-world-fans" className="home-simple-all" onClick={() => navigate('/world-fans')}>الكل <ArrowLeft size={16}/></button></header>
    <p className="home-world-summary">{representedCountriesCount.toLocaleString('ar-EG')} دولة <span>·</span> {approvedGroupsCount.toLocaleString('ar-EG')} رابطة <span>·</span> {totalFans.toLocaleString('ar-EG')} مشجع</p>
    {dynamicCountriesList.length > 0 ? <div className="home-country-list">{dynamicCountriesList.slice(0, 4).map(country => <button key={country.countryId} onClick={() => navigate(`/world-fans?country=${encodeURIComponent(country.countryId)}`)}><CountryFlag countryCode={country.countryId} flag={country.countryFlag} countryName={country.countryName} size="md" shape="rounded"/><strong>{country.countryName}</strong><span>{country.groupsCount} رابطة</span><ArrowLeft size={16}/></button>)}</div> : <p className="home-simple-empty">ابدأ رابطة الاتحاداوية في بلدك.</p>}
    <footer className="home-simple-footer"><button id="btn-world-fans-found-league" onClick={() => navigate('/world-fans?action=found')}><Plus size={16}/> أسّس رابطة في بلدك</button></footer>
  </section>;
}
