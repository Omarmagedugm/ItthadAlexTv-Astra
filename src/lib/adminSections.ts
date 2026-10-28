import type { AppRole, UserProfile } from '../store';
import { canAccessAdmin, isSuperAdminProfile } from './adminAccess';
export interface AdminSection { id: string; title: string; description: string; group: string; roles: AppRole[]; }
const groups: [string, [string, string, string, AppRole[]][]][] = [
 ['الرئيسية والمتابعة', [
 ['overview','نظرة عامة','ابدأ من هنا وتابع أهم المهام',[]],
 ['analytics','الإحصاءات والتفاعل','أداء المحتوى ونشاط الجمهور',[]],
 ['service-health','فحص الخدمات','اختبار الاتصال والخدمات المتاحة',['admin']],
 ]],
 ['الأخبار والمحتوى', [
 ['news','الأخبار والمقالات','نشر الأخبار وتعديلها',['news_editor']],
 ['news-categories','أقسام الأخبار','تنظيم تصنيفات الأخبار',['news_editor']],
 ['news-tags','وسوم الأخبار','إدارة وسوم البحث',['news_editor']],
 ['media','الصور والفيديو','إدارة الميديا وقوائم التشغيل',['media_editor']],
 ['music','المكتبة الموسيقية','الأغاني والألبومات',['media_editor']],
 ['books','الكتب والمجلات','إدارة الأرشيف المقروء',['media_editor']],
 ['history','تاريخ النادي','البطولات والمحطات والملاعب',['layout_editor']],
 ]],
 ['المباريات والبث', [
 ['matches','المباريات','المواعيد والنتائج والتغطية',['matches_editor']],
 ['clubs','الأندية','الأسماء والشعارات',['matches_editor','layout_editor']],
 ['live','البث المباشر','القنوات ومصادر المشاهدة',['matches_editor']],
 ['predictions','توقعات المباريات','إدارة توقعات الجماهير',['matches_editor','user_manager']],
 ['comments','تعليقات البث','مراجعة تعليقات المشاهدة',['matches_editor','user_manager']],
 ]],
 ['الجمهور وخدمات النادي', [
 ['fanzone','منطقة الجماهير','نظرة على تفاعل المشجعين',['user_manager']],
 ['posts','منشورات الجماهير','المراجعة والإشراف',['user_manager']],
 ['fan-comments','تعليقات الجمهور','مراجعة المناقشات',['user_manager']],
 ['polls','الاستطلاعات','الأسئلة والتصويت',['layout_editor','user_manager']],
 ['world-fans','اتحاداوية العالم','الروابط والطلبات والفعاليات',['user_manager']],
 ['club_members','أعضاء النادي','اللجان والرحلات والخدمات',['members_editor','layout_editor','user_manager']],
 ['public-services','خدمات الجمهور والتعليم','الخدمات والفرص التعليمية',['layout_editor','user_manager','media_editor']],
 ]],
 ['المتجر والأعمال', [
 ['products','المنتجات','إدارة كتالوج المتجر',['store_editor']],
 ['orders','طلبات الشراء','المتابعة وحالة الطلبات',['store_editor']],
 ['business','اتحاداوي بيزنس','المشروعات وطلبات المراجعة',['store_editor','layout_editor','user_manager']],
 ]],
 ['التصميم وتجربة التطبيق', [
 ['layout','الصفحة الرئيسية','ترتيب الويدجت والمحتوى',['layout_editor']],
 ['bottom-nav','القائمة السفلية','العناصر والأسماء والترتيب والإظهار',['layout_editor']],
 ['sidebar-menu','القائمة الجانبية','الروابط وترتيب الأقسام',['layout_editor']],
 ['sections-control','إظهار أقسام التطبيق','تفعيل وإيقاف الأقسام',['layout_editor']],
 ['city','طقس الإسكندرية','معلومات المدينة والطقس',['layout_editor']],
 ['ai-studio','استوديو الصور','إعدادات تجربة الصور',['layout_editor']],
 ['game','لعبة هروب اتحاداوي','تحميل اللعبة ورفع وتحديث النسخ الجديدة',['layout_editor','admin']],
 ]],
 ['النظام والصلاحيات', [
 ['users','الأعضاء والصلاحيات','إدارة حسابات فريق العمل',['user_manager']],
 ['audit-logs','سجل العمليات والمحذوفات','مراجعة التغييرات والاستعادة',['user_manager']],
 ['settings','إعدادات التطبيق','الهوية والإعدادات العامة',['admin']],
 ['backup','النسخ الاحتياطي','تصدير واستعادة البيانات',['admin']],
 ['migration','نقل الصور والتخزين','أدوات نقل الأرشيف القديمة',['admin']],
 ]],
];
export const ADMIN_GROUPS = groups.map(([title]) => title);
export const ADMIN_SECTIONS: AdminSection[] = groups.flatMap(([group, entries]) => entries.map(([id,title,description,roles]) => ({id,title,description,roles,group})));
export function canOpenAdminSection(profile: UserProfile, id: string): boolean {
 const section = ADMIN_SECTIONS.find(s => s.id === id);
 if (!section || !canAccessAdmin(profile)) return false;
 if (isSuperAdminProfile(profile)) return true;
 const roles = new Set<string>([profile.role, ...(profile.roles || [])]);
 if (roles.has('writer')) roles.add('news_editor');
 if (roles.has('moderator')) { roles.add('user_manager'); roles.add('news_editor'); roles.add('media_editor'); }
 return section.roles.length === 0 || section.roles.some(role => roles.has(role));
}
