import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { API_CONFIG, getLogger } from './config';

// 获取日志记录器
const logger = getLogger('API');

// API响应的标准格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// API错误类
export class ApiError extends Error {
  statusCode?: number;
  data?: any;
  
  constructor(message: string, statusCode?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

// 创建API客户端类
class ApiClient {
  private instance: AxiosInstance;
  private authToken: string | null = null;
  private cache: Map<string, { data: any, timestamp: number }> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5分钟缓存
  
  constructor() {
    this.instance = axios.create({
      baseURL: API_CONFIG.API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Platform': Platform.OS,
      },
    });

    // 请求拦截器
    this.instance.interceptors.request.use(
      async (config) => {
        // 如果没有保存的令牌，尝试从AsyncStorage获取
        if (!this.authToken) {
          this.authToken = await AsyncStorage.getItem(API_CONFIG.AUTH.TOKEN_STORAGE_KEY);
        }

        // 如果有令牌，添加到请求头
        if (this.authToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        
        logger.debug(`REQUEST ${config.method?.toUpperCase()} ${config.url}`, 
          config.params ? { params: config.params } : '',
          config.data ? { data: config.data } : '');
          
        return config;
      },
      (error) => {
        logger.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => {
        logger.debug(`RESPONSE ${response.status} ${response.config.url}`, 
          { data: response.data });
        return response;
      },
      async (error) => {
        // 处理网络错误和重试
        if (!error.response) {
          const config = error.config;
          
          // 如果重试次数未达上限，则尝试重试
          if (config && (!config._retryCount || config._retryCount < 2)) {
            config._retryCount = (config._retryCount || 0) + 1;
            
            // 指数退避延迟
            const delay = 1000 * Math.pow(2, config._retryCount - 1);
            logger.info(`Request failed, retrying (${config._retryCount}/2) after ${delay}ms...`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return this.instance(config);
          }
          
          logger.error('Network error:', error);
          return Promise.reject(new ApiError('网络连接失败，请检查您的互联网连接', 0));
        }
        
        // 处理401未授权错误
        if (error.response.status === 401) {
          logger.warn('Authentication error (401)', error.response.data);
          await this.clearAuthToken();
        }
        
        // 构造API错误
        const statusCode = error.response.status;
        const responseData = error.response.data;
        
        logger.error(`API error ${statusCode}:`, responseData);
        
        return Promise.reject(
          new ApiError(
            responseData?.message || responseData?.error || '请求失败',
            statusCode,
            responseData
          )
        );
      }
    );
  }

  // 缓存辅助方法
  private getCacheKey(url: string, params?: any): string {
    return `${url}:${JSON.stringify(params || {})}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // 检查是否过期
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    logger.debug('Cache hit:', key);
    return cached.data;
  }

  private saveToCache(key: string, data: any): void {
    logger.debug('Cache save:', key);
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // 响应处理
  private handleApiResponse<T>(response: AxiosResponse<ApiResponse<T>>): T {
    const data = response.data;
    
    if (data.success && data.data !== undefined) {
      return data.data;
    }
    
    throw new ApiError(
      data.message || data.error || '请求失败',
      response.status,
      data
    );
  }

  // 设置认证令牌
  async setAuthToken(token: string): Promise<void> {
    logger.info('Setting auth token');
    this.authToken = token;
    await AsyncStorage.setItem(API_CONFIG.AUTH.TOKEN_STORAGE_KEY, token);
  }

  // 清除认证令牌
  async clearAuthToken(): Promise<void> {
    logger.info('Clearing auth token');
    this.authToken = null;
    await AsyncStorage.removeItem(API_CONFIG.AUTH.TOKEN_STORAGE_KEY);
  }

  // 检查是否有认证令牌
  async hasAuthToken(): Promise<boolean> {
    const token = await AsyncStorage.getItem(API_CONFIG.AUTH.TOKEN_STORAGE_KEY);
    return token !== null;
  }

  // 清除缓存
  clearCache(): void {
    logger.debug('Clearing all cache');
    this.cache.clear();
  }

  // 清除指定URL的缓存
  invalidateCache(url: string, params?: any): void {
    const key = this.getCacheKey(url, params);
    logger.debug('Invalidating cache:', key);
    this.cache.delete(key);
  }

  // GET请求
  async get<T = any>(
    url: string, 
    params?: any, 
    useCache: boolean = false
  ): Promise<T> {
    try {
      // 检查缓存
      if (useCache) {
        const cacheKey = this.getCacheKey(url, params);
        const cachedData = this.getFromCache(cacheKey);
        
        if (cachedData) {
          return cachedData;
        }
      }
      
      const response = await this.instance.get<ApiResponse<T>>(url, { params });
      const data = this.handleApiResponse(response);
      
      // 保存到缓存
      if (useCache) {
        const cacheKey = this.getCacheKey(url, params);
        this.saveToCache(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : '请求失败',
        undefined
      );
    }
  }

  // POST请求
  async post<T = any>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.instance.post<ApiResponse<T>>(url, data);
      return this.handleApiResponse(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : '请求失败',
        undefined
      );
    }
  }

  // PUT请求
  async put<T = any>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.instance.put<ApiResponse<T>>(url, data);
      return this.handleApiResponse(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : '请求失败',
        undefined
      );
    }
  }

  // DELETE请求
  async delete<T = any>(url: string): Promise<T> {
    try {
      const response = await this.instance.delete<ApiResponse<T>>(url);
      return this.handleApiResponse(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : '请求失败',
        undefined
      );
    }
  }


  // 上传文件
  async uploadFile<T = any>(
    url: string,
    fileUri: string,
    fileType: string,
    fileName: string,
    onProgress?: (progress: number) => void,
    extraData?: Record<string, any>
  ): Promise<T> {
    try {
      // 检查文件是否存在
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new ApiError(`文件不存在: ${fileUri}`, 400);
      }
      
      // 检查文件大小
      if (fileInfo.size && fileInfo.size > API_CONFIG.IMAGE.MAX_FILE_SIZE) {
        throw new ApiError(`文件过大: ${(fileInfo.size / (1024 * 1024)).toFixed(2)}MB，超过限制 ${API_CONFIG.IMAGE.MAX_FILE_SIZE / (1024 * 1024)}MB`, 400);
      }
      
      // 创建FormData
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
      
      // 配置
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            onProgress(percentCompleted);
            logger.debug(`Upload progress: ${percentCompleted}%`);
          }
        },
      };
      
      const response = await this.instance.post<ApiResponse<T>>(url, formData, config);
      return this.handleApiResponse(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : '上传失败',
        undefined
      );
    }
  }
}

// 导出API客户端单例
export const apiClient = new ApiClient();
