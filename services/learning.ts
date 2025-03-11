import { apiClient, ApiError } from './api';
import { API_CONFIG, useMockData, getLogger } from './config';
import { QuestionAnalysisResult } from './analysis';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 获取日志记录器
const logger = getLogger('LEARNING');

// 存储键
const STORAGE_KEYS = {
  FAVORITES: 'user_favorites',
  HISTORY: 'user_history'
};

/**
 * 学习内容过滤条件
 */
export interface LearningContentFilter {
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'all';
  searchQuery?: string;
  page?: number;
  limit?: number;
}

/**
 * 收藏请求
 */
export interface FavoriteRequest {
  questionId: string;
  isFavorite: boolean;
}

/**
 * 历史记录项
 */
interface HistoryItem {
  questionId: string;
  timestamp: number;
  question: QuestionAnalysisResult;
}

/**
 * 学习内容服务 - 处理学习内容获取、收藏、历史记录等功能
 */
class LearningService {
  // API端点
  private endpoints = {
    getContent: '/api/learning/content',
    favorites: '/api/learning/favorites',
    history: '/api/learning/history',
    search: '/api/learning/search',
    recommend: '/api/learning/recommend'
  };

  /**
   * 生成模拟学习内容
   * @private
   */
  private generateMockContent(filter?: LearningContentFilter): QuestionAnalysisResult[] {
    logger.debug('Generating mock learning content with filter:', filter);
    
    // 模拟数据 - 每个学科的题目
    const mockQuestions: QuestionAnalysisResult[] = [
      // 数学题目
      {
        questionId: 'math_1',
        questionText: '解方程: 2x + 5 = 15',
        subject: '数学',
        difficulty: 'easy',
        createdAt: '2023-03-10T09:20:00Z',
        solutionSteps: [],
        explanation: '',
        knowledgePoints: [],
        relatedResources: [],
      },
      {
        questionId: 'math_2',
        questionText: '计算三角形的面积，已知底边长为6cm，高为8cm。',
        subject: '数学',
        difficulty: 'easy',
        createdAt: '2023-03-09T14:30:00Z',
        solutionSteps: [],
        explanation: '',
        knowledgePoints: [],
        relatedResources: [],
      },
      {
        questionId: 'math_3',
        questionText: '求解方程组: { 2x + y = 7, x - y = 1 }',
        subject: '数学',
        difficulty: 'medium',
        createdAt: '2023-03-08T11:15:00Z',
        solutionSteps: [],
        explanation: '',
        knowledgePoints: [],
        relatedResources: [],
      },
      {
        questionId: 'math_4',
        questionText: '已知函数f(x) = x² - 4x + 3，求函数的最小值。',
        subject: '数学',
        difficulty: 'medium',
        createdAt: '2023-03-07T16:45:00Z',
        solutionSteps: [],
        explanation: '',
        knowledgePoints: [],
        relatedResources: [],
      },
      {
        questionId: 'math_5',
        questionText: '证明：对于任意的三角形，三个内角和等于180°。',
        subject: '数学',
        difficulty: 'medium',
        createdAt: '2023-03-06T10:20:00Z',
        solutionSteps: [],
        explanation: '',
        knowledgePoints: [],
        relatedResources: [],
      },
      // 语文题目
      {
        questionId: 'chinese_1',
        questionText: '分析下列句子的成分："春天来了，万物复苏。"',
        subject: '语文',
        difficulty: 'easy',
        createdAt: '2023-03-10T08:30:00Z',
        solutionSteps: [],
        explanation: '',
        knowledgePoints: [],
        relatedResources: [],
      },
      {
        questionId: 'chinese_2',
        questionText: '阅读下面的短文，回答问题：\n"夜晚，星星眨着眼睛，月亮挂在天空中..."',
        subject: '语文',
        difficulty: 'medium',
        createdAt: '2023-03-09T13:15:00Z',
        solutionSteps: [],
        explanation: '',
        knowledgePoints: [],
        relatedResources: [],
      },
      // 英语题目
      {
        questionId: 'english_1',
        questionText: 'Complete the sentence: Yesterday, I ___ (go) to the park with my friends.',
        subject: '英语',
        difficulty: 'easy',
        createdAt: '2023-03-08T15:40:00Z',
        solutionSteps: [],
        explanation: '',
        knowledgePoints: [],
        relatedResources: [],
      },
      // 物理题目
      {
        questionId: 'physics_1',
        questionText: '一个物体从10米高处自由落下，计算它落地时的速度。',
        subject: '物理',
        difficulty: 'medium',
        createdAt: '2023-03-05T10:40:00Z',
        solutionSteps: [],
        explanation: '',
        knowledgePoints: [],
        relatedResources: [],
      },
      {
        questionId: 'physics_2',
        questionText: '计算一个质量为5kg的物体所具有的重力势能，已知重力加速度g=9.8m/s²，物体距地面高度为10m。',
        subject: '物理',
        difficulty: 'hard',
        createdAt: '2023-03-03T14:20:00Z',
        solutionSteps: [],
        explanation: '',
        knowledgePoints: [],
        relatedResources: [],
      },
    ];
    
    // 根据过滤条件筛选
    let filteredQuestions = [...mockQuestions];
    
    if (filter) {
      // 按学科筛选
      if (filter.subject) {
        filteredQuestions = filteredQuestions.filter(q => q.subject === filter.subject);
      }
      
      // 按难度筛选
      if (filter.difficulty && filter.difficulty !== 'all') {
        filteredQuestions = filteredQuestions.filter(q => q.difficulty === filter.difficulty);
      }
      
      // 按搜索词筛选
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase().trim();
        filteredQuestions = filteredQuestions.filter(q => 
          q.questionText.toLowerCase().includes(query) || 
          q.subject.toLowerCase().includes(query)
        );
      }
      
      // 分页
      if (filter.page !== undefined && filter.limit) {
        const startIndex = filter.page * filter.limit;
        filteredQuestions = filteredQuestions.slice(startIndex, startIndex + filter.limit);
      }
    }
    
