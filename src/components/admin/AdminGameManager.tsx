import React, { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, 
  Download, 
  Upload, 
  RefreshCw, 
  RotateCcw, 
  Trash2, 
  FileArchive, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  FileText, 
  Code, 
  Music, 
  Image as ImageIcon, 
  Type, 
  ShieldCheck, 
  Sparkles, 
  Search, 
  Copy, 
  Check, 
  Layers, 
  FolderArchive,
  ArrowDownToLine,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { auth } from '../../lib/firebase';
import JSZip from 'jszip';

// Static hosts may return index.html with status 200 for missing API routes.
async function readGameResponse(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  if (res.status === 413) {
    throw new Error('حجم الملف أكبر من الحد المسموح على الاستضافة.');
  }
  if (!contentType.includes('application/json')) {
    throw new Error('خدمة إدارة اللعبة غير متصلة على هذه الاستضافة. تعذر تنفيذ العملية؛ لم يتم تأكيد أي تحديث للعبة.');
  }
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('وصل رد غير صالح من خدمة إدارة اللعبة. أعد المحاولة لاحقاً.');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('وصل رد غير صالح من خدمة إدارة اللعبة.');
  }
  if (!res.ok || data.success !== true) {
    throw new Error(typeof data.error === 'string' ? data.error : 'تعذر تنفيذ العملية على خادم اللعبة.');
  }
  return data;
}

interface GameFileInfo {
  path: string;
  size: number;
  formattedSize: string;
  type: 'html' | 'js' | 'css' | 'audio' | 'image' | 'font' | 'other';
  lastModified: string;
}

interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  formattedSize: string;
  createdAt: string;
}

interface GameData {
  exists: boolean;
  gameDir: string;
  fileCount: number;
  totalSize: number;
  formattedSize: string;
  lastModified: string;
  files: GameFileInfo[];
  backups: BackupInfo[];
}

