
export type UserRole = 'citizen' | 'official';

export interface Interaction {
  id: string;
  uid: string;
  userName: string;
  text: string;
  timestamp: string;
  likes: string[]; // Array of UIDs
  replies: Interaction[];
  role: UserRole;
  imageUrl?: string; // Only for top-level project feedback
  parentId?: string; // To track where it came from for notifications
}

export interface Feedback extends Interaction {}

export interface WorkProject {
  id: string;
  name: string;
  description: string;
  progress: number;
  assignedBudget: number; // In Crores
  spentBudget: number; // In Crores
  status: 'Planning' | 'In-Progress' | 'Completed' | 'Delayed';
  feedbacks: Feedback[];
  creatorUid?: string; // UID of the citizen who logged it
  creatorName?: string;
  isOfficial: boolean; // True if from government, false if citizen-logged
}

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  username: string;
  photoURL?: string;
  createdAt: any;
  tourCompleted?: boolean;
  taxPaid?: number;
  isPrivate?: boolean;
  auditScore?: number;
}

export type ReportStatus = 'Pending' | 'Investigating' | 'Resolved' | 'Declined';
export type NotificationType = 'STATUS_CHANGE' | 'REPLY' | 'LIKE' | 'VERDICT';

export interface TaxNotification {
  id: string;
  recipientUid: string;
  reportId?: string;
  projectId?: string; // For project feedback interactions
  interactionId?: string; // The ID of the comment/feedback
  message: string;
  status?: ReportStatus;
  type: NotificationType;
  timestamp: string;
  read: boolean;
  fromUserName: string;
  fromUid: string;
}

export interface TaxReport {
  id: string;
  citizenUid: string;
  citizenEmail: string;
  citizenName: string;
  citizenUsername: string;
  taxType: string;
  description: string;
  proofUrls?: string[]; 
  status: ReportStatus;
  progress: number;
  updates: ProgressUpdate[];
  createdAt: string;
  updatedAt: string;
  likes: string[]; 
  dislikes: string[]; 
  comments: Comment[];
  assignedBudget?: number; 
  spentBudget?: number; 
}

export interface ProgressUpdate {
  id: string;
  officialUid: string;
  officialName: string;
  text: string;
  mediaUrls?: string[]; 
  mediaType?: 'image' | 'video';
  timestamp: string;
  likes: string[]; 
  dislikes: string[]; 
  comments: Comment[];
}

export interface Comment {
  id: string;
  uid: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface TaxCategory {
  id: string;
  name: string;
  data: number[]; 
  taxCollected: number;
  taxAllocated: number;
  taxUsed: number;
  taxRemaining: number;
  totalTaxRemaining: number;
  statement?: string;
  proofUrls?: string[];
  updatedAt?: string;
  lastUpdatedByUid?: string;
  lastUpdatedByName?: string;
  works?: WorkProject[]; 
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
