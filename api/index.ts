import express from 'express';
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { sendOobLinkRemote, verifyOobLinkRemote } from '../src/lib/alightApi.js';
import { loadGithubProxies } from '../src/lib/proxyManager.js';

export const app = express();

app.use(express.json());

const MONGO_URI = process.env.MONGODB_URI;
let mongoClient: MongoClient | null = null;
let mongoDb: any = null;

// Local JSON file store path in /tmp for Vercel / serverless compatibility (writable directory)
const LOCAL_STORE_FILE = path.join(os.tmpdir(), 'alight_local_store.json');
const LOCAL_STORE_FILE_FALLBACK = path.join(process.cwd(), 'local_store.json');

// In-memory Database state
let stats = {
  todayCount: 0,
  totalCount: 0,
  lastDate: new Date().toISOString().split('T')[0],
  dbType: 'mongodb'
};

function checkDailyStatsReset() {
  const currentDate = new Date().toISOString().split('T')[0];
  if (!stats.lastDate) {
    stats.lastDate = currentDate;
  } else if (stats.lastDate !== currentDate) {
    stats.todayCount = 0;
    stats.lastDate = currentDate;
    saveServerStore().catch(console.error);
  }
}

let activityLogs: Array<{
  id: string;
  emailMasked: string;
  timeAgo: string;
  statusText: string;
}> = [];

export interface LoginLogEntry {
  id: string;
  username: string;
  ip: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
  userAgent?: string;
}

let loginLogs: LoginLogEntry[] = [];

// In-memory Feedback Storage
let feedbackMessages: Array<{
  id: string;
  category: 'feature' | 'bug';
  detail: string;
  contact: string;
  timestamp: string;
}> = [];

// User Accounts Storage
let userAccounts: Array<{
  id: string;
  username: string;
  password: string;
  createdAt: string;
}> = [];

// Verified Emails Storage
let verifiedEmails: string[] = [];

// Muted Chat Users Storage
export interface MutedUserEntry {
  id?: string;
  target?: string;
  targetType?: 'username' | 'ip';
  username?: string;
  ip?: string;
  isPermanent?: boolean;
  mutedUntil: number | null;
  mutedAt: string;
  durationLabel: string;
  reason?: string;
}
export let mutedUsers: MutedUserEntry[] = [];

export function isUserMuted(username?: string, clientIp?: string): {
  isMuted: boolean;
  isPermanent?: boolean;
  mutedUntil?: number | null;
  remainingMs?: number | null;
  reason?: string;
  durationLabel?: string;
  target?: string;
  targetType?: string;
} {
  const cleanUser = typeof username === 'string' ? username.trim().toLowerCase() : '';
  const cleanIp = typeof clientIp === 'string' ? clientIp.trim().toLowerCase() : '';
  const now = Date.now();

  for (let i = mutedUsers.length - 1; i >= 0; i--) {
    const mute = mutedUsers[i];
    const muteTarget = (mute.target || mute.username || mute.ip || '').trim().toLowerCase();
    const isIpType = mute.targetType === 'ip' || /^(?:::ffff:)?(?:\d{1,3}\.){3}\d{1,3}$/.test(muteTarget);

    let isMatch = false;
    if (isIpType && cleanIp && muteTarget) {
      const normClient = cleanIp.replace(/^::ffff:/, '');
      const normTarget = muteTarget.replace(/^::ffff:/, '');
      if (normClient === normTarget) {
        isMatch = true;
      }
    } else if (cleanUser && muteTarget && muteTarget === cleanUser) {
      isMatch = true;
    }

    if (isMatch) {
      if (mute.isPermanent || mute.mutedUntil === null || mute.mutedUntil === undefined || mute.mutedUntil <= 0) {
        return {
          isMuted: true,
          isPermanent: true,
          mutedUntil: null,
          remainingMs: null,
          reason: mute.reason,
          durationLabel: 'Permanen',
          target: mute.target || mute.username || mute.ip,
          targetType: mute.targetType || (isIpType ? 'ip' : 'username')
        };
      }

      if (now >= mute.mutedUntil) {
        // Expired
        mutedUsers.splice(i, 1);
        saveServerStore().catch(() => {});
        continue;
      }

      return {
        isMuted: true,
        isPermanent: false,
        mutedUntil: mute.mutedUntil,
        remainingMs: Math.max(0, mute.mutedUntil - now),
        reason: mute.reason,
        durationLabel: mute.durationLabel,
        target: mute.target || mute.username || mute.ip,
        targetType: mute.targetType || (isIpType ? 'ip' : 'username')
      };
    }
  }

  return { isMuted: false };
}

// Global Chat Storage (In-memory + local_store.json ONLY)
export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: string;
}
export const chatMessages: ChatMessage[] = [];

// Custom User / IP Quota Rules Storage
export interface CustomQuotaRule {
  id: string;
  target: string;
  targetType: 'username' | 'ip';
  username?: string;
  ip?: string;
  quotaLimit: number; // -1 if permanent/unlimited, or custom positive number
  isPermanent: boolean;
  reason?: string;
  createdAt: string;
  createdAtFormatted?: string;
}

export let customQuotaRules: CustomQuotaRule[] = [];

