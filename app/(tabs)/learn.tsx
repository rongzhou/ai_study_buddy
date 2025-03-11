import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { QuestionAnalysisResult } from '../../services/analysis';
import { learningService, LearningContentFilter } from '../../services/learning';
import { getLogger } from '../../services/config';

// 获取日志记录器
const logger = getLogger('LEARN_SCREEN');

const SCREEN_WIDTH = Dimensions.get('window').width;

// 学科类别
interface Subject {
  id: string;
  name: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}

// 学科数据
const SUBJECTS: Subject[] = [
  { id: '1', name: '数学', icon: 'calculator-outline', color: '#4A6FFF' },
  { id: '2', name: '语文', icon: 'book-outline', color: '#FF9500' },
  { id: '3', name: '英语', icon: 'language-outline', color: '#34C759' },
  { id: '4', name: '物理', icon: 'flash-outline', color: '#AF52DE' },
  { id: '5', name: '化学', icon: 'flask-outline', color: '#FF3B30' },
  { id: '6', name: '生物', icon: 'leaf-outline', color: '#5AC8FA' },
  { id: '7', name: '历史', icon: 'time-outline', color: '#FFCC00' },
  { id: '8', name: '地理', icon: 'globe-outline', color: '#FF9500' },
];

// 难度级别
type Difficulty = 'all' | 'easy' | 'medium' | 'hard';


// 获取难度标签颜色
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return '#28A745';
    case 'medium':
      return '#FFC107';
    case 'hard':
      return '#DC3545';
    default:
      return '#6C757D';
  }
};

// 获取难度标签文本
const getDifficultyText = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return '简单';
    case 'medium':
      return '中等';
    case 'hard':
      return '困难';
    default:
      return '未知';
  }
};

// 在LearnScreen组件之前添加QuestionItem组件
interface QuestionItemProps {
  item: QuestionAnalysisResult;
  onPress: (questionId: string) => void;
  onToggleFavorite: (questionId: string, isFavorite: boolean) => Promise<boolean>;
}

const QuestionItem: React.FC<QuestionItemProps> = ({ item, onPress, onToggleFavorite }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  
  // 检查初始收藏状态
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      const favorited = await learningService.isFavorite(item.questionId);
      setIsFavorite(favorited);
    };
    
    checkFavoriteStatus();
  }, [item.questionId]);
  
  // 切换收藏状态
  const toggleFavorite = async (e: any) => {
    e.stopPropagation();
    
    // 立即更新UI状态
    const newState = !isFavorite;
    setIsFavorite(newState);
    
    // 调用API更新收藏状态
    const success = await onToggleFavorite(item.questionId, newState);
    
    // 如果失败，恢复UI状态
    if (!success) {
      setIsFavorite(!newState);
    }
  };
  
  return (
    <TouchableOpacity
      style={styles.questionCard}
      onPress={() => onPress(item.questionId)}
    >
      <View style={styles.questionCardHeader}>
        <View style={styles.subjectContainer}>
          <Text style={styles.subjectText}>{item.subject}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={toggleFavorite}
          >
            <Ionicons 
              name={isFavorite ? "bookmark" : "bookmark-outline"} 
              size={22} 
              color={isFavorite ? "#4A6FFF" : "#6C757D"} 
            />
          </TouchableOpacity>
          <View
            style={[
              styles.difficultyTag,
              { backgroundColor: getDifficultyColor(item.difficulty) }
            ]}
          >
            <Text style={styles.difficultyText}>
              {getDifficultyText(item.difficulty)}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.questionText} numberOfLines={3}>
        {item.questionText}
      </Text>
    </TouchableOpacity>
  );
};

