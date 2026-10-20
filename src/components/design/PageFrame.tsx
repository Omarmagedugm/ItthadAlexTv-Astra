import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, Newspaper, Trophy, Radio, Library, Users, History, ShoppingBag, ShieldCheck, HeartHandshake, Building2, Globe2, Sparkles, Bookmark, UserRound, Settings2, FileText, GraduationCap, Facebook, Tags } from 'lucide-react';
const pages:Record<string,{title:string;description:string;en:string;Icon:typeof Newspaper;family:string}>={
 news:{title:'من قلب النادي',description:'الأخبار، الكواليس، ووجهات النظر. تابع كل جديد عن زعيم الثغر.',en:'THE NEWSROOM',Icon:Newspaper,family:'editorial'},
 matches:{title:'كل مباراة.. حكاية',description:'مواعيد ونتائج كرة القدم وكرة السلة، لحظة بلحظة.',en:'MATCH CENTER',Icon:Trophy,family:'sport'},
 live:{title:'أقرب للملعب',description:'شاهد قنوات الاتحاد وتابع البث والتغطيات من مكانك.',en:'ITTIHAD TV',Icon:Radio,family:'screen'},
 library:{title:'ذاكرة بالصوت والصورة',description:'مباريات، صور، أغاني وكتب. أرشيف الاتحاد بين إيديك.',en:'THE COLLECTION',Icon:Library,family:'screen'},
 'fan-zone':{title:'مكانك في المدرج',description:'شارك حكايتك، توقّع النتيجة، وخلي صوتك وسط الاتحاداوية.',en:'THE FAN COMMUNITY',Icon:Users,family:'community'},
 history:{title:'حكاية نادينا',description:'محطات من التاريخ، بطولات وأرقام، وملاعب صنعت الذكريات.',en:'OUR HERITAGE',Icon:History,family:'heritage'},
 store:{title:'لبسنا.. انتماؤنا',description:'اكتشف منتجات الجماهير واختار قطعتك المفضلة.',en:'THE FAN STORE',Icon:ShoppingBag,family:'commerce'},
 'club-members':{title:'ناديك أقرب ليك',description:'خدمات الأعضاء، اللجان، الرحلات، والإعلانات في مكان واحد.',en:'MEMBERS CLUB',Icon:ShieldCheck,family:'services'},
 services:{title:'الاتحاد يخدم جمهوره',description:'اكتشف الخدمات والمبادرات والفرص التعليمية المتاحة للجمهور.',en:'FOR OUR COMMUNITY',Icon:HeartHandshake,family:'services'},
 business:{title:'من جمهورنا.. لجمهورنا',description:'اكتشف المشروعات والخدمات والأنشطة التجارية للاتحاداوية.',en:'ITTIHAD BUSINESS',Icon:Building2,family:'commerce'},
 'world-fans':{title:'اتحاداوية.. في كل بلد',description:'رابطة تجمعنا مهما كانت المسافات. تواصل مع جمهور مدينتك.',en:'ONE CLUB. EVERYWHERE.',Icon:Globe2,family:'community'},
 'jersey-tryon':{title:'صورتك بألواننا',description:'استوديو المشجع. اختار صورتك واصنع لحظتك مع الاتحاد.',en:'FAN STUDIO',Icon:Sparkles,family:'studio'},
 bookmarks:{title:'حكايات ترجع لها',description:'منشوراتك المحفوظة، جاهزة وقت ما تحب ترجع تقراها.',en:'YOUR COLLECTION',Icon:Bookmark,family:'personal'},
 profile:{title:'أنت جزء من الحكاية',description:'ملفك، هويتك، وتفضيلاتك في عالم الاتحاد.',en:'MY ITTIHAD',Icon:UserRound,family:'personal'},
 admin:{title:'مساحة إدارة الاتحاد',description:'المحتوى، الجمهور، والإعدادات. كل أدواتك في مساحة عمل واحدة.',en:'CONTROL ROOM',Icon:Settings2,family:'admin'},
 auth:{title:'أهلاً بيك في بيتك',description:'سجّل دخولك وشارك جمهور الاتحاد كل لحظة.',en:'WELCOME HOME',Icon:UserRound,family:'personal'},
 social:{title:'كل منصاتنا.. قريبة',description:'تابع صفحات وقنوات الاتحاد وتواصل مع مجتمعنا.',en:'STAY CONNECTED',Icon:Facebook,family:'community'},
 discounts:{title:'مزايا تستاهلها',description:'اكتشف العروض والخصومات المخصصة لأعضاء النادي.',en:'MEMBER BENEFITS',Icon:Tags,family:'commerce'},
 education:{title:'فرصتك تتعلم أكتر',description:'تصفّح المحتوى التعليمي واختار المجال اللي يناسبك.',en:'LEARN & GROW',Icon:GraduationCap,family:'services'},
 privacy:{title:'خصوصيتك تهمنا',description:'تعرّف على سياسة الخصوصية وكيفية التعامل مع بياناتك.',en:'PRIVACY',Icon:ShieldCheck,family:'document'},
 terms:{title:'شروط الاستخدام',description:'الشروط المنظمة لاستخدام التطبيق وخدماته.',en:'TERMS OF USE',Icon:FileText,family:'document'},
 page:{title:'من صفحات الاتحاد',description:'محتوى وخدمات من مجتمع النادي.',en:'CLUB PAGES',Icon:FileText,family:'document'}
};
const aliases:Record<string,string>={media:'library',feed:'fan-zone',fanzone:'fan-zone',leaderboard:'fan-zone','world-association':'world-fans','public-services':'services','education-services':'education','social-media':'social',facebook:'social','privacy-policy':'privacy'};
export function getPageKey(path:string){const p=path.split('/').filter(Boolean);if(p.includes('discounts'))return 'discounts';if(p.includes('education'))return 'education';return aliases[p[0]]||p[0]||'home';}
export default function PageFrame({children}:{children:ReactNode}){const {pathname}=useLocation();const key=getPageKey(pathname);const page=pages[key];const detail=pathname.split('/').filter(Boolean).length>1&&!pathname.endsWith('/discounts')&&!pathname.endsWith('/education');const Icon=page?.Icon;
 return <div id="main-content" tabIndex={-1} className={`ds-stage ds-family-${page?.family||'home'}`} data-page={key} dir="rtl">{page&&<div className={`ds-page-heading ${detail?'ds-page-heading--detail':''}`}><div className="ds-breadcrumb"><Link to="/">الرئيسية</Link><ChevronLeft size={13}/><span>{page.title}</span></div><div className="ds-page-intro"><div><span className="ds-kicker">{page.en}</span><h1>{page.title}</h1><p>{page.description}</p></div>{Icon&&<span className="ds-page-symbol"><Icon size={42} strokeWidth={1.2}/></span>}</div></div>}<div className="ds-route-body" data-detail={detail?'true':'false'}>{children}</div><footer className="ds-footer"><Link to="/" className="ds-footer-brand">الاتحاد يجمعنا<span>ITTIHAD ALEX TV</span></Link><div><Link to="/privacy">الخصوصية</Link><Link to="/terms">شروط الاستخدام</Link><a href="mailto:info@itthadalextv.com">تواصل معنا <ArrowLeft size={13}/></a></div><small>تصميم وتطوير: عمر ماجد</small></footer></div>;
}
