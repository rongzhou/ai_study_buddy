import { apiClient, ApiError } from './api';
import { API_CONFIG, useMockData, getLogger } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuestionAnalysisResult } from './analysis';

// 获取日志记录器
const logger = getLogger('ANALYTICS');

// 本地存储键
const STORAGE_KEYS = {
  ANALYTICS_DATA: 'analytics_data',
  LAST_SYNC: 'analytics_last_sync'
};

/**
 * 学习活动类型
 */
export enum LearningActivityType {
  QUESTION_VIEWED = 'question_viewed',
  QUESTION_ANSWERED = 'question_answered',
  KNOWLEDGE_POINT_LEARNED = 'knowledge_point_learned'
}

/**
 * 学习活动记录
 */
export interface LearningActivity {
  type: LearningActivityType;
  timestamp: number;
  data: Record<string, any>;
}

/**
 * 每周学习数据
 */
export interface WeeklyData {
  date: string;
  questions: number;
  correct: number;
}

/**
 * 学科学习数据
 */
export interface SubjectData {
  subject: string;
  questions: number;
  correct: number;
  accuracy: number;
}

/**
 * 难度分布数据
 */
export interface DifficultyData {
  difficulty: string;
  questions: number;
  correct: number;
  accuracy: number;
}

/**
 * 错题记录
 */
export interface MistakeRecord {
  id: string;
  subject: string;
  questionText: string;
  difficulty: string;
  date: string;
}

/**
 * 学习报告数据
 * 注意: 这里保持与原始报告页面中的数据结构兼容
 */
export interface LearningReport {
  totalQuestions: number;
  correctQuestions: number;
  wrongQuestions: number;
  accuracy: number;
  weeklyData: WeeklyData[];
  subjectData: SubjectData[];
  difficultyData: DifficultyData[];
  recentMistakes: MistakeRecord[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

/**
 * 数据分析服务 - 处理学习数据分析、统计和报告生成
 */
class AnalyticsService {
  // API端点
  private endpoints = {
    report: '/api/analytics/report',
    activity: '/api/analytics/activity',
    sync: '/api/analytics/sync'
  };

  /**
   * 记录学习活动
   * @param activity 学习活动记录
   */
  async recordActivity(activity: LearningActivity): Promise<boolean> {
    try {
      // 获取现有活动数据
      const existingData = await this.getStoredActivities();
      
      // 添加新活动
      existingData.push(activity);
      
      // 保存到本地存储
      await AsyncStorage.setItem(
        STORAGE_KEYS.ANALYTICS_DATA, 
        JSON.stringify(existingData)
      );
      
      // 使用模拟数据
      if (useMockData()) {
        logger.info('Mock recording activity:', activity.type);
        return true;
      }
      
      // 实际环境下同步到服务器
      logger.info('Recording activity to server:', activity.type);
      
      // 使用API客户端发送活动数据
      await apiClient.post(this.endpoints.activity, { activity });
      
      return true;
    } catch (error) {
      logger.error('Record activity error:', error);
      // 本地存储失败则返回失败
      return false;
    }
  }

  /**
   * 从本地存储获取学习活动数据
   * @private
   */
  private async getStoredActivities(): Promise<LearningActivity[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ANALYTICS_DATA);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('Get stored activities error:', error);
      return [];
    }
  }
  
