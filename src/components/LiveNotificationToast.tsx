import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Check } from 'lucide-react';

interface ToastItem {
  id: string;
  email: string;
  timeAgo: string;
}

const getStoredSeenIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem('alight_seen_toast_ids');
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
};

const saveSeenIds = (set: Set<string>) => {
  try {
    const arr = Array.from(set).slice(-50);
    localStorage.setItem('alight_seen_toast_ids', JSON.stringify(arr));
  } catch {}
};

export const LiveNotificationToast: React.FC = () => {
  const [activeToast, setActiveToast] = useState<ToastItem | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const seenLogIds = useRef<Set<string>>(getStoredSeenIds());
  const hasFetchedInitialLogs = useRef(false);

  const maskEmail = (emailStr: string) => {
    if (!emailStr) return 'user***@gmail.com';
    const parts = emailStr.split('@');
    if (parts.length !== 2) return emailStr;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 3) {
      return `${name}***@${domain}`;
    }
    return `${name.substring(0, 3)}***@${domain}`;
  };

  const showToast = (item: ToastItem) => {
    setActiveToast(item);
    setIsVisible(true);
  };

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const triggerToast = (item: ToastItem) => {
      showToast(item);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    // 🔔 [UPDATE TERBARU: POLL SERVER UNTUK NOTIFIKASI REAL-TIME GLOBAL TERPERSISTENSI]
    // Mengambil log verifikasi terbaru dari backend server tiap 3 detik agar pengguna lain juga langsung dapat notifikasi
    const pollGlobalLogs = async () => {
      try {
        const res = await fetch('/api/logs');
        if (res.ok) {
          const logs: Array<{ id: string; emailMasked: string; timeAgo: string }> = await res.json();
          
          if (!hasFetchedInitialLogs.current) {
            // Mark all pre-existing server logs as seen when user opens the page
            logs.forEach(l => seenLogIds.current.add(l.id));
            saveSeenIds(seenLogIds.current);
            hasFetchedInitialLogs.current = true;
            return; // Never show toast on page entry / initial load
          }

          // Check for any new logs from other users created AFTER page entry
          for (const log of logs) {
            if (!seenLogIds.current.has(log.id)) {
              seenLogIds.current.add(log.id);
              saveSeenIds(seenLogIds.current);
              triggerToast({
                id: log.id,
                email: log.emailMasked,
                timeAgo: log.timeAgo || 'Baru saja'
              });
              break; // Show newest log
            }
          }
        }
      } catch (e) {
        // Silently handle fetch error
      }
    };

    pollGlobalLogs();
    const pollInterval = setInterval(pollGlobalLogs, 3000);

    // Listen ALSO for instant local activation event in app
    const handleNewActivation = (e: CustomEvent) => {
      const record = e.detail;
      if (record && record.email) {
        const masked = maskEmail(record.email);
        const toastId = record.id || String(Date.now());
        if (!seenLogIds.current.has(toastId)) {
          seenLogIds.current.add(toastId);
          saveSeenIds(seenLogIds.current);
          triggerToast({
            id: toastId,
            email: masked,
            timeAgo: 'Baru saja',
          });
        }
      }
    };

    window.addEventListener('alight_new_activation', handleNewActivation as EventListener);

    return () => {
      if (hideTimer) clearTimeout(hideTimer);
      clearInterval(pollInterval);
      window.removeEventListener('alight_new_activation', handleNewActivation as EventListener);
    };
  }, []);

  if (!activeToast || !isVisible) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-[calc(100vw-2.5rem)] sm:max-w-md">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-2xl p-2.5 sm:p-3 shadow-[4px_4px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] text-slate-900 dark:text-white flex items-center justify-between gap-3 relative">
        <div className="flex items-center gap-3 min-w-0">
          {/* Green Icon Box with checkmark circle */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#6EE7B7] border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
            <div className="w-6 h-6 border-2 border-slate-900 dark:border-slate-600 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-slate-900 dark:text-white stroke-[3]" />
            </div>
          </div>

          <div className="min-w-0">
            {/* First Line: Email + TimeAgo */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-[13px] truncate">
                {activeToast.email}
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] sm:text-[12px]">
                {activeToast.timeAgo}
              </span>
            </div>

            {/* Second Line: Sparkles + Berhasil Aktivasi Alight Pro! */}
            <div className="flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-500 shrink-0 fill-pink-100" />
              <span className="font-extrabold text-[#047857] text-xs sm:text-[13px] tracking-tight">
                Berhasil Aktivasi Alight Pro!
              </span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setIsVisible(false)}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0 cursor-pointer"
          title="Tutup Notifikasi"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

