import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  X, 
  ShieldCheck, 
  Users, 
  ExternalLink,
  Github,
  Instagram,
  Headphones
} from 'lucide-react';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.2c0 1.95-.66 3.95-1.97 5.39-1.29 1.43-3.23 2.29-5.26 2.3-2.02.01-4-.83-5.3-2.25-1.32-1.43-1.99-3.41-2-5.36.01-1.96.72-3.92 2.05-5.33 1.33-1.42 3.26-2.26 5.25-2.27.42 0 .84.04 1.25.11v4.08c-.4-.1-.81-.15-1.23-.15-1.12.01-2.24.49-3.03 1.28-.79.79-1.25 1.9-1.25 3.02 0 1.12.48 2.23 1.26 3.01.78.78 1.9 1.25 3.02 1.25 1.12 0 2.23-.47 3.01-1.25.79-.79 1.25-1.91 1.25-3.03V.02z"/>
  </svg>
);

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Link states
  const [waGroupLink, setWaGroupLink] = useState(() => localStorage.getItem('alight_link_wa_group') || 'https://chat.whatsapp.com');
  const [waChannelLink, setWaChannelLink] = useState(() => localStorage.getItem('alight_link_wa_channel') || 'https://whatsapp.com/channel');
  const [tgGroupLink, setTgGroupLink] = useState(() => localStorage.getItem('alight_link_tg_group') || 'https://t.me');
  const [adminDirectLink, setAdminDirectLink] = useState(() => localStorage.getItem('alight_link_admin_direct') || 'https://wa.me');
  const [socialTgLink, setSocialTgLink] = useState(() => localStorage.getItem('alight_link_social_tg') || 'https://t.me');
  const [socialTiktokLink, setSocialTiktokLink] = useState(() => localStorage.getItem('alight_link_social_tiktok') || 'https://tiktok.com');
  const [socialIgLink, setSocialIgLink] = useState(() => localStorage.getItem('alight_link_social_ig') || 'https://instagram.com');
  const [socialGithubLink, setSocialGithubLink] = useState(() => localStorage.getItem('alight_link_social_github') || 'https://github.com');

  useEffect(() => {
    const handleSettingsUpdate = () => {
      const wag = localStorage.getItem('alight_link_wa_group') || 'https://chat.whatsapp.com';
      const wac = localStorage.getItem('alight_link_wa_channel') || 'https://whatsapp.com/channel';
      const tgg = localStorage.getItem('alight_link_tg_group') || 'https://t.me';
      const adm = localStorage.getItem('alight_link_admin_direct') || 'https://wa.me';
      const stg = localStorage.getItem('alight_link_social_tg') || 'https://t.me';
      const stk = localStorage.getItem('alight_link_social_tiktok') || 'https://tiktok.com';
      const sig = localStorage.getItem('alight_link_social_ig') || 'https://instagram.com';
      const sgh = localStorage.getItem('alight_link_social_github') || 'https://github.com';

      setWaGroupLink((prev) => (prev !== wag ? wag : prev));
      setWaChannelLink((prev) => (prev !== wac ? wac : prev));
      setTgGroupLink((prev) => (prev !== tgg ? tgg : prev));
      setAdminDirectLink((prev) => (prev !== adm ? adm : prev));
      setSocialTgLink((prev) => (prev !== stg ? stg : prev));
      setSocialTiktokLink((prev) => (prev !== stk ? stk : prev));
      setSocialIgLink((prev) => (prev !== sig ? sig : prev));
      setSocialGithubLink((prev) => (prev !== sgh ? sgh : prev));
    };

    window.addEventListener('alight_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('alight_settings_updated', handleSettingsUpdate);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShowModal(true);
    } else {
      const timer = setTimeout(() => setShowModal(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!showModal && !isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      const now = new Date().getTime();
      const expiration = now + 24 * 60 * 60 * 1000; // 24 hours
      localStorage.setItem('alightpro_hide_welcome', expiration.toString());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      <div 
        className={`bg-white dark:bg-slate-900 rounded-[24px] w-[95%] sm:w-full max-w-sm sm:max-w-md border-[3px] border-slate-900 dark:border-slate-600 shadow-[4px_4px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] sm:shadow-[6px_6px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] relative z-10 flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden transition-all duration-300 transform ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        {/* Header - Light Blue */}
        <div className="bg-[#93C5FD] dark:bg-slate-900 p-4 sm:p-5 sm:pb-6 border-b-[3px] border-slate-900 dark:border-slate-600 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FDE047] dark:bg-slate-800 rounded-full border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] shrink-0">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 fill-rose-500" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-900 dark:border-slate-600 rounded-full px-2 py-0.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[9px] sm:text-[10px] font-bold tracking-wide text-slate-800 dark:text-slate-100 uppercase">Pemberitahuan Resmi</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">Gabung & Dukung Kami</h2>
              </div>
            </div>
            
            <button 
              onClick={handleClose}
              className="w-7 h-7 sm:w-8 sm:h-8 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 active:translate-y-0.5 active:shadow-none shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] transition-all"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-900 dark:text-white stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar">
          
          {/* Green Info Box */}
          <div className="bg-[#D1FAE5] dark:bg-slate-800 border-[3px] border-slate-900 dark:border-slate-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] sm:shadow-[3px_3px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] mb-4 sm:mb-6">
            <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 mb-1.5 sm:mb-2">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              Verifikasi AM Pro Gratis
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
              Dukung pengembangan platform ini agar tetap gratis dengan bergabung ke komunitas dan mengikuti akun media sosial resmi kami!
            </p>
          </div>

          {/* Communities */}
          <div className="mb-4 sm:mb-6">
            <h4 className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wider uppercase mb-2.5 sm:mb-3">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              Komunitas & Diskusi
            </h4>
            
            <div className="space-y-2.5 sm:space-y-3">
              {[
                { label: 'Grup WhatsApp', icon: <WhatsAppIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />, href: waGroupLink, bgColor: 'bg-[#25D366]' },
                { label: 'Saluran WA', icon: <WhatsAppIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />, href: waChannelLink, bgColor: 'bg-[#25D366]' },
                { label: 'Grup Telegram', icon: <TelegramIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />, href: tgGroupLink, bgColor: 'bg-[#0088cc]' },
                { label: 'Bantuan Admin', icon: <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-white" />, href: adminDirectLink, bgColor: 'bg-amber-500' },
              ].map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 sm:p-3.5 bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-600 rounded-xl sm:rounded-2xl shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] sm:shadow-[3px_3px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] sm:hover:shadow-[4px_4px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-y-0 active:shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] transition-all group"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${item.bgColor}`}>
                      {item.icon}
                    </div>
                    <span className="font-bold text-xs sm:text-sm">{item.label}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-slate-900 dark:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wider uppercase mb-2.5 sm:mb-3">
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 fill-rose-500" />
              Ikuti Media Sosial
            </h4>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {[
                { label: 'GitHub', icon: <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, href: socialGithubLink },
                { label: 'Instagram', icon: <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-500" />, href: socialIgLink },
                { label: 'TikTok', icon: <TikTokIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-900 dark:text-white" />, href: socialTiktokLink },
                { label: 'Telegram', icon: <TelegramIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0088cc]" />, href: socialTgLink },
              ].map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-600 rounded-lg sm:rounded-xl shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-y-0 active:shadow-none transition-all group"
                >
                  {item.icon}
                  <span className="font-bold text-[10px] sm:text-xs">{item.label}</span>
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t-[3px] border-slate-900 dark:border-slate-600 bg-slate-50 dark:bg-slate-900">
          <label className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input 
                type="checkbox" 
                className="peer sr-only"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-slate-900 dark:border-slate-600 rounded bg-white dark:bg-slate-900 peer-checked:bg-slate-900 transition-colors"></div>
              <svg 
                className="absolute w-3 h-3 sm:w-3.5 sm:h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" 
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 select-none group-hover:text-slate-900 dark:text-white transition-colors">
              Jangan tampilkan lagi dalam 24 jam
            </span>
          </label>
          
          <button 
            onClick={handleClose}
            className="w-full bg-[#93C5FD] dark:bg-slate-900 hover:bg-[#60A5FA] text-slate-900 dark:text-white border-[3px] border-slate-900 dark:border-slate-600 rounded-lg sm:rounded-xl py-2.5 sm:py-3 font-bold text-xs sm:text-sm shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] sm:shadow-[3px_3px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:shadow-none active:translate-y-[2px] sm:active:translate-y-[3px] transition-all"
          >
            Saya Mengerti & Lanjutkan
          </button>
        </div>

      </div>
    </div>
  );
};
