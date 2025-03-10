/**
 * 用户相关类型定义
 */

// 用户角色枚举
export enum UserRole {
  STUDENT = 'student',
  PARENT = 'parent',
  TEACHER = 'teacher',
}

// 学习偏好
export interface LearningPreferences {
  // 喜欢的学科
  favoriteSubjects: string[];
  // 学习时间偏好 (例如: 'morning', 'afternoon', 'evening')
  studyTimePreference?: string;
  // 学习难度偏好 (例如: 'easy', 'medium', 'hard')
  difficultyPreference?: string;
  // 其他个性化设置
  otherPreferences?: Record<string, any>;
}

// 用户基本信息
export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  email?: string;
  role: UserRole;
  grade?: string; // 年级
  school?: string; // 学校
  preferences: LearningPreferences;
  createdAt: string; // ISO日期字符串
  updatedAt: string; // ISO日期字符串
}

// 认证请求
export interface LoginRequest {
  username: string;
  password: string;
}

// 注册请求
export interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  email?: string;
  role: UserRole;
  grade?: string;
  school?: string;
  preferences?: Partial<LearningPreferences>;
}

// 认证响应
export interface AuthResponse {
  token: string;
  user: UserProfile;
}

// 使用token刷新用户信息的响应
export interface RefreshUserResponse {
  user: UserProfile;
}

// 更新用户配置请求
export interface UpdateUserRequest {
  displayName?: string;
  avatarUrl?: string;
  email?: string;
  grade?: string;
  school?: string;
  preferences?: Partial<LearningPreferences>;
}

// 更新用户配置响应
export interface UpdateUserResponse {
  success: boolean;
  user: UserProfile;
}
