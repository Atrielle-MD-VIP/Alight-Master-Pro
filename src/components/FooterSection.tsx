import React, { useState, useEffect } from 'react';
import { ShieldCheck, Zap, Sparkles, HelpCircle, Send } from 'lucide-react';
import { useAppSettings } from '../hooks/useAppSettings';

interface FooterSectionProps {
  onNavigate: (sectionId: string) => void;
  onOpenAdmin: () => void;
}

export const FooterSection: React.FC<FooterSectionProps> = ({ onNavigate, onOpenAdmin }) => {
  const [socialTg, setSocialTg] = useState(() => localStorage.getItem('alight_link_social_tg') || 'https://t.me');
  const [socialTiktok, setSocialTiktok] = useState(() => localStorage.getItem('alight_link_social_tiktok') || 'https://tiktok.com');
  const [socialIg, setSocialIg] = useState(() => localStorage.getItem('alight_link_social_ig') || 'https://instagram.com');
  const [socialHandle, setSocialHandle] = useState(() => localStorage.getItem('alight_social_handle') || '@ALIGHTMASTER');
  
  const { websiteName, appName, appPublisher } = useAppSettings();

  const loadLinks = () => {
    const tg = localStorage.getItem('alight_link_social_tg') || 'https://t.me';
    const tt = localStorage.getItem('alight_link_social_tiktok') || 'https://tiktok.com';
    const ig = localStorage.getItem('alight_link_social_ig') || 'https://instagram.com';
    const sh = localStorage.getItem('alight_social_handle') || '@ALIGHTMASTER';

    setSocialTg((prev) => (prev !== tg ? tg : prev));
    setSocialTiktok((prev) => (prev !== tt ? tt : prev));
    setSocialIg((prev) => (prev !== ig ? ig : prev));
    setSocialHandle((prev) => (prev !== sh ? sh : prev));
  };

  useEffect(() => {
    loadLinks();
    const handleUpdated = () => loadLinks();
    window.addEventListener('alight_settings_updated', handleUpdated);
    window.addEventListener('storage', handleUpdated);
    return () => {
      window.removeEventListener('alight_settings_updated', handleUpdated);
      window.removeEventListener('storage', handleUpdated);
    };
  }, []);

  return (
    <footer className="mt-12 bg-white dark:bg-slate-900 border-t-2 border-slate-900 dark:border-slate-600 pt-8 pb-20 px-4 select-none">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="space-y-3">
          <div 
            onClick={onOpenAdmin}
            className="flex items-center gap-2.5 cursor-pointer group inline-flex"
            title="Klik untuk buka Login Admin Manajemen"
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 border-[2px] border-slate-900 dark:border-slate-700 flex items-center justify-center text-white shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#38bdf8] group-hover:scale-105 group-hover:rotate-3 transition-all duration-200">
              <span className="font-black text-lg sm:text-xl tracking-tighter text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)] italic pr-0.5 select-none">
                A
              </span>
              {/* Modern Sparkling Star Badge */}
              <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 p-0.5 rounded-full border-[1.5px] border-slate-900 shadow-[1px_1px_0px_#0f172a] flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-slate-950 stroke-[2.5]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                  {websiteName}
                </span>
                <span className="bg-pink-100 text-pink-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-pink-300">
                  PRO 1 THN
                </span>
              </div>
              <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase -mt-0.5">
                ALIGHT MOTION VERIFIER
              </p>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
            {websiteName} adalah platform verifikasi mandiri untuk aktivasi akun {appName} berdurasi 1 tahun secara gratis, cepat, dan aman berbasis token OOB {appPublisher}.
          </p>

          <div className="bg-purple-100 dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-xl p-3 flex items-center gap-2 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
            <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0 stroke-[2.5]" />
            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
              Sistem Enkripsi Token OOB 100% Aman Tanpa Simpan Password.
            </span>
          </div>
        </div>

        {/* Quick Navigation Links */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <h4 className="font-extrabold text-xs tracking-wider uppercase text-slate-900 dark:text-white">
            NAVIGASI CEPAT
          </h4>
          <ul className="space-y-2 text-xs font-bold text-slate-800 dark:text-slate-100">
            <li>
              <button
                onClick={() => onNavigate('verification-panel')}
                className="flex items-center gap-2 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <Zap className="w-4 h-4 text-blue-500 fill-blue-400" />
                <span>Mulai Verifikasi Pro</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('features')}
                className="flex items-center gap-2 hover:text-pink-600 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span>Fitur Alight Master</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('faq')}
                className="flex items-center gap-2 hover:text-purple-600 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-purple-500" />
                <span>Pertanyaan Umum FAQ</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Official Social Media Links */}
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <h4 className="font-extrabold text-xs tracking-wider uppercase text-slate-900 dark:text-white">
            SOSIAL MEDIA RESMI
          </h4>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Ikuti sosial media resmi <span className="font-bold text-slate-900 dark:text-white">{socialHandle}</span> untuk pembaruan, tutorial, dan bantuan Alight Motion Pro.
          </p>

          <div className="flex items-center gap-3">
            {/* Telegram Icon */}
            <a
              href={socialTg}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram Community"
              className="w-10 h-10 rounded-xl bg-sky-500 text-white border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
            >
              <Send className="w-5 h-5 -ml-0.5" />
            </a>

            {/* TikTok Icon */}
            <a
              href={socialTiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok Official"
              className="w-10 h-10 rounded-xl bg-slate-900 text-white border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.31 0 .61.05.89.15V9.77a5.7 5.7 0 0 0-.89-.07 5.68 5.68 0 1 0 5.68 5.68V8.69a7.35 7.35 0 0 0 4.29 1.38V7a4.29 4.29 0 0 1-3.23-1.18z" />
              </svg>
            </a>

            {/* Instagram Icon */}
            <a
              href={socialIg}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Official"
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom Rights Line */}
        <div className="pt-6 border-t border-slate-200 text-center space-y-1">
          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
            © 2026 {websiteName}. All rights reserved.
          </p>
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
            <span>Dibuat dengan</span>
            <span className="text-red-500 font-bold">❤️</span>
            <span>untuk Editor Alight Motion Indonesia</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

