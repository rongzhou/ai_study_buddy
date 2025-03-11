import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth';
import { 
  UserProfile, 
  LoginRequest, 
  RegisterRequest,
  UpdateUserRequest
} from '../types/user';
import { getLogger } from '../services/config';

// 获取日志记录器
const logger = getLogger('AUTH_CONTEXT');

// 定义上下文状态接口
export interface AuthContextState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<boolean>; // 返回是否成功
  register: (userData: RegisterRequest) => Promise<boolean>; // 返回是否成功
  logout: () => Promise<void>;
  updateProfile: (userData: UpdateUserRequest) => Promise<boolean>; // 返回是否成功
  clearError: () => void;
}

// 创建上下文
const AuthContext = createContext<AuthContextState | undefined>(undefined);

// 提供认证上下文的组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化 - 检查用户状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        logger.info('Initializing authentication state');
        const isLoggedIn = await authService.isAuthenticated();
        
        if (isLoggedIn) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(true);
          logger.info('User authenticated on startup');
        } else {
          logger.info('No authenticated user found');
          setIsAuthenticated(false);
        }
      } catch (err) {
        // 如果获取用户信息失败，认为用户未登录
        logger.error('Authentication initialization error:', err);
        await authService.logout();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // 登录方法
  const login = async (credentials: LoginRequest): Promise<boolean> => {
    setIsAuthenticating(true);
    setError(null);
    
    try {
      logger.info('Attempting login for user:', credentials.username);
      const response = await authService.login(credentials);
      setUser(response.user);
      setIsAuthenticated(true);
      logger.info('Login successful');
      return true;
    } catch (err) {
      logger.error('Login error:', err);
      setError(err instanceof Error ? err.message : '登录失败');
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 注册方法
  const register = async (userData: RegisterRequest): Promise<boolean> => {
    setIsAuthenticating(true);
    setError(null);
    
    try {
      logger.info('Attempting registration for user:', userData.username);
      const response = await authService.register(userData);
      setUser(response.user);
      setIsAuthenticated(true);
      logger.info('Registration successful');
      return true;
    } catch (err) {
      logger.error('Registration error:', err);
      setError(err instanceof Error ? err.message : '注册失败');
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 登出方法
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      logger.info('Logging out user');
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      logger.info('Logout successful');
    } catch (err) {
      logger.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 更新用户资料
  const updateProfile = async (userData: UpdateUserRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('Updating user profile');
      const updatedUser = await authService.updateProfile(userData);
      setUser(updatedUser);
      logger.info('Profile updated successfully');
      return true;
    } catch (err) {
      logger.error('Update profile error:', err);
      setError(err instanceof Error ? err.message : '更新用户资料失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 清除错误
  const clearError = () => {
    setError(null);
  };

  // 上下文值
  const value: AuthContextState = {
    user,
    isLoading,
    isAuthenticating,
    isAuthenticated,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 自定义Hook，使用认证上下文
export const useAuth = (): AuthContextState => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};