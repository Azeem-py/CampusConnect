export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  username: string;
  role: 'STUDENT' | 'BUSINESS' | 'ADMIN';
  isDeactivated: boolean;
  reputationScore: number;
  school: string | null;
  department: string | null;
  major: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { posts: number; comments: number };
}

export interface PaginatedUsers {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUserDetail extends Omit<AdminUser, '_count'> {
  _count: { posts: number; comments: number; reportsCreated: number; reportsAgainst: number };
}

export interface UpdateUserByAdminDto {
  name?: string;
  username?: string;
  email?: string;
  department?: string;
  school?: string;
}

export interface AdminInstitution {
  id: string;
  name: string;
  type: string;
  state: string | null;
  acronym: string | null;
  _count: { departments: number };
  departments?: AdminDepartment[];
}

export interface AdminDepartment {
  id: string;
  name: string;
  institutionId: string;
}

export interface AdminPost {
  id: string;
  title: string | null;
  content: string;
  status: string;
  authorId: string;
  author: { id: string; name: string | null; username: string; avatar: string | null };
  createdAt: string;
  _count: { comments: number; votes: number; reports: number };
  reports: { id: string }[];
}

export interface PaginatedPosts {
  posts: AdminPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BannedWord {
  id: string;
  pattern: string;
  isRegex: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannedWordDto {
  pattern: string;
  isRegex?: boolean;
}

export interface AdminAnalyticsOverview {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalInstitutions: number;
  totalDepartments: number;
  activeUsersToday: number;
  newUsersToday: number;
  postsToday: number;
  totalReports: number;
  pendingReports: number;
  bannedUsers: number;
  totalBannedWords: number;
  usersGrowth: string;
}

export interface UserAnalytics {
  userGrowth: { date: string; count: number }[];
  roleDistribution: { role: string; count: number }[];
}

export interface PostAnalytics {
  postTrend: { date: string; count: number }[];
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
}

export interface EngagementAnalytics {
  commentTrend: { date: string; count: number }[];
  voteTrend: { date: string; count: number }[];
  totalComments: number;
  totalVotes: number;
}
