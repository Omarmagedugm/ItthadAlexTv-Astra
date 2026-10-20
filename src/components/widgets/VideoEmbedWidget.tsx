import React, { useState } from 'react';
import { 
  Play, 
  ExternalLink, 
  Tv, 
  AlertCircle,
  Code
} from 'lucide-react';
import { 
  isYouTubeUrl, 
  getYouTubeEmbedUrl, 
  isFacebookUrl, 
  getFacebookEmbedUrl,
  extractEmbedSrc,
  isEmbedCode
} from '../../lib/videoUtils';

interface VideoEmbedWidgetProps {
  id?: string;
  title?: string;
  subtitle?: string;
  videoUrl?: string;
  videoType?: 'youtube' | 'facebook' | 'direct' | 'iframe' | 'auto';
  aspectRatio?: '16/9' | '4/3' | '1/1' | '9/16';
  autoplay?: boolean;
}

export default function VideoEmbedWidget({
  title,
  subtitle,
  videoUrl,
  videoType = 'auto',
  aspectRatio = '16/9',
  autoplay = false
}: VideoEmbedWidgetProps) {
  const [hasError, setHasError] = useState(false);

  if (!videoUrl || videoUrl.trim() === '') {
    return null;
  }

  const rawInput = videoUrl.trim();
  const isHtmlEmbed = isEmbedCode(rawInput);
  const src = extractEmbedSrc(rawInput);

  // Detect type
  const isYT = videoType === 'youtube' || (videoType === 'auto' && isYouTubeUrl(rawInput));
  const isFB = videoType === 'facebook' || (videoType === 'auto' && isFacebookUrl(rawInput));
  const isDirect = videoType === 'direct' || (!isYT && !isFB && !isHtmlEmbed && (src.endsWith('.mp4') || src.endsWith('.webm')));

  // Formulate embed URL
  let embedSrc = src;
  if (isYT) {
    embedSrc = getYouTubeEmbedUrl(rawInput, autoplay);
  } else if (isFB) {
    embedSrc = getFacebookEmbedUrl(rawInput, autoplay);
  }

  // Determine watch link
  const directLink = isHtmlEmbed ? src : rawInput;

  // Aspect ratio class calculation
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '4/3':
        return 'aspect-[4/3]';
      case '1/1':
        return 'aspect-square max-w-[480px] mx-auto';
      case '9/16':
        return 'aspect-[9/16] max-w-[360px] mx-auto';
      case '16/9':
      default:
        return 'aspect-video';
    }
  };

  return (
    <div className="ds-content-card w-full bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm hover:shadow-md transition-all">
      
      {/* Header section (if title or subtitle) */}
      {(title || subtitle) && (
        <div className="p-4 pb-3 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-border-dark/60">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Title & Subtitle */}
            <div className="truncate">
              <h3 className="ds-content-heading text-sm font-bold text-slate-900 dark:text-white truncate">
                {title || 'فيديو نادي الاتحاد'}
              </h3>
              {subtitle && (
                <p className="text-[12px] font-bold text-slate-400 truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Container */}
      <div className={`relative w-full bg-black ${getAspectRatioClass()} overflow-hidden`}>
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950">
            <AlertCircle size={32} className="text-amber-500 mb-2" />
            <p className="text-xs font-bold text-white mb-1">تعذر تشغيل الفيديو</p>
            <p className="text-[12px] text-slate-400">قد تكون إعدادات الخصوصية تمنع التضمين داخل الصفحة.</p>
          </div>
        ) : isYT ? (
          <iframe
            src={embedSrc}
            title={title || 'YouTube video player'}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            loading="lazy"
            onError={() => setHasError(true)}
          />
        ) : isFB ? (
          <iframe
            src={embedSrc}
            title={title || 'Facebook video player'}
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            scrolling="no"
            loading="lazy"
            onError={() => setHasError(true)}
          />
        ) : isDirect ? (
          <video
            src={src}
            controls
            autoPlay={autoplay}
            playsInline
            className="w-full h-full object-contain"
            onError={() => setHasError(true)}
          />
        ) : (
          <iframe
            src={embedSrc}
            title={title || 'Video Player'}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            loading="lazy"
            onError={() => setHasError(true)}
          />
        )}
      </div>

    </div>
  );
}
