import React, { useState, useEffect } from 'react';
import { Mail, Link2, CheckCircle2, ArrowRight, Loader2, RefreshCw, Copy, ExternalLink, ShieldCheck, Clock, Key, Video, Award, Layers, Calendar, Sparkles, X, Check, Zap, Wrench, AlertTriangle, Database } from 'lucide-react';
import { VerificationRecord } from '../types';
import { HCaptchaModal } from './HCaptchaModal';

interface VerificationPanelProps {
  onSuccess: (record: VerificationRecord) => void;
  currentUser?: { username: string } | null;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({ onSuccess, currentUser }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isMaintenance, setIsMaintenance] = useState(() => {
    return localStorage.getItem('alight_maintenance_mode') === 'true';
  });
  const [maintTitle, setMaintTitle] = useState(() => {
    return localStorage.getItem('alight_maintenance_title') || 'Layanan Verifikasi Ditangguhkan Sementara';
  });
  const [maintDesc, setMaintDesc] = useState(() => {
    return localStorage.getItem('alight_maintenance_desc') || 'Sistem verifikasi akun Alight Motion Pro saat ini sedang dalam pemeliharaan terjadwal oleh Administrator untuk optimasi performa backend. Seluruh pengiriman link login OOB dan verifikasi lisensi dihentikan sementara.';
  });

  useEffect(() => {
    const checkMaintenance = () => {
      const nextMaint = localStorage.getItem('alight_maintenance_mode') === 'true';
      const nextTitle = localStorage.getItem('alight_maintenance_title') || 'Layanan Verifikasi Ditangguhkan Sementara';
      const nextDesc = localStorage.getItem('alight_maintenance_desc') || 'Sistem verifikasi akun Alight Motion Pro saat ini sedang dalam pemeliharaan terjadwal oleh Administrator untuk optimasi performa backend. Seluruh pengiriman link login OOB dan verifikasi lisensi dihentikan sementara.';

      setIsMaintenance((prev) => (prev !== nextMaint ? nextMaint : prev));
      setMaintTitle((prev) => (prev !== nextTitle ? nextTitle : prev));
      setMaintDesc((prev) => (prev !== nextDesc ? nextDesc : prev));
    };
    window.addEventListener('alight_settings_updated', checkMaintenance);
    return () => window.removeEventListener('alight_settings_updated', checkMaintenance);
  }, []);