export default function LearnScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [questions, setQuestions] = useState<QuestionAnalysisResult[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionAnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 获取学习内容
  const fetchLearningContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 构建过滤条件
      const filter: LearningContentFilter = {};
      
      if (selectedSubject) {
        filter.subject = selectedSubject;
      }
      
      if (selectedDifficulty !== 'all') {
        filter.difficulty = selectedDifficulty;
      }
      
      if (searchQuery.trim()) {
        filter.searchQuery = searchQuery.trim();
      }
      
      logger.info('Fetching learning content with filter:', filter);
      
      // 调用服务获取学习内容
      const content = await learningService.getLearningContent(filter);
      
      setQuestions(content);
      setFilteredQuestions(content);
      
    } catch (err) {
      logger.error('Error fetching learning content:', err);
      setError(err instanceof Error ? err.message : '获取学习内容失败');
      Alert.alert('加载失败', err instanceof Error ? err.message : '获取学习内容失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, selectedDifficulty, searchQuery]);

  // 初始加载
  useEffect(() => {
    fetchLearningContent();
  }, [fetchLearningContent]);

  // 处理刷新
  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      await fetchLearningContent();
    } catch (err) {
      logger.error('Error refreshing content:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // 处理搜索
  const handleSearch = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      // 如果有搜索词，直接使用搜索API
      if (searchQuery.trim()) {
        const results = await learningService.searchContent(searchQuery.trim());
        
        // 应用其他过滤条件
        let filtered = [...results];
        
        if (selectedSubject) {
          filtered = filtered.filter(q => q.subject === selectedSubject);
        }
        
        if (selectedDifficulty !== 'all') {
          filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
        }
        
        setQuestions(filtered);
        setFilteredQuestions(filtered);
      } else {
        // 否则获取全部内容
        await fetchLearningContent();
      }
    } catch (err) {
      logger.error('Error searching content:', err);
      setError(err instanceof Error ? err.message : '搜索失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理题目点击
  const handleQuestionPress = async (questionId: string) => {
    try {
      // 找到对应的题目
      const question = questions.find(q => q.questionId === questionId);
      if (question) {
        // 将题目添加到历史记录
        await learningService.addToHistory(question);
      }
      
      // 跳转到题目分析页面
      router.push(`/analysis/${questionId}`);
    } catch (error) {
      // 即使添加历史记录失败，也继续跳转
      logger.error('Error adding to history:', error);
      router.push(`/analysis/${questionId}`);
    }
  };

  // 处理收藏/取消收藏
  const handleToggleFavorite = async (questionId: string, isFavorite: boolean) => {
    try {
      const success = await learningService.toggleFavorite({
        questionId,
        isFavorite
      });
      
      if (!success) {
        Alert.alert(
          isFavorite ? '收藏失败' : '取消收藏失败',
          '请稍后重试'
        );
      } else if (Platform.OS === 'android') {
        // 在Android上显示Toast提示
        // (在实际应用中，应使用ToastAndroid.show)
        logger.debug(isFavorite ? '已添加到收藏' : '已取消收藏');
      }
      
      return success;
    } catch (error) {
      logger.error('Error toggling favorite:', error);
      Alert.alert('操作失败', '请稍后重试');
      return false;
    }
  };

  // 处理清除过滤器
  const clearFilters = () => {
    setSelectedSubject(null);
    setSelectedDifficulty('all');
    setSearchQuery('');
    // 重新获取数据
    fetchLearningContent();
  };

  // 渲染学科项
  const renderSubjectItem = ({ item }: { item: Subject }) => (
    <TouchableOpacity
      style={[
        styles.subjectItem,
        selectedSubject === item.name && { backgroundColor: `${item.color}20` }
      ]}
      onPress={() => setSelectedSubject(selectedSubject === item.name ? null : item.name)}
    >
      <View
        style={[
          styles.subjectIconContainer,
          { backgroundColor: item.color }
        ]}
      >
        <Ionicons name={item.icon} size={20} color="#FFFFFF" />
      </View>
      <Text style={styles.subjectName}>{item.name}</Text>
    </TouchableOpacity>
  );

  // 渲染题目卡片
  const renderQuestionItem = ({ item }: { item: QuestionAnalysisResult }) => (
    <QuestionItem 
      item={item}
      onPress={handleQuestionPress}
      onToggleFavorite={handleToggleFavorite}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4A6FFF']} />
        }
      >
        {/* 搜索框 */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#ADB5BD" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索题目、知识点..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#ADB5BD"
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                // 清除搜索后立即刷新
                fetchLearningContent();
              }}
            >
              <Ionicons name="close-circle" size={18} color="#ADB5BD" />
            </TouchableOpacity>
          )}
        </View>

        {/* 学科分类 */}
        <View style={styles.subjectsContainer}>
          <Text style={styles.sectionTitle}>学科</Text>
          <FlatList
            horizontal
            data={SUBJECTS}
            renderItem={renderSubjectItem}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subjectsList}
          />
        </View>

        {/* 难度选择 */}
        <View style={styles.difficultiesContainer}>
          <Text style={styles.sectionTitle}>难度</Text>
          <View style={styles.difficultiesList}>
            <TouchableOpacity
              style={[
                styles.difficultyButton,
                selectedDifficulty === 'all' && styles.selectedDifficultyButton,
              ]}
              onPress={() => setSelectedDifficulty('all')}
            >
              <Text
                style={[
                  styles.difficultyButtonText,
                  selectedDifficulty === 'all' && styles.selectedDifficultyButtonText,
                ]}
              >
                全部
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.difficultyButton,
                selectedDifficulty === 'easy' && styles.selectedDifficultyButton,
                { borderColor: '#28A745' },
              ]}
              onPress={() => setSelectedDifficulty('easy')}
            >
              <Text
                style={[
                  styles.difficultyButtonText,
                  selectedDifficulty === 'easy' && styles.selectedDifficultyButtonText,
                  { color: '#28A745' },
                ]}
              >
                简单
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.difficultyButton,
                selectedDifficulty === 'medium' && styles.selectedDifficultyButton,
                { borderColor: '#FFC107' },
              ]}
              onPress={() => setSelectedDifficulty('medium')}
            >
              <Text
                style={[
                  styles.difficultyButtonText,
                  selectedDifficulty === 'medium' && styles.selectedDifficultyButtonText,
                  { color: '#FFC107' },
                ]}
              >
                中等
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.difficultyButton,
                selectedDifficulty === 'hard' && styles.selectedDifficultyButton,
                { borderColor: '#DC3545' },
              ]}
              onPress={() => setSelectedDifficulty('hard')}
            >
              <Text
                style={[
                  styles.difficultyButtonText,
                  selectedDifficulty === 'hard' && styles.selectedDifficultyButtonText,
                  { color: '#DC3545' },
                ]}
              >
                困难
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 题目列表 */}
        <View style={styles.questionsContainer}>
          <View style={styles.questionsHeader}>
            <Text style={styles.sectionTitle}>
              题目 ({filteredQuestions.length})
            </Text>
            {(selectedSubject || selectedDifficulty !== 'all' || searchQuery) && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersText}>清除筛选</Text>
                <Ionicons name="close-circle" size={16} color="#4A6FFF" />
              </TouchableOpacity>
            )}
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color="#4A6FFF" style={styles.loadingIndicator} />
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={36} color="#DC3545" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={fetchLearningContent}
              >
                <Text style={styles.retryButtonText}>重试</Text>
              </TouchableOpacity>
            </View>
          ) : filteredQuestions.length > 0 ? (
            <FlatList
              data={filteredQuestions}
              renderItem={renderQuestionItem}
              keyExtractor={item => item.questionId}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={48} color="#E9ECEF" />
              <Text style={styles.emptyText}>
                没有找到符合条件的题目
              </Text>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersText}>清除筛选</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'PingFangSC-Regular',
    color: '#212529',
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PingFangSC-Medium',
    color: '#212529',
    marginBottom: 12,
  },
  subjectsContainer: {
    marginBottom: 24,
  },
  subjectsList: {
    paddingRight: 16,
  },
  subjectItem: {
    alignItems: 'center',
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  subjectIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 12,
    fontFamily: 'PingFangSC-Medium',
    color: '#212529',
  },
  difficultiesContainer: {
    marginBottom: 24,
  },
  difficultiesList: {
    flexDirection: 'row',
  },
  difficultyButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  selectedDifficultyButton: {
    backgroundColor: '#EBF1FF',
    borderColor: '#4A6FFF',
  },
  difficultyButtonText: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Medium',
    color: '#6C757D',
  },
  selectedDifficultyButtonText: {
    color: '#4A6FFF',
  },
  questionsContainer: {
    marginBottom: 16,
  },
  questionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Regular',
    color: '#4A6FFF',
    marginRight: 4,
  },
  loadingIndicator: {
    marginVertical: 32,
  },
  questionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  questionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 4,
    marginRight: 8,
  },
  subjectContainer: {
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  subjectText: {
    fontSize: 12,
    fontFamily: 'PingFangSC-Medium',
    color: '#495057',
  },
  difficultyTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontFamily: 'PingFangSC-Medium',
    color: '#FFFFFF',
  },
  questionText: {
    fontSize: 15,
    fontFamily: 'PingFangSC-Regular',
    color: '#212529',
    lineHeight: 22,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'PingFangSC-Regular',
    color: '#6C757D',
    marginTop: 12,
    marginBottom: 16,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'PingFangSC-Regular',
    color: '#6C757D',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4A6FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Medium',
    color: '#FFFFFF',
  },
});
