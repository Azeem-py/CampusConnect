export interface Post {
  id: string;
  title?: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED';
  courseCode?: string;
  authorId: string;
  event?: EventData | null;
  poll?: PollData | null;
  images?: string[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EventData {
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
}

export interface PollData {
  question: string;
  options: string[];
}
