export interface VoteDto {
  postId?: string;
  commentId?: string;
  value: 1 | -1;
}

export interface ReputationUpdate {
  userId: string;
  newScore: number;
}
