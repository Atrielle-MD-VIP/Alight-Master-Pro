import React, { useState, useEffect } from 'react';
import { Headset, X, MessageSquare, MessageCircle, Radio, Send, UserCheck, ShieldCheck, ExternalLink, Activity, RefreshCw, Copy, Check, Lock, Server, MapPin, Wifi, Instagram, Eye, EyeOff } from 'lucide-react';
import { useAppSettings } from '../hooks/useAppSettings';

interface GeoData {
  ip: string;
  country_name: string;
  country_code: string;
  region: string;
  city: string;
  org: string;
  asn?: string;
}

export const SupportModal: React.FC = () => {
  const { websiteName } = useAppSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contact'>('dashboard');
  const [geoData, setGeoData] = useState<GeoData | null>(null);

  const checkUserSession = () => {
    try {
      const session = localStorage.getItem('alight_user_session');
      if (session) {
        setIsLoggedIn(true);
        setActiveTab('contact');
      } else {
        setIsLoggedIn(false);
      }
    } catch {
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkUserSession();
    }
  }, [isOpen]);

  const [isLoadingIp, setIsLoadingIp] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFullIp, setShowFullIp] = useState(false);

  const maskIp = (ipStr: string) => {
    if (!ipStr) return '***.***.***.***';
    if (ipStr.includes('.')) {
      const parts = ipStr.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.***.***`;
      }
    }
    if (ipStr.includes(':')) {
      const parts = ipStr.split(':');
      return `${parts[0]}:${parts[1]}:****:****`;
    }
    return '***.***.***.***';
  };

  // Quota & Reset State (synced with Admin settings in localStorage & MongoDB API)
  const [usedCount, setUsedCount] = useState(0);
  const [timeLeftToReset, setTimeLeftToReset] = useState('');
  const [quotaLimitStr, setQuotaLimitStr] = useState('5');
  const [quotaPeriodStr, setQuotaPeriodStr] = useState('harian');
  const [remainingQuotaStr, setRemainingQuotaStr] = useState('5');
  const [resetHoursStr, setResetHoursStr] = useState('24');

  // CS & Social Links state (synced with Admin settings in localStorage)
  const [csLinks, setCsLinks] = useState({
    waGroup: localStorage.getItem('alight_link_wa_group') || 'https://chat.whatsapp.com',
    waChannel: localStorage.getItem('alight_link_wa_channel') || 'https://whatsapp.com/channel',
    tgGroup: localStorage.getItem('alight_link_tg_group') || 'https://t.me',
    adminDirect: localStorage.getItem('alight_link_admin_direct') || 'https://wa.me',
    socialTg: localStorage.getItem('alight_link_social_tg') || 'https://t.me',
    socialTiktok: localStorage.getItem('alight_link_social_tiktok') || 'https://tiktok.com',
    socialIg: localStorage.getItem('alight_link_social_ig') || 'https://instagram.com',
    socialHandle: localStorage.getItem('alight_social_handle') || '@AlightMaster',
  });

  const loadCsLinks = () => {
    setCsLinks({
      waGroup: localStorage.getItem('alight_link_wa_group') || 'https://chat.whatsapp.com',
      waChannel: localStorage.getItem('alight_link_wa_channel') || 'https://whatsapp.com/channel',
      tgGroup: localStorage.getItem('alight_link_tg_group') || 'https://t.me',
      adminDirect: localStorage.getItem('alight_link_admin_direct') || 'https://wa.me',
      socialTg: localStorage.getItem('alight_link_social_tg') || 'https://t.me',
      socialTiktok: localStorage.getItem('alight_link_social_tiktok') || 'https://tiktok.com',
      socialIg: localStorage.getItem('alight_link_social_ig') || 'https://instagram.com',
      socialHandle: localStorage.getItem('alight_social_handle') || '@AlightMaster',
    });
  };

  const fetchRealIpInfo = async () => {
    setIsLoadingIp(true);
    try {
      const res = await fetch('https://ipwho.is/').catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setGeoData({
          ip: data.ip || '0.0.0.0',
          country_name: data.country || 'Unknown',
          country_code: data.country_code || '??',
          region: data.region || 'Unknown',
          city: data.city || 'Unknown',
          org: data.connection?.isp || data.connection?.org || 'Unknown',
        });
      } else {
        const res2 = await fetch('https://api.ipify.org?format=json').catch(() => null);
        if (res2 && res2.ok) {
          const data2 = await res2.json();
          setGeoData({
            ip: data2.ip || '0.0.0.0',
            country_name: 'Unknown',
            country_code: '??',
            region: 'Unknown',
            city: 'Unknown',
            org: 'Unknown',
          });
        } else {
          setGeoData({
            ip: '0.0.0.0',
            country_name: 'Unknown',
            country_code: '??',
            region: 'Unknown',
            city: 'Unknown',
            org: 'Unknown',
          });
        }
      }
    } catch {
      setGeoData({
        ip: '0.0.0.0',
        country_name: 'Unknown',
        country_code: '??',
        region: 'Unknown',
        city: 'Unknown',
        org: 'Unknown',
      });
    } finally {
      setIsLoadingIp(false);
    }
  };

  // Calculate real usage from localStorage and settings sync
  const loadSettings = () => {
    try {
      loadCsLinks();

      const limit = localStorage.getItem('alight_quota_limit');
      const period = localStorage.getItem('alight_quota_period');
      const rem = localStorage.getItem('alight_remaining_quota');
      const rHours = localStorage.getItem('alight_reset_hours');

      if (limit !== null && limit !== '') setQuotaLimitStr((prev) => (prev !== limit ? limit : prev));
      if (period !== null && period !== '') {
        const cleanPeriod = !period || period === 'per IP (harian)' || period === 'per IP' ? 'harian' : period;
        setQuotaPeriodStr((prev) => (prev !== cleanPeriod ? cleanPeriod : prev));
      }
      if (rem !== null && rem !== '') setRemainingQuotaStr((prev) => (prev !== rem ? rem : prev));
      if (rHours !== null && rHours !== '') setResetHoursStr((prev) => (prev !== rHours ? rHours : prev));

      const savedOrders = localStorage.getItem('alightpro_orders');
      if (savedOrders) {
        const orders = JSON.parse(savedOrders);
        const today = new Date().toDateString();
        const todayOrders = orders.filter((o: any) => new Date(o.createdAt || Date.now()).toDateString() === today);
        setUsedCount((prev) => (prev !== todayOrders.length ? todayOrders.length : prev));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSettings();

    window.addEventListener('alight_settings_updated', loadSettings);
    window.addEventListener('storage', loadSettings);

    // Countdown timer based on reset hours
    const updateResetTimer = () => {
      const now = new Date();
      const rHoursNum = parseFloat(resetHoursStr) || 24;
      const diff = rHoursNum * 3600 * 1000 - (Date.now() % (rHoursNum * 3600 * 1000));

      if (diff > 0) {
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeftToReset(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      } else {
        setTimeLeftToReset('00:00:00');
      }
    };

    updateResetTimer();
    const timer = setInterval(updateResetTimer, 1000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('alight_settings_updated', loadSettings);
      window.removeEventListener('storage', loadSettings);
    };
  }, [isOpen, resetHoursStr]);

  useEffect(() => {
    if (isOpen && activeTab === 'dashboard') {
      fetchRealIpInfo();
    }
  }, [isOpen, activeTab]);

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const limitParsed = parseFloat(quotaLimitStr);
  const numericMaxQuota = !isNaN(limitParsed) ? limitParsed : 5;

  const numericRemainingQuota = Math.max(0, numericMaxQuota - usedCount);
  const usagePercentage = numericMaxQuota > 0 ? Math.min(100, Math.round((usedCount / numericMaxQuota) * 100)) : 0;

  return (
    <>
      {/* Floating Headset Support Button (Bottom Right) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 w-9 h-9 sm:w-10 sm:h-10 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/60 flex items-center justify-center active:scale-95 transition-all duration-200 group cursor-pointer backdrop-blur-md"
        aria-label="Pusat Bantuan & Komunitas"
      >
        <Headset className="w-4 h-4 stroke-[2.2] group-hover:scale-110 transition-transform duration-200" />
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white dark:border-slate-950 shadow-sm">
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
        </span>
      </button>

      {/* Support Modal Popup */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 rounded-3xl max-w-[390px] w-full shadow-2xl overflow-hidden select-none animate-in zoom-in-95 duration-200 max-h-[84vh] flex flex-col relative">
            
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-50 via-indigo-50/50 to-slate-50 dark:from-slate-950 dark:via-indigo-950/80 dark:to-slate-950 p-3 sm:p-3.5 border-b border-slate-200 dark:border-slate-800/90 flex items-center justify-between shrink-0 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-sm">
                  <Headset className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white tracking-wide bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                    Pusat Bantuan & Komunitas
                  </h3>
                  <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400">Pusat Layanan CS & Monitoring Realtime</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-all cursor-pointer hover:scale-105"
              >
                <X className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
            </div>

            {/* Navigation Tabs - Hide Dashboard tab if user is logged in */}
            {!isLoggedIn ? (
              <div className="p-1.5 bg-slate-55 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800/80 grid grid-cols-2 gap-1 shrink-0 relative z-10">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`py-1.5 px-2.5 rounded-lg font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                      : 'bg-white dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 border border-slate-200 dark:border-slate-800/80'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-300 stroke-[2]" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveTab('contact')}
                  className={`py-1.5 px-2.5 rounded-lg font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'contact'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                      : 'bg-white dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 border border-slate-200 dark:border-slate-800/80'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-violet-500 dark:text-violet-300 stroke-[2]" />
                  <span>Kontak CS</span>
                </button>
              </div>
            ) : (
              <div className="px-3.5 py-2.5 bg-gradient-to-r from-indigo-50 to-slate-50 dark:from-indigo-950/60 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 relative z-10">
                <span className="font-extrabold text-[11px] text-slate-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Layanan CS & Komunitas Resmi</span>
                </span>
                <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px] px-2 py-0.5 rounded-full shadow-sm">
                  PRO MEMBER
                </span>
              </div>
            )}

            {/* Modal Scrollable Content */}
            <div className="p-3 sm:p-3.5 overflow-y-auto space-y-3 flex-1 relative z-10 no-scrollbar bg-slate-50/50 dark:bg-transparent">
              {activeTab === 'dashboard' && !isLoggedIn && (
                <div className="space-y-3">
                  {/* Dashboard Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 stroke-[2.2]" />
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">System Status</h4>
                      </div>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">Limit & Geo Location Realtime</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                        <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">Online</span>
                      </div>
                      <button
                        onClick={fetchRealIpInfo}
                        disabled={isLoadingIp}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-150 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                        title="Refresh IP Info"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingIp ? 'animate-spin text-indigo-500 dark:text-indigo-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Network Information Box (Real API Geolocation) */}
                  <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span className="text-[9px] font-extrabold uppercase text-slate-500 dark:text-slate-300 tracking-wider">Detail Informasi Jaringan</span>
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[8px] px-1.5 py-0.5 rounded-full">
                        Koneksi Aktif
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {/* IP Address */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-xl p-2 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Server className="w-3.5 h-3.5 stroke-[2.2]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">ALAMAT IP</p>
                            <p className="font-mono font-black text-[11px] text-slate-900 dark:text-white truncate">
                              {isLoadingIp
                                ? 'Mendeteksi...'
                                : showFullIp
                                ? (geoData?.ip || '')
                                : maskIp(geoData?.ip || '')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowFullIp(!showFullIp)}
                            title={showFullIp ? 'Sembunyikan IP' : 'Tampilkan IP Full'}
                            className="w-6.5 h-6.5 rounded-md bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                          >
                            {showFullIp ? <EyeOff className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" /> : <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(geoData?.ip || '', 'ip')}
                            title="Salin IP"
                            className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                          >
                            {copiedField === 'ip' ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Country */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-xl p-2 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                            <div className="w-3.5 h-2 rounded-xs flex flex-col overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700">
                              <div className="h-1 bg-red-600 w-full"></div>
                              <div className="h-1 bg-white w-full"></div>
                            </div>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">NEGARA</p>
                            <p className="font-extrabold text-[11px] text-slate-900 dark:text-white">
                              {isLoadingIp ? 'Memuat...' : `${geoData?.country_name || 'Indonesia'} (${geoData?.country_code || 'ID'})`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopy(`${geoData?.country_name} (${geoData?.country_code})`, 'country')}
                          className="w-6.5 h-6.5 rounded-md bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          {copiedField === 'country' ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Region & City */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-xl p-2 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-500 dark:text-amber-400">
                            <MapPin className="w-3.5 h-3.5 stroke-[2.2]" />
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">WILAYAH & KOTA</p>
                            <p className="font-extrabold text-[11px] text-slate-900 dark:text-white">
                              {isLoadingIp ? 'Memuat...' : `${geoData?.city || 'Jakarta'}, ${geoData?.region || 'Indonesia'}`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopy(`${geoData?.city}, ${geoData?.region}`, 'city')}
                          className="w-6.5 h-6.5 rounded-md bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          {copiedField === 'city' ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* ISP / Provider */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-xl p-2 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-550 dark:text-cyan-400">
                            <Wifi className="w-3.5 h-3.5 stroke-[2.2]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">ISP / PENYEDIA</p>
                            <p className="font-extrabold text-[11px] text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-[200px]">
                              {isLoadingIp ? 'Memuat...' : (geoData?.org || 'Internet Service Provider')}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopy(geoData?.org || '', 'isp')}
                          className="w-6.5 h-6.5 rounded-md bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          {copiedField === 'isp' ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quota & Reset Stats */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-center shadow-sm">
                      <p className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">BATAS HARIAN</p>
                      <p className="font-black text-[11px] text-indigo-600 dark:text-indigo-300 mt-0.5 font-mono">{quotaLimitStr} <span className="text-[8px] font-sans text-slate-500">x/{quotaPeriodStr}</span></p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-center shadow-sm">
                      <p className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">SISA KUOTA</p>
                      <p className="font-black text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">{numericRemainingQuota}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-center shadow-sm">
                      <p className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">RESET</p>
                      <p className="font-black text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-mono">{timeLeftToReset || '00:00:00'}</p>
                    </div>
                  </div>

                  {/* Quota Progress */}
                  <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      <span>Penggunaan Kuota Hari Ini</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[10px]">{usedCount} Dari {quotaLimitStr} Verifikasi ({usagePercentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 h-2 rounded-full overflow-hidden p-0.5">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm"
                        style={{ width: `${Math.min(100, usagePercentage)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Notice Box */}
                  <div className="bg-amber-500/5 dark:bg-slate-900/80 border border-amber-500/20 dark:border-slate-800 rounded-xl p-2 flex items-start gap-2 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[9px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                      Sistem kuota dihitung per Alamat IP publik. Setiap IP mendapatkan maksimal {quotaLimitStr} verifikasi per {resetHoursStr} jam.
                    </p>
                  </div>
                </div>
              )}

              {(activeTab === 'contact' || isLoggedIn) && (
                <div className="space-y-3.5">
                  {/* Main Link Cards matching dark website theme */}
                  <div className="space-y-2">
                    {/* 1. Grup WhatsApp Komunitas */}
                    <a
                      href={csLinks.waGroup}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 hover:border-emerald-550/40 dark:hover:border-emerald-500/40 rounded-xl p-2.5 flex items-center justify-between gap-2.5 shadow-sm transition-all duration-200 cursor-pointer group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shrink-0 shadow-sm">
                          <MessageSquare className="w-4 h-4 stroke-[2.2] group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-[11px] sm:text-xs text-slate-900 dark:text-white leading-tight tracking-wide">Grup WhatsApp Komunitas</h4>
                          <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-none mt-0.5">Diskusi & info update Alight Motion</p>
                        </div>
                      </div>
                      <div className="w-6.5 h-6.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                        <ExternalLink className="w-3 h-3 stroke-[2.2] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </a>

                    {/* 2. Channel WhatsApp Resmi */}
                    <a
                      href={csLinks.waChannel}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 hover:border-teal-550/40 dark:hover:border-teal-500/40 rounded-xl p-2.5 flex items-center justify-between gap-2.5 shadow-sm transition-all duration-200 cursor-pointer group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 shadow-sm">
                          <Radio className="w-4 h-4 stroke-[2.2] group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-[11px] sm:text-xs text-slate-900 dark:text-white leading-tight tracking-wide">Channel WhatsApp Resmi</h4>
                          <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-none mt-0.5">Pengumuman & kabar fitur terbaru</p>
                        </div>
                      </div>
                      <div className="w-6.5 h-6.5 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:bg-teal-500/20 transition-colors">
                        <ExternalLink className="w-3 h-3 stroke-[2.2] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </a>

                    {/* 3. Grup Telegram Support */}
                    <a
                      href={csLinks.tgGroup}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 hover:border-sky-550/40 dark:hover:border-sky-500/40 rounded-xl p-2.5 flex items-center justify-between gap-2.5 shadow-sm transition-all duration-200 cursor-pointer group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-500 dark:text-sky-400 shrink-0 shadow-sm">
                          <Send className="w-4 h-4 stroke-[2.2] group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-[11px] sm:text-xs text-slate-900 dark:text-white leading-tight tracking-wide">Grup Telegram Support</h4>
                          <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-none mt-0.5">Dukungan teknis cepat & file XML</p>
                        </div>
                      </div>
                      <div className="w-6.5 h-6.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-500 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:bg-sky-500/20 transition-colors">
                        <ExternalLink className="w-3 h-3 stroke-[2.2] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </a>

                    {/* 4. Kontak Admin Direct */}
                    <a
                      href={csLinks.adminDirect}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 hover:border-amber-550/40 dark:hover:border-amber-500/40 rounded-xl p-2.5 flex items-center justify-between gap-2.5 shadow-sm transition-all duration-200 cursor-pointer group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0 shadow-sm">
                          <MessageCircle className="w-4 h-4 stroke-[2.2] group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-[11px] sm:text-xs text-slate-900 dark:text-white leading-tight tracking-wide">Kontak Admin Direct</h4>
                          <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-none mt-0.5">Konsultasi kendala verifikasi khusus</p>
                        </div>
                      </div>
                      <div className="w-6.5 h-6.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                        <ExternalLink className="w-3 h-3 stroke-[2.2] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </a>
                  </div>

                  {/* Section Title: KUNJUNGI MEDIA SOSIAL RESMI */}
                  <div className="text-center pt-1 pb-0.5">
                    <p className="font-extrabold text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <span className="w-4 h-[1px] bg-slate-200 dark:bg-slate-800"></span>
                      <span>MEDIA SOSIAL RESMI ({csLinks.socialHandle || '@AlightMaster'})</span>
                      <span className="w-4 h-[1px] bg-slate-200 dark:bg-slate-800"></span>
                    </p>
                  </div>

                  {/* 3 Social Media Grid Buttons */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <a
                      href={csLinks.socialTg}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white hover:bg-slate-50 dark:bg-slate-900/90 dark:hover:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-xl py-1.5 px-1.5 flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer text-center group"
                    >
                      <Send className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 stroke-[2.2] group-hover:scale-110 transition-transform" />
                      <span className="font-extrabold text-[10px]">Telegram</span>
                    </a>

                    <a
                      href={csLinks.socialTiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white hover:bg-slate-50 dark:bg-slate-900/90 dark:hover:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-xl py-1.5 px-1.5 flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer text-center group"
                    >
                      <svg className="w-3.5 h-3.5 fill-current text-slate-600 dark:text-slate-300 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                        <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.31 0 .61.05.89.15V9.77a5.7 5.7 0 0 0-.89-.07 5.68 5.68 0 1 0 5.68 5.68V8.69a7.35 7.35 0 0 0 4.29 1.38V7a4.29 4.29 0 0 1-3.23-1.18z" />
                      </svg>
                      <span className="font-extrabold text-[10px]">TikTok</span>
                    </a>

                    <a
                      href={csLinks.socialIg}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white hover:bg-slate-50 dark:bg-slate-900/90 dark:hover:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-xl py-1.5 px-1.5 flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer text-center group"
                    >
                      <Instagram className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 stroke-[2.2] group-hover:scale-110 transition-transform" />
                      <span className="font-extrabold text-[10px]">Instagram</span>
                    </a>
                  </div>

                  {/* Bottom Security Banner */}
                  <div className="bg-slate-55 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-2 flex items-center gap-2.5 shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-550 dark:text-emerald-400 shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 leading-tight">
                      Admin tidak pernah meminta password email atau kata sandi kamu.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/90 flex items-center justify-between shrink-0 relative z-10">
              <span className="text-[9px] font-medium text-slate-450 dark:text-slate-500">{websiteName} Security v2.5.0</span>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-[10px] py-1 px-3 rounded-lg border border-slate-300 dark:border-slate-800 transition-all cursor-pointer active:scale-95"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};