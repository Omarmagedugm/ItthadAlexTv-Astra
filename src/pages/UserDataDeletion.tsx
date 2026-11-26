import { motion } from 'motion/react';
import { Trash2, UserX, Clock, ShieldCheck, Mail } from 'lucide-react';

export default function UserDataDeletion() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 pb-24 bg-background-light dark:bg-background-dark min-h-screen">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-12"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-lg mb-2">
            <Trash2 className="text-primary w-8 h-8" />
          </div>
          <h1 className="ds-content-heading text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">حذف بيانات المستخدم / User Data Deletion</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold">آخر تحديث: {new Date().toLocaleDateString('ar-EG')}</p>
        </motion.div>

        {/* Content Section - Arabic */}
        <motion.section variants={itemVariants} className="ds-content-card ds-surface p-6 sm:p-8 rounded-xl border border-border-light dark:border-border-dark space-y-6 text-right" dir="rtl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-primary rounded-full" />
            <h2 className="ds-content-heading text-xl font-bold text-slate-800 dark:text-white">أولاً: اللغة العربية</h2>
          </div>

          <div className="space-y-6 text-slate-600 dark:text-slate-300 leading-relaxed font-bold text-sm">
            <div>
              <h3 className="ds-content-heading text-primary flex items-center gap-2 mb-2">
                <UserX size={18} /> كيفية حذف بياناتك
              </h3>
              <p>إذا كنت ترغب في حذف بيانات حسابك من تطبيق "قناة الاتحاد السكندري"، يمكنك القيام بذلك بأحدى الطرق التالية:</p>
              <ul className="list-disc list-inside mr-4 mt-2 space-y-1">
                <li>من داخل التطبيق: افتح "الملف الشخصي" ثم اختر خيار "حذف الحساب" (إن كان متاحاً).</li>
                <li>عبر البريد الإلكتروني: أرسل طلب حذف إلى info@itthadalextv.com من نفس البريد المسجَّل في حسابك.</li>
              </ul>
            </div>

            <div>
              <h3 className="ds-content-heading text-primary flex items-center gap-2 mb-2">
                <Clock size={18} /> مدة المعالجة
              </h3>
              <p>تتم معالجة طلبات الحذف خلال مدة أقصاها 30 يوماً من تاريخ استلام الطلب. سيتم حذف البيانات التالية نهائياً: الاسم الكامل، البريد الإلكتروني، صورة الملف الشخصي، وتعليقاتك ومنشوراتك داخل التطبيق.</p>
            </div>

            <div>
              <h3 className="ds-content-heading text-primary flex items-center gap-2 mb-2">
                <ShieldCheck size={18} /> البيانات التي لا يتم حذفها
              </h3>
              <p>قد نحتفظ ببعض السجلات الفنية المحدودة لأغراض أمنية وقانونية، وذلك وفقاً لسياسة الخصوصية الخاصة بنا.</p>
            </div>

            <div>
              <h3 className="ds-content-heading text-primary flex items-center gap-2 mb-2">
                <Trash2 size={18} /> حذف البيانات عبر فيسبوك
              </h3>
              <p>إذا قمت بتسجيل الدخول إلى التطبيق باستخدام فيسبوك، يمكنك أيضاً حذف بياناتك ومحتواك الناتج عن نشاطك عبر التطبيق من خلال: إعدادات حسابك على فيسبوك ← "الإعدادات والخصوصية" ← "التطبيقات والمواقع" ← اختر تطبيقنا ثم اضغط "إزالة". سيتم إرسال طلب حذف البيانات إلينا تلقائياً، وسيتم حذف كافة بياناتك خلال 30 يوماً.</p>
            </div>
          </div>
        </motion.section>

        {/* Content Section - English */}
        <motion.section variants={itemVariants} className="ds-content-card ds-surface p-6 sm:p-8 rounded-xl border border-border-light dark:border-border-dark space-y-6 text-left" dir="ltr">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-accent rounded-full" />
            <h2 className="ds-content-heading text-xl font-bold text-slate-800 dark:text-white">II. English Version</h2>
          </div>

          <div className="space-y-6 text-slate-600 dark:text-slate-300 leading-relaxed font-medium text-sm">
            <div>
              <h3 className="ds-content-heading text-accent flex items-center gap-2 mb-2 uppercase font-bold italic">
                <UserX size={18} /> How to Delete Your Data
              </h3>
              <p>If you wish to delete your account data from the "Ittihad Fan App", you can do so using either of the following methods:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>In-app: open "Profile" and choose the "Delete Account" option (if available).</li>
                <li>By email: send a deletion request to info@itthadalextv.com from the email address registered to your account.</li>
              </ul>
            </div>

            <div>
              <h3 className="ds-content-heading text-accent flex items-center gap-2 mb-2 uppercase font-bold italic">
                <Clock size={18} /> Processing Time
              </h3>
              <p>Deletion requests are processed within a maximum of 30 days from the date the request is received. The following data will be permanently deleted: full name, email address, profile picture, and your comments and posts within the app.</p>
            </div>

            <div>
              <h3 className="ds-content-heading text-accent flex items-center gap-2 mb-2 uppercase font-bold italic">
                <ShieldCheck size={18} /> Data We Retain
              </h3>
              <p>We may retain certain limited technical records for security and legal purposes, in accordance with our Privacy Policy.</p>
            </div>

            <div>
              <h3 className="ds-content-heading text-accent flex items-center gap-2 mb-2 uppercase font-bold italic">
                <Trash2 size={18} /> Deleting Data via Facebook
              </h3>
              <p>If you signed in to the app using Facebook, you can also delete the data generated by your activity through the app via: your Facebook account — "Settings &amp; Privacy" — "Apps and Websites" — select our app, then press "Remove". A data deletion request will be sent to us automatically, and all of your data will be deleted within 30 days.</p>
            </div>
          </div>
        </motion.section>

        {/* Contact Info */}
        <motion.div variants={itemVariants} className="ds-content-card text-center p-8 bg-slate-50 dark:bg-card-dark rounded-xl border border-dashed border-border-light dark:border-border-dark">
          <Mail className="mx-auto text-primary mb-3" size={24} />
          <h3 className="ds-content-heading font-bold text-slate-800 dark:text-white mb-2">للتواصل والاستفسارات / Contact Us</h3>
          <p className="text-primary font-bold text-lg">info@itthadalextv.com</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
