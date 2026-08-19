import React from 'react';
import { HelpCircle } from 'lucide-react';

export const InstructionCard: React.FC = () => {
  return (
    <div className="px-3 max-w-2xl mx-auto w-full my-2.5 select-none">
      <div className="bg-[#f0eefe] dark:bg-slate-900 border-[2px] border-slate-900 dark:border-slate-600 rounded-[18px] p-3.5 sm:p-4 shadow-[3px_3px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] text-slate-900 dark:text-white">
        {/* Title row */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <HelpCircle className="w-4 h-4 text-[#8b5cf6] stroke-[2.2] shrink-0" />
          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
            Cara Mengambil Link Login OOB Alight Creative:
          </h3>
        </div>

        {/* Numbered List */}
        <ol className="space-y-1.5 text-[11px] sm:text-xs leading-relaxed font-normal text-slate-900 dark:text-white">
          <li className="flex items-start gap-1">
            <span className="font-extrabold text-slate-900 dark:text-white shrink-0">1.</span>
            <span>
              Ketik email aktif akun Alight Motion kamu lalu klik tombol{' '}
              <strong className="font-extrabold text-slate-900 dark:text-white">Kirim Link OOB</strong>.
            </span>
          </li>
          <li className="flex items-start gap-1">
            <span className="font-extrabold text-slate-900 dark:text-white shrink-0">2.</span>
            <span>
              Buka pesan email masuk (Cek inbox/spam) dari{' '}
              <em className="italic font-medium">Alight Creative</em>.
            </span>
          </li>
          <li className="flex items-start gap-1">
            <span className="font-extrabold text-slate-900 dark:text-white shrink-0">3.</span>
            <span>
              <strong className="font-extrabold text-slate-900 dark:text-white">Tahan tekan lama</strong> pada tombol{' '}
              <em className="italic font-medium">Log In to AlightMaster</em>.
            </span>
          </li>
          <li className="flex items-start gap-1">
            <span className="font-extrabold text-slate-900 dark:text-white shrink-0">4.</span>
            <span>
              Pilih opsi{' '}
              <strong className="font-extrabold text-slate-900 dark:text-white">Salin Alamat Link</strong>{' '}
              (Copy Link Address).
            </span>
          </li>
          <li className="flex items-start gap-1">
            <span className="font-extrabold text-slate-900 dark:text-white shrink-0">5.</span>
            <span>Tempelkan link OOB tersebut pada Langkah 2 lalu klik konfirmasi.</span>
          </li>
        </ol>
      </div>
    </div>
  );
};

