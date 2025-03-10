import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API基础URL - 可以根据环境配置进行调整
const API_BASE_URL = 'https://api.example.com';
// AUTH_TOKEN_KEY - 用于存储在AsyncStorage中的键
const AUTH_TOKEN_KEY = 'auth_token';

// API响应的通用接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 创建API客户端类
class ApiClient {
  private instance: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30秒超时
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // 请求拦截器 - 添加认证头
    this.instance.interceptors.request.use(
      async (config) => {
        // 如果没有保存的令牌，尝试从AsyncStorage获取
        if (!this.authToken) {
          this.authToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        }

        // 如果有令牌，添加到请求头
        if (this.authToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器 - 处理常见错误
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // 处理401未授权错误 - 可以在这里添加token刷新逻辑
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // 清除token
          await this.clearAuthToken();
          
          // 这里可以添加自动重新登录或刷新token的逻辑
          // 例如: 导航到登录页面、尝试刷新token等
          
          return Promise.reject(error);
        }
        
        return Promise.reject(error);
      }
    );
  }

  // 设置认证令牌
  async setAuthToken(token: string): Promise<void> {
    this.authToken = token;
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  // 清除认证令牌
  async clearAuthToken(): Promise<void> {
    this.authToken = null;
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }

  // 检查是否有存储的认证令牌
  async hasAuthToken(): Promise<boolean> {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return token !== null;
  }

  // 通用GET请求
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.instance.get(url, config);
      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // 通用POST请求
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.instance.post(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // 通用PUT请求
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.instance.put(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // 通用DELETE请求
  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.instance.delete(url, config);
      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // 处理API错误
  private handleApiError(error: any): ApiResponse {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data;
      
      if (responseData) {
        return {
          success: false,
          error: responseData.error || responseData.message,
          message: responseData.message || '请求失败',
        };
      }
      
      return {
        success: false,
        error: error.message,
        message: '网络请求失败',
      };
    }
    
    return {
      success: false,
      error: 'unknown_error',
      message: error.message || '发生未知错误',
    };
  }

  // 上传文件
  async uploadFile<T = any>(
    url: string,
    fileUri: string,
    fileType: string,
    fileName: string,
    onProgress?: (progress: number) => void,
    extraData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      
      // 添加文件
      formData.append('file', {
        uri: fileUri,
        type: fileType,
        name: fileName,
      } as any);
      
      // 添加额外的数据
      if (extraData) {
        Object.keys(extraData).forEach(key => {
          formData.append(key, extraData[key]);
        });
      }
      
      // 设置上传进度回调
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      
      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          onProgress(percentCompleted);
        };
      }
      
      const response = await this.instance.post(url, formData, config);
      return response.data;
    } catch (error) {
      return this.handleApiError(error);
    }
  }
}

// 导出API客户端单例
export const apiClient = new ApiClient();
