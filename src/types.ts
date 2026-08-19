export interface VerificationRecord {
  id: string;
  email: string;
  timestamp: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED';
  licenseKey: string;
  oobToken?: string;
  isLoggedIn?: boolean;
  username?: string;
  ip?: string;
  country?: string;
  regionCity?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface FeatureItem {
  id: string;
  icon: string;
  title: string;
  badge: string;
  description: string;
  isIncluded: boolean;
}

export interface ActivityLog {
  id: string;
  emailMasked: string;
  timeAgo: string;
  statusText: string;
}

export interface LoginLog {
  id: string;
  username: string;
  ip: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
  userAgent?: string;
}

export interface MutedUser {
  username: string;
  mutedUntil: number;
  mutedAt: string;
  durationLabel: string;
  reason?: string;
}

export interface MutedUserEntry {
  id?: string;
  target?: string;
  targetType?: 'username' | 'ip';
  username?: string;
  ip?: string;
  isPermanent?: boolean;
  mutedUntil: number | null;
  mutedAt: string;
  mutedAtFormatted?: string;
  mutedUntilFormatted?: string;
  durationLabel: string;
  reason?: string;
}

export interface MuteStatus {
  isMuted: boolean;
  isPermanent?: boolean;
  mutedUntil: number | null;
  remainingMs: number | null;
  reason?: string;
  durationLabel?: string;
  target?: string;
  targetType?: string;
}

export interface UserQuotaRule {
  id: string;
  target: string;
  targetType: 'username' | 'ip';
  username?: string;
  ip?: string;
  quotaLimit: number;
  isPermanent: boolean;
  reason?: string;
  createdAt: string;
  createdAtFormatted?: string;
}

export interface UserQuotaInfo {
  isCustom: boolean;
  isPermanent: boolean;
  quotaLimit: number;
  remainingQuota: number | string;
  usedCount: number;
  reason?: string;
  target?: string;
  targetType?: string;
}