// Helper to determine effective quota for a given username or client IP
export function getEffectiveQuotaForTarget(username?: string, clientIp?: string): {
  isCustom: boolean;
  isPermanent: boolean;
  quotaLimit: number;
  remainingQuota: number | string;
  usedCount: number;
  reason?: string;
  target?: string;
  targetType?: string;
} {
  const cleanUser = typeof username === 'string' ? username.trim().toLowerCase() : '';
  const cleanIp = typeof clientIp === 'string' ? clientIp.trim().toLowerCase() : '';

  // Get current IP usage count
  const now = Date.now();
  const windowMs = (parseFloat(globalSettings.resetHours) || 24) * 3600 * 1000;
  const ipHistory = (ipQuotaMap.get(cleanIp) || []).filter(ts => now - ts < windowMs);
  const usedCount = ipHistory.length;

  for (let i = customQuotaRules.length - 1; i >= 0; i--) {
    const rule = customQuotaRules[i];
    const ruleTarget = (rule.target || rule.username || rule.ip || '').trim().toLowerCase();
    const isIpType = rule.targetType === 'ip' || /^(?:::ffff:)?(?:\d{1,3}\.){3}\d{1,3}$/.test(ruleTarget);

    let isMatch = false;
    if (isIpType && cleanIp && ruleTarget) {
      const normClient = cleanIp.replace(/^::ffff:/, '');
      const normTarget = ruleTarget.replace(/^::ffff:/, '');
      if (normClient === normTarget) {
        isMatch = true;
      }
    } else if (cleanUser && ruleTarget && ruleTarget === cleanUser) {
      isMatch = true;
    }

    if (isMatch) {
      const isPerm = Boolean(rule.isPermanent || rule.quotaLimit === -1 || rule.quotaLimit <= 0);
      const limitVal = isPerm ? -1 : (Number(rule.quotaLimit) || 5);
      const remainingVal = isPerm ? '∞' : Math.max(0, limitVal - usedCount);

      return {
        isCustom: true,
        isPermanent: isPerm,
        quotaLimit: limitVal,
        remainingQuota: remainingVal,
        usedCount,
        reason: rule.reason,
        target: rule.target || rule.username || rule.ip,
        targetType: rule.targetType || (isIpType ? 'ip' : 'username')
      };
    }
  }

  const defaultLimit = parseInt(globalSettings.quotaLimit, 10) || 5;


  return {
    isCustom: false,
    isPermanent: false,
    quotaLimit: defaultLimit,
    remainingQuota: Math.max(0, defaultLimit - usedCount),
    usedCount
  };
}

// Global Settings (In-memory + local_store.json ONLY)
let globalSettings = {
  quotaLimit: '5',
  quotaPeriod: 'harian',
  remainingQuota: '5',
  resetHours: '24',
  websiteName: 'AlightMaster',
  appName: 'Alight Motion Pro',
  appPublisher: 'Alight Creative',
  infoBannerText: 'Ingin melihat info detail **batas harian dan sisa kredit kamu?** Klik tombol **LOGIN** diatas layar,  Belum punya akun? pencet teks **Daftar akun**',
  chatReportNotice: 'silahkan lapor disini jika ada error atau gagal verifikasi akun pro, admin respon 22.00/04.00',
  licenseBadge: 'VIP',
  licenseTitle: 'PRO ACTIVE',
  maintenanceMode: 'false',
  maintenanceTitle: 'Layanan Verifikasi Ditangguhkan Sementara',
  maintenanceDesc: 'Sistem verifikasi akun Alight Motion Pro saat ini sedang dalam pemeliharaan terjadwal oleh Administrator untuk optimasi performa backend. Seluruh pengiriman link login OOB dan verifikasi lisensi dihentikan sementara.',
  updatedAt: '0'
};

// Local Store Helpers for Settings, Custom Quotas & Chat
function loadLocalStore() {
  try {
    const targetPath = fs.existsSync(LOCAL_STORE_FILE)
      ? LOCAL_STORE_FILE
      : fs.existsSync(LOCAL_STORE_FILE_FALLBACK)
      ? LOCAL_STORE_FILE_FALLBACK
      : null;

    if (targetPath) {
      const content = fs.readFileSync(targetPath, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed.globalSettings && typeof parsed.globalSettings === 'object') {
        globalSettings = { ...globalSettings, ...parsed.globalSettings };
      }
      if (Array.isArray(parsed.chatMessages)) {
        chatMessages.length = 0;
        chatMessages.push(...parsed.chatMessages);
      }
      if (Array.isArray(parsed.mutedUsers)) {
        const now = Date.now();
        mutedUsers.length = 0;
        mutedUsers.push(...parsed.mutedUsers.filter((m: any) => m && (m.isPermanent || m.mutedUntil === null || m.mutedUntil === undefined || m.mutedUntil > now)));
      }
      if (Array.isArray(parsed.customQuotaRules)) {
        customQuotaRules.length = 0;
        customQuotaRules.push(...parsed.customQuotaRules);
      }
      console.log('📦 [LocalStore] Loaded globalSettings, mutedUsers, customQuotaRules & chatMessages from', targetPath);
    }
  } catch (err) {
    console.warn('⚠️ [LocalStore] Failed to load local store file:', err);
  }
}

