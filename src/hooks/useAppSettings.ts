import { useState, useEffect } from 'react';

export function useAppSettings() {
  const [websiteName, setWebsiteName] = useState(() => localStorage.getItem('alight_website_name') || 'AlightMaster');
  const [appName, setAppName] = useState(() => localStorage.getItem('alight_app_name') || 'Alight Motion Pro');
  const [appPublisher, setAppPublisher] = useState(() => localStorage.getItem('alight_app_publisher') || 'Alight Creative');

  useEffect(() => {
    const handleUpdate = () => {
      const w = localStorage.getItem('alight_website_name') || 'AlightMaster';
      const a = localStorage.getItem('alight_app_name') || 'Alight Motion Pro';
      const p = localStorage.getItem('alight_app_publisher') || 'Alight Creative';

      setWebsiteName((prev) => (prev !== w ? w : prev));
      setAppName((prev) => (prev !== a ? a : prev));
      setAppPublisher((prev) => (prev !== p ? p : prev));
    };

    window.addEventListener('alight_settings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('alight_settings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return { websiteName, appName, appPublisher };
}
