import { apiClient, ApiError } from './api';
import { API_CONFIG, useMockData, getLogger } from './config';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserProfile,
  UpdateUserRequest,
  UserRole
} from '../types/user';

// 获取日志记录器
const logger = getLogger('AUTH');

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
    try {
      // 使用模拟数据
      if (useMockData()) {
        logger.info('Using mock register data');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockResponse: AuthResponse = {
          token: API_CONFIG.AUTH.MOCK_TOKEN,
          user: {
            id: '1',
            username: userData.username,
            displayName: userData.displayName,
            role: userData.role,
            email: userData.email,
            grade: userData.grade,
            school: userData.school,
            preferences: {
              favoriteSubjects: userData.preferences?.favoriteSubjects || []
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
        
        // 保存模拟令牌
        await apiClient.setAuthToken(mockResponse.token);
        
        return mockResponse;
      }
      
      // 使用更新后的API客户端发送请求
      logger.info('Registering user:', userData.username);
      const response = await apiClient.post<AuthResponse>(this.endpoints.register, userData);
      
      // 保存认证令牌
      await apiClient.setAuthToken(response.token);
      
      return response;
    } catch (error) {
      // 处理API错误
      logger.error('Register error:', error);
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('注册过程中发生未知错误');
    }
  }

  /**
   * 用户登录
   * @param credentials 登录凭证
   * @returns 登录结果
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      // 使用模拟数据
      if (useMockData()) {
        logger.info('Using mock login data');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockResponse: AuthResponse = {
          token: API_CONFIG.AUTH.MOCK_TOKEN,
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
        
        // 保存模拟令牌
        await apiClient.setAuthToken(mockResponse.token);
        
        return mockResponse;
      }
      
      // 使用API客户端发送真实请求
      logger.info('Logging in user:', credentials.username);
      const response = await apiClient.post<AuthResponse>(this.endpoints.login, credentials);
      
      // 保存认证令牌
      await apiClient.setAuthToken(response.token);
      
      return response;
    } catch (error) {
      // 处理API错误
      logger.error('Login error:', error);
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('登录失败，请检查您的凭证');
    }
  }

  /**
   * 获取当前用户信息
   * @returns 用户信息
   */
  async getCurrentUser(): Promise<UserProfile> {
    try {
      // 使用模拟数据
      if (useMockData()) {
        logger.info('Using mock user profile');
        await new Promise(resolve => setTimeout(resolve, 300));
        
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
      }
      
      // 使用API客户端发送真实请求
      logger.info('Fetching current user profile');
      const response = await apiClient.get<{user: UserProfile}>(this.endpoints.profile);
      
      return response.user;
    } catch (error) {
      // 处理API错误
      logger.error('Get user profile error:', error);
      if (error instanceof ApiError) {
        // 如果是认证错误，清除令牌
        if (error.statusCode === 401) {
          await this.logout();
        }
        throw new Error(error.message);
      }
      throw new Error('获取用户信息失败');
    }
  }

  /**
   * 更新用户信息
   * @param userData 更新的用户数据
   * @returns 更新结果
   */
  async updateProfile(userData: UpdateUserRequest): Promise<UserProfile> {
    try {
      // 使用模拟数据
      if (useMockData()) {
        logger.info('Using mock update profile');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 模拟更新用户资料
        return {
          id: '1',
          username: 'testuser',
          displayName: userData.displayName || '测试用户',
          role: UserRole.STUDENT,
          email: userData.email || 'test@example.com',
          grade: userData.grade || '高中一年级',
          school: userData.school || '测试学校',
          preferences: {
            favoriteSubjects: userData.preferences?.favoriteSubjects || ['数学', '物理']
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      // 使用API客户端发送请求
      logger.info('Updating user profile');
      const response = await apiClient.put<{user: UserProfile}>(
        this.endpoints.updateProfile,
        userData
      );
      
      return response.user;
    } catch (error) {
      // 处理API错误
      logger.error('Update profile error:', error);
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('更新用户信息失败');
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      logger.info('Logging out user');
      // 清除认证令牌
      await apiClient.clearAuthToken();
    } catch (error) {
      logger.error('Logout error:', error);
    }
  }

  /**
   * 检查用户是否已登录
   * @returns 是否已登录
   */
  async isAuthenticated(): Promise<boolean> {
    // 开发环境强制认为已登录
    if (API_CONFIG.AUTH.ALWAYS_AUTHENTICATED) {
      logger.info('Development mode: always authenticated');
      return true;
    }
    
    // 检查是否有有效的令牌
    const hasToken = await apiClient.hasAuthToken();
    logger.debug('Authentication check:', hasToken ? 'authenticated' : 'not authenticated');
    return hasToken;
  }
}

// 导出认证服务实例
export const authService = new AuthService();
