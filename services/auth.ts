import { apiClient } from './api';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshUserResponse,
  UserProfile,
  UpdateUserRequest,
  UpdateUserResponse,
  UserRole
} from '../types/user';

/**
 * 认证服务 - 处理用户登录、注册、用户信息获取等功能
 */
class AuthService {
  // API端点
  private endpoints = {
    register: '/api/auth/register',
    login: '/api/auth/login',
    profile: '/api/user/profile',
    updateProfile: '/api/user/update'
  };

  /**
   * 用户注册
   * @param userData 注册信息
   * @returns 注册结果
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(this.endpoints.register, userData);
    
    if (response.success && response.data) {
      // 保存认证令牌
      await apiClient.setAuthToken(response.data.token);
      return response.data;
    }
    
    throw new Error(response.error || '注册失败');
  }

  /**
   * 用户登录
   * @param credentials 登录凭证
   * @returns 登录结果
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return {
      token: 'fake-token-for-testing',
      user: {
        id: '1',
        username: credentials.username,
        displayName: '测试用户',
        role: UserRole.STUDENT,
        email: 'test@example.com',
        grade: '高中一年级',
        school: '测试学校',
        preferences: {
          favoriteSubjects: ['数学', '物理']
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
    // const response = await apiClient.post<AuthResponse>(this.endpoints.login, credentials);
    
    // if (response.success && response.data) {
    //   // 保存认证令牌
    //   await apiClient.setAuthToken(response.data.token);
    //   return response.data;
    // }
    
    // throw new Error(response.error || '登录失败');
  }

  /**
   * 获取当前用户信息
   * @returns 用户信息
   */
  async getCurrentUser(): Promise<UserProfile> {
    return {
      id: '1',
      username: 'testuser',
      displayName: '测试用户',
      role: UserRole.STUDENT,
      email: 'test@example.com',
      grade: '高中一年级',
      school: '测试学校',
      preferences: {
        favoriteSubjects: ['数学', '物理']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    // const response = await apiClient.get<RefreshUserResponse>(this.endpoints.profile);
    
    // if (response.success && response.data) {
    //   return response.data.user;
    // }
    
    // throw new Error(response.error || '获取用户信息失败');
  }

  /**
   * 更新用户信息
   * @param userData 更新的用户数据
   * @returns 更新结果
   */
  async updateProfile(userData: UpdateUserRequest): Promise<UserProfile> {
    const response = await apiClient.put<UpdateUserResponse>(
      this.endpoints.updateProfile,
      userData
    );
    
    if (response.success && response.data) {
      return response.data.user;
    }
    
    throw new Error(response.error || '更新用户信息失败');
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    await apiClient.clearAuthToken();
  }

  /**
   * 检查用户是否已登录
   * @returns 是否已登录
   */
  async isAuthenticated(): Promise<boolean> {
    return true;
    // return await apiClient.hasAuthToken();
  }
}

// 导出认证服务实例
export const authService = new AuthService();
