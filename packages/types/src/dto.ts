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
