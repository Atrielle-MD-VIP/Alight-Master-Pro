import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { InstructionCard } from './components/InstructionCard';
import { InfoBanner } from './components/InfoBanner';
import { VerificationPanel } from './components/VerificationPanel';
import { LiveStatsCard } from './components/LiveStatsCard';
import { FeatureListSection } from './components/FeatureListSection';
import { FaqSection } from './components/FaqSection';
import { FooterSection } from './components/FooterSection';
import { SupportModal } from './components/SupportModal';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { AdminModal } from './components/AdminModal';
import { LiveNotificationToast } from './components/LiveNotificationToast';
import { WelcomeModal } from './components/WelcomeModal';
import { FeedbackModal } from './components/FeedbackModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { GlobalChatModal } from './components/GlobalChatModal';
import { VerificationRecord } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ username: string } | null>(() => {
    try {
      const saved = localStorage.getItem('alight_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [userQuota, setUserQuota] = useState<any>(null);

  const [orders, setOrders] = useState<VerificationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('alightpro_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handleOpenFeedback = () => setIsFeedbackOpen(true);
    const handleOpenAuth = () => setIsAuthOpen(true);
    const handleOpenChat = () => setIsChatOpen(true);

    window.addEventListener('open_feedback_modal', handleOpenFeedback);
    window.addEventListener('open_auth_modal', handleOpenAuth);
    window.addEventListener('open_global_chat', handleOpenChat);

    return () => {
      window.removeEventListener('open_feedback_modal', handleOpenFeedback);
      window.removeEventListener('open_auth_modal', handleOpenAuth);
      window.removeEventListener('open_global_chat', handleOpenChat);
    };
  }, []);

  const handleLoginSuccess = (user: { username: string }) => {
    const session = { username: user.username };
    setCurrentUser(session);
    try {
      localStorage.setItem('alight_user_session', JSON.stringify(session));
    } catch (e) {
      console.error('Failed to save user session', e);
    }
    fetch(`/api/user/quota-info?username=${encodeURIComponent(user.username)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setUserQuota(data);
        }
      })
      .catch(() => {});
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserQuota(null);
    localStorage.removeItem('alight_user_session');
  };

  const refreshUserQuota = () => {
    if (currentUser?.username) {
      fetch(`/api/user/quota-info?username=${encodeURIComponent(currentUser.username)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setUserQuota(data);
            const uKey = currentUser.username;
            if (data.isPermanent) {
              localStorage.setItem(`alight_${uKey}_quota_limit`, 'Unlimited');
              localStorage.setItem(`alight_${uKey}_remaining`, '∞');
              localStorage.setItem(`alight_${uKey}_permanent`, 'true');
              localStorage.setItem(`alight_${uKey}_custom`, 'true');
              localStorage.setItem(`alight_${uKey}_reason`, data.reason || 'Akses Limit Unlimited');
            } else if (data.isCustom) {
              localStorage.setItem(`alight_${uKey}_quota_limit`, String(data.quotaLimit));
              localStorage.setItem(`alight_${uKey}_remaining`, String(data.remainingQuota));
              localStorage.setItem(`alight_${uKey}_permanent`, 'false');
              localStorage.setItem(`alight_${uKey}_custom`, 'true');
              localStorage.setItem(`alight_${uKey}_reason`, data.reason || '');
            } else {
              localStorage.setItem(`alight_${uKey}_quota_limit`, String(data.quotaLimit || data.globalLimit || 5));
              localStorage.setItem(`alight_${uKey}_remaining`, String(data.remainingQuota));
              localStorage.setItem(`alight_${uKey}_permanent`, 'false');
              localStorage.setItem(`alight_${uKey}_custom`, 'false');
              localStorage.removeItem(`alight_${uKey}_reason`);
              localStorage.removeItem('alight_is_permanent_quota');
            }
            if (data.period) {
              localStorage.setItem(`alight_${uKey}_quota_period`, data.period);
            }
          }
        })
        .catch(() => {});
    } else {
      setUserQuota(null);
    }
  };

  useEffect(() => {
    // Migrate old banner text if cached in user's browser localStorage
    const currentBanner = localStorage.getItem('alight_info_banner_text');
    if (currentBanner && (currentBanner.includes('Pusat Bantuan & CS') || currentBanner.includes('info detail **Dashboard**') || currentBanner.includes('sisa kuota harian'))) {
      localStorage.setItem('alight_info_banner_text', 'Ingin melihat info detail **batas harian dan sisa kredit kamu?** Klik tombol **LOGIN** diatas layar,  Belum punya akun? pencet teks **Daftar akun**');
      window.dispatchEvent(new CustomEvent('alight_settings_updated'));
    }
  }, []);

  useEffect(() => {
    refreshUserQuota();
    window.addEventListener('alight_settings_updated', refreshUserQuota);
    return () => {
      window.removeEventListener('alight_settings_updated', refreshUserQuota);
    };
  }, [currentUser?.username]);

  useEffect(() => {
    // Auto fetch global settings (Website Name, Quota Settings, etc.)
    const fetchGlobalSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object') {
            const serverTs = Number(data.updatedAt || 0);
            const localTs = Number(localStorage.getItem('alight_settings_updated_at') || 0);

            // Only sync from server if server data is equal or newer than local state
            if (serverTs >= localTs) {
              let hasChanges = false;

              const checkAndSync = (key: string, val: any) => {
                if (val !== undefined && val !== null) {
                  let cleanVal = String(val);
                  if (key === 'alight_quota_period' && (cleanVal.includes('per IP') || cleanVal === 'per IP (harian)')) {
                    cleanVal = 'harian';
                  }
                  const current = localStorage.getItem(key);
                  if (current !== cleanVal) {
                    localStorage.setItem(key, cleanVal);
                    hasChanges = true;
                  }
                }
              };

              checkAndSync('alight_settings_updated_at', String(serverTs));
              checkAndSync('alight_quota_limit', data.quotaLimit);
              checkAndSync('alight_quota_period', data.quotaPeriod);
              checkAndSync('alight_remaining_quota', data.remainingQuota);
              checkAndSync('alight_reset_hours', data.resetHours);
              checkAndSync('alight_website_name', data.websiteName);
              checkAndSync('alight_app_name', data.appName);
              checkAndSync('alight_app_publisher', data.appPublisher);
              checkAndSync('alight_info_banner_text', data.infoBannerText);
              checkAndSync('alight_chat_report_notice', data.chatReportNotice);
              checkAndSync('alight_license_badge', data.licenseBadge);
              checkAndSync('alight_license_title', data.licenseTitle);
              checkAndSync('alight_maintenance_mode', data.maintenanceMode);
              checkAndSync('alight_maintenance_title', data.maintenanceTitle);
              checkAndSync('alight_maintenance_desc', data.maintenanceDesc);

              if (hasChanges) {
                window.dispatchEvent(new CustomEvent('alight_settings_updated'));
              }
            }
          }
        }
      } catch (e) {
        // Fallback to local storage if network fails
      }
    };

    fetchGlobalSettings();
    const interval = setInterval(fetchGlobalSettings, 5000);

    // Sync settings between tabs/iframes instantly when localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('alight_')) {
        window.dispatchEvent(new CustomEvent('alight_settings_updated'));
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('alightpro_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders to localStorage', e);
    }
  }, [orders]);

  useEffect(() => {
    const checkWelcome = () => {
      const hideExpiration = localStorage.getItem('alightpro_hide_welcome');
      if (hideExpiration) {
        const now = new Date().getTime();
        if (now < parseInt(hideExpiration, 10)) {
          return; // Still hidden
        } else {
          localStorage.removeItem('alightpro_hide_welcome');
        }
      }
      // Delay showing welcome modal slightly
      setTimeout(() => setIsWelcomeOpen(true), 500);
    };

    checkWelcome();
  }, []);

  const handleNavigate = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAddOrder = (newRecord: VerificationRecord) => {
    setOrders((prev) => [newRecord, ...prev]);
  };

  const handleClearOrders = () => {
    setOrders([]);
    localStorage.removeItem('alightpro_orders');
  };

  const handleDeleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-slate-900 text-slate-900 dark:text-white transition-colors pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Sticky Header */}
      <Navbar
        onNavigate={handleNavigate}
        onOpenHistory={() => setIsHistoryOpen(true)}
        activeOrderCount={orders.length}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="space-y-2">
        {/* Hero Section */}
        <HeroSection />

        {/* How to Get OOB Link Instructions */}
        <InstructionCard />

        {/* Info Banner Above Verification Panel */}
        <InfoBanner />

        {/* 3-Step OOB Verification Panel */}
        <VerificationPanel onSuccess={handleAddOrder} currentUser={currentUser} />

        {/* Real-time Verification Statistics */}
        <LiveStatsCard />

        {/* Pro Features Breakdown */}
        <FeatureListSection />

        {/* FAQ Accordions */}
        <FaqSection />
      </main>

      {/* Footer */}
      <FooterSection 
        onNavigate={handleNavigate} 
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Floating Support Modal */}
      <SupportModal />

      {/* Live Activation Toast Notification */}
      <LiveNotificationToast />

      {/* Order History Modal */}
      <OrderHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        orders={orders}
        onClear={handleClearOrders}
        onDeleteOrder={handleDeleteOrder}
      />

      {/* Admin Management Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        orders={orders}
        onClearOrders={handleClearOrders}
        onDeleteOrder={handleDeleteOrder}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      {/* Welcome Modal */}
      <WelcomeModal 
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
      />

      {/* Login & Register Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* User Profile & Password Reset Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        userQuota={userQuota}
      />

      {/* Global Chat Modal */}
      <GlobalChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
