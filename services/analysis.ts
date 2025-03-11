import { apiClient, ApiError } from './api';
import { API_CONFIG, useMockData, getLogger } from './config';
import { OCRResult } from './image';

// 获取日志记录器
const logger = getLogger('ANALYSIS');

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
    recommend: '/api/learning/recommend',
    feedback: '/api/question/feedback'
  };

  /**
   * 生成模拟的题目分析结果
   * @private
   */
  private generateMockAnalysisResult(questionText: string): QuestionAnalysisResult {
    logger.debug('Generating mock analysis result for:', questionText);
    
    // 生成一个简单的模拟结果
    return {
      questionId: `mock_${Date.now()}`,
      questionText,
      questionLatex: questionText.includes('=') ? questionText.replace(/\^2/g, '²') : undefined,
      subject: questionText.includes('=') ? '数学' : 
               questionText.includes('力') ? '物理' : '语文',
      difficulty: Math.random() > 0.7 ? 'hard' : Math.random() > 0.4 ? 'medium' : 'easy',
      solutionSteps: [
        {
          id: 's1',
          stepNumber: 1,
          content: '理解题目要求',
        },
        {
          id: 's2',
          stepNumber: 2,
          content: '分析题目条件',
        },
        {
          id: 's3',
          stepNumber: 3,
          content: '应用相关公式',
          latex: questionText.includes('=') ? questionText : undefined
        },
        {
          id: 's4',
          stepNumber: 4,
          content: '得出答案',
        }
      ],
      explanation: `这是一道关于${questionText.includes('=') ? '代数' : '概念'}的题目，需要${questionText.includes('=') ? '使用恰当的公式求解' : '理解相关知识点'}。`,
      knowledgePoints: [
        {
          id: 'kp1',
          name: questionText.includes('=') ? '方程求解' : '基础概念',
          description: `掌握${questionText.includes('=') ? '方程的基本性质和求解方法' : '基本概念和原理'}`,
          difficulty: 'medium',
        }
      ],
      relatedResources: [
        {
          id: 'r1',
          title: `${questionText.includes('=') ? '方程求解' : '基础知识'}讲解`,
          type: 'video',
          url: 'https://example.com/video1',
          thumbnail: 'https://example.com/thumbnail1.jpg',
        }
      ],
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 发送题目分析请求
   * @param data 题目分析请求数据
   * @returns 分析任务ID
   */
  async analyzeQuestion(data: QuestionAnalysisRequest): Promise<string> {
    try {
      // 使用模拟数据
      if (useMockData()) {
        logger.info('Using mock question analysis data');
        
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return `mock_task_${Date.now()}`;
      }
      
      logger.info('Sending question analysis request', data.ocrResult.text);
      
      // 使用API客户端发送真实请求
      const response = await apiClient.post<{ taskId: string }>(
        this.endpoints.analyze,
        data
      );
      
      return response.taskId;
    } catch (error) {
      logger.error('Question analysis request error:', error);
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error(error instanceof Error ? error.message : '题目分析请求失败');
    }
  }

  /**
   * 获取题目分析结果
   * @param taskId 任务ID
   * @returns 题目分析状态响应
   */
  async getAnalysisResult(taskId: string): Promise<QuestionAnalysisStatusResponse> {
    try {
      // 使用模拟数据
      if (useMockData()) {
        logger.info('Using mock analysis result data for taskId:', taskId);
        
        // 延迟模拟网络请求
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.ANALYSIS.MOCK_ANALYSIS_DELAY / 5));
        
        // 从任务ID中提取模拟题目文本
        const mockQuestionText = '求解方程: x² - 5x + 6 = 0';
        
        // 根据taskId前缀判断是否是模拟任务
        if (taskId.startsWith('mock_task_')) {
          // 模拟任务进度 - 基于当前时间来模拟进度变化
          const timestamp = parseInt(taskId.split('_')[2]);
          const elapsedTime = Date.now() - timestamp;
          const totalTime = API_CONFIG.ANALYSIS.MOCK_ANALYSIS_DELAY;
          const progress = Math.min(100, Math.floor((elapsedTime / totalTime) * 100));
          
          if (progress < 95) {
            // 处理中
            return {
              taskId,
              status: 'processing',
              progress
            };
          } else {
            // 完成
            return {
              taskId,
              status: 'completed',
              result: this.generateMockAnalysisResult(mockQuestionText)
            };
          }
        }
        
        // 非模拟任务，返回默认完成状态
        return {
          taskId,
          status: 'completed',
          result: this.generateMockAnalysisResult(mockQuestionText)
        };
      }
      
      logger.info('Fetching analysis result for taskId:', taskId);
      
      // 使用API客户端获取真实结果
      return await apiClient.get<QuestionAnalysisStatusResponse>(
        `${this.endpoints.getResult}/${taskId}`
      );
    } catch (error) {
      logger.error('Get analysis result error:', error);
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error(error instanceof Error ? error.message : '获取题目分析结果失败');
    }
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
    maxAttempts: number = API_CONFIG.ANALYSIS.MAX_POLL_ATTEMPTS,
    interval: number = API_CONFIG.ANALYSIS.POLL_INTERVAL,
    onUpdate?: (status: string, progress?: number) => void
  ): Promise<QuestionAnalysisResult> {
    let attempts = 0;
    
    logger.info('Starting analysis result polling for taskId:', taskId);
    
    while (attempts < maxAttempts) {
      attempts++;
      
      if (onUpdate) {
        onUpdate('正在处理...', attempts / maxAttempts * 100);
      }
      
      try {
        const result = await this.getAnalysisResult(taskId);
        
        // 更新进度
        if (onUpdate && result.progress) {
          onUpdate('正在解析题目...', result.progress);
        }
        
        // 如果处理完成，返回结果
        if (result.status === 'completed' && result.result) {
          logger.info('Analysis completed for taskId:', taskId);
          return result.result;
        }
        
        // 如果处理失败，抛出错误
        if (result.status === 'failed') {
          logger.error('Analysis failed for taskId:', taskId, result.error);
          throw new Error(result.error || '题目分析失败');
        }
        
        logger.debug(`Analysis polling attempt ${attempts}/${maxAttempts} for taskId: ${taskId}, status: ${result.status}, progress: ${result.progress || 'unknown'}`);
        
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
        logger.warn(`Analysis polling attempt ${attempts} failed:`, error);
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    logger.error('Analysis polling timeout for taskId:', taskId);
    throw new Error('处理超时，请重试');
  }

  /**
   * 获取相似题目推荐
   * @param questionId 题目ID
   * @returns 推荐的相似题目列表
   */
  async getSimilarQuestions(questionId: string): Promise<QuestionAnalysisResult[]> {
    try {
      // 使用模拟数据
      if (useMockData()) {
        logger.info('Using mock similar questions data for questionId:', questionId);
        
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 生成多个模拟题目
        const mockQuestions = [
          '求解二次方程: 2x² - 7x + 3 = 0',
          '计算表达式: (3x + 2)(2x - 5)，其中x = 3',
          '如果a + b = 5且ab = 6，求a² + b²的值'
        ];
        
        return mockQuestions.map(q => this.generateMockAnalysisResult(q));
      }
      
      logger.info('Fetching similar questions for questionId:', questionId);
      
      // 使用API客户端获取推荐题目
      const response = await apiClient.get<{ questions: QuestionAnalysisResult[] }>(
        `${this.endpoints.recommend}/${questionId}`
      );
      
      return response.questions;
    } catch (error) {
      logger.error('Get similar questions error:', error);
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error(error instanceof Error ? error.message : '获取相似题目失败');
    }
  }

  /**
   * 提交题目反馈
   * @param questionId 题目ID
   * @param feedback 反馈内容
   * @returns 是否提交成功
   */
  async submitFeedback(questionId: string, feedback: {
    rating?: number;
    comment?: string;
    isHelpful: boolean;
  }): Promise<boolean> {
    try {
      // 使用模拟数据
      if (useMockData()) {
        logger.info('Mock submitting feedback for questionId:', questionId, feedback);
        
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return true;
      }
      
      logger.info('Submitting feedback for questionId:', questionId);
      
      // 使用API客户端提交反馈
      await apiClient.post(
        `${this.endpoints.feedback}/${questionId}`,
        feedback
      );
      
      return true;
    } catch (error) {
      logger.error('Submit feedback error:', error);
      return false;
    }
  }
}

// 导出题目解析服务实例
export const analysisService = new AnalysisService();
