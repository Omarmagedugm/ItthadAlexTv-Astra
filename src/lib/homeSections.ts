import type { HomeSection } from '../store';

export const DEFAULT_HOME_SECTIONS_LIST: HomeSection[] = [
  { id: 'hero', type: 'hero', active: true, order: 0, title: 'المباراة القادمة / الحية', spacing: 20 },
  { id: 'ads', type: 'ads', active: true, order: 1, title: 'شريط الإعلانات والبانرات', spacing: 20 },
  { id: 'live', type: 'live', active: true, order: 2, title: 'بث مباشر متاح (عند وجود بث)', spacing: 16 },
  { id: 'matches', type: 'matches', active: true, order: 3, title: 'مباريات مرتقبة', spacing: 24 },
  { id: 'game', type: 'game', active: true, order: 3.5, title: 'لعبة اتحاداوي 🎮', spacing: 20 },
  { id: 'ai_banner', type: 'ai_banner', active: true, order: 4, title: 'بانر استوديو التيشيرت (AI)', spacing: 20 },
  { id: 'city', type: 'city', active: true, order: 5, title: 'عروس البحر المتوسط (طقس وتاريخ)', spacing: 24 },
  { id: 'news', type: 'news', active: true, order: 6, title: 'آخر الأخبار الرسمية', spacing: 24 },
  { id: 'media', type: 'media', active: true, order: 7, title: 'ميديا الاتحاد والملخصات', spacing: 24 },
  { id: 'club_members', type: 'club_members', active: true, order: 8, title: 'بوابة الأعضاء والأنشطة', spacing: 24 },
  { id: 'public_services', type: 'services', active: true, order: 8.5, title: 'خدمات الجمهور والتعليم المجاني 🟢', spacing: 24 },
  { id: 'world_fans', type: 'world_fans', active: true, order: 9, title: 'رابطة اتحاداوية العالم (المغتربين)', spacing: 24 },
  { id: 'business', type: 'business', active: true, order: 10, title: 'اتحاداوي بيزنس (دليل الأعمال)', spacing: 24 },
  { id: 'tickets', type: 'tickets', active: true, order: 11, title: 'حجز وتذاكر المباريات (Live)', spacing: 20 },
  { id: 'polls', type: 'polls', active: true, order: 12, title: 'توقعات واستطلاعات الجماهير', spacing: 24 },
  { id: 'custom', type: 'custom', active: true, order: 13, title: 'مجتمع المشجعين (Fan Zone)', spacing: 24 },
  { id: 'history', type: 'history', active: true, order: 14, title: 'تاريخ وعراقة زعيم الثغر', spacing: 24 },
  { id: 'advertise', type: 'advertise', active: true, order: 15, title: 'ويدجت أعلن معنا', spacing: 24 }
];

export const WELCOME_SECTIONS: HomeSection[] = [
  { id: 'welcome_intro', type: 'welcome_intro', active: true, order: 0, title: 'الاتحاد يجمعنا — مقدمة الصفحة', spacing: 20 },
  { id: 'welcome_matches', type: 'welcome_matches', active: true, order: 1, title: 'على موعد مع الاتحاد والبث المباشر', spacing: 20 },
  { id: 'welcome_links', type: 'welcome_links', active: true, order: 2, title: 'اختصارات اكتشف التطبيق', spacing: 20 },
  { id: 'welcome_explore', type: 'welcome_explore', active: true, order: 3, title: 'أكتر من مجرد ماتش', spacing: 20 },
  { id: 'welcome_feed', type: 'welcome_feed', active: true, order: 4, title: 'نبض النادي — عنوان الأقسام', spacing: 20 },
 ];

export function resolveHomeSections(saved: HomeSection[] = []): HomeSection[] {
  const sections = saved.length ? saved.map(s => ({ ...s })) : DEFAULT_HOME_SECTIONS_LIST.map(s => ({ ...s }));
  // Migrate the formerly fixed welcome widgets once, preserving the visible legacy order.
  if (sections.some(s => WELCOME_SECTIONS.some(w => w.type === s.type))) return sections;
  const priority = (s: HomeSection) => s.type === 'hero' ? 0 : s.type === 'matches' ? 1 : s.type === 'city' || s.id === 'city' ? 2 : 3;
  sections.sort((a, b) => priority(a) - priority(b) || Number(!!b.pinned) - Number(!!a.pinned) || a.order - b.order);
  const at = sections.findIndex(s => priority(s) === 3);
  sections.splice(at < 0 ? sections.length : at, 0, ...WELCOME_SECTIONS.map(s => ({ ...s })));
  return sections.map((s, order) => ({ ...s, order }));
}