    return filteredQuestions;
  }

  /**
   * 获取学习内容列表
   * @param filter 过滤条件
   * @returns 学习内容列表
   */
  async getLearningContent(filter?: LearningContentFilter): Promise<QuestionAnalysisResult[]> {
    try {
      // 使用模拟数据
      if (useMockData()) {
        logger.info('Using mock learning content data');
        
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 600));
        
        return this.generateMockContent(filter);
      }
      
      logger.info('Fetching learning content with filter:', filter);
      
      // 构建查询参数
      const params = filter ? { ...filter } : undefined;
      
      // 使用API客户端获取学习内容
      const response = await apiClient.get<{ questions: QuestionAnalysisResult[] }>(
        this.endpoints.getContent,
        params,
        true // 使用缓存
      );
      
      return response.questions;
    } catch (error) {
      logger.error('Get learning content error:', error);
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error(error instanceof Error ? error.message : '获取学习内容失败');
    }
  }

  /**
   * 搜索学习内容
   * @param query 搜索关键词
   * @returns 搜索结果
   */
  async searchContent(query: string): Promise<QuestionAnalysisResult[]> {
    try {
      // 使用模拟数据
      if (useMockData()) {
        logger.info('Using mock search content data for query:', query);
        
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return this.generateMockContent({ searchQuery: query });
      }
      
      logger.info('Searching content with query:', query);
      
      // 使用API客户端搜索内容
      const response = await apiClient.get<{ questions: QuestionAnalysisResult[] }>(
        this.endpoints.search,
        { query }
      );
      
      return response.questions;
    } catch (error) {
      logger.error('Search content error:', error);
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error(error instanceof Error ? error.message : '搜索学习内容失败');
    }
  }

  /**
   * 从本地存储获取收藏ID列表
   * @private
   */
  private async getFavoriteIdsFromStorage(): Promise<string[]> {
    try {
      const favoritesJson = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (favoritesJson) {
        return JSON.parse(favoritesJson);
      }
      return [];
    } catch (error) {
      logger.error('Error getting favorite IDs from storage:', error);
      return [];
    }
  }

  /**
   * 更新本地存储中的收藏ID列表
   * @private
   */
  private async updateFavoriteIdsInStorage(ids: string[]): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(ids));
      return true;
    } catch (error) {
      logger.error('Error updating favorite IDs in storage:', error);
      return false;
    }
  }

  /**
   * 获取收藏的学习内容
   * @returns 收藏的学习内容
   */
  async getFavorites(): Promise<QuestionAnalysisResult[]> {
    try {
      // 获取本地存储的收藏ID
      const favoriteIds = await this.getFavoriteIdsFromStorage();
      
      // 使用模拟数据
      if (useMockData()) {
        logger.info('Using mock favorites data with local IDs:', favoriteIds);
        
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // 如果本地没有收藏，返回模拟数据的前3个作为示例
        if (favoriteIds.length === 0) {
          const allContent = this.generateMockContent();
          const mockFavorites = allContent.slice(0, 3);
          
          // 保存到本地存储
          this.updateFavoriteIdsInStorage(mockFavorites.map(q => q.questionId));
          
          return mockFavorites;
        }
        
        // 从所有模拟数据中筛选出已收藏的内容
        const allContent = this.generateMockContent();
        return allContent.filter(item => favoriteIds.includes(item.questionId));
      }
      
      logger.info('Fetching favorites from server');
      
      // 如果本地没有收藏ID，从服务器获取
      if (favoriteIds.length === 0) {
        const response = await apiClient.get<{ questions: QuestionAnalysisResult[] }>(
          this.endpoints.favorites
        );
        
        // 更新本地收藏ID
        this.updateFavoriteIdsInStorage(response.questions.map(q => q.questionId));
        
        return response.questions;
      }
      
      // 如果本地有收藏ID，获取这些题目的详细信息
      const response = await apiClient.post<{ questions: QuestionAnalysisResult[] }>(
        `${this.endpoints.getContent}/batch`,
        { ids: favoriteIds }
      );
      
      return response.questions;
    } catch (error) {
      logger.error('Get favorites error:', error);
      
      // 如果服务器请求失败，尝试使用本地模拟数据
      if (useMockData()) {
        const favoriteIds = await this.getFavoriteIdsFromStorage();
        const allContent = this.generateMockContent();
        return allContent.filter(item => favoriteIds.includes(item.questionId));
      }
      
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error(error instanceof Error ? error.message : '获取收藏内容失败');
    }
  }

  /**
   * 添加或删除收藏
   * @param request 收藏请求
   * @returns 是否成功
   */
  async toggleFavorite(request: FavoriteRequest): Promise<boolean> {
    try {
      // 更新本地存储
      const favoriteIds = await this.getFavoriteIdsFromStorage();
      
      if (request.isFavorite) {
        // 添加收藏，避免重复
        if (!favoriteIds.includes(request.questionId)) {
          favoriteIds.push(request.questionId);
        }
      } else {
        // 移除收藏
        const index = favoriteIds.indexOf(request.questionId);
        if (index !== -1) {
          favoriteIds.splice(index, 1);
        }
      }
      
      // 更新本地存储
      const storageSuccess = await this.updateFavoriteIdsInStorage(favoriteIds);
      
      // 使用模拟数据
      if (useMockData()) {
        logger.info('Mock toggling favorite:', request);
        
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return storageSuccess;
      }
      
      logger.info('Syncing favorite change to server:', request);
      
      // 使用API客户端同步到服务器
      await apiClient.post(
        this.endpoints.favorites,
        request
      );
      
      // 成功后清除缓存，确保下次获取收藏列表时是最新的
      apiClient.invalidateCache(this.endpoints.favorites);
      
      return true;
    } catch (error) {
      logger.error('Toggle favorite error:', error);
      // 即使API请求失败，只要本地更新成功，也返回成功
      // 可以在下次启动时尝试同步
      return error instanceof Error && error.message.includes('storage');
    }
  }

  /**
   * 检查题目是否已收藏
   * @param questionId 题目ID
   * @returns 是否已收藏
   */
  async isFavorite(questionId: string): Promise<boolean> {
    try {
      const favoriteIds = await this.getFavoriteIdsFromStorage();
      return favoriteIds.includes(questionId);
    } catch (error) {
      logger.error('Check favorite status error:', error);
      return false;
    }
  }

  /**
   * 从本地存储获取历史记录
   * @private
   */
  private async getHistoryFromStorage(limit?: number): Promise<HistoryItem[]> {
    try {
      const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
      if (historyJson) {
        let historyItems: HistoryItem[] = JSON.parse(historyJson);
        
        // 按时间排序
        historyItems.sort((a, b) => b.timestamp - a.timestamp);
        
        // 应用限制
        if (limit && limit > 0) {
          historyItems = historyItems.slice(0, limit);
        }
        
        return historyItems;
      }
      return [];
    } catch (error) {
      logger.error('Error getting history from storage:', error);
      return [];
    }
  }

  /**
   * 更新本地存储中的历史记录
   * @private
   */
  private async updateHistoryInStorage(historyItems: HistoryItem[]): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(historyItems));
      return true;
    } catch (error) {
      logger.error('Error updating history in storage:', error);
      return false;
    }
  }

  /**
   * 获取历史记录
   * @param limit 限制数量
   * @returns 历史记录
   */
  async getHistory(limit?: number): Promise<QuestionAnalysisResult[]> {
    try {
      // 获取本地历史记录
      const historyItems = await this.getHistoryFromStorage(limit);
      
      // 使用模拟数据
      if (useMockData()) {
        logger.info('Using mock history data with local items:', historyItems.length);
        
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // 如果本地没有历史记录，生成一些模拟数据
        if (historyItems.length === 0) {
          const allContent = this.generateMockContent().sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          const mockHistory = limit ? allContent.slice(0, limit) : allContent;
          
          // 不保存到本地存储，因为这只是模拟数据
          
          return mockHistory;
        }
        
        // 返回本地历史记录中的问题数据
        return historyItems.map(item => item.question);
      }
      
      logger.info('Fetching history content from server');
      
      // 如果本地有历史记录，直接返回
      if (historyItems.length > 0) {
        return historyItems.map(item => item.question);
      }
      
      // 如果本地没有历史记录，从服务器获取
      const params = limit ? { limit } : undefined;
      const response = await apiClient.get<{ questions: QuestionAnalysisResult[] }>(
        this.endpoints.history,
        params
      );
      
      // 更新本地历史记录
      const newHistoryItems = response.questions.map(question => ({
        questionId: question.questionId,
        timestamp: new Date().getTime(),
        question
      }));
      
      this.updateHistoryInStorage(newHistoryItems);
      
      return response.questions;
    } catch (error) {
      logger.error('Get history error:', error);
      
      // 如果服务器请求失败，但本地有历史记录，返回本地数据
      const historyItems = await this.getHistoryFromStorage(limit);
      if (historyItems.length > 0) {
        return historyItems.map(item => item.question);
      }
      
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error(error instanceof Error ? error.message : '获取历史记录失败');
    }
  }

  /**
   * 添加题目到历史记录
   * @param question 题目信息
   * @returns 是否成功
   */
  async addToHistory(question: QuestionAnalysisResult): Promise<boolean> {
    try {
      // 获取当前历史记录
      const historyItems = await this.getHistoryFromStorage();
      
      // 创建新的历史记录项
      const newHistoryItem: HistoryItem = {
        questionId: question.questionId,
        timestamp: new Date().getTime(),
        question
      };
      
      // 移除相同ID的历史记录（如果存在）
      const filteredHistory = historyItems.filter(
        item => item.questionId !== question.questionId
      );
      
      // 添加新的历史记录项到最前面
      filteredHistory.unshift(newHistoryItem);
      
      // 限制历史记录数量（保留最近的50条）
      const limitedHistory = filteredHistory.slice(0, 50);
      
      // 更新本地存储
      const storageSuccess = await this.updateHistoryInStorage(limitedHistory);
      
      // 使用模拟数据
      if (useMockData()) {
        logger.info('Mock adding to history:', question.questionId);
        return storageSuccess;
      }
      
      logger.info('Syncing history addition to server:', question.questionId);
      
      // 同步到服务器
      await apiClient.post(
        `${this.endpoints.history}/add`,
        { questionId: question.questionId }
      );
      
      return true;
    } catch (error) {
      logger.error('Add to history error:', error);
      // 即使API请求失败，只要本地更新成功，也返回成功
      return error instanceof Error && error.message.includes('storage');
    }
  }

  /**
   * 清除历史记录
   * @returns 是否成功
   */
  async clearHistory(): Promise<boolean> {
    try {
      // 清除本地历史记录
      await AsyncStorage.removeItem(STORAGE_KEYS.HISTORY);
      
      // 使用模拟数据
      if (useMockData()) {
        logger.info('Mock clearing history');
        return true;
      }
      
      logger.info('Syncing history clearing to server');
      
      // 同步到服务器
      await apiClient.delete(this.endpoints.history);
      
      return true;
    } catch (error) {
      logger.error('Clear history error:', error);
      return false;
    }
  }

  /**
   * 获取推荐学习内容
   * @param count 数量限制
   * @returns 推荐的学习内容
   */
  async getRecommendedContent(count: number = 5): Promise<QuestionAnalysisResult[]> {
    try {
      // 使用模拟数据
      if (useMockData()) {
        logger.info('Using mock recommended content data');
        
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 从模拟数据中随机选择一些作为推荐
        const allContent = this.generateMockContent();
        const shuffled = [...allContent].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
      }
      
      logger.info('Fetching recommended content');
      
      // 使用API客户端获取推荐内容
      const response = await apiClient.get<{ questions: QuestionAnalysisResult[] }>(
        this.endpoints.recommend,
        { count }
      );
      
      return response.questions;
    } catch (error) {
      logger.error('Get recommended content error:', error);
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error(error instanceof Error ? error.message : '获取推荐内容失败');
    }
  }
}

// 导出学习内容服务实例
export const learningService = new LearningService();
