import { FaqItem, FeatureItem, ActivityLog } from '../types';

export const getFaqData = (websiteName: string, appName: string, appPublisher: string): FaqItem[] => [
  {
    id: 'faq-1',
    question: `Berapa lama lisensi ${appName} ini aktif?`,
    answer: `Lisensi yang diklaim melalui ${websiteName} berlaku secara penuh selama 1 Tahun (365 Hari) terhitung sejak tanggal verifikasi berhasil dilakukan.`
  },
  {
    id: 'faq-2',
    question: `Apakah layanan verifikasi di ${websiteName} 100% gratis?`,
    answer: `Ya! Seluruh proses verifikasi dan klaim ${appName} 1 Tahun di ${websiteName} adalah 100% gratis tanpa dipungut biaya apapun.`
  },
  {
    id: 'faq-3',
    question: `Apa itu Link OOB dari ${appPublisher}?`,
    answer: `Link OOB (Out-Of-Band) adalah link autentikasi unik berbasis Firebase yang dikirimkan oleh ${appPublisher} ke email kamu saat mencoba login. Link ini berisi token khusus untuk mengonfirmasi kepemilikan akun.`
  },
  {
    id: 'faq-4',
    question: 'Kenapa Link OOB hanya aktif selama 3 menit?',
    answer: `Batasan durasi 3 menit diterapkan untuk alasan keamanan autentikasi. Jika link tidak ditempelkan dalam waktu 3 menit, kamu dapat menggunakan tombol 'Isi Ulang Link OOB' di ${websiteName}.`
  },
  {
    id: 'faq-5',
    question: 'Kenapa ada jeda cooldown 2 menit antar order?',
    answer: 'Jeda 2 menit berfungsi sebagai sistem proteksi keamanan untuk mencegah request berlebihan (rate limiting) dan menjaga kestabilan server verifikasi untuk semua pengguna.'
  },
  {
    id: 'faq-6',
    question: 'Apakah aman menggunakan email pribadi?',
    answer: `Sangat aman. ${websiteName} hanya memproses link OOB resmi dari server ${appPublisher} tanpa pernah meminta atau menyimpan kata sandi (password) email kamu.`
  }
];

export const getFeatureData = (appName: string, appPublisher: string): FeatureItem[] => [
  {
    id: 'feat-1',
    icon: 'Sparkles',
    title: 'Tanpa Watermark',
    badge: 'PRO FEATURE',
    description: `Eksport hasil editan video kamu tanpa logo watermark ${appName.replace(' Pro', '')}. Tampilan profesional untuk YouTube, TikTok, & Reels.`,
    isIncluded: true
  },
  {
    id: 'feat-2',
    icon: 'FileCode',
    title: 'Full Preset & XML Unlocked',
    badge: 'UNLIMITED',
    description: 'Bebas import dan export file preset XML / QR Code buatan creator terkemuka tanpa batasan ukuran file.',
    isIncluded: true
  },
  {
    id: 'feat-3',
    icon: 'Sliders',
    title: 'Keyframe Smooth Curve Graph',
    badge: 'ADVANCED',
    description: 'Kontrol animasi tingkat lanjut dengan kurva kustom keyframe, easing profesional, serta efek motion blur yang realistis.',
    isIncluded: true
  },
  {
    id: 'feat-4',
    icon: 'Layers',
    title: 'Vektor & Multi-Layer Graphics',
    badge: 'UNLIMITED LAYERS',
    description: 'Dukungan layer grafis, video, foto, audio, dan bentuk vektor tanpa batas dengan blending mode terlengkap.',
    isIncluded: true
  },
  {
    id: 'feat-5',
    icon: 'Video',
    title: 'Eksport 4K 60FPS High-Bitrate',
    badge: 'ULTRA HD',
    description: 'Proses render ekstra cepat dan jernih hingga kualitas 4K UHD 60FPS tanpa kompresi buram atau patah-patah.',
    isIncluded: true
  },
  {
    id: 'feat-6',
    icon: 'CloudSync',
    title: 'Sync Cloud & Project Backup',
    badge: 'CLOUD SYNC',
    description: `Proyek kamu tersimpan aman di cloud ${appPublisher}. Bisa dilanjutkan di mana saja, kapan saja tanpa khawatir hilang.`,
    isIncluded: true
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];
