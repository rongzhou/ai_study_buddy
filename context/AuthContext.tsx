import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth';
import { 
  UserProfile, 
  LoginRequest, 
  RegisterRequest,
  UpdateUserRequest
} from '../types/user';
import { router } from 'expo-router';

// 定义上下文状态接口
interface AuthContextState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: UpdateUserRequest) => Promise<void>;
  clearError: () => void;
}

// 创建上下文
const AuthContext = createContext<AuthContextState | undefined>(undefined);

// 提供认证上下文的组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化 - 检查用户状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        const isLoggedIn = await authService.isAuthenticated();
        
        if (isLoggedIn) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } catch (err) {
        // 如果获取用户信息失败，认为用户未登录
        console.error('Authentication initialization error:', err);
        await authService.logout();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // 登录方法
  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      setIsAuthenticated(true);
      
      // 登录成功后，在状态更新后再导航到主页
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 注册方法
  const register = async (userData: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(userData);
      setUser(response.user);
      setIsAuthenticated(true);
      
      // 注册成功后，在状态更新后再导航到主页
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 登出方法
  const logout = async () => {
    setIsLoading(true);
    
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      
      // 登出后，在状态更新后再导航到登录页
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 0);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 更新用户资料
  const updateProfile = async (userData: UpdateUserRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedUser = await authService.updateProfile(userData);
      setUser(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新用户资料失败');
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
