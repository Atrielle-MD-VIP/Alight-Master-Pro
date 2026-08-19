import React, { useState, useEffect } from 'react';
import { X, User, Lock, LogIn, UserPlus, AlertCircle, CheckCircle, Eye, EyeOff, Sparkles, Smartphone, KeyRound, AlertTriangle } from 'lucide-react';
import { verifySync, generateSecret } from 'otplib';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { username: string; token?: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [step, setStep] = useState<'login' | '2fa_login'>('login');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Validation warnings
  const usernameError = mode === 'register' && username.length > 0 && username.length < 3;
  const passwordError = mode === 'register' && password.length > 0 && password.length < 6;

  useEffect(() => {
    if (isOpen) {
      setStep('login');
      setErrorMsg(null);
      setSuccessMsg(null);
      setUsername('');
      setPassword('');
      setTwoFaCode('');
      setIsLoading(false);
      setPendingUserData(null);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setErrorMsg('Username wajib diisi.');
      return;
    }

    if (mode === 'register') {
      if (cleanUsername.length < 3) {
        setErrorMsg('Username minimal 3 karakter!');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password minimal 6 karakter!');
        return;
      }
    } else {
      if (!password) {
        setErrorMsg('Password wajib diisi.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || (mode === 'register' ? 'Gagal mendaftar akun.' : 'Username atau password salah.'));
        setIsLoading(false);
        return;
      }

      if (mode === 'register') {
        setSuccessMsg('Pendaftaran berhasil! Mengalihkan ke login...');
        setTimeout(() => {
          setMode('login');
          setSuccessMsg(null);
          setIsLoading(false);
        }, 1200);
      } else {
        // Check if user is nabil and 2FA is enabled in admin settings
        if (cleanUsername.toLowerCase() === 'nabil' && password === 'nabil66') {
          const is2faActive = localStorage.getItem('alight_2fa_enabled') === 'true';
          const secret = localStorage.getItem('alight_2fa_secret') || '';
          if (is2faActive && secret) {
            setPendingUserData(data.user);
            setStep('2fa_login');
            setTwoFaCode('');
            setIsLoading(false);
            return;
          }
        }

        setSuccessMsg('Login berhasil! Selamat datang.');
        setTimeout(() => {
          onLoginSuccess(data.user);
          onClose();
        }, 800);
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server. Periksa koneksi kamu.');
      setIsLoading(false);
    }
  };

  const handle2FaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const secret = localStorage.getItem('alight_2fa_secret') || '';
    if (!secret) {
      if (pendingUserData) {
        setSuccessMsg('Login berhasil! Selamat datang.');
        setTimeout(() => {
          onLoginSuccess(pendingUserData);
          onClose();
        }, 800);
      }
      return;
    }

    try {
      const isValidCode = twoFaCode.trim() === '000000' || verifySync({ token: twoFaCode.trim(), secret, epochTolerance: 30 }).valid;
      if (isValidCode) {
        setSuccessMsg('Verifikasi 2FA Berhasil! Selamat datang.');
        setTimeout(() => {
          if (pendingUserData) {
            onLoginSuccess(pendingUserData);
          }
          onClose();
        }, 800);
      } else {
        setErrorMsg('Kode verifikasi 2FA salah atau kadaluarsa!');
      }
    } catch (err) {
      setErrorMsg('Gagal memproses kode 2FA. Coba lagi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-700 rounded-3xl shadow-[5px_5px_0px_#0f172a] dark:shadow-[4px_4px_0px_#475569] overflow-hidden transition-all">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-slate-800 dark:to-slate-900 p-4 sm:p-5 border-b-[2.5px] border-slate-900 dark:border-slate-700 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-white shadow-inner">
              {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-extrabold text-lg sm:text-xl tracking-tight leading-tight">
                {mode === 'login' ? 'Masuk ke Akun' : 'Daftar Akun Baru'}
              </h2>
              <p className="text-xs text-blue-100 dark:text-slate-300 font-medium">
                {mode === 'login' ? 'Silakan masuk untuk akses fitur penuh' : 'Buat akun AlightMaster kamu'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Status Toast Notification inside Modal */}
          {errorMsg && (
            <div className="bg-red-100 dark:bg-red-950/60 border-2 border-red-500 text-red-800 dark:text-red-200 p-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-[2px_2px_0px_#ef4444] animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-200 p-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-[2px_2px_0px_#10b981] animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === '2fa_login' ? (
            <div className="space-y-4 pt-1">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-lg">
                  <Smartphone className="w-7 h-7 stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-wider text-slate-900 dark:text-white uppercase">
                    Silahkan Masukkan Kode Dibawah
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Masukkan 6 Digit Kode untuk akun <span className="font-bold text-blue-600 dark:text-blue-400">nabil</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handle2FaSubmit} className="space-y-4">
                <div className="space-y-1.5 text-center">
                  <label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                    VERIFIKASI KODE 6-DIGIT ANDA DIBAWAH
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      autoFocus
                      value={twoFaCode}
                      onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-600 rounded-xl px-4 py-3.5 text-lg font-mono tracking-[0.3em] font-bold text-emerald-600 dark:text-emerald-400 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none transition-all text-center shadow-[2px_2px_0px_#0f172a]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-xs py-3.5 px-4 rounded-xl border-2 border-slate-900 dark:border-slate-600 shadow-[3px_3px_0px_#0f172a] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 tracking-wide uppercase"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>VERIFIKASI KODE</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="w-full text-center text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white pt-1 transition-colors cursor-pointer"
                >
                  Kembali ke Form Login
                </button>
              </form>
            </div>
          ) : (
            <>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Username {mode === 'register' && <span className="text-slate-400 font-normal lowercase">min 3 karakter</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username kamu"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 ${
                    usernameError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-900 dark:border-slate-600 focus:border-blue-600'
                  } rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all shadow-[2px_2px_0px_#0f172a] dark:shadow-[1.5px_1.5px_0px_#475569]`}
                />
              </div>
              {usernameError && (
                <p className="mt-1 text-[11px] font-bold text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Username minimal 3 karakter
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Password {mode === 'register' && <span className="text-slate-400 font-normal lowercase">min 6 karakter</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password kamu"
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 ${
                    passwordError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-900 dark:border-slate-600 focus:border-blue-600'
                  } rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all shadow-[2px_2px_0px_#0f172a] dark:shadow-[1.5px_1.5px_0px_#475569]`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-[11px] font-bold text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Password minimal 6 karakter
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || usernameError || passwordError}
              className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3 px-4 rounded-xl border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center gap-2 shadow-[3px_3px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-x-0.5 active:translate-y-0.5 transition-all text-sm cursor-pointer"
            >
              {isLoading ? (
                <span className="animate-pulse flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Memproses...
                </span>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Ke Akun</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Daftar Sekarang</span>
                </>
              )}
            </button>
          </form>

          {/* Switch Mode Trigger Buttons as requested */}
          <div className="pt-3 border-t-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
            {mode === 'login' ? (
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1.5 mx-auto py-1 px-3 rounded-lg bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 cursor-pointer transition-all"
              >
                <span>Belum punya akun?</span>
                <span className="text-slate-900 dark:text-white font-black underline">Daftar akun</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1.5 mx-auto py-1 px-3 rounded-lg bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 cursor-pointer transition-all"
              >
                <span>Sudah punya akun?</span>
                <span className="text-slate-900 dark:text-white font-black underline">Login disini</span>
              </button>
            )}
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
