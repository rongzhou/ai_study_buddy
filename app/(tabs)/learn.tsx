import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { QuestionAnalysisResult } from '../../services/analysis';

const SCREEN_WIDTH = Dimensions.get('window').width;

// 学科类别
interface Subject {
  id: string;
  name: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}

// 模拟学科数据
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

// 模拟推荐题目数据
const RECOMMENDED_QUESTIONS: QuestionAnalysisResult[] = [
  {
    questionId: 'q101',
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
    questionId: 'q102',
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
    questionId: 'q103',
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
    questionId: 'q104',
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
    questionId: 'q105',
    questionText: '证明：对于任意的三角形，三个内角和等于180°。',
    subject: '数学',
    difficulty: 'medium',
    createdAt: '2023-03-06T10:20:00Z',
    solutionSteps: [],
    explanation: '',
    knowledgePoints: [],
    relatedResources: [],
  },
  {
    questionId: 'q201',
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
    questionId: 'q202',
    questionText: '阅读下面的短文，回答问题：\n"夜晚，星星眨着眼睛，月亮挂在天空中..."',
    subject: '语文',
    difficulty: 'medium',
    createdAt: '2023-03-09T13:15:00Z',
    solutionSteps: [],
    explanation: '',
    knowledgePoints: [],
    relatedResources: [],
  },
  {
    questionId: 'q301',
    questionText: 'Complete the sentence: Yesterday, I ___ (go) to the park with my friends.',
    subject: '英语',
    difficulty: 'easy',
    createdAt: '2023-03-08T15:40:00Z',
    solutionSteps: [],
    explanation: '',
    knowledgePoints: [],
    relatedResources: [],
  },
];

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

export default function LearnScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [questions, setQuestions] = useState<QuestionAnalysisResult[]>(RECOMMENDED_QUESTIONS);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionAnalysisResult[]>(RECOMMENDED_QUESTIONS);

  // 过滤题目
  useEffect(() => {
    let filtered = [...questions];
    
    // 按学科过滤
    if (selectedSubject) {
      filtered = filtered.filter(q => q.subject === selectedSubject);
    }
    
    // 按难度过滤
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }
    
    // 按搜索词过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(q => 
        q.questionText.toLowerCase().includes(query) || 
        q.subject.toLowerCase().includes(query)
      );
    }
    
    setFilteredQuestions(filtered);
  }, [selectedSubject, selectedDifficulty, searchQuery, questions]);

  // 处理刷新
  const handleRefresh = async () => {
    setRefreshing(true);
    
    // 模拟网络请求
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 简单地随机排序模拟新数据
    setQuestions([...RECOMMENDED_QUESTIONS].sort(() => 0.5 - Math.random()));
    setRefreshing(false);
  };

  // 处理题目点击
  const handleQuestionPress = (questionId: string) => {
    router.push(`/analysis/${questionId}`);
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
    <TouchableOpacity
      style={styles.questionCard}
      onPress={() => handleQuestionPress(item.questionId)}
    >
      <View style={styles.questionCardHeader}>
        <View style={styles.subjectContainer}>
          <Text style={styles.subjectText}>{item.subject}</Text>
        </View>
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
      <Text style={styles.questionText} numberOfLines={3}>
        {item.questionText}
      </Text>
    </TouchableOpacity>
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
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
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
            {selectedSubject || selectedDifficulty !== 'all' || searchQuery ? (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSelectedSubject(null);
                  setSelectedDifficulty('all');
                  setSearchQuery('');
                }}
              >
                <Text style={styles.clearFiltersText}>清除筛选</Text>
                <Ionicons name="close-circle" size={16} color="#4A6FFF" />
              </TouchableOpacity>
            ) : null}
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color="#4A6FFF" style={styles.loadingIndicator} />
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
                onPress={() => {
                  setSelectedSubject(null);
                  setSelectedDifficulty('all');
                  setSearchQuery('');
                }}
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
});
