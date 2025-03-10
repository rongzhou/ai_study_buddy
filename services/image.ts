import { apiClient } from './api';

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
    // 获取文件类型和文件名
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    const fileName = `photo_${Date.now()}.${fileType}`;
    
    // 调用API上传图像
    const response = await apiClient.uploadFile<ImageUploadResponse>(
      this.endpoints.upload,
      imageUri,
      `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
      fileName,
      onProgress
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || '图像上传失败');
  }

  /**
   * 获取OCR识别结果
   * @param taskId 任务ID
   * @returns OCR识别结果
   */
  async getOCRResult(taskId: string): Promise<OCRResultResponse> {
    const response = await apiClient.get<OCRResultResponse>(
      `${this.endpoints.getResult}/${taskId}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || '获取OCR结果失败');
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
    
    while (attempts < maxAttempts) {
      attempts++;
      
      if (onUpdate) {
        onUpdate('正在处理...', attempts);
      }
      
      const result = await this.getOCRResult(taskId);
      
      // 如果处理完成，返回结果
      if (result.status === 'completed' && result.result) {
        return result.result;
      }
      
      // 如果处理失败，抛出错误
      if (result.status === 'failed') {
        throw new Error(result.error || '图像处理失败');
      }
      
      // 继续等待
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    throw new Error('处理超时，请重试');
  }
}

// 导出图像服务实例
export const imageService = new ImageService();
