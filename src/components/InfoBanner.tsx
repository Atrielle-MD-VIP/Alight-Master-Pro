import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

const DEFAULT_BANNER_TEXT = 'Ingin melihat info detail **batas harian dan sisa kredit kamu?** Klik tombol **LOGIN** diatas layar,  Belum punya akun? pencet teks **Daftar akun**';

export const InfoBanner: React.FC = () => {
  const [bannerText, setBannerText] = useState(() => {
    return localStorage.getItem('alight_info_banner_text') || DEFAULT_BANNER_TEXT;
  });

  useEffect(() => {
    const handleSync = () => {
      const text = localStorage.getItem('alight_info_banner_text') || DEFAULT_BANNER_TEXT;
      setBannerText((prev) => (prev !== text ? text : prev));
    };

    window.addEventListener('alight_settings_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('alight_settings_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const renderFormattedText = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-extrabold text-slate-900 dark:text-amber-300">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="px-3 max-w-2xl mx-auto w-full my-1.5 select-none">
      <div className="bg-[#FEF08A] dark:bg-slate-900/90 dark:border-slate-800 border-[1.5px] border-slate-900 rounded-xl sm:rounded-2xl p-2.5 px-3.5 shadow-[2px_2px_0px_#0f172a] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] text-slate-900 dark:text-slate-300 flex items-center gap-2.5 sm:gap-3 transition-all">
        {/* Badge Icon Left */}
        <div className="bg-white dark:bg-slate-800 border-[1.5px] border-slate-900 dark:border-amber-500/30 rounded-lg p-1.5 shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-none shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8">
          <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500 stroke-[2]" />
        </div>

        {/* Banner Text Right */}
        <p className="font-medium text-[11px] sm:text-xs text-slate-900 dark:text-slate-300 leading-tight sm:leading-snug tracking-tight">
          {renderFormattedText(bannerText)}
        </p>
      </div>
    </div>
  );
};
