import React, { useState, useEffect } from 'react';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useAppStore, HomeSection } from '../../store';
import toast from 'react-hot-toast';
import { 
  MoveUp, 
  MoveDown, 
  Pin, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Sparkles, 
  Code, 
  Image as ImageIcon, 
  Ticket, 
  BarChart3, 
  History as HistoryIcon, 
  Megaphone, 
  Newspaper, 
  Video, 
  Layers, 
  GripVertical,
  Building2,
  Globe,
  ShieldCheck,
  Radio,
  Tv,
  Calendar,
  MapPin,
  Flame,
  ArrowUpToLine,
  ArrowDownToLine,
  Sliders,
  Copy,
  Info,
  Play,
  HeartHandshake,
  ExternalLink,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Gamepad2
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { isYouTubeUrl, isFacebookUrl, getYouTubeThumbnail, getYouTubeEmbedUrl, getFacebookEmbedUrl } from '../../lib/videoUtils';

import { WELCOME_SECTIONS, resolveHomeSections } from '../../lib/homeSections';

export const SECTION_METADATA: Record<string, { label: string; icon: React.ReactNode; color: string; desc: string }> = {
  welcome_intro: { label: 'الاتحاد يجمعنا — مقدمة الصفحة', icon: <Layers size={16} />, color: 'bg-emerald-500/10 text-emerald-600', desc: 'تحكم في ظهور الويدجت ومكانها في الصفحة الرئيسية' },
  welcome_matches: { label: 'على موعد مع الاتحاد والبث المباشر', icon: <Layers size={16} />, color: 'bg-emerald-500/10 text-emerald-600', desc: 'تحكم في ظهور الويدجت ومكانها في الصفحة الرئيسية' },
  welcome_links: { label: 'اختصارات اكتشف التطبيق', icon: <Layers size={16} />, color: 'bg-emerald-500/10 text-emerald-600', desc: 'تحكم في ظهور الويدجت ومكانها في الصفحة الرئيسية' },
  welcome_explore: { label: 'أكتر من مجرد ماتش', icon: <Layers size={16} />, color: 'bg-emerald-500/10 text-emerald-600', desc: 'تحكم في ظهور الويدجت ومكانها في الصفحة الرئيسية' },
  welcome_feed: { label: 'نبض النادي — عنوان الأقسام', icon: <Layers size={16} />, color: 'bg-emerald-500/10 text-emerald-600', desc: 'تحكم في ظهور الويدجت ومكانها في الصفحة الرئيسية' },
  hero: { 
    label: 'المباراة القادمة / الحية', 
    icon: <Flame size={16} />, 
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    desc: 'البطاقة الرئيسية للمباراة الحالية أو القادمة مع العداد والتشكيلة'
  },
  game: {
    label: 'لعبة اتحاداوي 🎮',
    icon: <Gamepad2 size={16} />,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    desc: 'ويدجت وبانر ترويجي للعبة اتحاداوي التفاعلية في شوارع الإسكندرية'
  },
  video: { 
    label: 'فيديو يوتيوب أو فيسبوك', 
    icon: <Tv size={16} />, 
    color: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    desc: 'تضمين فيديو يوتيوب أو فيسبوك مع مشغل تفاعلي وعناوين مخصصة'
  },
  matches: { 
    label: 'جدول المباريات والنتائج', 
    icon: <Calendar size={16} />, 
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    desc: 'عرض مواعيد مباريات كرة القدم والسلة القادمة'
  },
  news: { 
    label: 'شريط الأخبار الرسمية', 
    icon: <Newspaper size={16} />, 
    color: 'bg-green-500/10 text-green-600 border-green-500/20',
    desc: 'قائمة بأحدث أخبار وتقارير النادي'
  },
  media: { 
    label: 'ميديا وفيديوهات الاتحاد', 
    icon: <Video size={16} />, 
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    desc: 'معرض الصور والفيديوهات والملخصات الحصرية'
  },
  live: { 
    label: 'شريط البث المباشر', 
    icon: <Tv size={16} />, 
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    desc: 'يظهر تلقائياً عند وجود بث مباشر للمباريات'
  },
  city: { 
    label: 'طقس وتاريخ الإسكندرية', 
    icon: <MapPin size={16} />, 
    color: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    desc: 'بطاقة تفاعلية لحالة الطقس المباشر في الإسكندرية وتأثيرات بصرية'
  },
  club_members: { 
    label: 'بوابة الأعضاء والأنشطة', 
    icon: <ShieldCheck size={16} />, 
    color: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
    desc: 'خدمات العضوية، اللجان، الرحلات، والخصومات'
  },
  world_fans: { 
    label: 'رابطة اتحاداوية العالم', 
    icon: <Globe size={16} />, 
    color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    desc: 'خريطة ورابطة جماهير الاتحاد حول العالم للمغتربين'
  },
  business: { 
    label: 'اتحاداوي بيزنس (الدليل)', 
    icon: <Building2 size={16} />, 
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    desc: 'دليل الأنشطة والشركات التابعة لأعضاء وجماهير النادي'
  },
  ai_banner: { 
    label: 'استوديو الذكاء الاصطناعي (AI)', 
    icon: <Sparkles size={16} />, 
    color: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    desc: 'بانر تجربة التيشيرت الأخضر الافتراضي بالذكاء الاصطناعي'
  },
  tickets: { 
    label: 'تذاكر المباريات (Live)', 
    icon: <Ticket size={16} />, 
    color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    desc: 'ويدجت مباشر لحجز تذاكر المباريات عبر تذكرتي'
  },
  polls: { 
    label: 'استطلاعات وتوقعات الجماهير', 
    icon: <BarChart3 size={16} />, 
    color: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    desc: 'استفتاءات المشجعين وتوقعات نتائج المباريات'
  },
  history: { 
    label: 'تاريخ وعراقة زعيم الثغر', 
    icon: <HistoryIcon size={16} />, 
    color: 'bg-emerald-600/10 text-emerald-700 border-emerald-600/20',
    desc: 'سجل بطولات النادي وبطاقة الـ 100 عام من المجد'
  },
  ads: { 
    label: 'شريط الإعلانات والبانرات', 
    icon: <Megaphone size={16} />, 
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    desc: 'سلايدر البانرات الإعلانية الترويجية'
  },
  advertise: { 
    label: 'ويدجت أعلن معنا', 
    icon: <Megaphone size={16} />, 
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    desc: 'بطاقة دعوة الشركات للإعلان عبر التطبيق'
  },
  custom: { 
    label: 'مجتمع المشجعين (Fan Zone)', 
    icon: <Flame size={16} />, 
    color: 'bg-green-600/10 text-green-700 border-green-600/20',
    desc: 'بطاقة دعوة لدخول ساحة الجمهور والمنتديات'
  },
  widget: { 
    label: 'برمجية HTML مخصصة', 
    icon: <Code size={16} />, 
    color: 'bg-slate-500/10 text-slate-700 border-slate-500/20',
    desc: 'إدراج كود HTML / iFrame مخصص داخل الصفحة'
  },
  image: { 
    label: 'بانر صورة مخصص مع رابط', 
    icon: <ImageIcon size={16} />, 
    color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    desc: 'عرض صورة بانر مخصصة مع فتح رابط عند الضغط'
  },
  services: {
    label: 'خدمات الجمهور والتعليم المجاني',
    icon: <HeartHandshake size={16} />,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    desc: 'بطاقات الخدمات المجانية وفرص التدريب والتعليم لجمهور النادي'
  },
  public_services: {
    label: 'خدمات الجمهور والتعليم المجاني',
    icon: <HeartHandshake size={16} />,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    desc: 'بطاقات الخدمات المجانية وفرص التدريب والتعليم لجمهور النادي'
  }
};

export default function AdminHomeSectionsManager() {
  const { homeSections, setHomeSections } = useAppStore();
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // New section modal / form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSectionType, setNewSectionType] = useState<HomeSection['type']>('video');
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionSubtitle, setNewSectionSubtitle] = useState('');
  const [newSectionVideoUrl, setNewSectionVideoUrl] = useState('');
  const [newSectionAspectRatio, setNewSectionAspectRatio] = useState<'16/9' | '4/3' | '1/1' | '9/16'>('16/9');
  const [newSectionAutoplay, setNewSectionAutoplay] = useState(false);
  const [newSectionHtml, setNewSectionHtml] = useState('');
  const [newSectionImageUrl, setNewSectionImageUrl] = useState('');
  const [newSectionLink, setNewSectionLink] = useState('');
  const [newSectionSpacing, setNewSectionSpacing] = useState(20);
  const [newSectionBannerHeight, setNewSectionBannerHeight] = useState<number>(260);
  const [newSectionBannerSize, setNewSectionBannerSize] = useState<HomeSection['bannerSize']>('medium');
  const [newSectionImageFit, setNewSectionImageFit] = useState<HomeSection['imageFit']>('cover');
  const [newSectionBannerWidth, setNewSectionBannerWidth] = useState<HomeSection['bannerWidth']>('full');

  // Sync from store once mounted
  useEffect(() => {
    if (homeSections) {
      // Normalize and sort
      const sorted = resolveHomeSections(homeSections).sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (a.order ?? 0) - (b.order ?? 0);
      });
      setSections(sorted);
    } else {
      setSections(resolveHomeSections());
    }
  }, [homeSections]);

  // Normalize order sequential indices
  const normalizeAndSetSections = (newArr: HomeSection[], markDirty = true) => {
    const normalized = newArr.map((s, idx) => ({
      ...s,
      order: idx
    }));
    setSections(normalized);
    if (markDirty) {
      setHasUnsavedChanges(true);
    }
  };

  // Move section in list
  const handleMove = (index: number, direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (index < 0 || index >= sections.length) return;
    const newArr = [...sections];

    if (direction === 'up' && index > 0) {
      const temp = newArr[index];
      newArr[index] = newArr[index - 1];
      newArr[index - 1] = temp;
    } else if (direction === 'down' && index < newArr.length - 1) {
      const temp = newArr[index];
      newArr[index] = newArr[index + 1];
      newArr[index + 1] = temp;
    } else if (direction === 'top' && index > 0) {
      const [item] = newArr.splice(index, 1);
      newArr.unshift(item);
    } else if (direction === 'bottom' && index < newArr.length - 1) {
      const [item] = newArr.splice(index, 1);
      newArr.push(item);
    }

    normalizeAndSetSections(newArr);
  };

  // Toggle active state
  const handleToggleActive = (id: string) => {
    const updated = sections.map(s => {
      if (s.id === id) {
        return { ...s, active: !s.active };
      }
      return s;
    });
    normalizeAndSetSections(updated);
  };

  // Toggle pinned state
  const handleTogglePin = (id: string) => {
    const updated = sections.map(s => {
      if (s.id === id) {
        return { ...s, pinned: !s.pinned };
      }
      return s;
    });
    
    // Sort so pinned stay at top
    updated.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (a.order ?? 0) - (b.order ?? 0);
    });

    normalizeAndSetSections(updated);
  };

  // Duplicate section
  const handleDuplicate = (section: HomeSection) => {
    const copy: HomeSection = {
      ...section,
      id: `${section.type}_${uuidv4().slice(0, 8)}`,
      title: section.title ? `${section.title} (نسخة)` : 'نسخة جديدة',
      pinned: false
    };
    const newArr = [...sections, copy];
    normalizeAndSetSections(newArr);
    toast.success('تم إنشاء نسخة من الويدجت بنجاح');
  };

  // Delete section
  const handleDelete = (id: string, title?: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الويدجت "${title || id}" من الصفحة الرئيسية؟`)) {
      const filtered = WELCOME_SECTIONS.some(s => s.id === id)
        ? sections.map(s => s.id === id ? { ...s, active: false } : s)
        : sections.filter(s => s.id !== id);
      normalizeAndSetSections(filtered);
      toast.success('تم حذف الويدجت من القائمة');
    }
  };

  // Change spacing
  const handleSpacingChange = (id: string, delta: number) => {
    const updated = sections.map(s => {
      if (s.id === id) {
        const current = s.spacing ?? 20;
        const next = Math.max(0, Math.min(80, current + delta));
        return { ...s, spacing: next };
      }
      return s;
    });
    normalizeAndSetSections(updated);
  };

  // Save current edit modal
  const handleSaveEditModal = () => {
    if (!editingSection) return;
    const updated = sections.map(s => {
      if (s.id === editingSection.id) {
        return { ...editingSection };
      }
      return s;
    });
    normalizeAndSetSections(updated);
    setEditingSection(null);
    toast.success('تم تحديث إعدادات وتسمية الويدجت');
  };

  // Add new section
  const handleAddNewSection = () => {
    const defaultMeta = SECTION_METADATA[newSectionType];
    const newSec: HomeSection = {
      id: `${newSectionType}_${uuidv4().slice(0, 8)}`,
      type: newSectionType,
      title: newSectionTitle.trim() || defaultMeta?.label || 'ويدجت جديد',
      subtitle: newSectionSubtitle.trim() || undefined,
      active: true,
      order: sections.length,
      spacing: newSectionSpacing || 20,
      pinned: false,
      videoUrl: (newSectionType === 'video' || newSectionType === 'video_embed' || newSectionType === 'youtube' || newSectionType === 'facebook') 
        ? newSectionVideoUrl.trim() 
        : undefined,
      aspectRatio: newSectionAspectRatio,
      autoplay: newSectionAutoplay,
      htmlCode: newSectionType === 'widget' ? newSectionHtml : undefined,
      imageUrl: newSectionType === 'image' ? newSectionImageUrl : undefined,
      link: (newSectionType === 'image' || newSectionType === 'tickets') ? newSectionLink : undefined,
      bannerHeight: newSectionType === 'image' ? newSectionBannerHeight : undefined,
      bannerSize: newSectionType === 'image' ? newSectionBannerSize : undefined,
      imageFit: newSectionType === 'image' ? newSectionImageFit : undefined,
      bannerWidth: newSectionType === 'image' ? newSectionBannerWidth : undefined
    };

    const newArr = [...sections, newSec];
    normalizeAndSetSections(newArr);
    setIsAddingNew(false);
    setNewSectionTitle('');
    setNewSectionSubtitle('');
    setNewSectionVideoUrl('');
    setNewSectionHtml('');
    setNewSectionImageUrl('');
    setNewSectionLink('');
    setNewSectionAutoplay(false);
    setNewSectionBannerHeight(260);
    setNewSectionBannerSize('medium');
    setNewSectionImageFit('cover');
    setNewSectionBannerWidth('full');
    toast.success('تمت إضافة الويدجت بنجاح للقائمة');
  };

  // Reset to default layout
  const handleResetDefaults = () => {
    if (window.confirm('هل أنت متأكد من استعادة الترتيب والتسميات الافتراضية لقسم الصفحة الرئيسية؟')) {
      normalizeAndSetSections(resolveHomeSections());
      toast.success('تمت استعادة التخطيط الافتراضي');
    }
  };

  // Save changes to Firestore
  const handleSaveAllToCloud = async () => {
    setIsSaving(true);
    try {
      // Clean sections for firestore
      const cleanSections = sections.map((s, index) => ({
        id: s.id,
        type: s.type,
        title: s.title || '',
        active: s.active !== false,
        order: index,
        pinned: !!s.pinned,
        spacing: typeof s.spacing === 'number' ? s.spacing : 20,
        ...(s.subtitle ? { subtitle: s.subtitle } : {}),
        ...(s.videoUrl ? { videoUrl: s.videoUrl } : {}),
        ...(s.videoType ? { videoType: s.videoType } : {}),
        ...(s.aspectRatio ? { aspectRatio: s.aspectRatio } : {}),
        ...(typeof s.autoplay === 'boolean' ? { autoplay: s.autoplay } : {}),
        ...(s.htmlCode ? { htmlCode: s.htmlCode } : {}),
        ...(s.imageUrl ? { imageUrl: s.imageUrl } : {}),
        ...(s.link ? { link: s.link } : {}),
        ...(typeof s.bannerHeight === 'number' ? { bannerHeight: s.bannerHeight } : {}),
        ...(s.bannerSize ? { bannerSize: s.bannerSize } : {}),
        ...(s.imageFit ? { imageFit: s.imageFit } : {}),
        ...(s.bannerWidth ? { bannerWidth: s.bannerWidth } : {})
      }));

      // 1. Save directly to settings/homeLayout
      await setDoc(doc(db, 'settings', 'homeLayout'), {
        sections: cleanSections,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.email || 'admin'
      });

      // 2. Update local app store
      setHomeSections(cleanSections as any);

      // 3. Log to audit_logs
      try {
        await addDoc(collection(db, 'audit_logs'), {
          adminEmail: auth.currentUser?.email || 'admin@ittihad.club',
          action: 'تعديل تنظيم وترتيب ويدجات الصفحة الرئيسية',
          category: 'layout',
          details: `تم حفظ وإعادة ترتيب ${cleanSections.length} ويدجت بنجاح (بما في ذلك ويدجات الفيديو).`,
          timestamp: new Date().toISOString(),
          createdAt: serverTimestamp()
        });
      } catch (logErr) {
        console.warn('Audit log write error:', logErr);
      }

      setHasUnsavedChanges(false);
      toast.success('تم حفظ ترتيب وتسميات ويدجات الصفحة الرئيسية بنجاح في السحابة! 🚀');
    } catch (err: any) {
      console.error('Error saving home layout:', err);
      toast.error('فشل في حفظ التغييرات: ' + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header & Action Bar */}
      <div className="ds-content-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-card-dark p-5 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="ds-content-heading text-xl font-bold text-slate-800 dark:text-white uppercase italic tracking-tight flex items-center gap-2">
              <Sliders size={20} className="text-primary" />
              إدارة وترتيب ويدجات الصفحة الرئيسية
            </h2>
            {hasUnsavedChanges && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse">
                تغييرات غير محفوظة
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-bold mt-1">
            تحكم كامل في ترتيب، تسميات، فيديوهات اليوتيوب والفيسبوك، وظهور جميع أقسام التطبيق
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Reset to defaults */}
          <button
            onClick={handleResetDefaults}
            className="ds-control p-2.5 bg-slate-100 dark:bg-surface-dark text-slate-600 dark:text-slate-300 hover:text-primary rounded-lg border border-slate-200 dark:border-border-dark text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="استعادة الترتيب الافتراضي"
          >
            <RotateCcw size={15} />
            <span className="hidden md:inline">استعادة الافتراضي</span>
          </button>

          {/* Add new widget */}
          <button
            onClick={() => {
              setNewSectionType('video');
              setNewSectionTitle('فيديو مميز 🎥');
              setIsAddingNew(true);
            }}
            className="ds-control px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus size={16} />
            <span>إضافة ويدجت جديد</span>
          </button>

          {/* Save All */}
          <button
            onClick={handleSaveAllToCloud}
            disabled={isSaving}
            className={`ds-control px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
              hasUnsavedChanges 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25 ring-2 ring-emerald-400' 
                : 'bg-primary hover:bg-primary-dark text-white shadow-primary/20'
            }`}
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>حفظ الترتيب في السحابة</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Notice Banner */}
      <div className="flex items-center gap-3 p-4 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-800 dark:text-blue-300 text-xs font-bold">
        <Info size={18} className="shrink-0 text-blue-500" />
        <p>
          💡 <strong>إضافة فيديو يوتيوب أو فيسبوك:</strong> اضغط على <strong>"إضافة ويدجت جديد"</strong> واختر <strong>"فيديو يوتيوب أو فيسبوك"</strong> وضع رابط الفيديو مباشرة (يدعم جميع صيغ روابط YouTube و Facebook Watch) ليظهر بمشغل احترافي في الصفحة الرئيسية.
        </p>
      </div>

      {/* Sections List */}
      <div className="ds-content-card bg-white dark:bg-card-dark rounded-xl p-4 sm:p-6 border border-border-light dark:border-border-dark shadow-sm space-y-3">
        {sections.map((section, index) => {
          const meta = SECTION_METADATA[section.type] || {
            label: section.type === 'video' ? 'فيديو يوتيوب / فيسبوك' : section.type,
            icon: section.type === 'video' ? <Tv size={16} /> : <Layers size={16} />,
            color: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
            desc: 'ويدجت مخصص'
          };

          const isVideoWidget = section.type === 'video' || section.type === 'video_embed' || section.type === 'youtube' || section.type === 'facebook';

          return (
            <div
              key={section.id}
              className={`ds-content-card flex flex-col gap-3 p-4 rounded-lg border transition-all ${
                section.active !== false
                  ? 'bg-slate-50/80 dark:bg-surface-dark border-slate-200/80 dark:border-border-dark shadow-sm'
                  : 'bg-slate-100/40 dark:bg-slate-900/30 opacity-60 border-dashed border-slate-300 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                
                {/* Reorder Buttons & Position Badge */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="ds-content-card flex items-center bg-white dark:bg-card-dark p-1 rounded-xl shadow-sm border border-border-light dark:border-border-dark">
                    <button
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      className="ds-control p-1.5 text-slate-400 hover:text-primary disabled:opacity-20 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="تحريك لأعلى خطوة واحدة"
                    >
                      <MoveUp size={15} />
                    </button>
                    <button
                      disabled={index === sections.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className="ds-control p-1.5 text-slate-400 hover:text-primary disabled:opacity-20 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="تحريك لأسفل خطوة واحدة"
                    >
                      <MoveDown size={15} />
                    </button>
                  </div>

                  <span className="w-7 h-7 rounded-xl bg-slate-200/70 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">
                    {index + 1}
                  </span>
                </div>

                {/* Section Info & Type Badge */}
                <div className="flex-1 min-w-[200px] flex flex-col justify-center">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[12px] font-bold border ${meta.color}`}>
                      {meta.icon}
                      {meta.label}
                    </span>

                    {isVideoWidget && section.videoUrl && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${
                        isYouTubeUrl(section.videoUrl)
                          ? 'bg-red-500/10 text-red-600 border-red-500/20'
                          : isFacebookUrl(section.videoUrl)
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      }`}>
                        {isYouTubeUrl(section.videoUrl) ? '🔴 YouTube' : isFacebookUrl(section.videoUrl) ? '🔵 Facebook' : '🎬 Video'}
                      </span>
                    )}

                    {section.type === 'image' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                        <Sliders size={10} />
                        ارتفاع البانر: {section.bannerHeight === 0 || section.bannerSize === 'max' ? 'أقصى حد (طبيعي كامل)' : `${section.bannerHeight || 400}px`}
                      </span>
                    )}
                    
                    {section.pinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <Pin size={10} className="fill-current" />
                        مثبت بالأعلى
                      </span>
                    )}

                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                      {section.title || meta.label}
                    </h4>
                  </div>
                  <p className="text-[12px] text-slate-400 font-medium mt-0.5 line-clamp-1">
                    {isVideoWidget && section.videoUrl ? (
                      <span className="font-mono text-slate-500 dark:text-slate-400 dir-ltr inline-block">
                        {section.videoUrl}
                      </span>
                    ) : (
                      meta.desc
                    )}
                  </p>
                </div>

                {/* Quick Visibility Switch */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                    {section.active !== false ? 'مفعل' : 'مخفي'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={section.active !== false} 
                      onChange={() => handleToggleActive(section.id)}
                      className="ds-form-control sr-only peer" 
                    />
                    <div className="ds-content-card w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>

              </div>

              {/* Bottom Actions Tool bar */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/60 dark:border-border-dark/60 text-xs">
                
                {/* Left Action Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Pin to top */}
                  <button
                    onClick={() => handleTogglePin(section.id)}
                    className={`ds-control p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                      section.pinned
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-white dark:bg-card-dark text-slate-400 hover:text-amber-500 border-border-light dark:border-border-dark'
                    }`}
                    title="تثبيت القسم في أعلى الصفحة"
                  >
                    <Pin size={13} className={section.pinned ? 'fill-current' : ''} />
                    <span className="text-[12px] hidden md:inline">{section.pinned ? 'مثبت' : 'تثبيت'}</span>
                  </button>

                  {/* Edit Name & Settings */}
                  <button
                    onClick={() => setEditingSection({ ...section })}
                    className="ds-control p-2 bg-white dark:bg-card-dark text-slate-600 dark:text-slate-300 hover:text-primary rounded-xl border border-border-light dark:border-border-dark flex items-center gap-1 transition-colors shadow-sm"
                    title="تعديل العنوان وتفاصيل الويدجت"
                  >
                    <Edit3 size={13} className="text-primary" />
                    <span className="text-[12px] font-bold">تعديل الإعدادات والفيديو</span>
                  </button>

                  {/* Copy section */}
                  <button
                    onClick={() => handleDuplicate(section)}
                    className="ds-control p-2 bg-white dark:bg-card-dark text-slate-400 hover:text-blue-500 rounded-xl border border-border-light dark:border-border-dark transition-colors shadow-sm"
                    title="نسخ ومضاعفة هذا الويدجت"
                  >
                    <Copy size={13} />
                  </button>

                  {/* Quick move to Top / Bottom */}
                  <button
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'top')}
                    className="ds-control p-2 bg-white dark:bg-card-dark text-slate-400 hover:text-primary disabled:opacity-20 rounded-xl border border-border-light dark:border-border-dark transition-colors shadow-sm"
                    title="نقل لأعلى القائمة مباشرة"
                  >
                    <ArrowUpToLine size={13} />
                  </button>
                  <button
                    disabled={index === sections.length - 1}
                    onClick={() => handleMove(index, 'bottom')}
                    className="ds-control p-2 bg-white dark:bg-card-dark text-slate-400 hover:text-primary disabled:opacity-20 rounded-xl border border-border-light dark:border-border-dark transition-colors shadow-sm"
                    title="نقل لأسفل القائمة مباشرة"
                  >
                    <ArrowDownToLine size={13} />
                  </button>
                </div>

                {/* Right Controls: Spacing & Delete */}
                <div className="flex items-center gap-2">
                  
                  {/* Spacing Control */}
                  <div className="ds-content-card flex items-center gap-1 bg-white dark:bg-card-dark px-2 py-1 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                    <span className="text-[11px] font-bold text-slate-400 ml-1">المسافة:</span>
                    <button
                      onClick={() => handleSpacingChange(section.id, -4)}
                      className="ds-control p-1 text-slate-400 hover:text-primary"
                      title="تقليل المسافة السفلية"
                    >
                      -
                    </button>
                    <span className="text-[12px] font-bold min-w-[28px] text-center font-mono text-primary">
                      {section.spacing ?? 20}px
                    </span>
                    <button
                      onClick={() => handleSpacingChange(section.id, 4)}
                      className="ds-control p-1 text-slate-400 hover:text-primary"
                      title="زيادة المسافة السفلية"
                    >
                      +
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(section.id, section.title)}
                    className="ds-control p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl border border-rose-200 dark:border-rose-500/20 transition-all shadow-sm"
                    title="حذف هذا الويدجت"
                  >
                    <Trash2 size={13} />
                  </button>

                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Widget Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="ds-content-card bg-white dark:bg-card-dark w-full max-w-lg rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark space-y-5 animate-scale-up">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-border-dark">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="ds-content-heading text-base font-bold text-slate-800 dark:text-white">
                    تعديل إعدادات وخصائص الويدجت
                  </h3>
                  <p className="text-[12px] text-slate-400 font-bold">
                    نوع الويدجت: {SECTION_METADATA[editingSection.type]?.label || editingSection.type}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingSection(null)}
                className="ds-control p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              
              {/* Title / Name input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  العنوان الظاهر للمستخدم (التسمية) *
                </label>
                <input
                  type="text"
                  value={editingSection.title || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  placeholder="أدخل عنواناً مخصصاً يظهر أعلى الويدجت..."
                  className="ds-form-control w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark text-xs font-bold"
                />
              </div>

              {/* Subtitle input (for video) */}
              {(editingSection.type === 'video' || editingSection.type === 'video_embed') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    النص الفرعي / الوصف القصير (اختياري)
                  </label>
                  <input
                    type="text"
                    value={editingSection.subtitle || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, subtitle: e.target.value })}
                    placeholder="مثال: ملخص وأهداف مباراة الأمس بصوت المعلق..."
                    className="ds-form-control w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark text-xs font-bold"
                  />
                </div>
              )}

              {/* Video URL input (for video widget) */}
              {(editingSection.type === 'video' || editingSection.type === 'video_embed' || editingSection.type === 'youtube' || editingSection.type === 'facebook') && (
                <div className="ds-content-card space-y-3 p-3.5 bg-slate-50 dark:bg-surface-dark rounded-lg border border-slate-200 dark:border-border-dark">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Tv size={14} className="text-primary" />
                        <span>رابط فيديو يوتيوب أو فيسبوك (Video URL) *</span>
                      </label>
                      {editingSection.videoUrl && (
                        <span className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${
                          isYouTubeUrl(editingSection.videoUrl)
                            ? 'bg-red-500/10 text-red-600'
                            : isFacebookUrl(editingSection.videoUrl)
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'bg-emerald-500/10 text-emerald-600'
                        }`}>
                          {isYouTubeUrl(editingSection.videoUrl) ? '🔴 YouTube detected' : isFacebookUrl(editingSection.videoUrl) ? '🔵 Facebook detected' : '🎬 Direct Video'}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={editingSection.videoUrl || ''}
                      onChange={(e) => setEditingSection({ ...editingSection, videoUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=... أو https://www.facebook.com/.../videos/..."
                      className="ds-form-control w-full p-3 rounded-xl border border-border-light bg-white dark:bg-card-dark text-xs font-mono text-left dir-ltr"
                    />
                    <p className="text-[12px] text-slate-400 font-medium">
                      يدعم روابط اليوتيوب العادية والمختصرة (youtu.be) وروابط الفيسبوك (fb.watch / videos).
                    </p>
                  </div>

                  {/* Aspect ratio */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        أبعاد المشغل (Aspect Ratio)
                      </label>
                      <select
                        value={editingSection.aspectRatio || '16/9'}
                        onChange={(e) => setEditingSection({ ...editingSection, aspectRatio: e.target.value as any })}
                        className="ds-form-control w-full p-2.5 rounded-xl border border-border-light bg-white dark:bg-card-dark text-xs font-bold"
                      >
                        <option value="16/9">شاشة عريضة (16:9 - قياسي)</option>
                        <option value="4/3">شاشة كلاسيكية (4:3)</option>
                        <option value="1/1">مربع (1:1 - إنستغرام)</option>
                        <option value="9/16">عمودي (9:16 - شورتس / ريلز)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 flex flex-col justify-end">
                      <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-card-dark border border-border-light dark:border-border-dark cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!editingSection.autoplay}
                          onChange={(e) => setEditingSection({ ...editingSection, autoplay: e.target.checked })}
                          className="ds-form-control rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          تشغيل تلقائي (Autoplay)
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Live Mini Preview */}
                  {editingSection.videoUrl && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-border-dark">
                      <p className="text-[12px] font-bold text-slate-500 mb-1.5">معاينة المشغل:</p>
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-800">
                        {isYouTubeUrl(editingSection.videoUrl) ? (
                          <iframe
                            src={getYouTubeEmbedUrl(editingSection.videoUrl, false)}
                            className="w-full h-full"
                            title="Preview"
                            allowFullScreen
                          />
                        ) : isFacebookUrl(editingSection.videoUrl) ? (
                          <iframe
                            src={getFacebookEmbedUrl(editingSection.videoUrl, false)}
                            className="w-full h-full"
                            title="Preview"
                            allowFullScreen
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-white">
                            <span>فيديو: {editingSection.videoUrl}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Spacing input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  المسافة السفلية بالبكسل (Spacing): {editingSection.spacing ?? 20}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="64"
                  step="4"
                  value={editingSection.spacing ?? 20}
                  onChange={(e) => setEditingSection({ ...editingSection, spacing: parseInt(e.target.value) })}
                  className="ds-form-control w-full accent-primary"
                />
              </div>

              {/* HTML Code input (if type is widget) */}
              {editingSection.type === 'widget' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    كود الـ HTML / iFrame المخصص *
                  </label>
                  <textarea
                    rows={5}
                    value={editingSection.htmlCode || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, htmlCode: e.target.value })}
                    placeholder="<div className='custom-widget'>...</div>"
                    className="ds-form-control w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark text-xs font-mono dir-ltr"
                  />
                </div>
              )}

              {/* Image URL & Controls (if image banner) */}
              {editingSection.type === 'image' && (
                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        رابط الصورة (Image URL) *
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditingSection({ ...editingSection, imageUrl: '/nada_ad.png' })}
                        className="ds-control text-[12px] font-bold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/20 transition-colors"
                      >
                        بانر نادي الاتحاد المرفوع (/nada_ad.png) 🖼️
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editingSection.imageUrl || ''}
                      onChange={(e) => setEditingSection({ ...editingSection, imageUrl: e.target.value })}
                      placeholder="https://example.com/banner.jpg أو /nada_ad.png"
                      className="ds-form-control w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark text-xs font-bold text-left dir-ltr"
                    />
                  </div>

                  {/* Target Link input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      الرابط الموجه عند الضغط (Link URL)
                    </label>
                    <input
                      type="text"
                      value={editingSection.link || ''}
                      onChange={(e) => setEditingSection({ ...editingSection, link: e.target.value })}
                      placeholder="https://example.com/promo..."
                      className="ds-form-control w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark text-xs font-bold text-left dir-ltr"
                    />
                  </div>

                  {/* Comprehensive Ad Size & Scale Controller */}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-rose-500/5 via-pink-500/5 to-amber-500/5 border border-rose-500/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
                          <Sliders size={15} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                            التحكم في حجم الإعلان (تصغير وتكبير لأقصى حد)
                          </h4>
                          <p className="text-[12px] text-slate-400 font-medium">
                            يمكنك اختيار حجم سريع أو ضبط الارتفاع بالبكسل حتى أقصى حد بدون اقتصاص
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-rose-500 text-white font-mono shadow-xs">
                        {editingSection.bannerHeight === 0 || editingSection.bannerSize === 'max'
                          ? 'أقصى حد (طبيعي كامل)'
                          : `${editingSection.bannerHeight ?? 260}px`}
                      </span>
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        أحجام سريعة جاهزة:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingSection({ ...editingSection, bannerHeight: 80, bannerSize: 'compact' })}
                          className={`ds-control px-2 py-2 rounded-xl text-[12px] font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                            editingSection.bannerHeight === 80
                              ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                              : 'bg-white dark:bg-card-dark text-slate-600 dark:text-slate-300 border-slate-200 dark:border-border-dark hover:border-rose-400'
                          }`}
                        >
                          <Minimize2 size={13} />
                          <span>شريط رفيع (80px)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingSection({ ...editingSection, bannerHeight: 160, bannerSize: 'small' })}
                          className={`ds-control px-2 py-2 rounded-xl text-[12px] font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                            editingSection.bannerHeight === 160
                              ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                              : 'bg-white dark:bg-card-dark text-slate-600 dark:text-slate-300 border-slate-200 dark:border-border-dark hover:border-rose-400'
                          }`}
                        >
                          <ZoomOut size={13} />
                          <span>صغير (160px)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingSection({ ...editingSection, bannerHeight: 260, bannerSize: 'medium' })}
                          className={`ds-control px-2 py-2 rounded-xl text-[12px] font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                            (editingSection.bannerHeight === 260 || (!editingSection.bannerHeight && editingSection.bannerSize !== 'max'))
                              ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                              : 'bg-white dark:bg-card-dark text-slate-600 dark:text-slate-300 border-slate-200 dark:border-border-dark hover:border-rose-400'
                          }`}
                        >
                          <Sliders size={13} />
                          <span>متوسط (260px)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingSection({ ...editingSection, bannerHeight: 420, bannerSize: 'large' })}
                          className={`ds-control px-2 py-2 rounded-xl text-[12px] font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                            editingSection.bannerHeight === 420
                              ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                              : 'bg-white dark:bg-card-dark text-slate-600 dark:text-slate-300 border-slate-200 dark:border-border-dark hover:border-rose-400'
                          }`}
                        >
                          <ZoomIn size={13} />
                          <span>كبير (420px)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingSection({ ...editingSection, bannerHeight: 0, bannerSize: 'max' })}
                          className={`ds-control col-span-2 sm:col-span-1 px-2 py-2 rounded-xl text-[12px] font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                            editingSection.bannerHeight === 0 || editingSection.bannerSize === 'max'
                              ? 'bg-rose-600 text-white border-rose-700 shadow-sm ring-1 ring-rose-400'
                              : 'bg-white dark:bg-card-dark text-slate-600 dark:text-slate-300 border-slate-200 dark:border-border-dark hover:border-rose-400'
                          }`}
                        >
                          <Maximize2 size={13} />
                          <span>أقصى حد (طبيعي)</span>
                        </button>
                      </div>
                    </div>

                    {/* Fine Tuning Slider & Buttons */}
                    <div className="ds-content-card space-y-2 bg-white dark:bg-card-dark p-3 rounded-xl border border-slate-200/70 dark:border-border-dark">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>التحكم الدقيق بالارتفاع (من 60px حتى 1000px):</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const curr = (editingSection.bannerHeight === 0 || editingSection.bannerSize === 'max') ? 400 : (editingSection.bannerHeight || 260);
                              const next = Math.max(60, curr - 20);
                              setEditingSection({ ...editingSection, bannerHeight: next, bannerSize: 'custom' });
                            }}
                            className="ds-control w-7 h-7 rounded-lg bg-slate-100 dark:bg-surface-dark hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-200"
                            title="تصغير بمقدار 20 بكسل"
                          >
                            -20
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const curr = (editingSection.bannerHeight === 0 || editingSection.bannerSize === 'max') ? 400 : (editingSection.bannerHeight || 260);
                              const next = Math.min(1000, curr + 20);
                              setEditingSection({ ...editingSection, bannerHeight: next, bannerSize: 'custom' });
                            }}
                            className="ds-control w-7 h-7 rounded-lg bg-slate-100 dark:bg-surface-dark hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-200"
                            title="تكبير بمقدار 20 بكسل"
                          >
                            +20
                          </button>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="60"
                        max="1000"
                        step="10"
                        value={(editingSection.bannerHeight === 0 || editingSection.bannerSize === 'max') ? 1000 : (editingSection.bannerHeight ?? 260)}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setEditingSection({
                            ...editingSection,
                            bannerHeight: val >= 1000 ? 0 : val,
                            bannerSize: val >= 1000 ? 'max' : 'custom'
                          });
                        }}
                        className="ds-form-control w-full accent-rose-500 cursor-pointer"
                      />

                      <div className="flex items-center justify-between text-[12px] text-slate-400 font-mono font-bold">
                        <span>أصغر حد (60px)</span>
                        <span>متوسط (260px)</span>
                        <span>كبير (500px)</span>
                        <span>أقصى حد (1000px / طبيعي كامل)</span>
                      </div>
                    </div>

                    {/* Image Fit & Width Layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          طريقة ملاءمة الصورة (Fit):
                        </label>
                        <select
                          value={editingSection.imageFit || 'cover'}
                          onChange={(e) => setEditingSection({ ...editingSection, imageFit: e.target.value as any })}
                          className="ds-form-control w-full p-2.5 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark text-xs font-bold"
                        >
                          <option value="cover">ملء وتغطية الإطار بالكامل (Cover)</option>
                          <option value="contain">احتواء كامل بدون أي قص (Contain)</option>
                          <option value="auto">الحجم المتجاوب التلقائي (Auto)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          عرض الإعلان في الصفحة:
                        </label>
                        <select
                          value={editingSection.bannerWidth || 'full'}
                          onChange={(e) => setEditingSection({ ...editingSection, bannerWidth: e.target.value as any })}
                          className="ds-form-control w-full p-2.5 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark text-xs font-bold"
                        >
                          <option value="full">عرض كامل (100% Full Width)</option>
                          <option value="medium">عرض متوسط ممركز (80%)</option>
                          <option value="compact">مدمج صغير في المنتصف (60%)</option>
                        </select>
                      </div>
                    </div>

                    {/* Live Preview Box */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <Eye size={12} className="text-rose-500" />
                          معاينة حية لشكل وحجم الإعلان في الصفحة:
                        </label>
                        <span className="text-[11px] text-slate-400 font-bold">
                          {editingSection.bannerHeight === 0 || editingSection.bannerSize === 'max'
                            ? 'معاينة بالحجم الكامل بدون أي اقتصاص'
                            : `محدد بارتفاع أقصى ${editingSection.bannerHeight ?? 260}px`}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-900/5 dark:bg-black/30 rounded-lg border border-slate-200 dark:border-border-dark flex items-center justify-center overflow-hidden">
                        <div
                          className={`ds-content-card relative overflow-hidden rounded-xl border border-slate-300/60 dark:border-slate-700 bg-white dark:bg-card-dark shadow-sm transition-all duration-300 ${
                            editingSection.bannerWidth === 'compact'
                              ? 'w-3/5'
                              : editingSection.bannerWidth === 'medium'
                                ? 'w-4/5'
                                : 'w-full'
                          }`}
                          style={{
                            maxHeight: (editingSection.bannerHeight === 0 || editingSection.bannerSize === 'max')
                              ? 'none'
                              : `${Math.min(380, editingSection.bannerHeight ?? 260)}px`
                          }}
                        >
                          <img
                            src={editingSection.imageUrl || '/nada_ad.png'}
                            alt="معاينة الإعلان"
                            style={{
                              maxHeight: (editingSection.bannerHeight === 0 || editingSection.bannerSize === 'max')
                                ? 'none'
                                : `${Math.min(380, editingSection.bannerHeight ?? 260)}px`
                            }}
                            className={`w-full h-auto transition-all ${
                              editingSection.imageFit === 'contain'
                                ? 'object-contain bg-slate-900/5 dark:bg-black/40'
                                : editingSection.imageFit === 'auto'
                                  ? 'object-scale-down'
                                  : 'object-cover'
                            }`}
                          />
                          {editingSection.title && (
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                              <span className="text-white text-[11px] font-bold">{editingSection.title}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Target Link input (for tickets only when not image) */}
              {editingSection.type === 'tickets' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    الرابط الموجه عند الضغط (Link URL)
                  </label>
                  <input
                    type="text"
                    value={editingSection.link || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, link: e.target.value })}
                    placeholder="https://tazkarti.com/..."
                    className="ds-form-control w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark text-xs font-bold text-left dir-ltr"
                  />
                </div>
              )}

              {/* Pinning checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="edit-pinned-toggle"
                  checked={!!editingSection.pinned}
                  onChange={(e) => setEditingSection({ ...editingSection, pinned: e.target.checked })}
                  className="ds-form-control rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="edit-pinned-toggle" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  تثبيت هذا الويدجت دائماً في أعلى الصفحة (Pinned)
                </label>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-border-dark">
              <button
                onClick={() => setEditingSection(null)}
                className="ds-control px-4 py-2.5 rounded-xl border border-slate-200 dark:border-border-dark text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-dark"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveEditModal}
                className="ds-control px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Check size={16} />
                تطبيق التعديلات
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add New Widget Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="ds-content-card bg-white dark:bg-card-dark w-full max-w-lg rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark space-y-5 animate-scale-up">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-border-dark">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="ds-content-heading text-base font-bold text-slate-800 dark:text-white">
                    إضافة ويدجت جديد للصفحة الرئيسية
                  </h3>
                  <p className="text-[12px] text-slate-400 font-bold">
                    اختر نوع الويدجت وحدد العنوان والخصائص
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddingNew(false)}
                className="ds-control p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              
              {/* Type selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  نوع الويدجت *
                </label>
                <select
                  value={newSectionType}
                  onChange={(e) => {
                    const t = e.target.value as HomeSection['type'];
                    setNewSectionType(t);
                    if (!newSectionTitle || newSectionTitle === SECTION_METADATA[newSectionType]?.label) {
                      setNewSectionTitle(SECTION_METADATA[t]?.label || '');
                    }
                  }}
                  className="ds-form-control w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark text-xs font-bold"
                >
                  {Object.entries(SECTION_METADATA).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label} ({key})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  العنوان المخصص (اختياري)
                </label>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder={SECTION_METADATA[newSectionType]?.label || 'أدخل عنواناً...'}
                  className="ds-form-control w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark text-xs font-bold"
                />
              </div>

              {/* Video Specific fields */}
              {(newSectionType === 'video' || newSectionType === 'video_embed' || newSectionType === 'youtube' || newSectionType === 'facebook') && (
                <div className="ds-content-card space-y-3 p-3.5 bg-slate-50 dark:bg-surface-dark rounded-lg border border-slate-200 dark:border-border-dark">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Tv size={14} className="text-primary" />
                        <span>رابط فيديو يوتيوب أو فيسبوك *</span>
                      </label>
                      {newSectionVideoUrl && (
                        <span className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${
                          isYouTubeUrl(newSectionVideoUrl)
                            ? 'bg-red-500/10 text-red-600'
                            : isFacebookUrl(newSectionVideoUrl)
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'bg-emerald-500/10 text-emerald-600'
                        }`}>
                          {isYouTubeUrl(newSectionVideoUrl) ? '🔴 YouTube detected' : isFacebookUrl(newSectionVideoUrl) ? '🔵 Facebook detected' : '🎬 Direct Video'}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={newSectionVideoUrl}
                      onChange={(e) => setNewSectionVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... أو https://facebook.com/.../videos/..."
                      className="ds-form-control w-full p-3 rounded-xl border border-border-light bg-white dark:bg-card-dark text-xs font-mono text-left dir-ltr"
                    />
                    <p className="text-[12px] text-slate-400 font-medium">
                      يمكنك لصق رابط يوتيوب مباشر أو شورتس، أو رابط فيديو فيسبوك Watch.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      الوصف / النص الفرعي (اختياري)
                    </label>
                    <input
                      type="text"
                      value={newSectionSubtitle}
                      onChange={(e) => setNewSectionSubtitle(e.target.value)}
                      placeholder="مثال: شاهد ملخص المباراة وأبرز اللقطات..."
                      className="ds-form-control w-full p-3 rounded-xl border border-border-light bg-white dark:bg-card-dark text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        أبعاد المشغل
                      </label>
                      <select
                        value={newSectionAspectRatio}
                        onChange={(e) => setNewSectionAspectRatio(e.target.value as any)}
                        className="ds-form-control w-full p-2.5 rounded-xl border border-border-light bg-white dark:bg-card-dark text-xs font-bold"
                      >
                        <option value="16/9">شاشة عريضة (16:9)</option>
                        <option value="4/3">شاشة كلاسيكية (4:3)</option>
                        <option value="1/1">مربع (1:1)</option>
                        <option value="9/16">عمودي (9:16)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 flex flex-col justify-end">
                      <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-card-dark border border-border-light dark:border-border-dark cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newSectionAutoplay}
                          onChange={(e) => setNewSectionAutoplay(e.target.checked)}
                          className="ds-form-control rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          تشغيل تلقائي
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* HTML Code for widget */}
              {newSectionType === 'widget' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    كود HTML الويدجت *
                  </label>
                  <textarea
                    rows={4}
                    value={newSectionHtml}
                    onChange={(e) => setNewSectionHtml(e.target.value)}
                    placeholder="<div className='my-widget'>...</div>"
                    className="ds-form-control w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark text-xs font-mono dir-ltr"
                  />
                </div>
              )}

              {/* Image URL for image banner */}
              {newSectionType === 'image' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    رابط الصورة *
                  </label>
                  <input
                    type="text"
                    value={newSectionImageUrl}
                    onChange={(e) => setNewSectionImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="ds-form-control w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark text-xs font-bold text-left dir-ltr"
                  />
                </div>
              )}

              {/* Target Link for image & tickets */}
              {(newSectionType === 'image' || newSectionType === 'tickets') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    الرابط عند الضغط (اختياري)
                  </label>
                  <input
                    type="text"
                    value={newSectionLink}
                    onChange={(e) => setNewSectionLink(e.target.value)}
                    placeholder="https://..."
                    className="ds-form-control w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark text-xs font-bold text-left dir-ltr"
                  />
                </div>
              )}

              {/* Spacing */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  المسافة السفلية بالبكسل: {newSectionSpacing}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="64"
                  step="4"
                  value={newSectionSpacing}
                  onChange={(e) => setNewSectionSpacing(parseInt(e.target.value))}
                  className="ds-form-control w-full accent-primary"
                />
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-border-dark">
              <button
                onClick={() => setIsAddingNew(false)}
                className="ds-control px-4 py-2.5 rounded-xl border border-slate-200 dark:border-border-dark text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-dark"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddNewSection}
                className="ds-control px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Plus size={16} />
                إضافة للقائمة
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

