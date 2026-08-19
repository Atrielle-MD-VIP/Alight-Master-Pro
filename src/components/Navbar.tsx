import React, { useState } from 'react';
import { Menu, X, Zap, Sparkles, HelpCircle, History, Moon, Sun, MessageSquare, User, LogIn, Headset } from 'lucide-react';
import { useAppSettings } from '../hooks/useAppSettings';
import { useTheme } from '../hooks/useTheme';

interface NavbarProps {
  onNavigate: (sectionId: string) => void;
  onOpenHistory: () => void;
  activeOrderCount?: number;
  currentUser?: { username: string } | null;
  onOpenAuth?: () => void;
  onOpenProfile?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  onOpenHistory,
  activeOrderCount = 0,
  currentUser,
  onOpenAuth,
  onOpenProfile,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { websiteName } = useAppSettings();
  const { theme, toggleTheme } = useTheme();

  const handleNavClick = (sectionId: string) => {
    onNavigate(sectionId);
    setIsOpen(false);
  };

  return (
    <header className="sticky top-2 z-40 px-3 max-w-2xl mx-auto w-full">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-[2px] border-slate-900 dark:border-slate-700 shadow-[2.5px_2.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] p-2.5 sm:p-3 flex items-center justify-between transition-all">
        {/* Brand Logo */}
        <div 
          onClick={() => handleNavClick('hero')} 
          className="flex items-center gap-2.5 cursor-pointer select-none group"
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
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                {websiteName}
              </span>
              <span className="bg-pink-100 text-pink-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-pink-300 flex items-center gap-0.5 shadow-[1px_1px_0px_#db2777]">
                ★ PRO 1 TH
              </span>
            </div>
            <p className="text-[9px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase -mt-0.5">
              ALIGHT MOTION VERIFIER
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Global Chat Button (Only if logged in) */}
          {currentUser && (
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open_global_chat'));
              }}
              className="flex items-center gap-1.5 bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 border-[2px] border-slate-900 dark:border-slate-700 px-2.5 py-1.5 rounded-xl shadow-[1.5px_1.5px_0px_#0f172a] transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5 text-slate-900 dark:text-white"
              title="Chat Global Komunitas AlightPro"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-black hidden sm:inline">
                Chat Global
              </span>
            </button>
          )}

          {/* Auth Button or User Profile Pill in Header Bar */}
          {currentUser ? (
            <button
              onClick={() => onOpenProfile && onOpenProfile()}
              className="flex items-center gap-1.5 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 border-[2px] border-slate-900 dark:border-slate-700 px-2.5 py-1.5 rounded-xl shadow-[1.5px_1.5px_0px_#0f172a] transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
              title="Klik untuk Pengaturan Akun & Reset Password"
            >
              <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-black text-slate-900 dark:text-white">
                Profile
              </span>
            </button>
          ) : (
            <button
              onClick={() => onOpenAuth && onOpenAuth()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-2.5 py-1.5 rounded-xl border-[2px] border-slate-900 dark:border-slate-700 flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#0f172a] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 border-[2px] border-slate-900 dark:border-slate-700 rounded-xl flex items-center justify-center shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all text-slate-900 dark:text-white cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 stroke-[2.5]" /> : <Moon className="w-5 h-5 stroke-[2.5]" />}
          </button>

          {/* Menu Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-[#fef08a] dark:bg-slate-900 hover:bg-yellow-300 dark:hover:bg-yellow-700 border-[2px] border-slate-900 dark:border-slate-700 rounded-xl flex items-center justify-center shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all text-slate-900 dark:text-white cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {isOpen ? <X className="w-5 h-5 stroke-[2.5]" /> : <Menu className="w-5 h-5 stroke-[2.5]" />}
          </button>
        </div>
      </div>

      {/* Expanded Mobile / Desktop Menu Dropdown */}
      {isOpen && (
        <div className="mt-2 bg-white dark:bg-slate-900 rounded-2xl border-[2px] border-slate-900 dark:border-slate-600 shadow-[3px_3px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] p-2 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Hanya munculkan Login / Dashboard jika BELUM login */}
          {!currentUser && (
            <button
              onClick={() => {
                if (onOpenAuth) onOpenAuth();
                setIsOpen(false);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-3 rounded-xl border-[1.5px] border-slate-900 flex items-center justify-center gap-2 shadow-[1.5px_1.5px_0px_#0f172a] transition-all text-xs sm:text-sm cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Login / Daftar Akun (Dashboard)</span>
            </button>
          )}

          {currentUser && (
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open_global_chat'));
                setIsOpen(false);
              }}
              className="w-full bg-[#dcfce7] dark:bg-slate-900 hover:bg-green-200 dark:hover:bg-green-800 text-slate-900 dark:text-white font-bold py-2 px-3 rounded-xl border-[1.5px] border-slate-900 dark:border-slate-600 flex items-center justify-between shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] transition-all text-left text-xs sm:text-sm"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Chat Global Komunitas</span>
              </div>
              <span className="text-[8px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded border border-slate-900 dark:border-slate-600 uppercase">
                Aktif
              </span>
            </button>
          )}

          <button
            onClick={() => handleNavClick('verification-panel')}
            className="w-full bg-[#e0f2fe] dark:bg-slate-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-slate-900 dark:text-white font-bold py-2 px-3 rounded-xl border-[1.5px] border-slate-900 dark:border-slate-600 flex items-center justify-between shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] transition-all text-left text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600 fill-blue-500" />
              <span>Mulai Verifikasi</span>
            </div>
            <span className="text-[9px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-extrabold px-1.5 py-0.5 rounded border border-slate-900 dark:border-slate-600">
              PRO 1 TH
            </span>
          </button>

          <button
            onClick={() => handleNavClick('features')}
            className="w-full bg-[#fde8f2] dark:bg-slate-900 hover:bg-pink-200 dark:hover:bg-pink-800 text-slate-900 dark:text-white font-bold py-2 px-3 rounded-xl border-[1.5px] border-slate-900 dark:border-slate-600 flex items-center gap-2 shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] transition-all text-left text-xs sm:text-sm"
          >
            <Sparkles className="w-4 h-4 text-pink-600" />
            <span>Fitur Alight Motion Pro</span>
          </button>

          <button
            onClick={() => handleNavClick('faq')}
            className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold py-2 px-3 rounded-xl border-[1.5px] border-slate-900 dark:border-slate-600 flex items-center gap-2 shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] transition-all text-left text-xs sm:text-sm"
          >
            <HelpCircle className="w-4 h-4 text-purple-600" />
            <span>Pertanyaan Umum (FAQ)</span>
          </button>

          <button
            onClick={() => {
              onOpenHistory();
              setIsOpen(false);
            }}
            className="w-full bg-[#fef08a] dark:bg-slate-900 hover:bg-yellow-200 dark:hover:bg-yellow-800 text-slate-900 dark:text-white font-bold py-2 px-3 rounded-xl border-[1.5px] border-slate-900 dark:border-slate-600 flex items-center justify-between shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] transition-all text-left text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-700" />
              <span>Riwayat Order</span>
            </div>
            {activeOrderCount > 0 && (
              <span className="bg-amber-400 text-slate-900 dark:text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border border-slate-900 dark:border-slate-600">
                {activeOrderCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open_support_modal'));
              setIsOpen(false);
            }}
            className="w-full bg-[#e0e7ff] dark:bg-slate-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-slate-900 dark:text-white font-bold py-2 px-3 rounded-xl border-[1.5px] border-slate-900 dark:border-slate-600 flex items-center gap-2 shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] transition-all text-left text-xs sm:text-sm"
          >
            <Headset className="w-4 h-4 text-indigo-700" />
            <span>Kontak CS & Komunitas</span>
          </button>

          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open_feedback_modal'));
              setIsOpen(false);
            }}
            className="w-full bg-[#dcfce7] dark:bg-slate-900 hover:bg-green-200 dark:hover:bg-green-800 text-slate-900 dark:text-white font-bold py-2 px-3 rounded-xl border-[1.5px] border-slate-900 dark:border-slate-600 flex items-center gap-2 shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] transition-all text-left text-xs sm:text-sm"
          >
            <MessageSquare className="w-4 h-4 text-emerald-700" />
            <span>Kirim Masukan</span>
          </button>
        </div>
      )}
    </header>
  );
};
