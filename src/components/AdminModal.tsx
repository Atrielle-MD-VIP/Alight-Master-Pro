import React, { useState, useEffect } from 'react';
import { 
  Shield, Lock, User, Key, CheckCircle, XCircle, Users, Activity, 
  Settings, LogOut, Search, RefreshCw, Bell, Database, ShieldCheck, 
  AlertTriangle, Check, X, Eye, EyeOff, Radio, Terminal, Server, Sparkles, Zap, Trash2, Ban, Sliders, Wrench,
  Share2, MessageSquare, Send, UserCheck, Globe, Link, Smartphone, QrCode, KeyRound, Copy, LogIn, VolumeX, Clock, UserX, ShieldAlert, Edit3
} from 'lucide-react';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { VerificationRecord, LoginLog, MutedUserEntry, UserQuotaRule } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: VerificationRecord[];
  onClearOrders: () => void;
  onDeleteOrder?: (id: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, orders, onClearOrders, onDeleteOrder }) => {
  const [step, setStep] = useState<'login' | '2fa_login' | 'dashboard'>(() => {
    return localStorage.getItem('alight_admin_logged_in') === 'true' ? 'dashboard' : 'login';
  });
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('alight_admin_saved_username') || '';
  });
  const [password, setPassword] = useState(() => {
    return localStorage.getItem('alight_admin_saved_password') || '';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    const val = localStorage.getItem('alight_admin_remember');
    return val !== null ? val === 'true' : true;
  });
  const [errorMsg, setErrorMsg] = useState('');
  
  // Dashboard active tab
  const [activeTab, setActiveTab] = useState<'logs' | 'login_logs' | 'mute' | 'settings' | 'branding' | 'banner_laporan' | 'cs_links' | '2fa' | 'feedback' | 'maintenance'>('logs');
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [loginSearchQuery, setLoginSearchQuery] = useState('');
  const [isLoadingLoginLogs, setIsLoadingLoginLogs] = useState(false);

  // Mute Users Management State
  const [mutedUsers, setMutedUsers] = useState<MutedUserEntry[]>([]);
  const [isLoadingMutedUsers, setIsLoadingMutedUsers] = useState(false);
  const [muteTargetUser, setMuteTargetUser] = useState('');
  const [muteDurationText, setMuteDurationText] = useState('1jam');
  const [isPermanentMute, setIsPermanentMute] = useState(false);
  const [muteReason, setMuteReason] = useState('');
  const [muteSearchQuery, setMuteSearchQuery] = useState('');
  const [isMutingSubmitting, setIsMutingSubmitting] = useState(false);
  const [unmutingTargetId, setUnmutingTargetId] = useState<string | null>(null);

  // Custom User / IP Quotas Management State
  const [customQuotas, setCustomQuotas] = useState<UserQuotaRule[]>([]);
  const [isLoadingCustomQuotas, setIsLoadingCustomQuotas] = useState(false);
  const [quotaTargetInput, setQuotaTargetInput] = useState('');
  const [quotaCustomLimit, setQuotaCustomLimit] = useState('50');
  const [isPermanentQuota, setIsPermanentQuota] = useState(false);
  const [quotaCustomReason, setQuotaCustomReason] = useState('');
  const [quotaSearchQuery, setQuotaSearchQuery] = useState('');
  const [isQuotaSubmitting, setIsQuotaSubmitting] = useState(false);

  const fetchLoginLogs = async () => {
    setIsLoadingLoginLogs(true);
    try {
      const res = await fetch('/api/admin/login-logs');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLoginLogs(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch login logs:', err);
    } finally {
      setIsLoadingLoginLogs(false);
    }
  };

  const fetchMutedUsers = async () => {
    setIsLoadingMutedUsers(true);
    try {
      const res = await fetch('/api/admin/muted-users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMutedUsers(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch muted users:', err);
    } finally {
      setIsLoadingMutedUsers(false);
    }
  };

  const fetchCustomQuotas = async () => {
    setIsLoadingCustomQuotas(true);
    try {
      const res = await fetch('/api/admin/custom-quotas');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCustomQuotas(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch custom quotas:', err);
    } finally {
      setIsLoadingCustomQuotas(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'login_logs' || (isOpen && step === 'dashboard')) {
      fetchLoginLogs();
    }
    if (activeTab === 'mute' || (isOpen && step === 'dashboard')) {
      fetchMutedUsers();
    }
    if (activeTab === 'settings' || (isOpen && step === 'dashboard')) {
      fetchCustomQuotas();
    }
  }, [activeTab, isOpen, step]);

  const handleCustomQuotaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotaTargetInput.trim()) {
      alert('Silakan masukkan Username atau Alamat IP target untuk kuota khusus');
      return;
    }
    setIsQuotaSubmitting(true);
    try {
      const res = await fetch('/api/admin/custom-quotas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: quotaTargetInput.trim(),
          username: quotaTargetInput.trim(),
          quotaLimit: isPermanentQuota ? -1 : (parseInt(quotaCustomLimit, 10) || 5),
          isPermanent: isPermanentQuota,
          reason: quotaCustomReason.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessToast(data.message || `Aturan kuota untuk "${quotaTargetInput}" berhasil ditetapkan!`);
        setQuotaTargetInput('');
        setQuotaCustomLimit('50');
        setIsPermanentQuota(false);
        setQuotaCustomReason('');
        fetchCustomQuotas();
        setTimeout(() => setSuccessToast(null), 2500);
      } else {
        alert(data.error || 'Gagal menyimpan aturan kuota');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi saat memproses kuota khusus');
    } finally {
      setIsQuotaSubmitting(false);
    }
  };

  const handleDeleteCustomQuota = async (targetToDelete: string, id?: string) => {
    try {
      setCustomQuotas(prev => prev.filter(q => (id ? q.id !== id : true) && q.target !== targetToDelete));
      const res = await fetch('/api/admin/delete-custom-quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: targetToDelete, id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessToast(data.message || `Aturan kuota untuk "${targetToDelete}" berhasil dihapus.`);
        fetchCustomQuotas();
        setTimeout(() => setSuccessToast(null), 2000);
      } else {
        fetchCustomQuotas();
        alert(data.error || 'Gagal menghapus kuota khusus');
      }
    } catch (err) {
      fetchCustomQuotas();
      alert('Terjadi kesalahan koneksi');
    }
  };

  const handleMuteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!muteTargetUser.trim()) {
      alert('Silakan masukkan username atau alamat IP pengguna yang ingin dimute');
      return;
    }
    setIsMutingSubmitting(true);
    try {
      const res = await fetch('/api/admin/mute-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: muteTargetUser.trim(),
          username: muteTargetUser.trim(),
          durationInput: isPermanentMute ? 'permanen' : (muteDurationText.trim() || '1jam'),
          isPermanent: isPermanentMute,
          reason: muteReason.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessToast(data.message || `Target "${muteTargetUser}" berhasil dimute!`);
        setMuteTargetUser('');
        setMuteDurationText('1jam');
        setIsPermanentMute(false);
        setMuteReason('');
        fetchMutedUsers();
        setTimeout(() => setSuccessToast(null), 2500);
      } else {
        alert(data.error || 'Gagal memute target');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi saat memproses mute target');
    } finally {
      setIsMutingSubmitting(false);
    }
  };

  const handleUnmuteUser = async (targetToUnmute: string, id?: string) => {
    const key = id || targetToUnmute;
    setUnmutingTargetId(key);
    // Optimistic UI update so the user immediately sees the entry removed
    setMutedUsers(prev => prev.filter(m => (id ? m.id !== id : true) && m.target !== targetToUnmute && m.username !== targetToUnmute && m.ip !== targetToUnmute));

    try {
      const res = await fetch('/api/admin/unmute-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: targetToUnmute, username: targetToUnmute, ip: targetToUnmute, id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessToast(data.message || `Mute untuk "${targetToUnmute}" berhasil dibuka!`);
        fetchMutedUsers();
        setTimeout(() => setSuccessToast(null), 2500);
      } else {
        fetchMutedUsers();
        alert(data.error || 'Gagal membuka mute target');
      }
    } catch (err) {
      fetchMutedUsers();
      alert('Terjadi kesalahan koneksi saat membuka mute');
    } finally {
      setUnmutingTargetId(null);
    }
  };

  const handleDeleteLoginLog = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/login-logs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLoginLogs(prev => prev.filter(l => l.id !== id));
        setSuccessToast('Log login berhasil dihapus.');
        setTimeout(() => setSuccessToast(null), 2000);
      }
    } catch (err) {
      console.error('Failed to delete login log:', err);
    }
  };

  const handleClearAllLoginLogs = async () => {
    try {
      const res = await fetch('/api/admin/login-logs', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setLoginLogs([]);
        setSuccessToast(data.message || 'Seluruh log login pengguna berhasil dibersihkan.');
        setTimeout(() => setSuccessToast(null), 2500);
      } else {
        alert(data.error || 'Gagal membersihkan log login');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi saat membersihkan log login');
    }
  };

  useEffect(() => {
    if (activeTab === 'feedback') {
      fetch('/api/feedback')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                setFeedback(data);
            } else {
                setFeedback([]);
                console.error('Feedback data is not an array:', data);
            }
        })
        .catch(err => {
            setFeedback([]);
            console.error('Failed to fetch feedback:', err);
        });
    }
  }, [activeTab]);

  // 2FA state management
  const [twoFaEnabled, setTwoFaEnabled] = useState(() => localStorage.getItem('alight_2fa_enabled') === 'true');
  const [twoFaSecret, setTwoFaSecret] = useState(() => localStorage.getItem('alight_2fa_secret') || '');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [setup2FA, setSetup2FA] = useState(false);
  const [tempSecret, setTempSecret] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [verifySetupCode, setVerifySetupCode] = useState('');
  const [setupError, setSetupError] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disableCodeInput, setDisableCodeInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (localStorage.getItem('alight_admin_logged_in') === 'true') {
        setStep('dashboard');
      } else {
        setStep('login');
      }
      const savedUser = localStorage.getItem('alight_admin_saved_username');
      const savedPass = localStorage.getItem('alight_admin_saved_password');
      setUsername(savedUser || '');
      setPassword(savedPass || '');
    }
  }, [isOpen]);

  // Helper to filter out legacy generic defaults
  const cleanLink = (val: string | null, genericPrefix: string) => {
    if (!val || val === genericPrefix) return '';
    return val;
  };

  // CS & Social Links states (stored in localStorage)
  const [waGroupLink, setWaGroupLink] = useState(() => cleanLink(localStorage.getItem("alight_link_wa_group"), "https://chat.whatsapp.com"));
  const [waChannelLink, setWaChannelLink] = useState(() => cleanLink(localStorage.getItem("alight_link_wa_channel"), "https://whatsapp.com/channel"));
  const [tgGroupLink, setTgGroupLink] = useState(() => cleanLink(localStorage.getItem("alight_link_tg_group"), "https://t.me"));
  const [adminDirectLink, setAdminDirectLink] = useState(() => cleanLink(localStorage.getItem("alight_link_admin_direct"), "https://wa.me"));
  const [socialTgLink, setSocialTgLink] = useState(() => cleanLink(localStorage.getItem("alight_link_social_tg"), "https://t.me"));
  const [socialTiktokLink, setSocialTiktokLink] = useState(() => cleanLink(localStorage.getItem("alight_link_social_tiktok"), "https://tiktok.com"));
  const [socialIgLink, setSocialIgLink] = useState(() => cleanLink(localStorage.getItem("alight_link_social_ig"), "https://instagram.com"));
  const [socialGithubLink, setSocialGithubLink] = useState(() => cleanLink(localStorage.getItem("alight_link_social_github"), "https://github.com"));
  const [socialHandle, setSocialHandle] = useState(() => {
    const saved = localStorage.getItem("alight_social_handle");
    if (!saved || saved === "@AlightMaster") return "@AlightMaster";
    return saved;
  });

  const [chatReportNotice, setChatReportNotice] = useState(
    () => localStorage.getItem('alight_chat_report_notice') || 'silahkan lapor disini jika ada error atau gagal verifikasi akun pro, admin respon 22.00/04.00'
  );

  const [licenseBadge, setLicenseBadge] = useState(
    () => localStorage.getItem('alight_license_badge') || 'ACTIVE'
  );
  const [licenseTitle, setLicenseTitle] = useState(
    () => localStorage.getItem('alight_license_title') || 'PRO ACTIVE (1 TAHUN)'
  );

  const handleSaveCsLinks = async () => {
    localStorage.setItem('alight_link_wa_group', waGroupLink);
    localStorage.setItem('alight_link_wa_channel', waChannelLink);
    localStorage.setItem('alight_link_tg_group', tgGroupLink);
    localStorage.setItem('alight_link_admin_direct', adminDirectLink);
    localStorage.setItem('alight_link_social_tg', socialTgLink);
    localStorage.setItem('alight_link_social_tiktok', socialTiktokLink);
    localStorage.setItem('alight_link_social_ig', socialIgLink);
    localStorage.setItem('alight_link_social_github', socialGithubLink);
    localStorage.setItem('alight_social_handle', socialHandle);

    window.dispatchEvent(new CustomEvent('alight_settings_updated'));
    setSuccessToast('Link CS & Media Sosial berhasil disimpan!');
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const handleSaveBannerLaporan = async () => {
    localStorage.setItem('alight_chat_report_notice', chatReportNotice);
    localStorage.setItem('alight_license_badge', licenseBadge);
    localStorage.setItem('alight_license_title', licenseTitle);
    window.dispatchEvent(new CustomEvent('alight_settings_updated'));
    await saveSettingsToServer({ chatReportNotice, licenseBadge, licenseTitle });
    setSuccessToast('Banner Laporan & Status Lisensi berhasil disimpan!');
    setTimeout(() => setSuccessToast(null), 2500);
  };

  // Quota & System Settings state (stored in localStorage)
  const [quotaLimit, setQuotaLimit] = useState(() => {
    const val = localStorage.getItem('alight_quota_limit');
    return val !== null && val !== '' ? val : '5';
  });
  const [quotaPeriod, setQuotaPeriod] = useState(() => {
    const val = localStorage.getItem('alight_quota_period');
    if (!val || val.includes('per IP')) return 'harian';
    return val;
  });
  const [remainingQuota, setRemainingQuota] = useState(() => {
    const val = localStorage.getItem('alight_remaining_quota');
    return val !== null && val !== '' ? val : '5';
  });
  const [resetHours, setResetHours] = useState(() => {
    const val = localStorage.getItem('alight_reset_hours');
    return val !== null && val !== '' ? val : '24';
  });
  const [announcementText, setAnnouncementText] = useState(() => localStorage.getItem('alight_announcement') || '🔥 Server Alight Motion Pro 2026 stabil & siap verifikasi 24/7.');
  const [maintenanceMode, setMaintenanceMode] = useState(() => {
    const val = localStorage.getItem('alight_maintenance_mode');
    return val === 'true';
  });
  const [maintenanceTitle, setMaintenanceTitle] = useState(() => localStorage.getItem('alight_maintenance_title') || '');
  const [maintenanceDesc, setMaintenanceDesc] = useState(() => localStorage.getItem('alight_maintenance_desc') || 'Sistem verifikasi akun Alight Motion Pro saat ini sedang dalam pemeliharaan terjadwal oleh Administrator untuk optimasi performa backend. Seluruh pengiriman link login OOB dan verifikasi lisensi dihentikan sementara.');

  const [websiteName, setWebsiteName] = useState(() => localStorage.getItem('alight_website_name') || 'AlightMaster');
  const [appName, setAppName] = useState(() => localStorage.getItem('alight_app_name') || 'Alight Motion Pro');
  const [appPublisher, setAppPublisher] = useState(() => localStorage.getItem('alight_app_publisher') || 'Alight Creative');
  const [infoBannerText, setInfoBannerText] = useState(
    () => localStorage.getItem('alight_info_banner_text') || 'Ingin melihat info detail **batas harian dan sisa kredit kamu?** Klik tombol **LOGIN** diatas layar,  Belum punya akun? pencet teks **Daftar akun**'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sync state from localStorage whenever modal opens or global settings update
  useEffect(() => {
    if (!isOpen) return;
    const syncFromStorage = () => {
      setQuotaLimit(localStorage.getItem('alight_quota_limit') || '5');
      const qp = localStorage.getItem('alight_quota_period');
      setQuotaPeriod(!qp || qp.includes('per IP') ? 'harian' : qp);
      setRemainingQuota(localStorage.getItem('alight_remaining_quota') || '5');
      setResetHours(localStorage.getItem('alight_reset_hours') || '24');
      setWaGroupLink(cleanLink(localStorage.getItem("alight_link_wa_group"), "https://chat.whatsapp.com"));
      setWaChannelLink(cleanLink(localStorage.getItem("alight_link_wa_channel"), "https://whatsapp.com/channel"));
      setTgGroupLink(cleanLink(localStorage.getItem("alight_link_tg_group"), "https://t.me"));
      setAdminDirectLink(cleanLink(localStorage.getItem("alight_link_admin_direct"), "https://wa.me"));
      setSocialTgLink(cleanLink(localStorage.getItem("alight_link_social_tg"), "https://t.me"));
      setSocialTiktokLink(cleanLink(localStorage.getItem("alight_link_social_tiktok"), "https://tiktok.com"));
      setSocialIgLink(cleanLink(localStorage.getItem("alight_link_social_ig"), "https://instagram.com"));
      setSocialGithubLink(cleanLink(localStorage.getItem("alight_link_social_github"), "https://github.com"));
      const savedSh = localStorage.getItem("alight_social_handle");
      setSocialHandle(!savedSh || savedSh === "@JAKISOFT" ? "@AlightMaster" : savedSh);
      setResetHours(localStorage.getItem('alight_reset_hours') || '24');
      setAnnouncementText(localStorage.getItem('alight_announcement') || '🔥 Server Alight Motion Pro 2026 stabil & siap verifikasi 24/7.');
      setWebsiteName(localStorage.getItem('alight_website_name') || 'AlightMaster');
      setAppName(localStorage.getItem('alight_app_name') || 'Alight Motion Pro');
      setAppPublisher(localStorage.getItem('alight_app_publisher') || 'Alight Creative');
      setInfoBannerText(localStorage.getItem('alight_info_banner_text') || 'Ingin melihat info detail **batas harian dan sisa kredit kamu?** Klik tombol **LOGIN** diatas layar,  Belum punya akun? pencet teks **Daftar akun**');
      setChatReportNotice(localStorage.getItem('alight_chat_report_notice') || 'silahkan lapor disini jika ada error atau gagal verifikasi akun pro, admin respon 22.00/04.00');
      setLicenseBadge(localStorage.getItem('alight_license_badge') || 'ACTIVE');
      setLicenseTitle(localStorage.getItem('alight_license_title') || 'PRO ACTIVE (1 TAHUN)');
      setMaintenanceMode(localStorage.getItem('alight_maintenance_mode') === 'true');
      setMaintenanceTitle(localStorage.getItem('alight_maintenance_title') || '');
      setMaintenanceDesc(localStorage.getItem('alight_maintenance_desc') || 'Sistem verifikasi akun Alight Motion Pro saat ini sedang dalam pemeliharaan terjadwal oleh Administrator untuk optimasi performa backend. Seluruh pengiriman link login OOB dan verifikasi lisensi dihentikan sementara.');
    };

    syncFromStorage();
    window.addEventListener('alight_settings_updated', syncFromStorage);
    return () => window.removeEventListener('alight_settings_updated', syncFromStorage);
  }, [isOpen]);

  const saveSettingsToServer = async (customOverrides: Record<string, any> = {}) => {
    const qLimit = customOverrides.quotaLimit !== undefined ? customOverrides.quotaLimit : quotaLimit;
    let qPeriod = customOverrides.quotaPeriod !== undefined ? customOverrides.quotaPeriod : quotaPeriod;
    if (qPeriod.includes('per IP')) {
      qPeriod = 'harian';
    }
    const qRem = customOverrides.remainingQuota !== undefined ? customOverrides.remainingQuota : remainingQuota;
    const qReset = customOverrides.resetHours !== undefined ? customOverrides.resetHours : resetHours;
    const webName = customOverrides.websiteName !== undefined ? customOverrides.websiteName : websiteName;
    const appN = customOverrides.appName !== undefined ? customOverrides.appName : appName;
    const appPub = customOverrides.appPublisher !== undefined ? customOverrides.appPublisher : appPublisher;
    const iBanner = customOverrides.infoBannerText !== undefined ? customOverrides.infoBannerText : infoBannerText;
    const cReportNotice = customOverrides.chatReportNotice !== undefined ? customOverrides.chatReportNotice : chatReportNotice;
    const lBadge = customOverrides.licenseBadge !== undefined ? customOverrides.licenseBadge : licenseBadge;
    const lTitle = customOverrides.licenseTitle !== undefined ? customOverrides.licenseTitle : licenseTitle;
    const maintMode = customOverrides.maintenanceMode !== undefined ? customOverrides.maintenanceMode : maintenanceMode;
    const maintTitle = customOverrides.maintenanceTitle !== undefined ? customOverrides.maintenanceTitle : maintenanceTitle;
    const maintDesc = customOverrides.maintenanceDesc !== undefined ? customOverrides.maintenanceDesc : maintenanceDesc;

    const now = String(Date.now());

    const payload = {
      updatedAt: now,
      quotaLimit: String(qLimit),
      quotaPeriod: String(qPeriod),
      remainingQuota: String(qRem),
      resetHours: String(qReset),
      websiteName: String(webName),
      appName: String(appN),
      appPublisher: String(appPub),
      infoBannerText: String(iBanner),
      chatReportNotice: String(cReportNotice),
      licenseBadge: String(lBadge),
      licenseTitle: String(lTitle),
      maintenanceMode: String(maintMode),
      maintenanceTitle: String(maintTitle),
      maintenanceDesc: String(maintDesc),
      ...customOverrides
    };

    localStorage.setItem('alight_settings_updated_at', now);
    localStorage.setItem('alight_quota_limit', String(qLimit));
    localStorage.setItem('alight_quota_period', String(qPeriod));
    localStorage.setItem('alight_remaining_quota', String(qRem));
    localStorage.setItem('alight_reset_hours', String(qReset));
    localStorage.setItem('alight_announcement', announcementText);
    localStorage.setItem('alight_website_name', String(webName));
    localStorage.setItem('alight_app_name', String(appN));
    localStorage.setItem('alight_app_publisher', String(appPub));
    localStorage.setItem('alight_info_banner_text', String(iBanner));
    localStorage.setItem('alight_chat_report_notice', String(cReportNotice));
    localStorage.setItem('alight_license_badge', String(lBadge));
    localStorage.setItem('alight_license_title', String(lTitle));
    localStorage.setItem('alight_maintenance_mode', String(maintMode));
    localStorage.setItem('alight_maintenance_title', String(maintTitle));
    localStorage.setItem('alight_maintenance_desc', String(maintDesc));

    window.dispatchEvent(new CustomEvent('alight_settings_updated'));

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {}
  };

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (username.trim().toLowerCase() === 'alightmotion' && password === 'alightpro66') {
      const is2faActive = localStorage.getItem('alight_2fa_enabled') === 'true';
      if (is2faActive) {
        setStep('2fa_login');
        setTwoFaCode('');
        setErrorMsg('');
      } else {
        completeAdminLogin();
      }
    } else {
      setErrorMsg('Username atau Password admin salah!');
    }
  };

  const completeAdminLogin = () => {
    setStep('dashboard');
    localStorage.setItem('alight_admin_remember', String(rememberMe));

    if (rememberMe) {
      localStorage.setItem('alight_admin_logged_in', 'true');
      localStorage.setItem('alight_admin_saved_username', username);
      localStorage.setItem('alight_admin_saved_password', password);
    } else {
      localStorage.removeItem('alight_admin_logged_in');
      localStorage.removeItem('alight_admin_saved_username');
      localStorage.removeItem('alight_admin_saved_password');
    }

    setSuccessToast('Berhasil login sebagai Administrator!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handle2FaLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const secret = localStorage.getItem('alight_2fa_secret') || '';
    if (!secret) {
      completeAdminLogin();
      return;
    }

    try {
      const isValidCode = verifySync({ token: twoFaCode.trim(), secret, epochTolerance: 30 }).valid;
      if (isValidCode) {
        completeAdminLogin();
      } else {
        setErrorMsg('Kode yang anda masukkan salah atau kadaluarsa!');
      }
    } catch (err) {
      setErrorMsg('Gagal memproses kode 2FA. Coba lagi.');
    }
  };

  const startSetup2FA = async () => {
    try {
      setSetupError('');
      const secret = generateSecret();
      const otpauth = generateURI({ issuer: 'AlightMaster Admin', label: 'alightmotion', secret });
      const qrUrl = await QRCode.toDataURL(otpauth, {
        margin: 2,
        width: 240,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setTempSecret(secret);
      setQrCodeDataUrl(qrUrl);
      setVerifySetupCode('');
      setSetup2FA(true);
    } catch (err) {
      setSetupError('Gagal membuat QR Code 2FA.');
    }
  };

  const handleVerifyAndEnable2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');
    if (!verifySetupCode.trim()) {
      setSetupError('Masukkan 6 digit kode dari aplikasi Google Authenticator.');
      return;
    }

    try {
      const res = verifySync({ token: verifySetupCode.trim(), secret: tempSecret, epochTolerance: 30 });
      if (res.valid) {
        localStorage.setItem('alight_2fa_enabled', 'true');
        localStorage.setItem('alight_2fa_secret', tempSecret);
        setTwoFaEnabled(true);
        setTwoFaSecret(tempSecret);
        setSetup2FA(false);
        setSuccessToast('2FA Google Authenticator Berhasil Diaktifkan!');
        setTimeout(() => setSuccessToast(null), 3000);
      } else {
        setSetupError('Kode verifikasi tidak sesuai! Pastikan jam di smartphone kamu sudah otomatis/sinkron.');
      }
    } catch (err) {
      setSetupError('Gagal memverifikasi kode 2FA.');
    }
  };

  const handleDisable2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');
    try {
      const res = verifySync({ token: disableCodeInput.trim(), secret: twoFaSecret, epochTolerance: 30 });
      if (res.valid) {
        localStorage.removeItem('alight_2fa_enabled');
        localStorage.removeItem('alight_2fa_secret');
        setTwoFaEnabled(false);
        setTwoFaSecret('');
        setShowDisableConfirm(false);
        setDisableCodeInput('');
        setSuccessToast('2FA Google Authenticator berhasil dinonaktifkan.');
        setTimeout(() => setSuccessToast(null), 3000);
      } else {
        setSetupError('Kode 2FA tidak valid untuk mematikan 2FA.');
      }
    } catch (err) {
      setSetupError('Gagal mematikan 2FA.');
    }
  };

  const handleInstantDisable2FA = () => {
    localStorage.removeItem('alight_2fa_enabled');
    localStorage.removeItem('alight_2fa_secret');
    setTwoFaEnabled(false);
    setTwoFaSecret('');
    setShowDisableConfirm(false);
    setDisableCodeInput('');
    setSuccessToast('2FA Google Authenticator berhasil dimatikan secara instan.');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('alight_admin_logged_in');
    if (!rememberMe) {
      localStorage.removeItem('alight_admin_saved_username');
      localStorage.removeItem('alight_admin_saved_password');
      setUsername('');
      setPassword('');
    }
    setStep('login');
    setSuccessToast('Berhasil logout.');
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const filteredOrders = orders.filter((o) => 
    o.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.username && o.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (o.ip && o.ip.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (o.country && o.country.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (o.regionCity && o.regionCity.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredLoginLogs = loginLogs.filter((l) =>
    l.username.toLowerCase().includes(loginSearchQuery.toLowerCase()) ||
    l.ip.toLowerCase().includes(loginSearchQuery.toLowerCase()) ||
    l.status.toLowerCase().includes(loginSearchQuery.toLowerCase()) ||
    l.timestamp.toLowerCase().includes(loginSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300">
      <div className={`bg-slate-950 border border-slate-800 rounded-3xl ${step === 'dashboard' ? 'max-w-6xl' : 'max-w-md'} w-full shadow-2xl overflow-hidden text-slate-100 flex flex-col relative animate-in zoom-in-95 duration-300 transition-all`}>
        
        {/* Success Toast Notification */}
        {successToast && (
          <div className="bg-emerald-950 border-b border-emerald-800/80 px-4 py-2.5 flex items-center gap-2 text-emerald-200 text-xs font-semibold shrink-0 z-10 animate-in slide-in-from-top-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {step === 'login' ? (
          <div className="p-5 sm:p-6 relative">
            {/* Close Button Top Right */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 w-7 h-7 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="space-y-4 pt-1">
              {/* Shield Icon Top Badge */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg">
                  <Shield className="w-7 h-7 stroke-[2]" />
                </div>
                <h3 className="font-black text-lg tracking-wider text-white">
                  ADMIN AKSES
                </h3>
              </div>

              {errorMsg && (
                <div className="bg-red-950/60 border border-red-800/60 rounded-xl p-2.5 flex items-start gap-2 text-red-200 text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {/* Username Field */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    USERNAME
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username"
                      className="w-full bg-slate-900 border border-slate-800/80 rounded-xl pl-10 pr-3 py-3 text-xs text-white placeholder:text-slate-600 dark:text-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    PASSWORD
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      className="w-full bg-slate-900 border border-slate-800/80 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder:text-slate-600 dark:text-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 cursor-pointer accent-emerald-500"
                  />
                  <label htmlFor="remember" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                    Simpan Login
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 mt-3 tracking-wide"
                >
                  LANJUTKAN
                </button>
              </form>
            </div>
          </div>
        ) : step === '2fa_login' ? (
          /* 2FA LOGIN SCREEN */
          <div className="p-5 sm:p-6 relative">
            <button
              onClick={() => setStep('login')}
              className="absolute right-4 top-4 w-7 h-7 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Kembali ke login username"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="space-y-4 pt-1">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg">
                  <Smartphone className="w-7 h-7 stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-wider text-white uppercase">
                    Silahkan Masukkan Kode Dibawah
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Masukkan 6 Digit Kode
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-red-950/60 border border-red-800/60 rounded-xl p-2.5 flex items-start gap-2 text-red-200 text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handle2FaLoginSubmit} className="space-y-4">
                <div className="space-y-1.5 text-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-lg font-mono tracking-[0.3em] font-bold text-emerald-400 placeholder:text-slate-700 dark:text-slate-200 placeholder:tracking-normal focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-center"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 tracking-wide uppercase"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>VERIFIKASI KODE</span>
                </button>


                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="w-full text-center text-xs font-semibold text-slate-400 hover:text-white pt-1 transition-colors cursor-pointer"
                >
                  Kembali ke Form Login
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* DASHBOARD */
          <div className="flex flex-col max-h-[85vh] w-full">
            
            {/* Top Admin Control Center Header Banner */}
            <div className="m-3 sm:m-4 mb-0 bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-950 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden shrink-0">
              {/* Background Glow Accents */}
              <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
                      <Shield className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-950"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-black text-white tracking-wide bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                        ADMIN KONTROL
                      </h2>
                      <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> SYSTEM ONLINE
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 inline shrink-0" />
                      <span>Alight Motion Master Panel 2026</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-rose-600/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 stroke-[2.2]" />
                    <span>KELUAR</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white p-2.5 rounded-xl border border-slate-800 transition-all cursor-pointer hover:scale-105"
                    title="Tutup Panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Navigation Sub-tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-4 border-t border-slate-800/80 no-scrollbar">
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`py-2 px-3.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === 'logs'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-100 hover:bg-slate-800/90 border border-slate-800'
                  }`}
                >
                  <Database className="w-4 h-4 text-indigo-300" />
                  <span>Monitoring Aktivasi</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'logs' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'}`}>
                    {orders.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('login_logs')}
                  className={`py-2 px-3.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === 'login_logs'
                      ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/30'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-100 hover:bg-slate-800/90 border border-slate-800'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-sky-300" />
                  <span>Log Login User</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'login_logs' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'}`}>
                    {loginLogs.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('mute')}
                  className={`py-2 px-3.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === 'mute'
                      ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-600/30 border border-rose-400/30'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-100 hover:bg-slate-800/90 border border-slate-800'
                  }`}
                >
                  <VolumeX className="w-4 h-4 text-rose-300" />
                  <span>Mute Chat User</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'mute' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'}`}>
                    {mutedUsers.length}
                  </span>
                </button>


                <button
                  onClick={() => setActiveTab('settings')}
                  className={`py-2 px-3.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-100 hover:bg-slate-800/90 border border-slate-800'
                  }`}
                >
                  <Sliders className="w-4 h-4 text-violet-300" />
                  <span>Batasan Kuota Global</span>
                </button>



                <button
                  onClick={() => setActiveTab('branding')}
                  className={`py-2 px-3.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === 'branding'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30 border border-cyan-400/30'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-100 hover:bg-slate-800/90 border border-slate-800'
                  }`}
                >
                  <Edit3 className="w-4 h-4 text-cyan-300" />
                  <span>Edit Nama Web</span>
                </button>

                <button
                  onClick={() => setActiveTab('maintenance')}
                  className={`py-2 px-3.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === 'maintenance'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30 border border-amber-400/30'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-100 hover:bg-slate-800/90 border border-slate-800'
                  }`}
                >
                  <Wrench className="w-4 h-4 text-amber-300" />
                  <span>Mode Pemeliharaan</span>
                  {maintenanceMode && (
                    <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">AKTIF</span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('cs_links')}
                  className={`py-2 px-3.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === 'cs_links'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/30'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-100 hover:bg-slate-800/90 border border-slate-800'
                  }`}
                >
                  <Share2 className="w-4 h-4 text-emerald-300" />
                  <span>Link CS & Sosmed</span>
                </button>

                <button
                  onClick={() => setActiveTab('banner_laporan')}
                  className={`py-2 px-3.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === 'banner_laporan'
                      ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-600/30 border border-amber-400/30'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-100 hover:bg-slate-800/90 border border-slate-800'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-amber-300" />
                  <span>Banner Laporan</span>
                </button>

                <button
                  onClick={() => setActiveTab('2fa')}
                  className={`py-2 px-3.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === '2fa'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/30'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-100 hover:bg-slate-800/90 border border-slate-800'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-teal-300" />
                  <span>Keamanan 2FA</span>
                  {twoFaEnabled && (
                    <span className="bg-emerald-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-sm">AKTIF</span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('feedback')}
                  className={`py-2 px-3.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === 'feedback'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 border border-amber-400/30'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-100 hover:bg-slate-800/90 border border-slate-800'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-amber-300" />
                  <span>Pesan Pengguna</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'feedback' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'}`}>
                    {feedback.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Scrollable Dashboard Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* TAB: FEEDBACK */}
              {activeTab === 'feedback' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-white tracking-wide uppercase">PESAN & MASUKAN PENGGUNA</h3>
                        <p className="text-xs text-slate-400">Laporan bug, saran fitur, dan pesan dari pengguna aplikasi.</p>
                      </div>
                    </div>
                    <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold text-xs px-3 py-1 rounded-full">
                      {feedback.length}
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {feedback.length === 0 ? (
                      <div className="text-center py-12 bg-slate-950/50 border border-slate-800/80 rounded-2xl p-6">
                        <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-slate-300">Belum ada pesan pengguna</h4>
                        <p className="text-xs text-slate-500 mt-1">Pesan atau laporan dari pengguna akan muncul di sini.</p>
                      </div>
                    ) : (
                      feedback.map(f => (
                        <div key={f.id} className="bg-slate-950/80 border border-slate-800/90 hover:border-slate-700/90 rounded-2xl p-4 flex justify-between items-start gap-4 transition-all shadow-md group">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${f.category === 'bug' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}`}>
                                {f.category === 'bug' ? 'Bug' : 'Fitur'}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">{f.timestamp}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">{f.detail}</p>
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60 text-xs text-slate-400">
                              <span className="text-slate-500 font-bold">Kontak:</span>
                              <span className="font-mono text-slate-300 font-semibold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px]">
                                {f.contact || 'Tanpa Kontak'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              await fetch(`/api/feedback/${f.id}`, { method: 'DELETE' });
                              setFeedback(feedback.filter(fb => fb.id !== f.id));
                              setSuccessToast('Pesan berhasil dihapus!');
                              setTimeout(() => setSuccessToast(null), 2000);
                            }}
                            className="shrink-0 p-2.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all border border-slate-800 cursor-pointer shadow-sm"
                            title="Hapus Pesan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB: LOGIN LOGS */}
              {activeTab === 'login_logs' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="font-extrabold text-base text-white flex items-center gap-2 tracking-wide">
                        <UserCheck className="w-5 h-5 text-sky-400" />
                        <span>Log Login User</span>
                        <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                          {loginLogs.length} Log
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Riwayat autentikasi login pengguna dengan IP, waktu, status login, dan perangkat.</p>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={loginSearchQuery}
                          onChange={(e) => setLoginSearchQuery(e.target.value)}
                          placeholder="Cari user, IP, status..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-all font-medium"
                        />
                      </div>
                      <button
                        onClick={fetchLoginLogs}
                        disabled={isLoadingLoginLogs}
                        className="bg-slate-950 hover:bg-slate-800 text-slate-300 p-2 rounded-xl border border-slate-800 cursor-pointer shrink-0 transition-all"
                        title="Segarkan Log"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoadingLoginLogs ? 'animate-spin text-sky-400' : ''}`} />
                      </button>
                      {loginLogs.length > 0 && (
                        <button
                          onClick={handleClearAllLoginLogs}
                          className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-bold px-3 py-2 rounded-xl border border-rose-500/30 cursor-pointer shrink-0 transition-all flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span className="hidden sm:inline">Hapus Semua</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1 no-scrollbar">
                    {filteredLoginLogs.length === 0 ? (
                      <div className="text-center py-14 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-1">
                          <UserCheck className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-sm text-slate-300">Belum Ada Log Login</p>
                        <p className="text-xs text-slate-500">Aktivitas login pengguna yang berhasil atau gagal akan tercatat otomatis di sini.</p>
                      </div>
                    ) : (
                      filteredLoginLogs.map((log) => {
                        const isSuccess = log.status === 'SUCCESS';
                        const displayIp = log.ip || '-';

                        return (
                          <div
                            key={log.id}
                            className="bg-slate-950 border border-slate-800/90 hover:border-slate-700/90 rounded-2xl p-4 flex flex-col space-y-3 text-xs shadow-lg transition-all duration-200 relative group overflow-hidden"
                          >
                            <div className={`absolute top-0 left-0 w-1 h-full ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

                            {/* Header Status Badge & Delete Button */}
                            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 pl-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                {isSuccess ? (
                                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-black px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1.5 uppercase tracking-wider shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    LOGIN BERHASIL
                                  </span>
                                ) : (
                                  <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 font-black px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1.5 uppercase tracking-wider shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                                    LOGIN GAGAL
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => handleDeleteLoginLog(log.id)}
                                title="Hapus log ini"
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* User & IP & Time Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-900/90 border border-slate-800/80 p-3 rounded-xl font-mono text-[11px] text-slate-300 ml-2">
                              <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                <span className="text-slate-400 font-sans font-medium">Username:</span>
                                <span className="font-extrabold text-white bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-xs">
                                  {log.username}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                  <span className="text-slate-400 font-sans font-medium">IP:</span>
                                  <span className="font-bold text-white">{displayIp}</span>
                                </div>
                                {displayIp !== '-' && (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(displayIp);
                                      setSuccessToast('IP tersalin!');
                                      setTimeout(() => setSuccessToast(null), 2000);
                                    }}
                                    className="text-slate-400 hover:text-white"
                                    title="Salin IP"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-2 sm:col-span-2">
                                <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="text-slate-400 font-sans font-medium">Waktu Login:</span>
                                <span className="font-bold text-slate-200">{log.timestamp}</span>
                              </div>

                              {log.userAgent && (
                                <div className="flex items-center gap-2 sm:col-span-2 text-[10px] text-slate-400 truncate">
                                  <Smartphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="text-slate-500 font-sans">Perangkat:</span>
                                  <span className="truncate">{log.userAgent}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB: MUTE CHAT PENGGUNA */}
              {activeTab === 'mute' && (
                <div className="space-y-4">
                  {/* Form Mute Pengguna */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div>
                        <h3 className="font-extrabold text-base text-white flex items-center gap-2 tracking-wide">
                          <VolumeX className="w-5 h-5 text-rose-400" />
                          <span>Mute / Blokir Chat Pengguna</span>
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                            {mutedUsers.length} Terblokir
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Blokir hak kirim pesan pengguna di Global Chat berdasarkan <b>Username</b> atau <b>Alamat IP</b> dengan durasi kustom atau <b>Permanen</b>.
                        </p>
                      </div>

                      <button
                        onClick={fetchMutedUsers}
                        disabled={isLoadingMutedUsers}
                        className="bg-slate-950 hover:bg-slate-800 text-slate-300 p-2 rounded-xl border border-slate-800 cursor-pointer shrink-0 transition-all"
                        title="Segarkan Data Mute"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoadingMutedUsers ? 'animate-spin text-rose-400' : ''}`} />
                      </button>
                    </div>

                    <form onSubmit={handleMuteSubmit} className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        {/* Username atau IP Target */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-rose-400" />
                            <span>USERNAME ATAU ALAMAT IP TARGET</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              value={muteTargetUser}
                              onChange={(e) => setMuteTargetUser(e.target.value)}
                              placeholder="Username atau Ip"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 font-bold transition-all"
                            />
                            {muteTargetUser.trim() && (
                              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                {muteTargetUser.includes('.') || muteTargetUser.includes(':') ? (
                                  <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    IP Address
                                  </span>
                                ) : (
                                  <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    Username
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-500">Mendukung blokir akun username atau blokir seluruh jaringan IP.</p>
                        </div>

                        {/* Durasi Mute / Pilihan Permanen */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>DURASI MUTE</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isPermanentMute}
                                onChange={(e) => {
                                  setIsPermanentMute(e.target.checked);
                                  if (e.target.checked) {
                                    setMuteDurationText('permanen');
                                  } else if (muteDurationText.toLowerCase() === 'permanen') {
                                    setMuteDurationText('1jam');
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-950 accent-rose-600"
                              />
                              <span className={`text-[10px] font-black tracking-wide ${isPermanentMute ? 'text-rose-400' : 'text-slate-400'}`}>
                                MUTE PERMANEN
                              </span>
                            </label>
                          </div>
                          <input
                            type="text"
                            required
                            disabled={isPermanentMute}
                            value={isPermanentMute ? 'Permanen' : muteDurationText}
                            onChange={(e) => setMuteDurationText(e.target.value)}
                            placeholder="1jam, 2hari, 1minggu, 1bulan, 1tahun, permanen"
                            className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-all font-bold ${
                              isPermanentMute
                                ? 'bg-rose-950/40 border-rose-600/50 text-rose-300 cursor-not-allowed'
                                : 'bg-slate-950 border-slate-800 focus:border-rose-500'
                            }`}
                          />
                          {/* Quick suggestions pills */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsPermanentMute(true);
                                setMuteDurationText('permanen');
                              }}
                              className={`text-[9px] px-2 py-0.5 rounded-md border font-mono font-black flex items-center gap-1 transition-all cursor-pointer ${
                                isPermanentMute
                                  ? 'bg-rose-600 text-white border-rose-500 shadow-sm shadow-rose-600/30'
                                  : 'bg-rose-950/50 text-rose-300 border-rose-800/60 hover:bg-rose-900/60'
                              }`}
                            >
                              <Lock className="w-2.5 h-2.5" />
                              <span>Permanen</span>
                            </button>
                            {['1jam', '3jam', '1hari', '3hari', '1minggu', '1bulan', '1tahun'].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  setIsPermanentMute(false);
                                  setMuteDurationText(preset);
                                }}
                                className={`text-[9px] px-2 py-0.5 rounded-md border font-mono font-bold transition-all cursor-pointer ${
                                  !isPermanentMute && muteDurationText === preset
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Alasan Mute */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                            <span>ALASAN MUTE (OPSIONAL)</span>
                          </label>
                          <input
                            type="text"
                            value={muteReason}
                            onChange={(e) => setMuteReason(e.target.value)}
                            placeholder="Contoh: Spam pesan berulang / Toksik / Pelanggaran Aturan"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 font-medium transition-all"
                          />
                          <p className="text-[9px] text-slate-500">Alasan akan ditampilkan ke pengguna saat mencoba mengirim pesan.</p>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={isMutingSubmitting || !muteTargetUser.trim()}
                          className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                        >
                          <VolumeX className="w-4 h-4" />
                          <span>
                            {isMutingSubmitting
                              ? ' LOADING MUTE...'
                              : isPermanentMute
                              ? 'MUTE PERMANEN TARGET'
                              : 'MUTE TARGET SEKARANG'}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Daftar Pengguna Yang Dimute */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                          <span>Daftar Target Yang Sedang Dimute</span>
                          <span className="bg-rose-500/20 text-rose-300 text-xs px-2 py-0.5 rounded-full font-bold">
                            {mutedUsers.length}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Daftar username dan IP yang mute mengirim pesan di global chat</p>
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={muteSearchQuery}
                          onChange={(e) => setMuteSearchQuery(e.target.value)}
                          placeholder="Username atau IP."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
                      {mutedUsers.length === 0 ? (
                        <div className="text-center py-12 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center gap-2">
                          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-1">
                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                          </div>
                          <p className="font-bold text-sm text-slate-300">TIDAK ADA PENGGUNA YANG DIMUTE</p>
                          <p className="text-xs text-slate-500">Semua pengguna dan jaringan IP saat ini dapat berpartisipasi di Global Chat.</p>
                        </div>
                      ) : (
                        mutedUsers
                          .filter((u) => {
                            if (!muteSearchQuery.trim()) return true;
                            const q = muteSearchQuery.toLowerCase();
                            const targetVal = (u.target || u.username || '').toLowerCase();
                            const reasonVal = (u.reason || '').toLowerCase();
                            const durationVal = (u.durationLabel || '').toLowerCase();
                            const typeVal = (u.targetType || '').toLowerCase();
                            return (
                              targetVal.includes(q) ||
                              reasonVal.includes(q) ||
                              durationVal.includes(q) ||
                              typeVal.includes(q)
                            );
                          })
                          .map((item) => {
                            const now = Date.now();
                            const isPermanent = Boolean(item.isPermanent || !item.mutedUntil || item.mutedUntil === 0);
                            const isExpired = !isPermanent && now >= item.mutedUntil;
                            const remainingMs = isPermanent ? 0 : Math.max(0, item.mutedUntil - now);
                            const remHours = Math.floor(remainingMs / (1000 * 60 * 60));
                            const remMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                            const remSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
                            const targetName = item.target || item.username;
                            const isIpTarget = item.targetType === 'ip' || targetName.includes('.') || targetName.includes(':');

                            return (
                              <div
                                key={item.id || targetName}
                                className="bg-slate-950 border border-slate-800/90 hover:border-rose-500/40 rounded-2xl p-4 flex flex-col space-y-3 text-xs shadow-lg transition-all relative overflow-hidden"
                              >
                                <div className={`absolute top-0 left-0 w-1 h-full ${isPermanent ? 'bg-red-600' : 'bg-rose-500'}`}></div>

                                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 pl-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {isPermanent ? (
                                      <span className="bg-red-500/20 text-red-300 border border-red-500/40 font-black px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1.5 uppercase tracking-wider shadow-xs animate-pulse">
                                        <Lock className="w-3 h-3 text-red-400" />
                                        MUTE PERMANEN (SELAMANYA)
                                      </span>
                                    ) : (
                                      <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 font-black px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1.5 uppercase tracking-wider">
                                        <VolumeX className="w-3 h-3" />
                                        DIMUTE {item.durationLabel || 'Kustom'}
                                      </span>
                                    )}

                                    <span className="bg-slate-900 border border-slate-800 text-slate-200 font-black px-2.5 py-0.5 rounded-lg text-xs flex items-center gap-1.5 font-mono">
                                      {isIpTarget ? (
                                        <>
                                          <Globe className="w-3.5 h-3.5 text-cyan-400" />
                                          <span>IP: {targetName}</span>
                                        </>
                                      ) : (
                                        <>
                                          <User className="w-3.5 h-3.5 text-indigo-400" />
                                          <span>@{targetName}</span>
                                        </>
                                      )}
                                    </span>
                                  </div>

                                  <button
                                    onClick={() => handleUnmuteUser(targetName, item.id)}
                                    disabled={unmutingTargetId === (item.id || targetName)}
                                    className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                    title="Cabut status mute sekarang"
                                  >
                                    {unmutingTargetId === (item.id || targetName) ? (
                                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    )}
                                    <span>{unmutingTargetId === (item.id || targetName) ? 'Membuka...' : 'Buka Mute'}</span>
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-900/90 border border-slate-800/80 p-3 rounded-xl font-mono text-[11px] text-slate-300 ml-2">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span className="text-slate-400 font-sans font-medium">Mulai Mute:</span>
                                    <span className="font-bold text-slate-200">{item.mutedAtFormatted || new Date(item.mutedAt).toLocaleString('id-ID')}</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                    <span className="text-slate-400 font-sans font-medium">Berakhir Pada:</span>
                                    <span className="font-bold text-rose-300">
                                      {isPermanent ? (
                                        <span className="text-red-400 font-black">Permanen</span>
                                      ) : (
                                        item.mutedUntilFormatted || new Date(item.mutedUntil).toLocaleString('id-ID')
                                      )}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 sm:col-span-2">
                                    <Activity className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                    <span className="text-slate-400 font-sans font-medium">Sisa Waktu:</span>
                                    <span className="font-bold text-amber-300 font-mono">
                                      {isPermanent ? (
                                        <span className="text-red-400 font-black flex items-center gap-1">
                                          <Lock className="w-3 h-3 text-red-400" />
                                          Dimute Chat Permanen
                                        </span>
                                      ) : isExpired ? (
                                        <span className="text-slate-500">Kadaluarsa Akan otomatis direset</span>
                                      ) : (
                                        `${remHours > 0 ? `${remHours} Jam ` : ''}${remMinutes} Menit ${remSeconds} Detik`
                                      )}
                                    </span>
                                  </div>

                                  {item.reason && (
                                    <div className="flex items-center gap-2 sm:col-span-2 text-[11px]">
                                      <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="text-slate-400 font-sans font-medium">Alasan:</span>
                                      <span className="text-slate-200 font-sans font-semibold italic">{item.reason}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: MONITORING / LOGS */}
              {activeTab === 'logs' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="font-extrabold text-base text-white flex items-center gap-2 tracking-wide">
                        <Database className="w-5 h-5 text-indigo-400" />
                        <span>Monitoring Aktivasi</span>
                        <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                          {orders.length} Log
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Log lengkap riwayat permintaan token pro dari pengguna secara real-time.</p>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Cari email, ID, IP..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                        />
                      </div>
                      {orders.length > 0 && (
                        <button
                          onClick={() => {
                            if (confirm('Apakah Anda yakin ingin menghapus SELURUH database log aktivasi?')) {
                              onClearOrders();
                              setSuccessToast('Database log berhasil dibersihkan.');
                              setTimeout(() => setSuccessToast(null), 2000);
                            }
                          }}
                          className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-bold px-3 py-2 rounded-xl border border-rose-500/30 cursor-pointer shrink-0 transition-all flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span className="hidden sm:inline">Hapus Semua</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1 no-scrollbar">
                    {filteredOrders.length === 0 ? (
                      <div className="text-center py-14 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-1">
                          <Database className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-sm text-slate-300">Belum Ada Log Aktivasi</p>
                        <p className="text-xs text-slate-500">Log permintaan verifikasi dari pengguna akan otomatis muncul di sini.</p>
                      </div>
                    ) : (
                      filteredOrders.map((o) => {
                        const userLoggedIn = Boolean(o.isLoggedIn || o.username);
                        const displayUsername = o.username || 'Pengguna';
                        const displayIp = o.ip || '-';
                        const displayCountry = o.country || '-';
                        const displayRegionCity = o.regionCity || '-';

                        return (
                          <div
                            key={o.id}
                            className="bg-slate-950 border border-slate-800/90 hover:border-slate-700/90 rounded-2xl p-4 flex flex-col space-y-3 text-xs shadow-lg transition-all duration-200 relative group overflow-hidden"
                          >
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 via-teal-500 to-emerald-500 opacity-80"></div>

                            {/* Header Status Badge & Delete Button */}
                            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 pl-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                {userLoggedIn ? (
                                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-black px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1.5 uppercase tracking-wider shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    verifikasi akun terhubung
                                  </span>
                                ) : (
                                  <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 font-black px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1.5 uppercase tracking-wider shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                    verifikasi akun publik
                                  </span>
                                )}
                                <span className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-black px-2.5 py-0.5 rounded-lg text-[10px]">
                                  PRO 1 TAHUN AKTIF
                                </span>
                              </div>

                              {onDeleteOrder && (
                                <button
                                  onClick={() => {
                                    onDeleteOrder(o.id);
                                    setSuccessToast(`Log ID ${o.id} berhasil dihapus.`);
                                    setTimeout(() => setSuccessToast(null), 2000);
                                  }}
                                  title="Hapus log ini"
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* User details */}
                            <div className="space-y-1.5 pl-2">
                              {userLoggedIn && (
                                <div className="flex items-center gap-2 text-slate-300">
                                  <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                  <span className="text-slate-400 font-medium">Username:</span>
                                  <span className="font-extrabold text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-xs">
                                    {displayUsername}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-slate-300 flex-wrap">
                                <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span className="text-slate-400 font-medium">Email Akun Premium:</span>
                                <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-xs flex items-center gap-1.5">
                                  <span>{o.email}</span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(o.email);
                                      setSuccessToast('Email tersalin!');
                                      setTimeout(() => setSuccessToast(null), 2000);
                                    }}
                                    className="text-emerald-300 hover:text-white transition-colors cursor-pointer"
                                    title="Salin Email"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </span>
                              </div>
                            </div>

                            {/* Geo & Machine specs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-900/90 border border-slate-800/80 p-3 rounded-xl font-mono text-[11px] text-slate-300 ml-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-slate-400 font-sans font-medium">IP : </span>
                                  <span className="font-bold text-white">{displayIp}</span>
                                </div>
                                {displayIp !== '-' && (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(displayIp);
                                      setSuccessToast('IP tersalin!');
                                      setTimeout(() => setSuccessToast(null), 2000);
                                    }}
                                    className="text-slate-400 hover:text-white"
                                    title="Salin IP"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-slate-400 font-sans font-medium">ID : </span>
                                  <span className="font-bold text-amber-400">{o.id}</span>
                                </div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(o.id);
                                    setSuccessToast('ID tersalin!');
                                    setTimeout(() => setSuccessToast(null), 2000);
                                  }}
                                  className="text-slate-400 hover:text-white"
                                  title="Salin ID"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                              <div>
                                <span className="text-slate-400 font-sans font-medium">Negara : </span>
                                <span className="font-bold text-white">{displayCountry}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-sans font-medium">Wilayah/Kota : </span>
                                <span className="font-bold text-white">{displayRegionCity}</span>
                              </div>
                            </div>

                            {/* Timestamps */}
                            <div className="text-[11px] font-medium text-slate-400 pt-1 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-1 pl-2">
                              <span>
                                <strong className="text-slate-300 font-semibold">Waktu : </strong>{o.timestamp}
                              </span>
                              <span className="text-slate-600 font-bold">||</span>
                              <span>
                                <strong className="text-slate-300 font-semibold">Exp : </strong>{o.expiresAt}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}





              {/* TAB: ATUR BATASAN & KUOTA GLOBAL */}
              {activeTab === 'settings' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xl">
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-violet-400" />
                        <span>Pengaturan Batasan Kuota Global</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Konfigurasi batas kuota harian default, periode reset, dan interval untuk semua pengguna umum.</p>
                    </div>
                    <button
                      onClick={async () => {
                        await saveSettingsToServer();
                        setSuccessToast('Pengaturan Kuota Global berhasil disimpan!');
                        setTimeout(() => setSuccessToast(null), 2500);
                      }}
                      className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 shrink-0 active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Simpan Kuota Global</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Quota Limit & Period */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-2">
                        <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Batas Kuota Harian (Maksimal per Akun)</span>
                        </label>
                        <input
                          type="text"
                          value={quotaLimit}
                          onChange={(e) => {
                            setQuotaLimit(e.target.value);
                            setRemainingQuota(e.target.value);
                          }}
                          placeholder="Contoh: 5 atau 100"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-bold"
                        />
                        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                          <span className="text-[10px] font-semibold text-slate-500 shrink-0">Preset:</span>
                          {['5', '10', '25', '50', '100', '999'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setQuotaLimit(preset);
                                setRemainingQuota(preset);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-all ${
                                quotaLimit === preset
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                              }`}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-2">
                        <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
                          <span>Periode Hitungan Kuota</span>
                        </label>
                        <input
                          type="text"
                          value={quotaPeriod}
                          onChange={(e) => setQuotaPeriod(e.target.value)}
                          placeholder="harian, mingguan, bulanan, atau tahunan"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                        />
                        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                          <span className="text-[10px] font-semibold text-slate-500 shrink-0">Opsi:</span>
                          {['harian', 'mingguan', 'bulanan', 'tahunan'].map((period) => (
                            <button
                              key={period}
                              type="button"
                              onClick={() => setQuotaPeriod(period)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                quotaPeriod === period
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                              }`}
                            >
                              {period}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Reset Hours & Calculation Explanation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-2">
                        <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-rose-400" />
                          <span>Reset Waktu Otomatis</span>
                        </label>
                        <input
                          type="text"
                          value={resetHours}
                          onChange={(e) => setResetHours(e.target.value)}
                          placeholder="Contoh: 24"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-bold"
                        />
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-semibold text-slate-500">Preset Jam:</span>
                          {['12', '24', '48', '72'].map((hr) => (
                            <button
                              key={hr}
                              type="button"
                              onClick={() => setResetHours(hr)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-all ${
                                resetHours === hr
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                              }`}
                            >
                              {hr}h
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-4 flex flex-col justify-between space-y-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-xs font-extrabold text-indigo-200 uppercase tracking-wider">Perhitungan Sisa Kuota Pengguna</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Sisa limit dihitung secara otomatis untuk setiap pengguna: <br/>
                          <strong className="text-amber-300 font-mono font-bold">Sisa Limit = Batas Kuota ({quotaLimit || '0'}) - Jumlah Pemakaian Akun</strong>
                        </p>
                        <div className="text-[10px] text-slate-400 bg-slate-950/60 rounded-lg p-2 border border-slate-800/80">
                          💡 Cukup atur <strong>Batas Kuota Harian</strong> di atas, maka kartu profil & modal bantuan semua pengguna akan langsung sinkron secara otomatis.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: EDIT NAMA WEB & BRANDING */}
              {activeTab === 'branding' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xl">
                  {/* Header */}
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-cyan-400" />
                        <span>Pengaturan Identitas & Branding</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Ubah nama website, nama aplikasi, developer/publisher, dan banner informasi aplikasi.</p>
                    </div>
                    <button
                      onClick={async () => {
                        await saveSettingsToServer();
                        setSuccessToast('Pengaturan Branding & Identitas Web berhasil disimpan!');
                        setTimeout(() => setSuccessToast(null), 2500);
                      }}
                      className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-600/30 flex items-center gap-1.5 shrink-0 active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Simpan Identitas</span>
                    </button>
                  </div>

                  {/* Form Identitas */}
                  <div className="space-y-4">
                    <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-3">
                      <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <Globe className="w-4 h-4 text-cyan-400" />
                        <span>Nama Website & Informasi Aplikasi</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Website</label>
                          <input
                            type="text"
                            value={websiteName}
                            onChange={(e) => setWebsiteName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                            placeholder="AlightMaster"
                          />
                          <p className="text-[9px] text-slate-500">Ditampilkan pada judul header dan footer web.</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Aplikasi</label>
                          <input
                            type="text"
                            value={appName}
                            onChange={(e) => setAppName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                            placeholder="Alight Motion Pro"
                          />
                          <p className="text-[9px] text-slate-500">Nama produk yang diverifikasi oleh sistem.</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Publisher/Developer</label>
                          <input
                            type="text"
                            value={appPublisher}
                            onChange={(e) => setAppPublisher(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                            placeholder="Alight Creative"
                          />
                          <p className="text-[9px] text-slate-500">Penerbit atau developer aplikasi.</p>
                        </div>
                      </div>
                    </div>

                    {/* Information banner editor */}
                    <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                          <Bell className="w-4 h-4 text-amber-400" />
                          <span>Teks Banner Informasi Dashboard</span>
                        </label>
                        <button
                          onClick={async () => {
                            await saveSettingsToServer();
                            setSuccessToast('Teks banner informasi berhasil disimpan!');
                            setTimeout(() => setSuccessToast(null), 2500);
                          }}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
                        >
                          Simpan Banner
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={infoBannerText}
                        onChange={(e) => setInfoBannerText(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed font-medium"
                        placeholder="Ingin melihat info detail **batas harian dan sisa kredit kamu?** Klik tombol **LOGIN** diatas layar,  Belum punya akun? pencet teks **Daftar akun**"
                      />
                      <p className="text-[10px] text-slate-400">
                        Tips: Gunakan tanda <code className="text-amber-400 font-mono font-bold">**kata**</code> untuk menebalkan teks di dalam banner pengumuman.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: MODE PEMELIHARAAN (MAINTENANCE) */}
              {activeTab === 'maintenance' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xl">
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-amber-400" />pengaturan mode maintenance
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Kelola status aktifasi sistem pemeliharaan</p>
                    </div>
                    <button
                      onClick={async () => {
                        await saveSettingsToServer();
                        setSuccessToast('Semua Pengaturan Pemeliharaan berhasil disimpan!');
                        setTimeout(() => setSuccessToast(null), 2500);
                      }}
                      className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center gap-1.5 shrink-0"
                    >
                      <Check className="w-4 h-4" />
                      <span>Simpan Kustomisasi</span>
                    </button>
                  </div>

                  {/* Status Toggle Card */}
                  <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${maintenanceMode ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-white">Status Pemeliharaan</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Saat aktif, layanan verifikasi akan ditutup sementara untuk semua pengguna umum.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${maintenanceMode ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                        {maintenanceMode ? 'Status : AKTIF' : 'Status : MATI'}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          const newMaint = !maintenanceMode;
                          setMaintenanceMode(newMaint);
                          await saveSettingsToServer({ maintenanceMode: newMaint });
                          setSuccessToast(`Mode Pemeliharaan berhasil ${newMaint ? 'diaktifkan' : 'dimatikan'}!`);
                          setTimeout(() => setSuccessToast(null), 2500);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${maintenanceMode ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20' : 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-md shadow-amber-600/20'}`}
                      >
                        {maintenanceMode ? 'Matikan Maintenance' : 'Aktifkan Maintenance'}
                      </button>
                    </div>
                  </div>

                  {/* Text Customization Inputs */}
                  <div className="space-y-4">
                    <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-4">
                      {/* Title input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">Judul Notifikasi Pemeliharaan</label>
                        <input
                          type="text"
                          value={maintenanceTitle}
                          onChange={(e) => setMaintenanceTitle(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                          placeholder="Contoh: Layanan Verifikasi Ditangguhkan Sementara"
                        />
                      </div>

                      {/* Description input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">Deskripsi/Pesan Pemeliharaan</label>
                        <textarea
                          rows={4}
                          value={maintenanceDesc}
                          onChange={(e) => setMaintenanceDesc(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed font-medium"
                          placeholder="Tuliskan pesan detail pemeliharaan..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: CS & SOCIAL MEDIA LINKS */}
              {activeTab === 'cs_links' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-white tracking-wide uppercase">KELOLA LINK CS & MEDIA SOSIAL</h3>
                        <p className="text-xs text-slate-400">Atur tautan grup WhatsApp, Telegram, Kontak Admin, dan Media Sosial</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* CS Section */}
                    <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-3">
                      <p className="text-xs font-black text-emerald-400 uppercase tracking-widest border-b border-slate-800/80 pb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span>1. KONTAK CUSTOMER SERVICE & KOMUNITAS</span>
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-extrabold text-slate-300 flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                            Link Grup WhatsApp Komunitas
                          </label>
                          <input
                            type="text"
                            value={waGroupLink}
                            onChange={(e) => setWaGroupLink(e.target.value)}
                            placeholder="https://chat.whatsapp.com/..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-extrabold text-slate-300 flex items-center gap-2">
                            <Radio className="w-3.5 h-3.5 text-teal-400" />
                            Link Channel WhatsApp Resmi
                          </label>
                          <input
                            type="text"
                            value={waChannelLink}
                            onChange={(e) => setWaChannelLink(e.target.value)}
                            placeholder="https://whatsapp.com/channel/..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-extrabold text-slate-300 flex items-center gap-2">
                            <Send className="w-3.5 h-3.5 text-sky-400" />
                            Link Grup Telegram Support
                          </label>
                          <input
                            type="text"
                            value={tgGroupLink}
                            onChange={(e) => setTgGroupLink(e.target.value)}
                            placeholder="https://t.me/..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-extrabold text-slate-300 flex items-center gap-2">
                            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                            Link Kontak Admin Direct (WhatsApp Admin)
                          </label>
                          <input
                            type="text"
                            value={adminDirectLink}
                            onChange={(e) => setAdminDirectLink(e.target.value)}
                            placeholder="https://wa.me/628xxx"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Social Media Section */}
                    <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-3">
                      <p className="text-xs font-black text-amber-400 uppercase tracking-widest border-b border-slate-800/80 pb-2 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-amber-400" />
                        <span>2. MEDIA SOSIAL RESMI & USERNAME</span>
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-xs font-extrabold text-slate-300 flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5 text-amber-400" />
                            Username / Handle Media Sosial (Judul)
                          </label>
                          <input
                            type="text"
                            value={socialHandle}
                            onChange={(e) => setSocialHandle(e.target.value)}
                            placeholder="Contoh: @AlightMaster"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono font-bold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-extrabold text-slate-300 flex items-center gap-2">
                            <Send className="w-3.5 h-3.5 text-sky-400" />
                            Link Social Telegram
                          </label>
                          <input
                            type="text"
                            value={socialTgLink}
                            onChange={(e) => setSocialTgLink(e.target.value)}
                            placeholder="https://t.me/..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-extrabold text-slate-300 flex items-center gap-2">
                            <Link className="w-3.5 h-3.5 text-rose-400" />
                            Link Social TikTok
                          </label>
                          <input
                            type="text"
                            value={socialTiktokLink}
                            onChange={(e) => setSocialTiktokLink(e.target.value)}
                            placeholder="https://tiktok.com/@..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-medium"
                          />
                        </div>

                        <div className="space-y-1.5 sm:col-span-1">
                          <label className="text-xs font-extrabold text-slate-300 flex items-center gap-2">
                            <Share2 className="w-3.5 h-3.5 text-rose-400" />
                            Link Social Instagram
                          </label>
                          <input
                            type="text"
                            value={socialIgLink}
                            onChange={(e) => setSocialIgLink(e.target.value)}
                            placeholder="https://instagram.com/..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-medium"
                          />
                        </div>

                        <div className="space-y-1.5 sm:col-span-1">
                          <label className="text-xs font-extrabold text-slate-300 flex items-center gap-2">
                            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                            Link Social GitHub
                          </label>
                          <input
                            type="text"
                            value={socialGithubLink}
                            onChange={(e) => setSocialGithubLink(e.target.value)}
                            placeholder="https://github.com/..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleSaveCsLinks}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-xs px-6 py-3.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center gap-2 uppercase tracking-wide active:scale-95"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Simpan Link CS & Media Sosial</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: BANNER LAPORAN / KENDALA CHAT & STATUS LISENSI */}
              {activeTab === 'banner_laporan' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-white tracking-wide uppercase">BANNER LAPORAN CHAT GLOBAL</h3>
                        <p className="text-xs text-slate-400">Atur pesan informasi pelaporan di ruang chat serta label status lisensi akun pengguna</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* BAGIAN 1: BANNER LAPORAN CHAT */}
                    <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner">
                      <p className="text-xs font-black text-amber-400 uppercase tracking-widest border-b border-slate-800/80 pb-2 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span>BANNER LAPORAN / KENDALA CHAT GLOBAL</span>
                      </p>

                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-slate-200 flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                          <span>teks chat global di atas kolom ketik chat</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setChatReportNotice('silahkan lapor disini jika ada error atau gagal verifikasi akun pro, admin respon 22.00/04.00')}
                          className="text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-all cursor-pointer bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30"
                        >
                          RESET
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        value={chatReportNotice}
                        onChange={(e) => setChatReportNotice(e.target.value)}
                        placeholder="silahkan lapor disini jika ada error atau gagal verifikasi akun pro, admin respon 22.00/04.00"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 font-medium transition-all"
                      />

                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Teks ini akan otomatis ditampilkan di banner atas ruang obrolan Global Chat agar pengguna mengetahui saluran resmi pelaporan kendala akun pro dan jam kerja admin.
                      </p>

                      {/* Live Preview Chat Banner */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Pratinjau Banner Chat:</span>
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-500/30 rounded-xl px-3.5 py-2.5 flex items-center gap-2 shadow-sm">
                          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                            {chatReportNotice || 'Tidak ada teks pemberitahuan'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* BAGIAN 2: STATUS LISENSI PROFIL PENGGUNA */}
                    <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner">
                      <p className="text-xs font-black text-emerald-400 uppercase tracking-widest border-b border-slate-800/80 pb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>STATUS LISENSI KARTU PROFIL PENGGUNA</span>
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Input 1: Badge Lisensi */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5">
                              <span>BADGE STATUS</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setLicenseBadge('ACTIVE')}
                              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                            >
                              Reset
                            </button>
                          </div>
                          <input
                            type="text"
                            value={licenseBadge}
                            onChange={(e) => setLicenseBadge(e.target.value)}
                            placeholder="ACTIVE"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold transition-all"
                          />
                          <p className="text-[10px] text-slate-500">ISI TEKS BEBAS</p>
                        </div>

                        {/* Input 2: Keterangan Lisensi */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5">
                              <span>TEKS KETERANGAN LISENSI</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setLicenseTitle('ISI TEKS BEBAS')}
                              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                            >
                              Reset
                            </button>
                          </div>
                          <input
                            type="text"
                            value={licenseTitle}
                            onChange={(e) => setLicenseTitle(e.target.value)}
                            placeholder="PRO ACTIVE"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold transition-all"
                          />
                          <p className="text-[10px] text-slate-500">M.NABIL ASSIHIDIQI</p>
                        </div>
                      </div>

                      {/* Preset Cepat */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">PILIHAN CEPAT</span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => { setLicenseBadge('PRO ACTIVE'); setLicenseTitle('PRO ACTIVE'); }}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-[10px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                          >
                            Default : PRO ACTIVE 
                          </button>
                          <button
                            type="button"
                            onClick={() => { setLicenseBadge('VIP LIFETIME'); setLicenseTitle('PRO VIP LIFETIME'); }}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-[10px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                          >
                            VIP Lifetime
                          </button>
                          <button
                            type="button"
                            onClick={() => { setLicenseBadge('PRO ACTIVE ACCESS'); setLicenseTitle('PRO ACTIVE ACCESS'); }}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-[10px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                          >
                            Unlimited Access
                          </button>
                        </div>
                      </div>

                      {/* Live Preview Kartu Profil */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Pratinjau Kartu Status Lisensi di Profil Pengguna:</span>
                        <div className="max-w-xs bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col justify-between shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Status Lisensi</span>
                            <span className="text-[8px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {licenseBadge || 'ACTIVE'}
                            </span>
                          </div>
                          <span className="font-black text-[11px] inline-flex items-center gap-1 mt-1 truncate text-emerald-400">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                            <span className="truncate">{licenseTitle || 'PRO ACTIVE'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleSaveBannerLaporan}
                        className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs px-6 py-3.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center gap-2 uppercase tracking-wide active:scale-95"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Simpan Banner & Status Lisensi</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: KEAMANAN 2FA ADMIN */}
              {activeTab === '2fa' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                  {/* Top Title Banner */}
                  <div className="flex items-start gap-3.5 border-b border-slate-800 pb-4">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg">
                      <Shield className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-white tracking-wide uppercase">
                        KEAMANAN ADMIN 2FA
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Amankan akses dashboard admin dengan Autentikasi Dua Faktor (2FA) Google Authenticator / Authy.
                      </p>
                    </div>
                  </div>

                  {setupError && (
                    <div className="bg-red-950/70 border border-red-800/80 rounded-xl p-3 flex items-start gap-2.5 text-red-200 text-xs">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{setupError}</span>
                    </div>
                  )}

                  {!twoFaEnabled ? (
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                      {!setup2FA ? (
                        /* State 1: 2FA Belum Aktif */
                        <div className="space-y-4">
                          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-black text-sm text-amber-300 uppercase">2FA BELUM AKTIF</h4>
                              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                Sangat disarankan untuk mengaktifkan 2FA guna melindungi dashboard admin dari akses yang tidak sah.
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={startSetup2FA}
                            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-xs py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                          >
                            <Key className="w-4 h-4" />
                            <span>MULAI SETUP 2FA</span>
                          </button>
                        </div>
                      ) : (
                        /* State 2: QR Code Scan & Verification Step */
                        <div className="space-y-5">
                          <div className="flex flex-col items-center justify-center text-center space-y-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
                            {qrCodeDataUrl ? (
                              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border-2 border-slate-800 shadow-xl">
                                <img src={qrCodeDataUrl} alt="2FA QR Code" className="w-48 h-48 object-contain" />
                              </div>
                            ) : (
                              <div className="w-48 h-48 rounded-2xl bg-slate-800 flex items-center justify-center">
                                <RefreshCw className="w-6 h-6 text-slate-500 dark:text-slate-400 animate-spin" />
                              </div>
                            )}

                            <div className="space-y-2 text-left max-w-md w-full pt-2">
                              <p className="text-xs font-semibold text-slate-300">
                                1. Scan QR Code di atas menggunakan aplikasi <strong className="text-emerald-400">Google Authenticator</strong> atau <strong className="text-emerald-400">Authy</strong> di HP kamu.
                              </p>
                              <p className="text-xs font-semibold text-slate-300">
                                2. Atau masukkan kode rahasia secara manual:
                              </p>
                              
                              <div className="flex items-center gap-2 bg-slate-950 border border-emerald-500/30 rounded-xl p-2.5">
                                <code className="flex-1 font-mono text-emerald-400 font-bold text-xs tracking-wider break-all text-center">
                                  {tempSecret}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(tempSecret);
                                    setCopiedSecret(true);
                                    setTimeout(() => setCopiedSecret(false), 2000);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
                                  title="Salin Kode Secret"
                                >
                                  {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          <form onSubmit={handleVerifyAndEnable2FA} className="space-y-3 max-w-md mx-auto">
                            <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider">
                              MASUKKAN KODE VERIFIKASI DARI APLIKASI:
                            </label>

                            <div className="flex flex-col sm:flex-row gap-2.5">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={verifySetupCode}
                                onChange={(e) => setVerifySetupCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="Contoh: 123456"
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono tracking-widest text-emerald-400 placeholder:text-slate-600 dark:text-slate-300 focus:outline-none focus:border-emerald-500 text-center"
                              />

                              <button
                                type="submit"
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap uppercase tracking-wider"
                              >
                                VERIFIKASI & AKTIFKAN
                              </button>
                            </div>

                            <div className="pt-2 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSetup2FA(false);
                                  setSetupError('');
                                }}
                                className="text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                              >
                                Batalkan Setup
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* State 3: 2FA Sudah Aktif */
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm text-emerald-400 uppercase">2FA AKTIF & DIPROTEKSI</h4>
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full">
                              VERIFIED
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            Dashboard admin telah dilindungi dengan Google Authenticator. Setiap kali login, sistem akan meminta 6 digit kode dari HP kamu.
                          </p>
                        </div>
                      </div>

                      {!showDisableConfirm ? (
                        <div className="pt-2 flex flex-wrap gap-2">
                          <button
                            onClick={() => setShowDisableConfirm(true)}
                            className="bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                          >
                            Nonaktifkan 2FA dengan Kode
                          </button>
                          <button
                            onClick={handleInstantDisable2FA}
                            className="bg-red-600 hover:bg-red-500 text-white font-black text-xs py-2.5 px-4 rounded-xl transition-all shadow-md cursor-pointer"
                          >
                            Matikan Instan 2FA (Bypass)
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleDisable2FA} className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-4 space-y-3">
                          <h5 className="font-bold text-xs text-rose-200 uppercase">
                            Konfirmasi Penonaktifan 2FA
                          </h5>
                          <p className="text-[11px] text-slate-400">
                            Masukkan kode 6 digit dari Google Authenticator untuk mematikan 2FA:
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={6}
                              value={disableCodeInput}
                              onChange={(e) => setDisableCodeInput(e.target.value.replace(/\D/g, ''))}
                              placeholder="6 Digit Kode"
                              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 text-center focus:outline-none focus:border-rose-500"
                            />
                            <button
                              type="submit"
                              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                            >
                              Matikan
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowDisableConfirm(false)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-2 rounded-xl cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
