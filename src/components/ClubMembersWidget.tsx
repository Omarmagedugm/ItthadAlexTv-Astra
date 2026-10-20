import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, CalendarDays, Compass, Dumbbell, ShieldCheck } from 'lucide-react';

export default function ClubMembersWidget({ title }: { title?: string }) {
  return <div className="home-members-widget" dir="rtl">
    <div className="home-member-pass" aria-hidden="true"><ShieldCheck size={34}/><span>نادي الاتحاد السكندري</span><strong>عضو في عيلة كبيرة</strong><div><span>بطاقة الانتماء</span><b>1914</b></div></div>
    <div className="home-members-content"><span className="home-widget-kicker">ناديك أقرب لك</span><h3>{title || 'بوابة أعضاء النادي'}</h3><p>خدماتك وأنشطتك ومواعيدك.. كلها في مكان واحد.</p>
      <div className="home-member-services">{[{Icon:Dumbbell,label:'الجيم والرياضات'},{Icon:Compass,label:'الرحلات والمصايف'},{Icon:Building2,label:'الخدمات الحكومية'},{Icon:CalendarDays,label:'اللجان والتنبيهات'}].map(({Icon,label}) => <Link key={label} to="/club-members"><Icon size={19}/><span>{label}</span><ArrowLeft size={15}/></Link>)}</div>
      <Link to="/club-members" className="home-widget-action">افتح بوابة الأعضاء <ArrowLeft size={18}/></Link>
    </div>
  </div>;
}