export function saveLocalStore() {
  try {
    const now = Date.now();
    const data = {
      globalSettings,
      chatMessages: chatMessages.slice(-50),
      mutedUsers: mutedUsers.filter(m => m.isPermanent || m.mutedUntil === null || m.mutedUntil === undefined || m.mutedUntil > now),
      customQuotaRules,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Quietly catch EROFS or permissions issues in serverless
  }
}

// Immediately load local store synchronously at startup
loadLocalStore();

// IP Quota Map
const ipQuotaMap = new Map<string, number[]>();
const emailQuotaMap = new Map<string, number[]>();
const cooldownMap = new Map<string, number>();

// Connect MongoDB and Sync Data (Excludes globalSettings and chatMessages)
let mongoInitPromise: Promise<void> | null = null;

async function initMongoDb() {
  if (!MONGO_URI) {
    console.log('ℹ️ [MongoDB] MONGODB_URI not provided. Running with local store mode.');
    stats.dbType = 'local';
    return;
  }

  try {
    const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    mongoClient = client;
    mongoDb = client.db('alightmaster');
    stats.dbType = 'mongodb';
    console.log('⚡ [MongoDB] Connected successfully to Cluster0!');

    // Load persisted state from MongoDB collections (Excluding globalSettings and chatMessages)
    const appDoc = await mongoDb.collection('app_store').findOne({ _id: 'main_store' });
    if (appDoc) {
      if (appDoc.stats) stats = { ...stats, ...appDoc.stats, dbType: 'mongodb' };
      if (Array.isArray(appDoc.activityLogs)) activityLogs = appDoc.activityLogs;
      if (Array.isArray(appDoc.loginLogs)) loginLogs = appDoc.loginLogs;
      if (Array.isArray(appDoc.mutedUsers)) {
        const now = Date.now();
        mutedUsers = appDoc.mutedUsers.filter((m: any) => m && (m.isPermanent || m.mutedUntil === null || m.mutedUntil === undefined || m.mutedUntil > now));
      }
      if (Array.isArray(appDoc.customQuotaRules)) {
        customQuotaRules = appDoc.customQuotaRules;
      }
      if (Array.isArray(appDoc.feedbackMessages)) feedbackMessages = appDoc.feedbackMessages;
      if (Array.isArray(appDoc.userAccounts)) userAccounts = appDoc.userAccounts;
      if (Array.isArray(appDoc.verifiedEmails)) verifiedEmails = appDoc.verifiedEmails;
      if (appDoc.ipQuotaMap && typeof appDoc.ipQuotaMap === 'object') {
        Object.entries(appDoc.ipQuotaMap).forEach(([ip, times]) => {
          if (Array.isArray(times)) ipQuotaMap.set(ip, times as number[]);
        });
      }
    }

    if (!userAccounts.some(u => u.username.toLowerCase() === 'nabil')) {
      userAccounts.push({
        id: 'usr_nabil_' + Date.now(),
        username: 'nabil',
        password: 'nabil66',
        createdAt: new Date().toISOString()
      });
    }

    await saveServerStore();
  } catch (err: any) {
    console.error('⚠️ [MongoDB] Connection failed:', err?.message || err);
    stats.dbType = 'local';
  }
}

mongoInitPromise = initMongoDb();

// Helper to save server state
export const saveServerStore = async () => {
  saveLocalStore();
  try {
    const ipQuotaObj: Record<string, number[]> = {};
    ipQuotaMap.forEach((val, key) => {
      ipQuotaObj[key] = val;
    });

    const now = Date.now();
    const storeData = {
      stats: { ...stats, dbType: mongoDb ? 'mongodb' : 'local' },
      activityLogs,
      loginLogs,
      mutedUsers: mutedUsers.filter(m => m.isPermanent || m.mutedUntil === null || m.mutedUntil === undefined || m.mutedUntil > now),
      customQuotaRules,
      feedbackMessages,
      userAccounts,
      verifiedEmails,
      ipQuotaMap: ipQuotaObj,
      updatedAt: new Date().toISOString()
    };

    // Sync to MongoDB if connected
    if (mongoDb) {
      await mongoDb.collection('app_store').updateOne(
        { _id: 'main_store' },
        { $set: storeData },
        { upsert: true }
      ).catch(() => {});
    }
  } catch (e) {
    console.error('[DB Error] Failed to save server state:', e);
  }
};

// Helper to get client IP
const getClientIp = (req: express.Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
};

// Helper to check and clean sliding window count (default 24h = 86400000 ms, max 5 per IP)
const checkIpQuota = (ip: string, maxQuota: number = 5, windowMs: number = 86400000): { allowed: boolean; count: number; remaining: number } => {
  const now = Date.now();
  const history = (ipQuotaMap.get(ip) || []).filter(ts => now - ts < windowMs);
  ipQuotaMap.set(ip, history);

  if (history.length >= maxQuota) {
    return { allowed: false, count: history.length, remaining: 0 };
  }
  return { allowed: true, count: history.length, remaining: maxQuota - history.length };
};

const recordIpUsage = (ip: string) => {
  const history = ipQuotaMap.get(ip) || [];
  history.push(Date.now());
  ipQuotaMap.set(ip, history);
};

// Global error wrapper for API handlers to prevent unhandled 500 HTML responses on Vercel
const asyncHandler = (fn: express.RequestHandler): express.RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error('[API Error]', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Terjadi kesalahan internal pada server.' });
      }
    });
  };
};

// API Routes
app.get('/api/health', asyncHandler(async (req, res) => {
  const proxies = await loadGithubProxies();
  const uptimeSeconds = Math.floor(process.uptime());
  res.json({
    status: 'ok',
    hasApiKey: true,
    proxyCount: proxies.length,
    uptimeSeconds,
    serverStartTime: new Date(Date.now() - uptimeSeconds * 1000).toISOString(),
    time: new Date().toISOString()
  });
}));

// Get real-time stats
app.get('/api/stats', asyncHandler((req, res) => {
  checkDailyStatsReset();
  res.json(stats);
}));

// Get activity logs
app.get('/api/logs', asyncHandler((req, res) => {
  res.json(activityLogs);
}));