  /**
   * 清空本地存储的学习活动数据（用于测试）
   * @private
   */
  async clearStoredActivities(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ANALYTICS_DATA);
      await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
      await AsyncStorage.removeItem('cached_learning_report');
      return true;
    } catch (error) {
      logger.error('Clear stored activities error:', error);
      return false;
    }
  }

  /**
   * 同步学习活动数据到服务器
   */
  async syncActivities(): Promise<boolean> {
    // 使用模拟数据
    if (useMockData()) {
      logger.info('Mock syncing activities to server');
      
      // 记录最后同步时间
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_SYNC,
        Date.now().toString()
      );
      
      return true;
    }
    
    try {
      // 获取本地存储的活动数据
      const activities = await this.getStoredActivities();
      
      if (activities.length === 0) {
        logger.info('No activities to sync');
        return true;
      }
      
      // 获取上次同步时间
      const lastSyncStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      const lastSync = lastSyncStr ? parseInt(lastSyncStr) : 0;
      
      // 只同步新活动
      const newActivities = activities.filter(a => a.timestamp > lastSync);
      
      if (newActivities.length === 0) {
        logger.info('No new activities to sync');
        return true;
      }
      
      logger.info(`Syncing ${newActivities.length} activities to server`);
      
      // 使用API客户端发送同步请求
      await apiClient.post(this.endpoints.sync, { activities: newActivities });
      
      // 更新最后同步时间
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_SYNC,
        Date.now().toString()
      );
      
      return true;
    } catch (error) {
      logger.error('Sync activities error:', error);
      return false;
    }
  }

  /**
   * 生成模拟报告数据
   * @private
   */
  private generateMockReport(): LearningReport {
    // 使用与原始代码相同的模拟数据结构
    // 这保证了与原始UI的完全兼容性
    return {
      totalQuestions: 56,
      correctQuestions: 42,
      wrongQuestions: 14,
      accuracy: 75,
      weeklyData: [
        { date: '周一', questions: 8, correct: 6 },
        { date: '周二', questions: 12, correct: 9 },
        { date: '周三', questions: 5, correct: 4 },
        { date: '周四', questions: 10, correct: 7 },
        { date: '周五', questions: 15, correct: 11 },
        { date: '周六', questions: 4, correct: 3 },
        { date: '周日', questions: 2, correct: 2 },
      ],
      subjectData: [
        { subject: '数学', questions: 25, correct: 18, accuracy: 72 },
        { subject: '语文', questions: 15, correct: 12, accuracy: 80 },
        { subject: '英语', questions: 10, correct: 8, accuracy: 80 },
        { subject: '物理', questions: 6, correct: 4, accuracy: 66.7 },
      ],
      difficultyData: [
        { difficulty: '简单', questions: 20, correct: 18, accuracy: 90 },
        { difficulty: '中等', questions: 30, correct: 21, accuracy: 70 },
        { difficulty: '困难', questions: 6, correct: 3, accuracy: 50 },
      ],
      recentMistakes: [
        {
          id: 'm1',
          subject: '数学',
          questionText: '求解方程: 2x² - 5x - 3 = 0',
          difficulty: 'medium',
          date: '2023-03-08',
        },
        {
          id: 'm2',
          subject: '物理',
          questionText: '一个物体从10米高处自由落下，计算它落地时的速度。',
          difficulty: 'medium',
          date: '2023-03-07',
        },
        {
          id: 'm3',
          subject: '数学',
          questionText: '计算积分: ∫(2x + 3)dx',
          difficulty: 'hard',
          date: '2023-03-05',
        },
      ],
      strengths: [
        '英语词汇掌握良好',
        '数学计算题准确率高',
        '语文阅读理解能力强',
      ],
      weaknesses: [
        '数学代数方程解题有困难',
        '物理力学概念理解不够深入',
        '数学积分计算需要加强',
      ],
      recommendations: [
        '加强数学代数方程的练习，特别是二次方程',
        '复习物理力学基本概念和公式',
        '针对积分计算，建议从基础题开始，逐步提高难度',
        '继续保持英语词汇的学习节奏',
      ],
    };
  }

  /**
   * 获取学习报告数据
   * @param forceRefresh 是否强制刷新数据
   * @returns 学习报告
   */
  async getLearningReport(forceRefresh: boolean = false): Promise<LearningReport> {
    try {
      // 使用模拟数据
      if (useMockData()) {
        logger.info('Using mock learning report data');
        
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return this.generateMockReport();
      }
      
      // 尝试从缓存获取
      if (!forceRefresh) {
        try {
          const cachedReport = await AsyncStorage.getItem('cached_learning_report');
          if (cachedReport) {
            const cachedData = JSON.parse(cachedReport);
            const cacheTime = cachedData.cacheTime || 0;
            
            // 如果缓存不超过30分钟，直接使用
            if (Date.now() - cacheTime < 30 * 60 * 1000) {
              logger.info('Using cached learning report');
              return cachedData.report;
            }
          }
        } catch (error) {
          logger.warn('Error reading cached report:', error);
        }
      }
      
      // 从服务器获取报告
      logger.info('Fetching learning report from server');
      
      // 先同步本地活动数据
      await this.syncActivities();
      
      // 获取报告
      const response = await apiClient.get<{ report: LearningReport }>(
        this.endpoints.report
      );
      
      // 缓存报告
      try {
        await AsyncStorage.setItem('cached_learning_report', JSON.stringify({
          report: response.report,
          cacheTime: Date.now()
        }));
      } catch (error) {
        logger.warn('Error caching report:', error);
      }
      
      return response.report;
    } catch (error) {
      logger.error('Get learning report error:', error);
      
      // 如果服务器请求失败，尝试使用缓存
      try {
        const cachedReport = await AsyncStorage.getItem('cached_learning_report');
        if (cachedReport) {
          logger.info('Using cached learning report after server error');
          return JSON.parse(cachedReport).report;
        }
      } catch (cacheError) {
        logger.error('Error reading cached report after server error:', cacheError);
      }
      
      // 如果缓存也失败，返回生成的模拟数据
      if (useMockData()) {
        return this.generateMockReport();
      }
      
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error(error instanceof Error ? error.message : '获取学习报告失败');
    }
  }

  /**
   * 获取学习趋势数据
   * @param days 天数
   * @returns 每日学习数据
   */
  async getStudyTrend(days: number = 7): Promise<WeeklyData[]> {
    try {
      // 从完整报告中提取每周数据
      const report = await this.getLearningReport();
      return report.weeklyData;
    } catch (error) {
      logger.error('Get study trend error:', error);
      throw error;
    }
  }

  /**
   * 获取学科统计数据
   * @returns 学科统计数据
   */
  async getSubjectStats(): Promise<SubjectData[]> {
    try {
      // 从完整报告中提取学科数据
      const report = await this.getLearningReport();
      return report.subjectData;
    } catch (error) {
      logger.error('Get subject stats error:', error);
      throw error;
    }
  }

  /**
   * 获取近期错题
   * @param limit 数量限制
   * @returns 错题记录
   */
  async getRecentMistakes(limit: number = 5): Promise<MistakeRecord[]> {
    try {
      // 从完整报告中提取错题记录
      const report = await this.getLearningReport();
      return report.recentMistakes.slice(0, limit);
    } catch (error) {
      logger.error('Get recent mistakes error:', error);
      throw error;
    }
  }

  /**
   * 获取学习建议
   * @returns 学习建议
   */
  async getLearningRecommendations(): Promise<string[]> {
    try {
      // 从完整报告中提取学习建议
      const report = await this.getLearningReport();
      return report.recommendations;
    } catch (error) {
      logger.error('Get learning recommendations error:', error);
      throw error;
    }
  }

  /**
   * 记录用户查看了题目
   * @param question 题目
   */
  async recordQuestionViewed(question: QuestionAnalysisResult): Promise<void> {
    try {
      await this.recordActivity({
        type: LearningActivityType.QUESTION_VIEWED,
        timestamp: Date.now(),
        data: {
          questionId: question.questionId,
          subject: question.subject,
          difficulty: question.difficulty
        }
      });
    } catch (error) {
      logger.error('Record question viewed error:', error);
    }
  }

  /**
   * 记录用户回答了题目
   * @param question 题目
   * @param isCorrect 是否正确
   * @param userAnswer 用户答案
   */
  async recordQuestionAnswered(
    question: QuestionAnalysisResult,
    isCorrect: boolean,
    userAnswer?: string
  ): Promise<void> {
    try {
      await this.recordActivity({
        type: LearningActivityType.QUESTION_ANSWERED,
        timestamp: Date.now(),
        data: {
          questionId: question.questionId,
          subject: question.subject,
          difficulty: question.difficulty,
          isCorrect,
          userAnswer
        }
      });
    } catch (error) {
      logger.error('Record question answered error:', error);
    }
  }
}

// 导出数据分析服务实例
export const analyticsService = new AnalyticsService();
