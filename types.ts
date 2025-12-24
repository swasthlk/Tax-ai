
export type UserRole = 'citizen' | 'official';

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  photoURL?: string;
  createdAt: any;
}

export type ReportStatus = 'Pending' | 'Investigating' | 'Resolved' | 'Declined';

export interface ProgressUpdate {
  id: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  timestamp: string;
}

export interface TaxNotification {
  id: string;
  recipientUid: string;
  reportId: string;
  message: string;
  status: ReportStatus;
  timestamp: string;
  read: boolean;
}

export interface TaxReport {
  id: string;
  citizenUid: string;
  citizenEmail: string;
  citizenName: string;
  taxType: string;
  description: string;
  proofUrl?: string;
  status: ReportStatus;
  progress: number;
  reply?: string;
  updates: ProgressUpdate[];
  createdAt: string;
  updatedAt: string;
}

export interface TaxCategory {
  id: string;
  name: string;
  data: number[]; // Sparkline/Trend data
  taxCollected: number;
  taxAllocated: number;
  taxUsed: number;
  taxRemaining: number;
  totalTaxRemaining: number;
  statement?: string;
  statementProofUrl?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