// Authentication API Endpoints
app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};
  const cleanUsername = typeof username === 'string' ? username.trim() : '';
  const cleanPassword = typeof password === 'string' ? password : '';

  if (!cleanUsername || cleanUsername.length < 3) {
    return res.status(400).json({ success: false, message: 'Username minimal 3 karakter!' });
  }

  if (!cleanPassword || cleanPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password minimal 6 karakter!' });
  }

  // Check existing user case-insensitively
  const existingUser = userAccounts.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Username sudah terdaftar! Gunakan username lain.' });
  }

  const newUser = {
    id: 'usr_' + Date.now(),
    username: cleanUsername,
    password: cleanPassword,
    createdAt: new Date().toISOString()
  };

  userAccounts.push(newUser);
  await saveServerStore();

  return res.json({
    success: true,
    message: 'Pendaftaran berhasil!',
    user: { id: newUser.id, username: newUser.username }
  });
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};
  const cleanUsername = typeof username === 'string' ? username.trim() : '';
  const cleanPassword = typeof password === 'string' ? password : '';
  const clientIp = getClientIp(req);
  const userAgent = String(req.headers['user-agent'] || '');

  const now = new Date();
  const formattedTime = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) + ', ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (!cleanUsername || !cleanPassword) {
    const failedLog: LoginLogEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      username: cleanUsername || 'Anonim',
      ip: clientIp,
      timestamp: formattedTime,
      status: 'FAILED',
      userAgent: userAgent.substring(0, 80)
    };
    loginLogs = [failedLog, ...loginLogs.slice(0, 199)];
    await saveServerStore().catch(() => {});
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi!' });
  }

  const user = userAccounts.find(
    u => u.username.toLowerCase() === cleanUsername.toLowerCase() && u.password === cleanPassword
  );

  if (!user) {
    const failedLog: LoginLogEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      username: cleanUsername,
      ip: clientIp,
      timestamp: formattedTime,
      status: 'FAILED',
      userAgent: userAgent.substring(0, 80)
    };
    loginLogs = [failedLog, ...loginLogs.slice(0, 199)];
    await saveServerStore().catch(() => {});
    return res.status(400).json({ success: false, message: 'Username atau password salah!' });
  }

  const successLog: LoginLogEntry = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    username: user.username,
    ip: clientIp,
    timestamp: formattedTime,
    status: 'SUCCESS',
    userAgent: userAgent.substring(0, 80)
  };
  loginLogs = [successLog, ...loginLogs.slice(0, 199)];
  await saveServerStore().catch(() => {});

  return res.json({
    success: true,
    message: 'Login berhasil!',
    user: { id: user.id, username: user.username }
  });
}));

app.post('/api/auth/change-password', asyncHandler(async (req, res) => {
  const { username, oldPassword, newPassword } = req.body || {};
  const cleanUsername = typeof username === 'string' ? username.trim() : '';
  const cleanOldPassword = typeof oldPassword === 'string' ? oldPassword : '';
  const cleanNewPassword = typeof newPassword === 'string' ? newPassword : '';

  if (!cleanUsername) {
    return res.status(400).json({ success: false, message: 'Username tidak valid.' });
  }

  const user = userAccounts.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
  if (!user) {
    return res.status(404).json({ success: false, message: 'Akun pengguna tidak ditemukan!' });
  }

  // Verify old password
  if (user.password !== cleanOldPassword) {
    return res.status(400).json({ success: false, message: 'Password lama kamu salah!' });
  }

  if (!cleanNewPassword || cleanNewPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter!' });
  }

  user.password = cleanNewPassword;
  await saveServerStore();

  return res.json({
    success: true,
    message: 'Password berhasil diperbarui!'
  });
}));

// Global Chat Routes (In-Memory + LocalStore Only)
app.get('/api/chat/history', (req, res) => {
  res.json(chatMessages);
});

app.get('/api/chat/mute-status', (req, res) => {
  const username = String(req.query.username || '').trim();
  const clientIp = getClientIp(req);
  const muteInfo = isUserMuted(username, clientIp);
  return res.json(muteInfo);
});

app.post('/api/chat/send', asyncHandler(async (req, res) => {
  const { username, text, replyTo } = req.body || {};
  if (typeof username === 'string' && typeof text === 'string' && text.trim()) {
    const cleanUser = username.trim();
    const clientIp = getClientIp(req);

    // Check if user or IP is currently muted
    const muteInfo = isUserMuted(cleanUser, clientIp);
    if (muteInfo.isMuted) {
      return res.status(403).json({
        error: muteInfo.isPermanent
          ? 'Akun/IP Anda sedang dimute secara PERMANEN oleh Admin. Tidak dapat mengirim pesan.'
          : 'Akun/IP Anda sedang dimute oleh Admin. Tidak dapat mengirim pesan.',
        isMuted: true,
        isPermanent: Boolean(muteInfo.isPermanent),
        mutedUntil: muteInfo.mutedUntil,
        remainingMs: muteInfo.remainingMs,
        durationLabel: muteInfo.durationLabel,
        reason: muteInfo.reason,
        target: muteInfo.target,
        targetType: muteInfo.targetType
      });
    }

    const newMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      username: cleanUser,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      replyTo: replyTo && typeof replyTo === 'object' ? {
        id: String(replyTo.id || ''),
        username: String(replyTo.username || ''),
        text: String(replyTo.text || '')
      } : null
    };

    chatMessages.push(newMessage);
    while (chatMessages.length > 50) {
      chatMessages.shift();
    }

    saveLocalStore();
    return res.json({ success: true, message: newMessage });
  }

  return res.status(400).json({ error: 'Username dan pesan wajib diisi.' });
}));

