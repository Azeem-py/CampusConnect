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
  avatar?: string;
  banner?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreatePostDto {
  title: string;
  content: string;
}

export interface CreateCommentDto {
  content: string;
  postId: string;
}

export interface UpgradeBusinessDto {
  businessName: string;
  description: string;
  websiteUrl?: string;
  services: string;
}
