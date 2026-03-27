export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  major: string;
  graduationYear: number;
  isBusiness?: boolean;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  timestamp: string;
  upvotes: number;
  downvotes: number;
  comments: number;
  hasUpvoted?: boolean;
  hasDownvoted?: boolean;
}

export const mockUsers: Record<string, User> = {
  u1: {
    id: 'u1',
    name: 'Alice Johnson',
    major: 'Computer Science',
    graduationYear: 2025,
  },
  u2: {
    id: 'u2',
    name: 'Bob Smith',
    major: 'Mathematics',
    graduationYear: 2024,
  },
  b1: {
    id: 'b1',
    name: 'Campus Tutors Ltd',
    major: 'Business',
    graduationYear: 2020,
    isBusiness: true,
  },
};

export const mockPosts: Post[] = [
  {
    id: 'p1',
    author: mockUsers.u1,
    content: `Just finished my assignment on forecasting models. Here is a quick breakdown of ARIMA:

The model is typically denoted as ARIMA(p,d,q) where:
- p: number of lag observations (AR)
- d: degree of differencing (I)
- q: size of the moving average window (MA)

It's crucial to check for stationarity before applying the model! Let me know if anyone needs help understanding the intuition.`,
    timestamp: '2 hours ago',
    upvotes: 42,
    downvotes: 3,
    comments: 12,
  },
  {
    id: 'p2',
    author: mockUsers.u2,
    content: `Can someone explain why the determinant of an orthogonal matrix is always ±1? I understand the definition $Q^T Q = I$, but how does that lead to the determinant property?`,
    timestamp: '5 hours ago',
    upvotes: 18,
    downvotes: 1,
    comments: 8,
    hasUpvoted: true,
  },
  {
    id: 'p3',
    author: mockUsers.b1,
    content: `Finals are approaching! We are offering a 20% discount on all our 1-on-1 tutoring sessions for Calculus and Physics.

Book now through our profile link! 📚✨`,
    timestamp: '1 day ago',
    upvotes: 156,
    downvotes: 10,
    comments: 45,
  },
];
