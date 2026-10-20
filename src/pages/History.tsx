import { motion, useInView, useMotionValue, useTransform, animate } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Trophy, History as HistoryIcon, MapPin, Calendar, Star, Award, Shield, ChevronRight, Search, X } from 'lucide-react';
import { useAppStore } from '../store';

const AnimatedCounter = ({ value, duration = 1.4 }: { value: number; duration?: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(count, Number.isFinite(value) ? value : 0, { duration });
    return () => controls.stop();
  }, [isInView, value, count, duration]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
};

type HistoryTab = 'titles' | 'timeline' | 'stadiums';

export default function History() {
  const [activeTab, setActiveTab] = useState<HistoryTab>('titles');
  const [timelineQuery, setTimelineQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const { clubStats: storeStats, clubTitles: storeTitles, historyEvents: storeEvents, stadiums: storeStadiums, dataLoaded } = useAppStore();

  const sortHistoryItems = <T extends { order?: number }>(
    items: T[],
    fallbackSort?: (a: T, b: T) => number
  ): T[] => [...items].sort((a, b) => {
    const hasA = typeof a.order === 'number';
    const hasB = typeof b.order === 'number';
    if (hasA && hasB) return (a.order as number) - (b.order as number);
    if (hasA) return -1;
    if (hasB) return 1;
    return fallbackSort ? fallbackSort(a, b) : 0;
  });

  const clubStats = sortHistoryItems((storeStats || []).filter(item => !item.hidden));
  const clubTitles = sortHistoryItems(
    (storeTitles || []).filter(item => !item.hidden),
    (a, b) => b.count - a.count
  );
  const historyEvents = sortHistoryItems(
    (storeEvents || []).filter(item => !item.hidden),
    (a, b) => (a.year || '').localeCompare(b.year || '')
  );
  const stadiums = sortHistoryItems((storeStadiums || []).filter(item => !item.hidden));
  const loading = !dataLoaded && clubTitles.length === 0 && historyEvents.length === 0 && stadiums.length === 0;

  const filteredEvents = useMemo(() => {
    const query = timelineQuery.trim().toLocaleLowerCase('ar');
    if (!query) return historyEvents;
    return historyEvents.filter(event =>
      [event.year, event.title, event.desc].some(value =>
        String(value || '').toLocaleLowerCase('ar').includes(query)
      )
    );
  }, [historyEvents, timelineQuery]);

  const selectedEvent = filteredEvents.find(event => event.id === selectedEventId) || filteredEvents[0] || null;
  const footballTitles = clubTitles.filter(title => title.category === 'football');
  const basketballTitles = clubTitles.filter(title => title.category === 'basketball');

  const getStatIcon = (label: string) => {
    if (label.includes('سنة')) return <Calendar aria-hidden="true" />;
    if (label.includes('كأس')) return <Trophy aria-hidden="true" />;
    if (label.includes('دوري')) return <Star aria-hidden="true" />;
    if (label.includes('سلة')) return <Award aria-hidden="true" />;
    return <Shield aria-hidden="true" />;
  };

  const getTitleIcon = (name: string) => {
    if (name.includes('كأس')) return <Trophy aria-hidden="true" />;
    if (name.includes('دوري')) return <Shield aria-hidden="true" />;
    if (name.includes('دورة') || name.includes('بطولة')) return <Star aria-hidden="true" />;
    return <Award aria-hidden="true" />;
  };

  const tabItems: { id: HistoryTab; title: string; subtitle: string; icon: typeof Trophy }[] = [
    { id: 'titles', title: 'البطولات', subtitle: 'سجل الإنجازات', icon: Trophy },
    { id: 'timeline', title: 'الخط الزمني', subtitle: 'محطات من الحكاية', icon: HistoryIcon },
    { id: 'stadiums', title: 'الملاعب', subtitle: 'بيوت الاتحاد', icon: MapPin }
  ];

  const renderTitleGroup = (title: string, data: typeof clubTitles) => (
    <section className="history-trophy-section" key={title}>
      <header className="history-section-heading">
        <div>
          <span className="history-section-kicker">إنجازات النادي</span>
          <h2>{title}</h2>
        </div>
        <span className="history-section-count">{data.length} سجل</span>
      </header>
      {data.length ? (
        <div className="history-trophy-grid">
          {data.map(item => (
            <article className="history-trophy-card" key={item.id}>
              <div className="history-trophy-icon">{getTitleIcon(item.name)}</div>
              <div className="history-trophy-count">{item.count}</div>
              <h3>{item.name}</h3>
            </article>
          ))}
        </div>
      ) : (
        <div className="history-empty">
          <Trophy aria-hidden="true" />
          <p>سيتم عرض الإنجازات هنا عند إضافتها.</p>
        </div>
      )}
    </section>
  );

  return (
    <main className="history-page-modern" dir="rtl">
      <header className="history-hero">
        <div className="history-hero-copy">
          <span className="history-eyebrow"><HistoryIcon size={15} /> أرشيف زعيم الثغر</span>
          <h1>حكاية الاتحاد</h1>
          <p>منذ 1906، حكاية مدينة وجمهور وإنجازات تنتقل من جيل إلى جيل.</p>
          <button type="button" className="history-hero-action" onClick={() => setActiveTab('timeline')}>
            اكتشف محطات الحكاية <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="history-hero-mark" aria-label="تأسس النادي عام 1906">
          <span>1906</span>
          <small>عام التأسيس</small>
          <div aria-hidden="true"><span /><span /><span /><span /><span /></div>
        </div>
      </header>

      <section className="history-summary-grid" aria-label="أرقام من تاريخ النادي">
        {clubStats.length ? clubStats.map(stat => (
          <article className="history-summary-card" key={stat.id}>
            <span className="history-summary-icon">{getStatIcon(stat.label)}</span>
            <strong><AnimatedCounter value={Number(stat.value) || 0} /></strong>
            <span>{stat.label}</span>
          </article>
        )) : (
          <div className="history-summary-empty">
            {loading ? 'جارٍ تحميل أرقام النادي…' : 'تظهر الأرقام التاريخية هنا عند إضافتها.'}
          </div>
        )}
      </section>

      <nav className="history-tabs" role="tablist" aria-label="أقسام تاريخ النادي">
        {tabItems.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              type="button"
              role="tab"
              id={'history-tab-' + tab.id}
              aria-controls={'history-panel-' + tab.id}
              aria-selected={active}
              className={active ? 'history-tab is-active' : 'history-tab'}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="history-tab-icon"><Icon size={20} aria-hidden="true" /></span>
              <span className="history-tab-copy"><strong>{tab.title}</strong><small>{tab.subtitle}</small></span>
              <ChevronRight className="history-tab-arrow" size={17} aria-hidden="true" />
            </button>
          );
        })}
      </nav>

      <motion.section
        key={activeTab}
        id={'history-panel-' + activeTab}
        role="tabpanel"
        aria-labelledby={'history-tab-' + activeTab}
        className="history-panel"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {activeTab === 'titles' && (
          <div className="history-title-groups">
            {renderTitleGroup('كرة القدم', footballTitles)}
            {renderTitleGroup('كرة السلة', basketballTitles)}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="history-timeline-shell">
            <header className="history-section-heading history-timeline-heading">
              <div>
                <span className="history-section-kicker">ذاكرة النادي</span>
                <h2>محطات صنعت الحكاية</h2>
                <p>اختر محطة لعرض تفاصيلها، أو ابحث باسمها أو عامها.</p>
              </div>
              <label className="history-search">
                <Search size={18} aria-hidden="true" />
                <span className="sr-only">ابحث في محطات التاريخ</span>
                <input
                  type="search"
                  value={timelineQuery}
                  onChange={event => setTimelineQuery(event.target.value)}
                  placeholder="ابحث في المحطات..."
                />
                {timelineQuery && (
                  <button type="button" onClick={() => setTimelineQuery('')} aria-label="مسح البحث">
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
              </label>
            </header>

            {filteredEvents.length ? (
              <div className="history-timeline-layout">
                <div className="history-event-list" aria-label="قائمة المحطات">
                  {filteredEvents.map((event, index) => {
                    const active = selectedEvent?.id === event.id;
                    return (
                      <button
                        type="button"
                        className={active ? 'history-event-choice is-active' : 'history-event-choice'}
                        key={event.id}
                        aria-pressed={active}
                        onClick={() => setSelectedEventId(event.id)}
                      >
                        <span className="history-event-year">{event.year}</span>
                        <span className="history-event-copy"><strong>{event.title}</strong><small>محطة {String(index + 1).padStart(2, '0')}</small></span>
                        <ChevronRight size={17} aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
                {selectedEvent && (
                  <article className="history-event-detail" aria-live="polite">
                    <span className="history-event-detail-year">{selectedEvent.year}</span>
                    <h3>{selectedEvent.title}</h3>
                    <p>{selectedEvent.desc}</p>
                  </article>
                )}
              </div>
            ) : (
              <div className="history-empty history-empty-large">
                <HistoryIcon aria-hidden="true" />
                <h3>لا توجد محطات مطابقة</h3>
                <p>{historyEvents.length ? 'جرّب كلمة بحث أخرى.' : 'ستظهر المحطات التاريخية هنا عند إضافتها.'}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stadiums' && (
          <div className="history-stadiums-shell">
            <header className="history-section-heading">
              <div>
                <span className="history-section-kicker">أماكن لها حكاية</span>
                <h2>ملاعب الاتحاد</h2>
                <p>تعرف على الملاعب المرتبطة بتاريخ النادي.</p>
              </div>
              <span className="history-section-count">{stadiums.length} ملعب</span>
            </header>
            {stadiums.length ? (
              <div className="history-stadium-grid">
                {stadiums.map(stadium => (
                  <article className="history-stadium-card" key={stadium.id}>
                    <div className="history-stadium-image">
                      {stadium.imageUrl ? (
                        <img src={stadium.imageUrl} alt={stadium.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                      ) : <MapPin size={42} aria-hidden="true" />}
                      <span>{stadium.type}</span>
                    </div>
                    <div className="history-stadium-copy">
                      <h3>{stadium.name}</h3>
                      <p>{stadium.desc}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="history-empty history-empty-large">
                <MapPin aria-hidden="true" />
                <h3>ملاعبنا</h3>
                <p>لا توجد ملاعب مضافة حالياً.</p>
              </div>
            )}
          </div>
        )}
      </motion.section>
    </main>
  );
}