export default function AdminGameManager() {
  const [activeSubTab, setActiveSubTab] = useState<'download' | 'upload' | 'backups' | 'ai-guide'>('download');
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [serviceError, setServiceError] = useState('');
  
  // Download states
  const [downloading, setDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Upload states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [zipInspecting, setZipInspecting] = useState(false);
  const [zipContents, setZipContents] = useState<string[]>([]);
  const [zipHasIndex, setZipHasIndex] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Backup states
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackupId, setRestoringBackupId] = useState<string | null>(null);
  const [deletingBackupId, setDeletingBackupId] = useState<string | null>(null);

  // Copy prompt state
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Game Metadata from Server
  const fetchGameInfo = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/game/info', { headers });
      const data = await readGameResponse(res);
      if (data.success) {
        setGameData(data);
        setServiceError('');
      }
    } catch (err: any) {
      console.error(err);
      setGameData(null);
      setServiceError(err.message || 'فشل الاتصال بخادم اللعبة');
      toast.error(err.message || 'فشل الاتصال بخادم اللعبة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameInfo();
  }, []);

  // Handle Full Game Download
  const handleDownloadFullGame = async () => {
    try {
      setDownloading(true);
      const token = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/game/download', { headers });
      if (!res.ok || !(res.headers.get('content-type') || '').includes('application/zip')) {
        await readGameResponse(res);
        throw new Error('لم تصل حزمة ZIP صالحة من خادم اللعبة.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ittihadawy-game-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('تم تحميل حزمة اللعبة بنجاح! 🎮');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'فشل تحميل حزمة اللعبة');
    } finally {
      setDownloading(false);
    }
  };

  // Inspect uploaded zip client-side before sending
  const handleZipSelection = async (file: File) => {
    if (file.size > 60 * 1024 * 1024) {
      toast.error('حجم ملف اللعبة يجب ألا يتجاوز 60 ميجابايت.');
      return;
    }
    setUploadFile(file);
    setZipInspecting(true);
    setZipContents([]);
    setZipHasIndex(false);

    try {
      const zip = await JSZip.loadAsync(file);
      const entries: string[] = [];
      let hasIndex = false;

      zip.forEach((relPath, entry) => {
        if (!entry.dir) {
          entries.push(relPath);
          if (relPath === 'index.html' || relPath.endsWith('/index.html')) {
            hasIndex = true;
          }
        }
      });

      setZipContents(entries);
      setZipHasIndex(hasIndex);

      if (!hasIndex) {
        toast.error('تحذير: الملف المضغوط لا يحتوي على index.html!', { duration: 5000 });
      } else {
        toast.success(`تم فحص الملف: يحتوي على ${entries.length} ملف صالح للعبة.`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('الملف المختار ليس ملف ZIP صالح أو به تلف.');
      setUploadFile(null);
    } finally {
      setZipInspecting(false);
    }
  };

  // Upload and Deploy New Version
  const handleDeployGame = async () => {
    if (serviceError || !gameData) {
      toast.error(serviceError || 'انتظر التحقق من اتصال خدمة إدارة اللعبة أولاً.');
      return;
    }
    if (!uploadFile) {
      toast.error('يرجى اختيار ملف ZIP أولاً');
      return;
    }
    if (!zipHasIndex) {
      toast.error('الملف المختار لا يحتوي على ملف index.html الرئيسي للعبة');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(20);

      const token = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const formData = new FormData();
      formData.append('file', uploadFile);

      setUploadProgress(50);
      const res = await fetch('/api/game/upload', {
        method: 'POST',
        headers,
        body: formData
      });

      setUploadProgress(90);
      const result = await readGameResponse(res);

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'فشل رفع وتحديث اللعبة');
      }

      setUploadProgress(100);
      toast.success(`تم تحديث اللعبة بنجاح! تم استبدال وتثبيت ${result.filesCount} ملف.`);
      setUploadFile(null);
      setZipContents([]);
      setZipHasIndex(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh list
      await fetchGameInfo();
      setActiveSubTab('download');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'حدث خطأ أثناء رفع وتحديث اللعبة');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Upload Single Audio Track
  const handleUploadAudio = async (e: React.ChangeEvent<HTMLInputElement>, trackName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('trackName', trackName);

      toast.loading(`جاري رفع ${trackName}...`, { id: 'audio-upload' });
      const res = await fetch('/api/game/upload-audio', {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await readGameResponse(res);
      if (data.success) {
        toast.success(`تم تحديث المقطع الصوتي ${trackName} بنجاح!`, { id: 'audio-upload' });
        await fetchGameInfo();
      }
    } catch (err: any) {
      toast.error(err.message || 'فشل رفع الملف الصوتي', { id: 'audio-upload' });
    } finally {
      e.target.value = '';
    }
  };

  // Create Manual Backup
  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      const token = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/game/create-backup', {
        method: 'POST',
        headers,
        body: JSON.stringify({ note: 'manual-admin' })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل إنشاء النسخة الاحتياطية');
      }

      toast.success('تم إنشاء نسخة احتياطية بنجاح! 💾');
      await fetchGameInfo();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء النسخ الاحتياطي');
    } finally {
      setCreatingBackup(false);
    }
  };

  // Restore Backup
  const handleRestoreBackup = async (backupId: string) => {
    if (!window.confirm(`هل أنت متأكد من استعادة النسخة الاحتياطية (${backupId})؟ سيتم تطبيق ملفاتها كنسخة نشطة للعبة.`)) {
      return;
    }

    try {
      setRestoringBackupId(backupId);
      const token = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/game/restore', {
        method: 'POST',
        headers,
        body: JSON.stringify({ backupId })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل استعادة النسخة');
      }

      toast.success('تمت استعادة النسخة بنجاح وتفعيلها في التطبيق!');
      await fetchGameInfo();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الاستعادة');
    } finally {
      setRestoringBackupId(null);
    }
  };

  // Delete Backup
  const handleDeleteBackup = async (backupId: string) => {
    if (!window.confirm(`هل تريد بالتأكيد حذف النسخة الاحتياطية ${backupId}؟`)) {
      return;
    }

    try {
      setDeletingBackupId(backupId);
      const token = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/game/delete-backup', {
        method: 'POST',
        headers,
        body: JSON.stringify({ backupId })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل حذف النسخة');
      }

      toast.success('تم حذف النسخة الاحتياطية.');
      await fetchGameInfo();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الحذف');
    } finally {
      setDeletingBackupId(null);
    }
  };

  // Filter files
  const filteredFiles = (gameData?.files || []).filter(f => {
    const matchSearch = f.path.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'all' || f.type === typeFilter;
    return matchSearch && matchType;
  });

  // AI Prompt Template for models
  const aiPromptText = `أريد تعديل لعبة «هروب اتحاداوي» (Ittihadawy Escape Game).
اللعبة مبنية بـ HTML5 + Three.js + Web Audio API وموجودة داخل مجلد واحد يحتوي على:
1. index.html: نقطة البداية، مساحة العرض (Canvas)، ومؤشرات اللعبة (HUD والواجهة باللغة العربية).
2. assets/index-DDVEmsD_.js: محرك اللعبة بالكامل (Three.js 3D Runner) ويشمل:
   - الشخصيات:
     * عادل شكل (قدرة الزمارة "٦ إلا تلت")
     * جمال الدولي (قدرة المبخرة)
     * حميدو البرنس (قدرة أبو جلمبو 🦀 سلطعونات تخرج من رأسه وتعطل المطاردة)
   - العوائق والحواجز الثلاثية الأبعاد (حواجز قفز، عوارض تزحلق، كرات ذهبية، عملات).
   - مسارات شوارع ومعالم الإسكندرية (استاد الإسكندرية، الكورنيش، الشاطبي، محطة الرمل).
3. audio/: الملفات الصوتية وأصوات الهتافات.
4. fonts/: الخطوط العربية الرسمية (Alexandria و Fedra).

المطلوب:
[اكتب هنا التعديل المطلوب: إضافة شخصية جديدة، عوائق إضافية، تعديل سرعة، تحسين جرافيك...]
يرجى توفير الكود أو الملفات المعدلة بحيث تظل متوافقة وتُحفظ كـ ZIP لرفعها مباشرة من لوحة التحكم.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(aiPromptText);
    setCopiedPrompt(true);
    toast.success('تم نسخ برومبت التعديل للذكاء الاصطناعي!');
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {serviceError && (
        <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
          <p className="font-bold">تعذر الاتصال بخدمة إدارة اللعبة</p>
          <p className="mt-1 leading-relaxed">{serviceError}</p>
        </div>
      )}
      {/* Top Header Card */}
      <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200/80 dark:border-border-dark shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Gamepad2 size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">إدارة لعبة «هروب اتحاداوي»</h2>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  الإصدار النشط 3D
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                حمّل حزمة اللعبة للتعديل عليها في أي موديل ذكاء اصطناعي، ثم ارفع النسخة الجديدة لتحديثها فورياً في التطبيق.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchGameInfo}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              title="تحديث البيانات"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
            <a
              href="/game"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <ExternalLink size={15} />
              <span>معاينة وتشغيل اللعبة</span>
            </a>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-100 dark:border-border-dark">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200/60 dark:border-border-dark">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">حجم ملفات اللعبة</span>
            <strong className="text-lg font-black text-slate-900 dark:text-white block">
              {gameData?.formattedSize || '...'}
            </strong>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200/60 dark:border-border-dark">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">إجمالي الملفات</span>
            <strong className="text-lg font-black text-slate-900 dark:text-white block">
              {gameData?.fileCount || 0} ملف
            </strong>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200/60 dark:border-border-dark">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">النسخ الاحتياطية</span>
            <strong className="text-lg font-black text-slate-900 dark:text-white block">
              {gameData?.backups?.length || 0} نسخة
            </strong>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200/60 dark:border-border-dark">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">الحالة والمسار</span>
            <strong className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block truncate" title="public/games/ittihadawy">
              {loading ? 'جاري التحقق…' : serviceError ? 'الخدمة غير متصلة' : gameData?.exists ? 'جاهزة ونشطة' : 'لا توجد حزمة لعبة'}
            </strong>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-border-dark pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('download')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
            activeSubTab === 'download'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-dark'
          }`}
        >
          <ArrowDownToLine size={16} />
          <span>تحميل الحزمة والملفات</span>
        </button>

        <button
          onClick={() => setActiveSubTab('upload')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
            activeSubTab === 'upload'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-dark'
          }`}
        >
          <Upload size={16} />
          <span>رفع نسخة جديدة (ZIP)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('backups')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
            activeSubTab === 'backups'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-dark'
          }`}
        >
          <RotateCcw size={16} />
          <span>النسخ الاحتياطية والاستعادة ({gameData?.backups?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ai-guide')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
            activeSubTab === 'ai-guide'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-dark'
          }`}
        >
          <Sparkles size={16} />
          <span>دليل التعديل بالموديلات والـ AI</span>
        </button>
      </div>

      {/* Tab 1: Download & File Explorer */}
      {activeSubTab === 'download' && (
        <div className="space-y-6">
          {/* Download Full Package Hero Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-sm">
                  <FileArchive size={14} />
                  <span>حزمة اللعبة الكاملة (Complete Offline Package)</span>
                </div>
                <h3 className="text-2xl font-black">تحميل اللعبة بالكامل كملف ZIP واحد</h3>
                <p className="text-emerald-50 text-xs leading-relaxed">
                  احصل على نسخة طبق الأصل من كل ملفات اللعبة (الكود، مجسمات Three.js، الأصوات، الخطوط العربية، والشخصيات عادل وجمال وحميدو) لتعديلها بحرية في أي محرر أو نموذج ذكاء اصطناعي.
                </p>
              </div>

              <button
                onClick={handleDownloadFullGame}
                disabled={downloading}
                className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-white text-emerald-900 font-black text-sm shadow-lg hover:bg-emerald-50 active:scale-95 transition-all disabled:opacity-60 whitespace-nowrap"
              >
                <Download size={19} className={downloading ? 'animate-bounce' : ''} />
                <span>{downloading ? 'جاري تجهيز التحميل…' : `تحميل الحزمة الآن (${gameData?.formattedSize || '...'})`}</span>
              </button>
            </div>
          </div>

          {/* Soundtrack Playlist Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-card-dark border border-slate-200/80 dark:border-border-dark space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Music size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">الموسيقى التصويرية للعبة (Soundtrack Playlist)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">مقطعان موسيقيان يعملان وراء بعضهما تلقائياً بالتتابع في حلقة مستمرة</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Track 1 */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200/70 dark:border-border-dark space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">١</span>
                    <span>المقطع الأول (Track 1)</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">alexandria-theme.mp3</span>
                </div>
                <audio controls className="w-full h-8" preload="none" src="/games/ittihadawy/audio/alexandria-theme.mp3" />
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-slate-500">موسيقى البداية والركض</span>
                  <label className="cursor-pointer text-emerald-600 font-bold hover:underline">
                    <span>استبدال</span>
                    <input type="file" accept=".mp3,.m4a" className="hidden" onChange={(e) => handleUploadAudio(e, 'alexandria-theme.mp3')} />
                  </label>
                </div>
              </div>

              {/* Track 2 */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200/70 dark:border-border-dark space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">٢</span>
                    <span>المقطع الثاني (Track 2)</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">alexandria-theme-2.mp3</span>
                </div>
                <audio controls className="w-full h-8" preload="none" src="/games/ittihadawy/audio/alexandria-theme-2.mp3" />
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-slate-500">يعمل بعد المقطع الأول</span>
                  <label className="cursor-pointer text-emerald-600 font-bold hover:underline">
                    <span>استبدال</span>
                    <input type="file" accept=".mp3,.m4a" className="hidden" onChange={(e) => handleUploadAudio(e, 'alexandria-theme-2.mp3')} />
                  </label>
                </div>
              </div>

              {/* Adel Shakl Horn */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200/70 dark:border-border-dark space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center">♬</span>
                    <span>زمارة عادل شكل (٦ إلا تلت)</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">adel-horn.mp3</span>
                </div>
                <audio controls className="w-full h-8" preload="none" src="/games/ittihadawy/audio/adel-horn.mp3" />
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-slate-500">صوت الزمارة عند القدرة</span>
                  <label className="cursor-pointer text-amber-600 font-bold hover:underline">
                    <span>استبدال</span>
                    <input type="file" accept=".mp3,.m4a" className="hidden" onChange={(e) => handleUploadAudio(e, 'adel-horn.mp3')} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* File Explorer Table */}
          <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200/80 dark:border-border-dark p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">مستعرض ملفات اللعبة ({filteredFiles.length} ملف)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">تصفح ملفات المجلد ومحتوياتها</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={15} className="absolute right-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث في أسماء الملفات..."
                    className="pr-9 pl-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-dark text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-dark text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">كل الأنواع</option>
                  <option value="html">HTML</option>
                  <option value="js">JavaScript (كود اللعبة)</option>
                  <option value="css">CSS (الستايل)</option>
                  <option value="audio">صوت وموسيقى (MP3)</option>
                  <option value="image">صور ورسومات (PNG/JPG)</option>
                  <option value="font">خطوط (Fonts)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-border-dark">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-surface-dark text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-border-dark">
                  <tr>
                    <th className="p-3">مسار الملف</th>
                    <th className="p-3">النوع</th>
                    <th className="p-3">الحجم</th>
                    <th className="p-3">آخر تعديل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                  {filteredFiles.map((file) => (
                    <tr key={file.path} className="hover:bg-slate-50/60 dark:hover:bg-surface-dark/60 transition-colors">
                      <td className="p-3 font-mono text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        {file.type === 'html' && <FileText size={15} className="text-orange-500 shrink-0" />}
                        {file.type === 'js' && <Code size={15} className="text-yellow-500 shrink-0" />}
                        {file.type === 'css' && <Layers size={15} className="text-blue-500 shrink-0" />}
                        {file.type === 'audio' && <Music size={15} className="text-purple-500 shrink-0" />}
                        {file.type === 'image' && <ImageIcon size={15} className="text-emerald-500 shrink-0" />}
                        {file.type === 'font' && <Type size={15} className="text-rose-500 shrink-0" />}
                        {file.type === 'other' && <FileText size={15} className="text-slate-400 shrink-0" />}
                        <span className="truncate max-w-md" title={file.path}>{file.path}</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {file.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-medium text-slate-600 dark:text-slate-400">
                        {file.formattedSize}
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">
                        {new Date(file.lastModified).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                  {filteredFiles.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        لا توجد ملفات مطابقة للبحث
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Upload & Update */}
      {activeSubTab === 'upload' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200/80 dark:border-border-dark space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload size={18} className="text-emerald-600" />
                <span>رفع وتحديث نسخة جديدة من اللعبة (Deploy Game ZIP)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ارفع ملف الـ ZIP الذي يحتوي على نسختك المعدلة من اللعبة. سيتم فحص الملف وإنشاء نسخة احتياطية للنسخة الحالية تلقائياً قبل التثبيت.
              </p>
            </div>

            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file && file.name.endsWith('.zip')) {
                  handleZipSelection(file);
                } else {
                  toast.error('يرجى سحب ملف ZIP فقط');
                }
              }}
              className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                uploadFile
                  ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50/50 dark:bg-surface-dark'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleZipSelection(file);
                }}
              />

              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FolderArchive size={28} />
                </div>
                <div>
                  <strong className="text-sm font-bold text-slate-900 dark:text-white block">
                    {uploadFile ? uploadFile.name : 'اسحب ملف الـ ZIP هنا أو اضغط للاختيار'}
                  </strong>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                    {uploadFile
                      ? `حجم الملف: ${(uploadFile.size / 1024 / 1024).toFixed(2)} MB`
                      : 'يدعم ملفات .zip حتى 60 ميجابايت'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pre-flight inspection status */}
            {zipInspecting && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-dark flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                <RefreshCw size={16} className="animate-spin text-emerald-600" />
                <span>جاري فحص محتويات ملف الـ ZIP والتأكد من وجود index.html...</span>
              </div>
            )}

            {uploadFile && !zipInspecting && (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  zipHasIndex 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200' 
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                }`}>
                  {zipHasIndex ? (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs space-y-1">
                    <strong className="block font-bold">
                      {zipHasIndex ? 'الملف جاهز وصالح للتثبيت' : 'تحذير: الملف لا يحتوي على ملف index.html الرئيسي!'}
                    </strong>
                    <p className="opacity-90">
                      {zipHasIndex
                        ? `تم رصد ${zipContents.length} ملف داخل الحزمة، بما فيها الملف الرئيسي index.html.`
                        : 'يجب أن يحتوي ملف الـ ZIP على صفحة index.html للعبة حتى تعمل بصورة صحيحة.'}
                    </p>
                  </div>
                </div>

                {/* Safety Guarantee */}
                <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 flex items-center gap-2.5 text-xs text-blue-900 dark:text-blue-300">
                  <ShieldCheck size={16} className="shrink-0 text-blue-600 dark:text-blue-400" />
                  <span>
                    <strong>أمان تام:</strong> سيقوم النظام تلقائياً بأخذ نسخة احتياطية من نسختك الحالية قبل استبدال أي ملف، ويمكنك الرجوع إليها بضغطة زر في أي وقت من تبويب «النسخ الاحتياطية».
                  </span>
                </div>

                {/* Deploy Button */}
                <button
                  onClick={handleDeployGame}
                  disabled={uploading || !zipHasIndex}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50"
                >
                  <Upload size={17} className={uploading ? 'animate-bounce' : ''} />
                  <span>{uploading ? `جاري رفع وتثبيت النسخة الجديدة (${uploadProgress}%)…` : 'تطبيق وتحديث اللعبة فورياً ←'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Backups & Rollback */}
      {activeSubTab === 'backups' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200/80 dark:border-border-dark space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <RotateCcw size={18} className="text-emerald-600" />
                  <span>سجل النسخ الاحتياطية للعبة (Rollback & Restore)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  يتم حفظ نسخة احتياطية تلقائياً قبل كل عملية رفع. يمكنك استعادة أي نسخة سابقة فورياً بنقرة واحدة.
                </p>
              </div>

              <button
                onClick={handleCreateBackup}
                disabled={creatingBackup}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold transition-colors whitespace-nowrap self-start"
              >
                <FileArchive size={15} />
                <span>{creatingBackup ? 'جاري النسخ الاحتياطي…' : 'إنشاء نسخة احتياطية يدوية الآن'}</span>
              </button>
            </div>

            {/* Backups List */}
            <div className="space-y-3">
              {(gameData?.backups || []).map((backup) => (
                <div
                  key={backup.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200/70 dark:border-border-dark flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <FileArchive size={20} />
                    </div>
                    <div>
                      <strong className="text-xs font-mono font-bold text-slate-900 dark:text-white block">
                        {backup.filename}
                      </strong>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        الحجم: {backup.formattedSize} • تاريخ الإنشاء: {new Date(backup.createdAt).toLocaleString('ar-EG')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => handleRestoreBackup(backup.id)}
                      disabled={restoringBackupId === backup.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      <RotateCcw size={13} className={restoringBackupId === backup.id ? 'animate-spin' : ''} />
                      <span>{restoringBackupId === backup.id ? 'جاري الاستعادة…' : 'استعادة هذه النسخة'}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(backup.id)}
                      disabled={deletingBackupId === backup.id}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 transition-colors"
                      title="حذف النسخة"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}

              {(!gameData?.backups || gameData.backups.length === 0) && (
                <div className="p-8 text-center text-slate-400 text-xs rounded-xl bg-slate-50/50 dark:bg-surface-dark border border-slate-200/40 dark:border-border-dark">
                  لا توجد نسخ احتياطية مسجلة حتى الآن. اضغط على «إنشاء نسخة احتياطية يدوية الآن» لحفظ حالتك الحالية.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: AI & Model Prompting Guide */}
      {activeSubTab === 'ai-guide' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200/80 dark:border-border-dark space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-emerald-600" />
                  <span>دليل التعديل عبر الموديلات والذكاء الاصطناعي (AI Prompt Guide)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  انسخ هذا النص وضعه في نموذج الذكاء الاصطناعي (مثل Gemini أو Claude أو ChatGPT) مرفقاً معه ملف الـ ZIP الذي قمت بتحميله، مع ذكر طلبك بدقة.
                </p>
              </div>

              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors whitespace-nowrap"
              >
                {copiedPrompt ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedPrompt ? 'تم النسخ!' : 'نسخ البرومبت'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap border border-slate-800">
                {aiPromptText}
              </pre>
            </div>

            {/* Quick Tips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200/70 dark:border-border-dark space-y-1.5">
                <strong className="text-xs font-bold text-slate-900 dark:text-white block">١. حمّل حزمة الـ ZIP</strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  من تبويب «تحميل الحزمة والملفات»، اضغط تحميل لتحصل على أحدث نسخة كاملة.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200/70 dark:border-border-dark space-y-1.5">
                <strong className="text-xs font-bold text-slate-900 dark:text-white block">٢. اطلب التعديل</strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  ارفع الـ ZIP للموديل وانسخ البرومبت مع طلبك (مثلاً: إضافة أصوات جديدة، تعديل الشوارع، شخصية جديدة).
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200/70 dark:border-border-dark space-y-1.5">
                <strong className="text-xs font-bold text-slate-900 dark:text-white block">٣. ارفع النسخة الجديدة</strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  من تبويب «رفع نسخة جديدة»، اسحب الـ ZIP الناتج واضغط «تطبيق وتحديث اللعبة» لتصبح حية فورياً.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
