export const currentUser = {
  id: 'u1',
  name: 'Alex Rivera',
  username: '@arivera_cs',
  avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
  role: 'student',
  major: 'Computer Science',
  year: 'Class of 2025',
  bio: 'Passionate about distributed systems and cloud architecture. Currently researching consensus algorithms.',
  reputation: 1250,
  joinedAt: 'Aug 2022'
};

export const businessUser = {
  id: 'b1',
  name: 'Campus Coffee Co.',
  username: '@campuscoffee',
  avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  role: 'business',
  category: 'Food & Beverage',
  bio: 'Fueling late-night study sessions since 2018. Show your student ID for 10% off espresso drinks!',
  location: 'Student Union, Level 1',
  website: 'campuscoffee.edu',
  reputation: 840,
  joinedAt: 'Jan 2019'
};

export const posts = [
  {
    id: 'p1',
    author: currentUser,
    content: "Just finished my distributed systems project! Implementing Paxos was challenging but incredibly rewarding. Here's a brief breakdown of how the leader election phase works in our implementation...",
    timestamp: '2 hours ago',
    upvotes: 45,
    comments: 12,
    hasUpvoted: false,
    hasDownvoted: false,
    tags: ['CS450', 'DistributedSystems']
  },
  {
    id: 'p2',
    author: businessUser,
    content: "Midterm season is approaching! 📚 We're extending our hours until 2 AM starting next week. Come grab a nitro cold brew to keep those study sessions going strong.",
    timestamp: '5 hours ago',
    upvotes: 128,
    comments: 24,
    hasUpvoted: true,
    hasDownvoted: false,
    tags: ['Promo', 'StudyFuel']
  },
  {
    id: 'p3',
    author: {
      id: 'u2',
      name: 'Sarah Chen',
      username: '@schen_math',
      avatar: 'https://i.pravatar.cc/150?u=a04258114e29026702d',
      role: 'student'
    },
    content: "Can anyone help explain the difference between Eigenvalues and Singular Values? I'm struggling to visualize how they relate to matrix transformations in linear algebra.",
    timestamp: '1 day ago',
    upvotes: 32,
    comments: 8,
    hasUpvoted: false,
    hasDownvoted: false,
    tags: ['MATH210', 'LinearAlgebra']
  }
];

export const trendingTopics = [
  { id: 't1', name: '#FinalsWeek', posts: 1240 },
  { id: 't2', name: '#CSCareerFair', posts: 856 },
  { id: 't3', name: '#Hackathon2024', posts: 642 },
  { id: 't4', name: '#StudyGroups', posts: 430 }
];

export const notifications = [
  { id: 'n1', type: 'upvote', user: 'Sarah Chen', target: 'your post', time: '10m ago', read: false },
  { id: 'n2', type: 'comment', user: 'Prof. Davis', target: 'your question', time: '1h ago', read: true },
  { id: 'n3', type: 'mention', user: 'David Kim', target: 'a comment', time: '2h ago', read: true }
];

export const studentProfilePosts = [
  ...posts.filter(p => p.author.id === currentUser.id),
  {
    id: 'p4',
    author: currentUser,
    content: "Has anyone taken Professor Smith's Advanced Operating Systems class? I'm wondering how heavy the workload is compared to CS412. Specifically regarding the final project.",
    timestamp: '3 days ago',
    upvotes: 18,
    comments: 5,
    hasUpvoted: false,
    hasDownvoted: false,
    tags: ['CS550', 'CourseAdvice']
  },
  {
    id: 'p5',
    author: currentUser,
    content: "I finally understood how React's virtual DOM reconciliation algorithm works. It's fascinating how it uses heuristics to achieve O(n) complexity instead of the naive O(n^3) tree edit distance algorithm. Wrote a small blog post about it!",
    timestamp: '1 week ago',
    upvotes: 89,
    comments: 14,
    hasUpvoted: true,
    hasDownvoted: false,
    tags: ['WebDev', 'React', 'Algorithms']
  }
];

export const businessProfilePosts = [
  ...posts.filter(p => p.author.id === businessUser.id),
  {
    id: 'p6',
    author: businessUser,
    content: "New Seasonal Menu Alert! 🍂 Try our new Maple Pecan Latte and Pumpkin Spice Croissants. Available starting tomorrow morning. Limited time only!",
    timestamp: '2 days ago',
    upvotes: 215,
    comments: 42,
    hasUpvoted: false,
    hasDownvoted: false,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800&h=400',
    tags: ['NewMenu', 'FallFlavors']
  },
  {
    id: 'p7',
    author: businessUser,
    content: "We're hiring! Looking for part-time baristas to join our amazing team. Flexible hours that work around your class schedule. DM us for an application link or drop your resume at the counter.",
    timestamp: '1 week ago',
    upvotes: 67,
    comments: 5,
    hasUpvoted: false,
    hasDownvoted: false,
    tags: ['Hiring', 'StudentJobs']
  }
];
