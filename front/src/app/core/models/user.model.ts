export type UserRole = 'artist' | 'production' | 'admin';

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  spotify?: string;
  soundcloud?: string;
  tiktok?: string;
}

export interface User {
  _id: string;
  aka: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone?: string;
  role: UserRole;
  bio?: string;
  musicalGenres: string[];
  avatar?: string;
  avatarUrl?: string;
  coverImage?: string;
  coverUrl?: string;
  socialLinks?: SocialLinks;
  isActive: boolean;
  isEmailVerified: boolean;
  notificationPrefs?: { email: boolean; web: boolean };
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterPayload {
  aka: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  musicalGenres?: string[];
  bio?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}
