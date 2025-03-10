import { apiClient } from './api';
import { OCRResult } from './image';

/**
 * 知识点类型
 */
export interface KnowledgePoint {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * 解题步骤类型
 */
export interface SolutionStep {
  id: string;
  stepNumber: number;
  content: string;
  latex?: string;
}

/**
 * 相关资源类型
 */
export interface RelatedResource {
  id: string;
  title: string;
  type: 'video' | 'article' | 'exercise';
  url: string;
  thumbnail?: string;
}

/**
 * 题目分析请求类型
 */
export interface QuestionAnalysisRequest {
  ocrResult: OCRResult;
  subjectHint?: string;
  gradeHint?: string;
  userNote?: string;
}

/**
 * 题目分析结果类型
 */
export interface QuestionAnalysisResult {
  questionId: string;
  questionText: string;
  questionLatex?: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  solutionSteps: SolutionStep[];
  explanation: string;
  knowledgePoints: KnowledgePoint[];
  relatedResources: RelatedResource[];
  createdAt: string;
}

/**
 * 题目分析状态响应
 */
export interface QuestionAnalysisStatusResponse {
  taskId: string;
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: QuestionAnalysisResult;
  error?: string;
}

/**
 * 题目解析服务 - 处理题目分析相关功能
 */
class AnalysisService {
  // API端点
  private endpoints = {
    analyze: '/api/question/analyze',
    getResult: '/api/question/result',
  };

  /**
   * 发送题目分析请求
   * @param data 题目分析请求数据
   * @returns 分析任务ID
   */
  async analyzeQuestion(data: QuestionAnalysisRequest): Promise<string> {
    const response = await apiClient.post<{ taskId: string }>(
      this.endpoints.analyze,
      data
    );
    
    if (response.success && response.data) {
      return response.data.taskId;
    }
    
    throw new Error(response.error || '题目分析请求失败');
  }

  /**
   * 获取题目分析结果
   * @param taskId 任务ID
   * @returns 题目分析状态响应
   */
  async getAnalysisResult(taskId: string): Promise<QuestionAnalysisStatusResponse> {
    const response = await apiClient.get<QuestionAnalysisStatusResponse>(
      `${this.endpoints.getResult}/${taskId}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || '获取题目分析结果失败');
  }

  /**
   * 轮询获取题目分析结果
   * @param taskId 任务ID
   * @param maxAttempts 最大尝试次数
   * @param interval 轮询间隔(毫秒)
   * @param onUpdate 状态更新回调
   * @returns 题目分析结果
   */
  async pollAnalysisResult(
    taskId: string,
    maxAttempts: number = 15,
    interval: number = 2000,
    onUpdate?: (status: string, progress?: number) => void
  ): Promise<QuestionAnalysisResult> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      if (onUpdate) {
        onUpdate('正在处理...', attempts / maxAttempts * 100);
      }
      
      const result = await this.getAnalysisResult(taskId);
      
      // 更新进度
      if (onUpdate && result.progress) {
        onUpdate('正在解析题目...', result.progress);
      }
      
      // 如果处理完成，返回结果
      if (result.status === 'completed' && result.result) {
        return result.result;
      }
      
      // 如果处理失败，抛出错误
      if (result.status === 'failed') {
        throw new Error(result.error || '题目分析失败');
      }
      
      // 继续等待
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    throw new Error('处理超时，请重试');
  }

  /**
   * 获取相似题目推荐
   * @param questionId 题目ID
   * @returns 推荐的相似题目列表
   */
  async getSimilarQuestions(questionId: string): Promise<QuestionAnalysisResult[]> {
    const response = await apiClient.get<{ questions: QuestionAnalysisResult[] }>(
      `/api/learning/recommend/${questionId}`
    );
    
    if (response.success && response.data) {
      return response.data.questions;
    }
    
    throw new Error(response.error || '获取相似题目失败');
  }
}

// 导出题目解析服务实例
export const analysisService = new AnalysisService();
