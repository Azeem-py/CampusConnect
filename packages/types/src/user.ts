export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  role: 'STUDENT' | 'BUSINESS';
  avatar?: string | null;
  banner?: string | null;
  reputationScore: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  profilePrivacy: 'PUBLIC' | 'CAMPUS_ONLY' | 'PRIVATE';
  showReputation: boolean;
  isDeactivated: boolean;
}
