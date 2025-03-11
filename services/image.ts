import { apiClient, ApiError } from './api';
import { API_CONFIG, useMockData, getLogger } from './config';
import * as FileSystem from 'expo-file-system';

// 获取日志记录器
const logger = getLogger('IMAGE');

/**
 * 图像识别结果类型
 */
export interface OCRResult {
  text: string;
  latex?: string;
  graphData?: any;
  confidence: number;
}

/**
 * 图像上传响应
 */
export interface ImageUploadResponse {
  taskId: string;
  message: string;
}

/**
 * OCR结果响应
 */
export interface OCRResultResponse {
  taskId: string;
  status: 'processing' | 'completed' | 'failed';
  result?: OCRResult;
  error?: string;
}

/**
 * 图像服务 - 处理图像上传、OCR识别等功能
 */
class ImageService {
  // API端点
  private endpoints = {
    upload: '/api/image/upload',
    getResult: '/api/image/result',
  };

  /**
   * 上传图像
   * @param imageUri 图像URI
   * @param onProgress 上传进度回调
   * @returns 上传结果
   */
  async uploadImage(
    imageUri: string,
    onProgress?: (progress: number) => void
  ): Promise<ImageUploadResponse> {
    try {
      // 验证文件是否存在
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        logger.error('File not found:', imageUri);
        throw new Error(`文件不存在: ${imageUri}`);
      }
      
      // 获取文件类型和文件名
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1].toLowerCase();
      const fileName = `photo_${Date.now()}.${fileType}`;
      
      // 验证文件类型
      if (!API_CONFIG.IMAGE.SUPPORTED_TYPES.includes(fileType)) {
        logger.error('Unsupported file type:', fileType);
        throw new Error(`不支持的文件类型: ${fileType}, 请使用 ${API_CONFIG.IMAGE.SUPPORTED_TYPES.join(', ')}`);
      }
      
      // 确定MIME类型
      let mimeType: string;
      switch (fileType) {
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'png':
          mimeType = 'image/png';
          break;
        case 'gif':
          mimeType = 'image/gif';
          break;
        case 'heic':
          mimeType = 'image/heic';
          break;
        default:
          mimeType = `image/${fileType}`;
      }
      
      // 使用模拟数据
      if (useMockData()) {
        logger.info('Using mock image upload data');
        
        // 模拟上传进度
        if (onProgress) {
          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;
            onProgress(progress);
            logger.debug(`Mock upload progress: ${progress}%`);
            if (progress >= 100) {
              clearInterval(interval);
            }
          }, 300);
        }
        
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return {
          taskId: `mock_task_${Date.now()}`,
          message: '图像上传成功，正在处理'
        };
      }
      
      logger.info('Uploading image:', fileName);
      
      // 使用增强的API客户端上传文件
      return await apiClient.uploadFile<ImageUploadResponse>(
        this.endpoints.upload,
        imageUri,
        mimeType,
        fileName,
        onProgress
      );
    } catch (error) {
      logger.error('Image upload error:', error);
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error(error instanceof Error ? error.message : '图像上传失败');
    }
  }

  /**
   * 获取OCR识别结果
   * @param taskId 任务ID
   * @returns OCR识别结果
   */
  async getOCRResult(taskId: string): Promise<OCRResultResponse> {
    try {
      // 使用模拟数据
      if (useMockData()) {
        logger.info('Using mock OCR result data for taskId:', taskId);
        
        // 延迟模拟网络请求
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.IMAGE.MOCK_PROCESS_DELAY / 3));
        
        // 生成随机状态，模拟处理过程
        const mockStatuses: Array<'processing' | 'completed' | 'failed'> = [
          'processing', 'processing', 'completed'
        ];
        
        // 从任务ID中提取时间戳，用于确定模拟状态
        let status: 'processing' | 'completed' | 'failed';
        if (taskId.startsWith('mock_task_')) {
          const timestamp = parseInt(taskId.split('_')[2]);
          const elapsedMs = Date.now() - timestamp;
          
          // 根据经过的时间确定状态
          if (elapsedMs < API_CONFIG.IMAGE.MOCK_PROCESS_DELAY) {
            status = 'processing';
          } else {
            status = 'completed';
          }
        } else {
          // 随机选择一个状态，模拟不同阶段的响应
          const randomIndex = Math.floor(Math.random() * mockStatuses.length);
          status = mockStatuses[randomIndex];
        }
        
        logger.debug(`Mock OCR status for ${taskId}: ${status}`);
        
        // 构造模拟响应
        const mockResponse: OCRResultResponse = {
          taskId,
          status,
          ...(status === 'completed' ? {
            result: {
              text: '求解方程: x² - 5x + 6 = 0',
              latex: 'x^2 - 5x + 6 = 0',
              confidence: 0.95
            }
          } : {}),
          ...(status === 'failed' ? {
            error: '图像质量不佳，无法识别'
          } : {})
        };
        
        return mockResponse;
      }
      
      logger.info('Fetching OCR result for taskId:', taskId);
      
      // 使用API客户端获取OCR结果
      return await apiClient.get<OCRResultResponse>(
        `${this.endpoints.getResult}/${taskId}`
      );
    } catch (error) {
      logger.error('Get OCR result error:', error);
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error(error instanceof Error ? error.message : '获取OCR结果失败');
    }
  }

  /**
   * 轮询获取OCR结果
   * @param taskId 任务ID
   * @param maxAttempts 最大尝试次数
   * @param interval 轮询间隔(毫秒)
   * @param onUpdate 状态更新回调
   * @returns OCR识别结果
   */
  async pollOCRResult(
    taskId: string,
    maxAttempts: number = 10,
    interval: number = 2000,
    onUpdate?: (status: string, attempt: number) => void
  ): Promise<OCRResult> {
    let attempts = 0;
    
    logger.info('Starting OCR result polling for taskId:', taskId);
    
    while (attempts < maxAttempts) {
      attempts++;
      
      if (onUpdate) {
        onUpdate('正在处理...', attempts);
      }
      
      try {
        const result = await this.getOCRResult(taskId);
        
        // 如果处理完成，返回结果
        if (result.status === 'completed' && result.result) {
          logger.info('OCR processing completed for taskId:', taskId);
          return result.result;
        }
        
        // 如果处理失败，抛出错误
        if (result.status === 'failed') {
          logger.error('OCR processing failed for taskId:', taskId, result.error);
          throw new Error(result.error || '图像处理失败');
        }
        
        logger.debug(`OCR polling attempt ${attempts}/${maxAttempts} for taskId: ${taskId}, status: ${result.status}`);
        
        // 继续等待
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      } catch (error) {
        // 如果是最后一次尝试，抛出错误
        if (attempts >= maxAttempts) {
          throw error;
        }
        
        // 否则继续尝试
        logger.warn(`OCR polling attempt ${attempts} failed:`, error);
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    logger.error('OCR polling timeout for taskId:', taskId);
    throw new Error('处理超时，请重试');
  }

  /**
   * 取消OCR任务
   * @param taskId 任务ID
   */
  async cancelOCRTask(taskId: string): Promise<void> {
    try {
      logger.info('Cancelling OCR task:', taskId);
      
      // 对于模拟数据，只记录日志
      if (useMockData()) {
        logger.info('Mock cancel OCR task:', taskId);
        return;
      }
      
      // 实际项目中，应当实现API调用来取消任务
      // 这里等待后端支持
    } catch (error) {
      logger.error('Cancel OCR task error:', error);
    }
  }
}

// 导出图像服务实例
export const imageService = new ImageService();