app.post('/api/chat/delete', asyncHandler(async (req, res) => {
  const { messageId, username, deleteType } = req.body || {};
  if (!messageId || !username) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }

  if (deleteType === 'everyone') {
    const msgIndex = chatMessages.findIndex((m) => m.id === messageId);
    if (msgIndex !== -1) {
      const targetMsg = chatMessages[msgIndex];
      const isAdmin = username.toLowerCase() === 'nabil' || username.toLowerCase() === 'admin';
      const isOwner = targetMsg.username.toLowerCase() === username.toLowerCase();

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Hanya pemilik pesan atau Admin yang dapat menghapus pesan untuk semua orang!' });
      }

      chatMessages.splice(msgIndex, 1);
      await saveServerStore().catch((err) => {
        console.error('[Chat] Error saving store after delete:', err);
      });
    }
    return res.json({ success: true, messageId, deleteType: 'everyone' });
  }

  return res.json({ success: true, messageId, deleteType: 'me' });
}));

// Feedback API
app.get('/api/feedback', asyncHandler(async (req, res) => {
  res.json(feedbackMessages);
}));

app.post('/api/feedback', asyncHandler(async (req, res) => {
  const { category, detail, contact } = req.body;
  if (!category || !detail) {
    return res.status(400).json({ error: 'Kategori dan Detail wajib diisi.' });
  }
  const newFeedback = {
    id: 'fb-' + Date.now(),
    category,
    detail,
    contact: contact || '-',
    timestamp: new Date().toISOString()
  };
  feedbackMessages = [newFeedback, ...feedbackMessages];
  await saveServerStore();
  res.json({ success: true });
}));

// Global Settings API (In-Memory + LocalStore Only)
app.get('/api/settings', (req, res) => {
  res.json(globalSettings);
});

app.post('/api/settings', (req, res) => {
  const updates = req.body;
  if (updates && typeof updates === 'object') {
    const cleanUpdates: Record<string, string> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined && val !== null) {
        cleanUpdates[key] = String(val);
      }
    }
    if (!cleanUpdates.updatedAt) {
      cleanUpdates.updatedAt = String(Date.now());
    }
    globalSettings = { ...globalSettings, ...cleanUpdates };
    saveLocalStore();
  }
  res.json({ success: true, settings: globalSettings });
});

app.delete('/api/feedback/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  feedbackMessages = feedbackMessages.filter(f => f.id !== id);
  await saveServerStore();
  res.json({ success: true });
}));

// Admin User Login Logs API
app.get('/api/admin/login-logs', asyncHandler(async (req, res) => {
  res.json(loginLogs);
}));

app.delete('/api/admin/login-logs/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  loginLogs = loginLogs.filter(l => l.id !== id);
  await saveServerStore();
  res.json({ success: true, message: 'Log login berhasil dihapus.' });
}));

app.delete('/api/admin/login-logs', asyncHandler(async (req, res) => {
  loginLogs = [];
  await saveServerStore();
  res.json({ success: true, message: 'Seluruh log login berhasil dibersihkan.' });
}));

// Admin User Accounts List API
app.get('/api/admin/users', asyncHandler(async (req, res) => {
  res.json(userAccounts.map(u => ({
    id: u.id,
    username: u.username,
    createdAt: u.createdAt
  })));
}));

// Admin Muted Users API
app.get('/api/admin/muted-users', asyncHandler(async (req, res) => {
  const now = Date.now();
  // Filter out any non-permanent expired mutes
  mutedUsers = mutedUsers.filter(m => m.isPermanent || m.mutedUntil === null || m.mutedUntil === undefined || m.mutedUntil > now);
  res.json(mutedUsers.map(m => ({
    ...m,
    remainingMs: m.isPermanent || m.mutedUntil === null || m.mutedUntil === undefined ? null : Math.max(0, m.mutedUntil - now)
  })));
}));

