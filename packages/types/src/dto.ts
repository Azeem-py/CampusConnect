export interface SignupDto {
  name: string;
  username: string;
  email: string;
  phone?: string;
  department?: string;
  school?: string;
  interests?: string;
  hobby?: string;
  password: string;
  confirmPassword: string;
  avatar?: string;
  banner?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreatePostDto {
  content: string;
  title?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  courseCode?: string;
  event?: {
    title: string;
    date: string;
    time?: string;
    location?: string;
    description?: string;
  } | null;
  poll?: {
    question: string;
    options: string[];
  } | null;
}

export interface UpdatePostDto {
  title?: string;
  content?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  courseCode?: string;
  event?: {
    title: string;
    date: string;
    time?: string;
    location?: string;
    description?: string;
  } | null;
  poll?: {
    question: string;
    options: string[];
  } | null;
}

export interface CreateCommentDto {
  content: string;
  postId: string;
}

export interface PollVoteDto {
  pollOptionId: string;
}

export interface UpgradeBusinessDto {
  businessName: string;
  description: string;
  websiteUrl?: string;
  services: string;
}

export interface UpdateProfileDto {
  name?: string;
  username?: string;
  bio?: string | null;
  phone?: string | null;
  department?: string | null;
  school?: string | null;
  major?: string | null;
  graduationYear?: number | null;
  interests?: string | null;
  hobby?: string | null;
  avatar?: string | null;
  banner?: string | null;
}