  const [email, setEmail] = useState('');
  const [oobLink, setOobLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successRecord, setSuccessRecord] = useState<VerificationRecord | null>(null);
  const [showLinkSentToast, setShowLinkSentToast] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);

  useEffect(() => {
    if (currentStep === 2) {
      setShowLinkSentToast(true);
      const timer = setTimeout(() => {
        setShowLinkSentToast(false);
      }, 5000); // Disappears automatically after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Timer for Step 2
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes = 180s
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check quota limit before processing
  const checkQuota = (): string | null => {
    try {
      const limitStr = localStorage.getItem('alight_quota_limit');
      const periodStr = localStorage.getItem('alight_quota_period') || 'hari';
      const resetHoursStr = localStorage.getItem('alight_reset_hours') || '24';
      const isPermanent = localStorage.getItem('alight_is_permanent_quota') === 'true' || limitStr === 'Permanen';

      if (isPermanent) {
        return null; // Unlimited access
      }

      let limit = limitStr !== null && limitStr !== '' ? parseFloat(limitStr) : 5;
      if (limit < 0) return null; // -1 signifies unlimited

      const resetHours = parseFloat(resetHoursStr) || 24;

      // Calculate today's used count from saved orders
      let usedCount = 0;
      try {
        const savedOrders = localStorage.getItem('alightpro_orders');
        if (savedOrders) {
          const orders = JSON.parse(savedOrders);
          const today = new Date().toDateString();
          const todayOrders = orders.filter((o: any) => new Date(o.createdAt || Date.now()).toDateString() === today);
          usedCount = todayOrders.length;
        }
      } catch (e) {}

      let rem = Math.max(0, limit - usedCount);

      // Auto-reset check based on elapsed reset hours
      const lastResetStr = localStorage.getItem('alight_last_reset_time');
      const lastReset = lastResetStr ? parseInt(lastResetStr, 10) : Date.now();
      if (!lastResetStr) {
        localStorage.setItem('alight_last_reset_time', String(Date.now()));
      } else if (Date.now() - lastReset >= resetHours * 3600 * 1000) {
        localStorage.setItem('alight_last_reset_time', String(Date.now()));
        window.dispatchEvent(new CustomEvent('alight_settings_updated'));
      }

      if (!isNaN(limit) && limit === 0) {
        return `⚠️ Limit Harian ${periodStr} Telah Habis ${limit} Verifikasi Tidak Dapat Diproses Silahkan Tunggu Reset Limit Harian 24jam`;
      }

      if (usedCount >= limit || rem <= 0) {
        return `⚠️ Sisa Kredit Verifikasi telah habis ${usedCount} Dari ${limit} Terpakai Sisa Kredit 0, verifikasi Tidak Dapat Diproses Silahkan Tunggu Reset Kredit 24jam`;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  // Step 1: Send OOB Link Request
  const handleSendOob = async (e: React.FormEvent) => {
    e.preventDefault();

    const quotaErr = checkQuota();
    if (quotaErr) {
      setErrorMsg(quotaErr);
      return;
    }

    if (!email || !email.includes('@')) {
      setErrorMsg('Masukkan alamat email yang valid.');
      return;
    }

    setErrorMsg('');
    setShowCaptcha(true);
  };

  const executeSendOob = async () => {
    setShowCaptcha(false);
    setIsLoading(true);
    setLoadingText('Mengirim Link OOB...');

    try {
      const res = await fetch('/api/oob/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error('Server Vercel memberikan respons non-JSON. Silakan coba lagi beberapa saat lagi.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses permintaan OOB');
      }

      setIsLoading(false);
      setCurrentStep(2);
      setTimeLeft(data.expiresInSeconds || 180);
      setTimerActive(true);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Terjadi kesalahan server.');
    }
  };

  // Step 2: Verify OOB Link Token
  const handleVerifyOob = async (e: React.FormEvent) => {
    e.preventDefault();

    const quotaErr = checkQuota();
    if (quotaErr) {
      setErrorMsg(quotaErr);
      return;
    }

    if (!oobLink || oobLink.length < 5) {
      setErrorMsg('Masukkan link OOB atau token autentikasi yang valid dari email kamu.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);
    setLoadingText('Memverifikasi token OOB dengan Firebase Auth Server...');

    try {
      let activeUser: { username: string } | null = currentUser || null;
      if (!activeUser) {
        try {
          const saved = localStorage.getItem('alight_user_session');
          if (saved) activeUser = JSON.parse(saved);
        } catch (e) {}
      }

      let geoInfo = { ip: '', country: '', regionCity: '' };
      try {
        const geoRes = await fetch('https://ipwho.is/').catch(() => null);
        if (geoRes && geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData && geoData.ip) {
            geoInfo = {
              ip: geoData.ip || '',
              country: geoData.country ? `${geoData.country} (${geoData.country_code || ''})`.trim() : '',
              regionCity: [geoData.city, geoData.region].filter(Boolean).join(', ')
            };
          }
        }

        // Secondary fallback if ipwho.is is blocked
        if (!geoInfo.ip) {
          const ipapiRes = await fetch('https://ipapi.co/json/').catch(() => null);
          if (ipapiRes && ipapiRes.ok) {
            const ipData = await ipapiRes.json();
            if (ipData && ipData.ip) {
              geoInfo = {
                ip: ipData.ip || '',
                country: ipData.country_name ? `${ipData.country_name} (${ipData.country_code || ''})`.trim() : '',
                regionCity: [ipData.city, ipData.region].filter(Boolean).join(', ')
              };
            }
          }
        }
      } catch (e) {}

      const res = await fetch('/api/oob/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          oobLink,
          isLoggedIn: Boolean(activeUser?.username),
          username: activeUser?.username || '',
          ip: geoInfo.ip,
          country: geoInfo.country,
          regionCity: geoInfo.regionCity
        })
      });

      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error('Server Vercel memberikan respons non-JSON. Silakan coba lagi beberapa saat lagi.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Verifikasi Token OOB Gagal.');
      }

      // Deduct remaining quota upon successful verification
      try {
        window.dispatchEvent(new CustomEvent('alight_new_activation', { detail: data.record }));
      } catch (e) {
        console.error(e);
      }

      setIsLoading(false);
      setSuccessRecord(data.record);
      setCurrentStep(3);
      onSuccess(data.record);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Gagal memverifikasi token OOB.');
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setEmail('');
    setOobLink('');
    setErrorMsg('');
    setSuccessRecord(null);
  };

  const copyLicense = () => {
    if (successRecord) {
      navigator.clipboard.writeText(
        `SERTIFIKAT AlightMaster VERIFICATION\nEmail: ${successRecord.email}\nStatus: PRO 1 TAHUN (ACTIVE)\nID Lisensi: ${successRecord.id}\nTanggal: ${successRecord.timestamp}\nKadaluarsa: ${successRecord.expiresAt}`
      );
      alert('Sertifikat Verifikasi berhasil disalin!');
    }
  };

  return (
    <section id="verification-panel" className="px-3 max-w-2xl mx-auto w-full my-4 select-none">
      {currentStep === 2 && showLinkSentToast && (
        <div className="fixed top-[72px] right-3 sm:right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300 bg-[#6EE7B7] dark:bg-emerald-700 border-2 border-slate-900 dark:border-slate-600 rounded-2xl px-3 py-2 flex items-center justify-between gap-2.5 shadow-[3.5px_3.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] max-w-[320px]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
              <div className="w-4 h-4 border-2 border-slate-900 dark:border-slate-600 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-slate-900 dark:text-white stroke-[3]" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">Link Dikirim!</p>
              <p className="text-[11px] font-semibold text-slate-900 dark:text-white leading-tight truncate">Cek inbox/spam email kamu.</p>
            </div>
          </div>
          <button
            onClick={() => setShowLinkSentToast(false)}
            className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-900 dark:border-slate-600 flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shrink-0 cursor-pointer"
            title="Tutup Notifikasi"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-600 rounded-[22px] p-4 sm:p-5 shadow-[4px_4px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
        {/* Panel Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] dark:bg-red-700 border border-slate-900 dark:border-slate-600 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] dark:bg-yellow-600 border border-slate-900 dark:border-slate-600 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] dark:bg-green-600 border border-slate-900 dark:border-slate-600 inline-block"></span>
          </div>
          <span className="text-xs sm:text-[13px] font-black tracking-wider uppercase ml-1.5 text-slate-900 dark:text-white">
            PANEL VERIFIKASI PRO
          </span>
        </div>

        {/* Header Line Divider */}
        <div className="h-[1.5px] bg-slate-900 w-full mb-4" />

        {isMaintenance && currentStep !== 3 ? (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center text-amber-500 shadow-[2.5px_2.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
              <Wrench className="w-7 h-7 stroke-[2.5]" />
            </div>
            
            <div className="space-y-2 max-w-md mx-auto px-2">
              <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-black px-3 py-1 rounded-full text-[10px] tracking-wider uppercase inline-block">
                Sistem Sedang Pemeliharaan
              </span>
              <h3 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
                {maintTitle}
              </h3>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
                {maintDesc}
              </p>
            </div>

            <div className="w-full h-[1.5px] bg-slate-100 dark:bg-slate-800" />

            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Silakan coba beberapa saat lagi atau hubungi layanan bantuan CS di kanan bawah.
            </div>
          </div>
        ) : (
          <>
            {/* Step Navigation Tabs */}
            <div className="bg-[#f0f4f8] dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-600 rounded-[16px] p-1 mb-5">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => currentStep > 1 && setCurrentStep(1)}
              className={`py-1.5 px-1 text-xs font-extrabold transition-all flex items-center justify-center gap-1 ${
                currentStep === 1
                  ? 'bg-[#93c5fd] dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-600 text-slate-900 dark:text-white rounded-[12px] shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]'
                  : 'bg-transparent text-slate-500 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>1. Email</span>
            </button>

            <button
              onClick={() => currentStep > 2 && setCurrentStep(2)}
              disabled={currentStep < 2}
              className={`py-1.5 px-1 text-xs font-extrabold transition-all flex items-center justify-center gap-1 ${
                currentStep === 2
                  ? 'bg-[#93c5fd] dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-600 text-slate-900 dark:text-white rounded-[12px] shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]'
                  : 'bg-transparent text-slate-400 font-bold disabled:opacity-50'
              }`}
            >
              <span>2. Tempel OOB</span>
            </button>

            <button
              disabled={currentStep < 3}
              className={`py-1.5 px-1 text-xs font-extrabold transition-all flex items-center justify-center gap-1 ${
                currentStep === 3
                  ? 'bg-[#6ee7b7] dark:bg-emerald-700 border-[1.5px] border-slate-900 dark:border-slate-600 text-slate-900 dark:text-white rounded-[12px] shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]'
                  : 'bg-transparent text-slate-400 font-bold disabled:opacity-50'
              }`}
            >
              <span>3. Hasil Pro</span>
            </button>
          </div>
        </div>

        {/* Panel Content Body */}
        <div>
          {errorMsg && (
            <div className="mb-3.5 bg-red-100 border-[1.5px] border-slate-900 dark:border-slate-600 text-red-900 p-2.5 rounded-xl font-bold text-xs shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* STEP 1 FORM */}
          {currentStep === 1 && (
            <form onSubmit={handleSendOob} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider mb-2">
                  ALAMAT EMAIL AlightMaster
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contoh: emailkamu@gmail.com"
                    className="w-full bg-[#f8fafc] dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-600 text-slate-900 dark:text-white text-xs sm:text-sm rounded-[12px] pl-9 pr-3 py-2.5 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <p className="mt-2 text-[11px] sm:text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 leading-normal">
                  Sistem akan menginstruksikan server Alight Creative untuk mengirimkan link login OOB
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#93c5fd] dark:bg-slate-900 hover:bg-blue-400 text-slate-900 dark:text-white font-extrabold text-xs sm:text-sm py-2.5 px-4 rounded-[12px] border-[1.5px] border-slate-900 dark:border-slate-600 shadow-[2.5px_2.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-900 dark:text-white" />
                    <span>{loadingText}</span>
                  </>
                ) : (
                  <>
                    <span>Kirim Link OOB (Langkah 1)</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2 FORM */}
          {currentStep === 2 && (
            <form onSubmit={handleVerifyOob} className="space-y-3">
              {/* Success Notification Banner */}
              <div className="bg-[#d1fae5] dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-xl p-2.5 flex items-center gap-2.5 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                <div className="w-6 h-6 rounded-full bg-[#a7f3d0] dark:bg-slate-900 border border-slate-900 dark:border-slate-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-800 stroke-[2.5]" />
                </div>
                <span className="font-extrabold text-[11px] sm:text-xs text-slate-900 dark:text-white">
                  Link OOB AlightMaster berhasil dikirim ke email kamu!
                </span>
              </div>

              {/* Countdown Timer Banner */}
              <div className="bg-[#fce7f3] dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-xl p-2.5 flex items-center justify-between shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-600 stroke-[2.5]" />
                  <span className="text-[11px] sm:text-xs font-extrabold text-slate-900 dark:text-white">
                    {timeLeft > 0 ? 'Masa Berlaku OOB 3 Menit' : 'Waktu OOB Telah Habis!'}
                  </span>
                </div>
                {timeLeft > 0 ? (
                  <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white font-mono bg-[#bbf7d0] dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border-2 border-slate-900 dark:border-slate-600 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                    {formatTime(timeLeft)}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/oob/send', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email })
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setTimeLeft(data.expiresInSeconds || 180);
                          setTimerActive(true);
                          alert('Link OOB berhasil dikirim ulang ke email kamu!');
                        } else {
                          alert(data.error || 'Gagal mengirim ulang link OOB');
                        }
                      } catch (err) {
                        console.error(err);
                        alert('Gagal menghubungi server.');
                      }
                    }}
                    className="bg-[#bbf7d0] dark:bg-slate-900 hover:bg-emerald-300 text-slate-900 dark:text-white font-black text-xs px-2.5 py-1 rounded-lg border-2 border-slate-900 dark:border-slate-600 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Kirim Ulang</span>
                  </button>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-black uppercase text-slate-900 dark:text-white tracking-wider">
                    TEMPEL LINK OOB EMAIL
                  </label>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{email}</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Link2 className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                  </div>
                  <input
                    type="text"
                    required
                    value={oobLink}
                    onChange={(e) => setOobLink(e.target.value)}
                    placeholder="https://alight-creative.firebaseapp.com/__/auth/links?link=https://alightcreative.com/auth_action/..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 text-slate-900 dark:text-white text-xs rounded-xl pl-10 pr-3 py-2.5 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]"
                  />
                </div>
                <p className="mt-1.5 text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Salin link login dari email AlightMaster secara utuh.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full bg-[#e2e8f0] dark:bg-slate-700 hover:bg-slate-300 text-slate-900 dark:text-white font-extrabold text-xs py-2.5 px-3 rounded-xl border-2 border-slate-900 dark:border-slate-600 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Ganti Email</span>
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#fbcfe8] dark:bg-slate-900 hover:bg-[#f472b6] text-slate-900 dark:text-white font-extrabold text-xs py-2.5 px-3 rounded-xl border-2 border-slate-900 dark:border-slate-600 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-900 dark:text-white" />
                      <span>{loadingText}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-slate-900 dark:text-white fill-slate-900" />
                      <span>Konfirmasi Order 1 Tahun</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}


          {/* STEP 3 SUCCESS RESULT */}
          {currentStep === 3 && successRecord && (
            <div className="relative bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-600 rounded-[28px] p-5 sm:p-6 shadow-[5px_5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] space-y-4 animate-in fade-in zoom-in-95 duration-300">
              
              {/* Close Button Top Right */}
              <button
                type="button"
                onClick={handleReset}
                className="absolute top-4 right-4 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-[2px] border-slate-900 dark:border-slate-600 rounded-xl p-1.5 transition-all shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-x-0.5 active:translate-y-0.5"
                title="Tutup / Reset"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Top Header Badge & Checkmark Icon */}
              <div className="flex flex-col items-center justify-center pt-2">
                {/* PRO ACTIVE Badge */}
                <div className="bg-[#fef08a] dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-600 rounded-full px-3 py-0.5 text-[11px] font-black uppercase text-slate-900 dark:text-white flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] z-10">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>PRO ACTIVE</span>
                </div>

                {/* Double Ring Green Checkmark Circle */}
                <div className="relative mt-[-8px]">
                  <div className="w-16 h-16 rounded-full bg-[#86efac] dark:bg-green-800 border-[2.5px] border-slate-900 dark:border-slate-600 flex items-center justify-center p-1.5 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                    <div className="w-full h-full rounded-full bg-[#22c55e] dark:bg-green-600 border-[1.5px] border-slate-900 dark:border-slate-600 flex items-center justify-center text-slate-900 dark:text-white">
                      <Check className="w-8 h-8 stroke-[3.5] text-slate-900 dark:text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Headline & Subtitle */}
              <div className="text-center space-y-1">
                <h3 className="font-black text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-1.5">
                  <span>Verifikasi Berhasil!</span>
                  <span className="text-2xl">🎉</span>
                </h3>
                <p className="text-xs sm:text-[13px] font-bold text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Selamat! Akun Alight Motion kamu resmi aktif versi Pro 1 Tahun.
                </p>
              </div>

              {/* 3 Feature Pills Row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#dbeafe] dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-600 rounded-[18px] p-2.5 sm:p-3 flex flex-col items-center text-center gap-1 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                  <Video className="w-5 h-5 text-slate-900 dark:text-white stroke-[2.25]" />
                  <span className="font-black text-[11px] sm:text-xs text-slate-900 dark:text-white leading-tight">
                    No Watermark
                  </span>
                </div>

                <div className="bg-[#dcfce7] dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-600 rounded-[18px] p-2.5 sm:p-3 flex flex-col items-center text-center gap-1 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                  <Award className="w-5 h-5 text-slate-900 dark:text-white stroke-[2.25]" />
                  <span className="font-black text-[11px] sm:text-xs text-slate-900 dark:text-white leading-tight">
                    1 Tahun Full
                  </span>
                </div>

                <div className="bg-[#fef9c3] dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-600 rounded-[18px] p-2.5 sm:p-3 flex flex-col items-center text-center gap-1 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                  <Layers className="w-5 h-5 text-slate-900 dark:text-white stroke-[2.25]" />
                  <span className="font-black text-[11px] sm:text-xs text-slate-900 dark:text-white leading-tight">
                    Full XML Preset
                  </span>
                </div>
              </div>

              {/* Details Box */}
              <div className="bg-white dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-600 rounded-[20px] p-4 space-y-3 text-xs shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <span className="font-bold text-slate-500 dark:text-slate-400 text-[11.5px]">Email Terdaftar:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-[220px]">
                    {successRecord.email}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <span className="font-bold text-slate-500 dark:text-slate-400 text-[11.5px]">Masa Berlaku Lisensi:</span>
                  <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-white">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
                    <span>{successRecord.expiresAt}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <span className="font-bold text-slate-500 dark:text-slate-400 text-[11.5px]">Status Akun:</span>
                  <span className="bg-[#86efac] dark:bg-green-800 text-slate-950 font-black text-[10.5px] tracking-wide px-2.5 py-0.5 rounded-full border border-slate-900 dark:border-slate-600 uppercase shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                    LINKED VERIFIED
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-500 dark:text-slate-400 text-[11.5px]">Auto Renewal:</span>
                  <div className="flex items-center gap-1 font-extrabold text-[#16a34a]">
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                    <span>Aktif</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={copyLicense}
                  className="w-full bg-[#fef08a] dark:bg-slate-900 hover:bg-yellow-300 dark:hover:bg-yellow-700 text-slate-900 dark:text-white font-extrabold text-xs sm:text-sm py-3 px-4 rounded-[14px] border-[2px] border-slate-900 dark:border-slate-600 shadow-[3px_3px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4 stroke-[2.5]" />
                  <span>Salin Bukti Verifikasi</span>
                </button>

                <a
                  href="https://alightmotion.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#93c5fd] dark:bg-slate-900 hover:bg-blue-400 text-slate-900 dark:text-white font-extrabold text-xs sm:text-sm py-3 px-4 rounded-[14px] border-[2px] border-slate-900 dark:border-slate-600 shadow-[3px_3px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  <span>Mulai Gunakan Alight Motion Pro</span>
                </a>
              </div>
            </div>
          )}
        </div>
          </>
        )}
      </div>

      <HCaptchaModal 
        isOpen={showCaptcha} 
        onClose={() => setShowCaptcha(false)} 
        onVerify={() => executeSendOob()} 
      />
    </section>
  );
};
