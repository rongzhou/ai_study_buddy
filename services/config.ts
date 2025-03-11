/**
 * 应用程序API配置
 * 提供集中式配置，便于管理各种环境设置
 */
export const API_CONFIG = {
    // API基础URL，根据环境确定
    API_BASE_URL: process.env.API_URL || 'https://api.example.com',
    
    // 是否使用模拟数据 - 开发环境默认使用
    USE_MOCK_DATA: process.env.NODE_ENV === 'development' && process.env.USE_REAL_API !== 'true',
    
    // 认证相关配置
    AUTH: {
      // 开发环境是否默认认为已登录
      ALWAYS_AUTHENTICATED: process.env.NODE_ENV === 'development' && process.env.FORCE_LOGIN === 'true',
      
      // 模拟认证令牌
      MOCK_TOKEN: 'mock-token-for-testing',
      
      // 令牌存储键名
      TOKEN_STORAGE_KEY: 'auth_token'
    },
    
    // 图像处理相关配置
    IMAGE: {
      // 上传图像最大尺寸(字节)
      MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
      
      // 支持的图像类型
      SUPPORTED_TYPES: ['jpg', 'jpeg', 'png', 'heic'],
      
      // OCR处理模拟延迟(毫秒)
      MOCK_PROCESS_DELAY: 2000
    },
    
    // 题目分析相关配置
    ANALYSIS: {
      // 轮询间隔(毫秒)
      POLL_INTERVAL: 2000,
      
      // 最大轮询次数
      MAX_POLL_ATTEMPTS: 15,
      
      // 模拟分析延迟(毫秒)
      MOCK_ANALYSIS_DELAY: 3000
    },
    
    // 日志级别 ('debug' | 'info' | 'warn' | 'error')
    LOG_LEVEL: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
  };
  
  /**
   * 判断当前是否处于开发环境
   */
  export const isDevelopment = (): boolean => {
    return process.env.NODE_ENV === 'development';
  };
  
  /**
   * 判断是否使用模拟数据
   */
  export const useMockData = (): boolean => {
    return API_CONFIG.USE_MOCK_DATA;
  };
  
  /**
   * 获取日志函数
   * 根据配置的日志级别提供不同级别的日志函数
   */
  export const getLogger = (module: string) => {
    const logLevels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    const currentLevel = logLevels[API_CONFIG.LOG_LEVEL as keyof typeof logLevels] || 3;
    
    return {
      debug: (...args: any[]) => {
        if (currentLevel <= 0) {
          console.debug(`[${module}]`, ...args);
        }
      },
      info: (...args: any[]) => {
        if (currentLevel <= 1) {
          console.info(`[${module}]`, ...args);
        }
      },
      warn: (...args: any[]) => {
        if (currentLevel <= 2) {
          console.warn(`[${module}]`, ...args);
        }
      },
      error: (...args: any[]) => {
        if (currentLevel <= 3) {
          console.error(`[${module}]`, ...args);
        }
      }
    };
  };