app.post('/api/admin/mute-user', asyncHandler(async (req, res) => {
  const { target, username, targetType, durationInput, durationValue, durationUnit, isPermanent, reason } = req.body || {};
  const rawTarget = String(target || username || '').trim();
  const cleanReason = typeof reason === 'string' && reason.trim() ? reason.trim() : 'Mute oleh Administrator';

  if (!rawTarget) {
    return res.status(400).json({ error: 'Username atau Alamat IP target wajib diisi!' });
  }

  // Prevent muting admin accounts
  if (rawTarget.toLowerCase() === 'admin' || rawTarget.toLowerCase() === 'nabil') {
    return res.status(400).json({ error: 'Akun Admin/Nabil tidak dapat dimute atau diblokir!' });
  }

  // Detect whether target is an IP address or a Username
  const isIpRegex = /^(?:::ffff:)?(?:\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]{3,39}$/;
  const isIp = targetType === 'ip' || isIpRegex.test(rawTarget);
  const detectedType: 'username' | 'ip' = isIp ? 'ip' : 'username';

  // Check if permanent mute is requested
  const durStr = String(durationInput || durationUnit || '').trim().toLowerCase();
  const permanentRequested = Boolean(isPermanent) || 
    durStr === 'permanen' || 
    durStr === 'permanent' || 
    durStr === 'selamanya' || 
    durStr === 'forever' || 
    durStr === 'inf' ||
    durStr === 'unlimited';

  let durationLabel = 'Permanen (Selamanya)';
  let mutedUntil: number | null = null;

  if (!permanentRequested) {
    let val = Number(durationValue);
    let unit = typeof durationUnit === 'string' ? durationUnit.trim().toLowerCase() : 'jam';

    if (durationInput && typeof durationInput === 'string') {
      const match = durationInput.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?$/);
      if (match) {
        val = parseFloat(match[1]);
        unit = match[2] || 'jam';
      }
    }

    if (isNaN(val) || val <= 0) {
      val = 1;
      unit = 'jam';
    }

    let multiplier = 60 * 60 * 1000;
    let unitName = 'Jam';

    if (['menit', 'm', 'minute', 'minutes', 'mnt'].includes(unit)) {
      multiplier = 60 * 1000;
      unitName = 'Menit';
    } else if (['jam', 'j', 'hour', 'hours', 'jm'].includes(unit)) {
      multiplier = 60 * 60 * 1000;
      unitName = 'Jam';
    } else if (['hari', 'h', 'day', 'days', 'hr'].includes(unit)) {
      multiplier = 24 * 60 * 60 * 1000;
      unitName = 'Hari';
    } else if (['minggu', 'w', 'week', 'weeks', 'mgg'].includes(unit)) {
      multiplier = 7 * 24 * 60 * 60 * 1000;
      unitName = 'Minggu';
    } else if (['bulan', 'bln', 'month', 'months', 'sebulan'].includes(unit)) {
      multiplier = 30 * 24 * 60 * 60 * 1000;
      unitName = 'Bulan';
    } else if (['tahun', 'thn', 'year', 'years', 'setahun'].includes(unit)) {
      multiplier = 365 * 24 * 60 * 60 * 1000;
      unitName = 'Tahun';
    }

    const durationMs = Math.round(val * multiplier);
    mutedUntil = Date.now() + durationMs;
    durationLabel = `${val} ${unitName}`;
  }

  const nowDate = new Date();
  const nowFormatted = nowDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) + ', ' + nowDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Remove existing mute for this target
  mutedUsers = mutedUsers.filter(m => {
    const t = (m.target || m.username || m.ip || '').toLowerCase();
    return t !== rawTarget.toLowerCase();
  });

  const newMute: MutedUserEntry = {
    id: 'mute-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    target: rawTarget,
    targetType: detectedType,
    username: detectedType === 'username' ? rawTarget : undefined,
    ip: detectedType === 'ip' ? rawTarget : undefined,
    isPermanent: permanentRequested,
    mutedUntil: mutedUntil,
    mutedAt: nowFormatted,
    durationLabel,
    reason: cleanReason
  };

  mutedUsers.push(newMute);
  await saveServerStore();

  res.json({
    success: true,
    message: `${detectedType === 'ip' ? 'Alamat IP' : 'Pengguna'} "${rawTarget}" berhasil dimute ${durationLabel}`,
    mutedUser: newMute
  });
}));

app.post('/api/admin/unmute-user', asyncHandler(async (req, res) => {
  const { target, username, ip, id } = req.body || {};
  const rawTarget = String(target || username || ip || '').trim().toLowerCase();
  const targetId = String(id || '').trim();

  if (!rawTarget && !targetId) {
    return res.status(400).json({ error: 'Username, IP, atau ID target wajib diisi.' });
  }

  const initialCount = mutedUsers.length;
  mutedUsers = mutedUsers.filter(m => {
    if (targetId && m.id === targetId) return false;
    const t = String(m.target || m.username || m.ip || '').trim().toLowerCase();
    if (rawTarget && (t === rawTarget || (m.username && m.username.toLowerCase() === rawTarget) || (m.ip && m.ip.toLowerCase() === rawTarget))) {
      return false;
    }
    return true;
  });

  await saveServerStore();

  res.json({
    success: true,
    message: `Status mute untuk "${rawTarget || targetId}" berhasil dicabut.`,
    remainingMutedCount: mutedUsers.length
  });
}));

app.delete('/api/admin/muted-users/:username', asyncHandler(async (req, res) => {
  const { username } = req.params;
  const rawTarget = String(username || '').trim().toLowerCase();

  mutedUsers = mutedUsers.filter(m => {
    if (m.id === rawTarget) return false;
    const t = String(m.target || m.username || m.ip || '').trim().toLowerCase();
    return t !== rawTarget;
  });
  await saveServerStore();

  res.json({
    success: true,
    message: `Status mute untuk "${rawTarget}" berhasil dihapus.`,
    remainingMutedCount: mutedUsers.length
  });
}));

// Admin Custom User / IP Quotas API
app.get('/api/admin/custom-quotas', asyncHandler(async (req, res) => {
  res.json(customQuotaRules);
}));

