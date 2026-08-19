import React, { useRef } from 'react';
import { X, ShieldCheck, RefreshCw } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface HCaptchaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (token: string) => void;
}

export const HCaptchaModal: React.FC<HCaptchaModalProps> = ({ isOpen, onClose, onVerify }) => {
  const captchaRef = useRef<HCaptcha>(null);

  if (!isOpen) return null;

  const handleVerificationSuccess = (token: string) => {
    onVerify(token);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-white dark:bg-slate-900 rounded-[24px] w-full max-w-sm border-[3px] border-slate-900 dark:border-slate-600 shadow-[6px_6px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] relative z-10 flex flex-col overflow-visible animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b-[3px] border-slate-900 dark:border-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-600 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">Verifikasi Keamanan</h2>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sistem Proteksi Anti-Bot</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 active:translate-y-0.5 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] transition-all"
          >
            <X className="w-4 h-4 text-slate-900 dark:text-white stroke-[3]" />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center justify-center space-y-4">
          <div className="bg-[#eff6ff] dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-600 rounded-xl p-3 text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-100 leading-relaxed shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] w-full text-center">
            Selesaikan verifikasi hCaptcha di bawah ini untuk melanjutkan ke langkah verifikasi Pro berikutnya.
          </div>

          <div className="flex justify-center w-full min-h-[78px] py-2">
            <HCaptcha
              sitekey="e8be5a98-f6ea-4d50-be1c-b7f8c2ba5894"
              onVerify={handleVerificationSuccess}
              ref={captchaRef}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 w-full pt-2">
            <button 
              onClick={() => captchaRef.current?.resetCaptcha()}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white dark:text-white border-2 border-slate-900 dark:border-slate-600 rounded-xl py-2.5 text-xs font-bold shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Muat Ulang
            </button>
            <button 
              onClick={onClose}
              className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-600 rounded-xl py-2.5 text-xs font-bold shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-y-0.5 active:shadow-none transition-all"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
