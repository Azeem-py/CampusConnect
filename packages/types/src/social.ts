export interface VoteDto {
  postId?: string;
  commentId?: string;
  value: 1 | -1 | 0;
}

export interface ReputationUpdate {
  userId: string;
  newScore: number;
}

export type ReportReason = 'SPAM' | 'HARASSMENT' | 'HATE_SPEECH' | 'INAPPROPRIATE_CONTENT' | 'INTELLECTUAL_PROPERTY' | 'OTHER';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface Report {
  id: string;
  reporterId: string;
  reporter: { id: string; name: string; username: string };
  reason: ReportReason;
  description?: string | null;
  status: ReportStatus;
  postId?: string | null;
  post?: any | null;
  commentId?: string | null;
  comment?: any | null;
  reportedUserId?: string | null;
  reportedUser?: { id: string; name: string; username: string; avatar?: string | null } | null;
  resolverId?: string | null;
  resolver?: { id: string; name: string; username: string } | null;
  resolutionNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportDto {
  reason: ReportReason;
  description?: string;
  postId?: string;
  commentId?: string;
  reportedUserId?: string;
}

export interface ResolveReportDto {
  status: 'RESOLVED' | 'DISMISSED';
  resolutionNote?: string;
  banUser?: boolean;
  deleteContent?: boolean;
}