app.post('/api/admin/custom-quotas', asyncHandler(async (req, res) => {
  const { target, username, targetType, quotaLimit, isPermanent, reason } = req.body || {};
  const rawTarget = String(target || username || '').trim();
  const cleanReason = typeof reason === 'string' && reason.trim() ? reason.trim() : 'Kuota Khusus Admin';

  if (!rawTarget) {
    return res.status(400).json({ error: 'Username atau Alamat IP target wajib diisi!' });
  }

  // Detect whether target is an IP address or Username
  const isIpRegex = /^(?:::ffff:)?(?:\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]{3,39}$/;
  const isIp = targetType === 'ip' || isIpRegex.test(rawTarget);
  const detectedType: 'username' | 'ip' = isIp ? 'ip' : 'username';

  const isPerm = Boolean(
    isPermanent ||
    String(quotaLimit).toLowerCase() === 'permanen' ||
    String(quotaLimit).toLowerCase() === 'permanent' ||
    String(quotaLimit).toLowerCase() === 'unlimited' ||
    String(quotaLimit).toLowerCase() === 'selamanya' ||
    String(quotaLimit).toLowerCase() === '-1'
  );

  let numLimit = isPerm ? -1 : (parseInt(String(quotaLimit), 10) || 5);
  if (!isPerm && (isNaN(numLimit) || numLimit <= 0)) {
    numLimit = 5;
  }

  const nowDate = new Date();
  const nowFormatted = nowDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) + ', ' + nowDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Remove existing quota rule for this target
  customQuotaRules = customQuotaRules.filter(r => {
    const t = (r.target || r.username || r.ip || '').toLowerCase();
    return t !== rawTarget.toLowerCase();
  });

  const newRule: CustomQuotaRule = {
    id: 'cquota-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    target: rawTarget,
    targetType: detectedType,
    username: detectedType === 'username' ? rawTarget : undefined,
    ip: detectedType === 'ip' ? rawTarget : undefined,
    quotaLimit: numLimit,
    isPermanent: isPerm,
    reason: cleanReason,
    createdAt: new Date().toISOString(),
    createdAtFormatted: nowFormatted
  };

  customQuotaRules.push(newRule);
  await saveServerStore();

  const limitLabel = isPerm ? 'Permanen / Tanpa Batas' : `${numLimit} Verifikasi`;
  const targetLabel = detectedType === 'ip' ? 'Alamat IP' : 'Pengguna';

  res.json({
    success: true,
    message: `Aturan kuota untuk ${targetLabel} "${rawTarget}" berhasil ditetapkan (${limitLabel}).`,
    rule: newRule
  });
}));

app.post('/api/admin/delete-custom-quota', asyncHandler(async (req, res) => {
  const { target, id } = req.body || {};
  const rawTarget = String(target || '').trim().toLowerCase();

  customQuotaRules = customQuotaRules.filter(r => {
    if (id && r.id === id) return false;
    if (rawTarget) {
      const t = (r.target || r.username || r.ip || '').toLowerCase();
      if (t === rawTarget) return false;
    }
    return true;
  });

  await saveServerStore();
  res.json({
    success: true,
    message: 'Aturan batas kuota khusus berhasil dihapus kembali ke batas standar'
  });
}));



// Client Quota Info API
app.get('/api/user/quota-info', asyncHandler(async (req, res) => {
  const username = String(req.query.username || '').trim();
  const clientIp = getClientIp(req);
  const quotaInfo = getEffectiveQuotaForTarget(username, clientIp);
  const uptimeSeconds = Math.floor(process.uptime());
  res.json({
    ...quotaInfo,
    period: globalSettings.quotaPeriod || 'harian',
    resetHours: globalSettings.resetHours || '24',
    globalLimit: parseInt(globalSettings.quotaLimit, 10) || 5,
    serverUptimeSeconds: uptimeSeconds,
    serverStartTime: new Date(Date.now() - uptimeSeconds * 1000).toISOString()
  });
}));

// Send OOB Link (Step 1)
app.post('/api/oob/send', asyncHandler(async (req, res) => {
  if (globalSettings.maintenanceMode === 'true') {
    return res.status(503).json({
      error: globalSettings.maintenanceDesc || 'Sistem Verifikasi Pro sedang dalam pemeliharaan (Maintenance Mode) oleh Administrator. Layanan verifikasi dinonaktifkan sementara. Silakan coba beberapa saat lagi.'
    });
  }

  const { email } = req.body;
  const clientIp = getClientIp(req);

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Alamat email tidak valid.' });
  }

  // Server-side IP / Target Quota check
  const quotaInfo = getEffectiveQuotaForTarget(undefined, clientIp);
  if (!quotaInfo.isPermanent) {
    const maxLimit = quotaInfo.quotaLimit;
    const windowMs = (parseFloat(globalSettings.resetHours) || 24) * 3600 * 1000;
    const ipCheck = checkIpQuota(clientIp, maxLimit, windowMs);
    if (!ipCheck.allowed) {
      return res.status(429).json({
        error: `⚠️ Batas kuota verifikasi untuk Alamat IP Anda (${clientIp}) telah habis (Maksimal ${maxLimit}x per ${globalSettings.quotaPeriod || 'harian'}). Silakan tunggu reset Limit.`
      });
    }
  }

  // Cooldown check (2 minutes for email or IP)
  const now = Date.now();
  const lastTimeEmail = cooldownMap.get(email.toLowerCase());
  const lastTimeIp = cooldownMap.get(`ip:${clientIp}`);

  if (lastTimeEmail && now - lastTimeEmail < 120000) {
    const waitSeconds = Math.ceil((120000 - (now - lastTimeEmail)) / 1000);
    return res.status(429).json({
      error: `Jeda cooldown 2 menit sedang aktif untuk email ini. Silakan tunggu ${waitSeconds} detik lagi.`
    });
  }

  if (lastTimeIp && now - lastTimeIp < 120000) {
    const waitSeconds = Math.ceil((120000 - (now - lastTimeIp)) / 1000);
    return res.status(429).json({
      error: `Jeda cooldown 2 menit sedang aktif untuk Alamat IP ini. Silakan tunggu ${waitSeconds} detik lagi.`
    });
  }

  cooldownMap.set(email.toLowerCase(), now);
  cooldownMap.set(`ip:${clientIp}`, now);

  // Call live API engine
  const remoteResult = await sendOobLinkRemote(email);

  if (!remoteResult.success) {
    const errorMsg = 'error' in remoteResult ? (remoteResult as any).error : 'Gagal mengirim instruksi link OOB ke server Alight Motion.';
    return res.status(400).json({
      error: errorMsg || 'Gagal mengirim instruksi link OOB ke server Alight Motion.'
    });
  }

  return res.json({
    success: true,
    message: remoteResult.message || 'Instruksi link OOB berhasil diproses. Cek inbox/spam email kamu dari Alight Creative.',
    expiresInSeconds: 180,
    raw: remoteResult.rawResponse
  });
}));

// Verify OOB Token (Step 2)
app.post('/api/oob/verify', asyncHandler(async (req, res) => {
  if (globalSettings.maintenanceMode === 'true') {
    return res.status(503).json({
      error: globalSettings.maintenanceDesc || 'Sistem Verifikasi Pro sedang dalam pemeliharaan (Maintenance Mode) oleh Administrator. Layanan verifikasi dinonaktifkan sementara. Silakan coba beberapa saat lagi.'
    });
  }

  const { email, oobLink, isLoggedIn, username, ip, country, regionCity } = req.body;
  const clientIp = getClientIp(req);

  if (!email || !oobLink) {
    return res.status(400).json({ error: 'Email dan Link OOB wajib diisi.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (verifiedEmails.includes(cleanEmail)) {
    return res.status(400).json({
      error: `⚠️ Email '${email}' sudah pernah berhasil diaktifkan/diverifikasi sebelumnya! Setiap email hanya dapat diverifikasi 1 kali untuk mendapatkan lisensi Pro aktif.`
    });
  }

  // Server-side IP / User Quota check (Strict enforcement with custom rule support)
  const quotaInfo = getEffectiveQuotaForTarget(username, clientIp);
  if (!quotaInfo.isPermanent) {
    const maxLimit = quotaInfo.quotaLimit;
    const windowMs = (parseFloat(globalSettings.resetHours) || 24) * 3600 * 1000;
    const ipCheck = checkIpQuota(clientIp, maxLimit, windowMs);
    if (!ipCheck.allowed || ipCheck.count >= maxLimit) {
      return res.status(429).json({
        error: `⚠️ Batas kuota ${globalSettings.quotaPeriod || 'harian'} verifikasi untuk ${quotaInfo.isCustom ? (quotaInfo.targetType === 'ip' ? 'Alamat IP' : 'Akun') : 'IP'} Anda telah habis (${ipCheck.count} dari ${maxLimit} terpakai). Sisa kuota 0, verifikasi ditolak oleh Server Backend.`
      });
    }
  }

  // Call live API engine
  const remoteResult = await verifyOobLinkRemote(email, oobLink);

  if (!remoteResult.success) {
    const errorMsg = 'error' in remoteResult ? (remoteResult as any).error : 'Verifikasi OOB Token gagal.';
    return res.status(400).json({
      error: errorMsg || 'Verifikasi OOB Token gagal.'
    });
  }

  // Record IP usage upon successful verification
  recordIpUsage(clientIp);

  if (!verifiedEmails.includes(cleanEmail)) {
    verifiedEmails.push(cleanEmail);
  }

  // Update stats and logs upon success
  checkDailyStatsReset();
  stats.todayCount += 1;
  stats.totalCount += 1;

  // Mask email for public log
  const parts = email.split('@');
  const maskedPrefix = parts[0].length > 3 ? parts[0].substring(0, 3) + '***' : parts[0] + '***';
  const maskedEmail = `${maskedPrefix}@${parts[1]}`;

  const newLog = {
    id: 'act-' + Date.now(),
    emailMasked: maskedEmail,
    timeAgo: 'Baru saja',
    statusText: 'Berhasil Aktivasi Alight Motion Pro!'
  };

  activityLogs = [newLog, ...activityLogs.slice(0, 9)];
  await saveServerStore();

  let finalIp = clientIp;
  let finalCountry = country || '';
  let finalRegionCity = regionCity || '';

  // If geo location missing, perform live server-side lookup for real IP details
  if (!finalCountry || !finalRegionCity) {
    try {
      let lookupIp = finalIp;
      if (!lookupIp || lookupIp === '127.0.0.1' || lookupIp === '::1' || lookupIp.startsWith('10.') || lookupIp.startsWith('192.168.')) {
        const pubIpRes = await fetch('https://api.ipify.org?format=json').catch(() => null);
        if (pubIpRes && pubIpRes.ok) {
          const pubData = await pubIpRes.json();
          if (pubData && pubData.ip) {
            lookupIp = pubData.ip;
            finalIp = pubData.ip;
          }
        }
      }

      if (lookupIp && lookupIp !== '127.0.0.1') {
        const geoApiRes = await fetch(`https://ipwho.is/${lookupIp}`).catch(() => null);
        if (geoApiRes && geoApiRes.ok) {
          const geoData = await geoApiRes.json();
          if (geoData && geoData.success) {
            if (!finalCountry && geoData.country) {
              finalCountry = `${geoData.country} (${geoData.country_code || ''})`.trim();
            }
            if (!finalRegionCity && (geoData.city || geoData.region)) {
              finalRegionCity = [geoData.city, geoData.region].filter(Boolean).join(', ');
            }
          }
        }
      }
    } catch (e) {}
  }

  const record = {
    id: 'AMPRO-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    email,
    isLoggedIn: Boolean(isLoggedIn || username),
    username: username || '',
    ip: finalIp || '-',
    country: finalCountry || '-',
    regionCity: finalRegionCity || '-',
    timestamp: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    status: 'ACTIVE' as const,
    licenseKey: 'PRO-1YR-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    oobToken: oobLink.substring(0, 25) + '...',
    remoteData: remoteResult.data
  };

  return res.json({
    success: true,
    record
  });
}));

// Catch-all Express Error Handler to ensure JSON response
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Express Error]', err);
  res.status(500).json({
    error: err.message || 'Terjadi kesalahan sistem pada server.'
  });
});

export default app;