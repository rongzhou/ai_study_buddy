import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';

const SCREEN_WIDTH = Dimensions.get('window').width;

// 定义学习数据类型
interface LearningData {
  totalQuestions: number;
  correctQuestions: number;
  wrongQuestions: number;
  accuracy: number;
  weeklyData: {
    date: string;
    questions: number;
    correct: number;
  }[];
  subjectData: {
    subject: string;
    questions: number;
    correct: number;
    accuracy: number;
  }[];
  difficultyData: {
    difficulty: string;
    questions: number;
    correct: number;
    accuracy: number;
  }[];
  recentMistakes: {
    id: string;
    subject: string;
    questionText: string;
    difficulty: string;
    date: string;
  }[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

// 模拟学习数据
const mockLearningData: LearningData = {
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

// 获取难度颜色
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case '简单':
    case 'easy':
      return '#28A745';
    case '中等':
    case 'medium':
      return '#FFC107';
    case '困难':
    case 'hard':
      return '#DC3545';
    default:
      return '#6C757D';
  }
};

// 简单的条形图组件
const BarChart = ({
  data,
  valueKey,
  maxValue,
  barColor,
  barHeight = 16,
  showValue = true,
}: {
  data: any[];
  valueKey: string;
  maxValue: number;
  barColor: string;
  barHeight?: number;
  showValue?: boolean;
}) => {
  return (
    <View style={styles.barChartContainer}>
      {data.map((item, index) => (
        <View key={index} style={styles.barChartItem}>
          <View style={styles.barChartLabelContainer}>
            <Text style={styles.barChartLabel}>
              {item.subject || item.difficulty || item.date}
            </Text>
          </View>
          <View style={styles.barChartBarContainer}>
            <View
              style={[
                styles.barChartBar,
                {
                  width: `${(item[valueKey] / maxValue) * 100}%`,
                  height: barHeight,
                  backgroundColor: barColor,
                },
              ]}
            />
          </View>
          {showValue && (
            <Text style={styles.barChartValue}>{item[valueKey]}</Text>
          )}
        </View>
      ))}
    </View>
  );
};

// 学习报告页面
export default function ReportsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [learningData, setLearningData] = useState<LearningData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'subject' | 'recommend'>('overview');

  // 模拟加载数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // 模拟网络请求延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      setLearningData(mockLearningData);
      setLoading(false);
    };

    loadData();
  }, []);

  // 处理错题点击
  const handleMistakePress = (id: string) => {
    router.push(`/analysis/${id}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6FFF" />
        <Text style={styles.loadingText}>加载数据中...</Text>
      </View>
    );
  }

  if (!learningData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#DC3545" />
        <Text style={styles.errorText}>加载数据失败</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 概览卡片 */}
        <View style={styles.overviewCard}>
          <Text style={styles.cardTitle}>学习概览</Text>
          <View style={styles.statCirclesContainer}>
            <View style={styles.statCircle}>
              <Text style={styles.statCircleValue}>{learningData.totalQuestions}</Text>
              <Text style={styles.statCircleLabel}>总题目</Text>
            </View>
            <View style={styles.statCircle}>
              <Text style={[styles.statCircleValue, { color: '#28A745' }]}>
                {learningData.correctQuestions}
              </Text>
              <Text style={styles.statCircleLabel}>正确</Text>
            </View>
            <View style={styles.statCircle}>
              <Text style={[styles.statCircleValue, { color: '#DC3545' }]}>
                {learningData.wrongQuestions}
              </Text>
              <Text style={styles.statCircleLabel}>错误</Text>
            </View>
            <View style={[styles.statCircle, styles.accuracyCircle]}>
              <Text style={styles.accuracyValue}>{learningData.accuracy}%</Text>
              <Text style={styles.accuracyLabel}>正确率</Text>
            </View>
          </View>
        </View>

        {/* 选项卡 */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'overview' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('overview')}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'overview' && styles.activeTabButtonText,
              ]}
            >
              学习趋势
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'subject' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('subject')}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'subject' && styles.activeTabButtonText,
              ]}
            >
              学科分析
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'recommend' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('recommend')}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'recommend' && styles.activeTabButtonText,
              ]}
            >
              改进建议
            </Text>
          </TouchableOpacity>
        </View>

        {/* 学习趋势 */}
        {activeTab === 'overview' && (
          <View style={styles.contentCard}>
            <Text style={styles.sectionTitle}>每周学习情况</Text>
            <BarChart
              data={learningData.weeklyData}
              valueKey="questions"
              maxValue={Math.max(...learningData.weeklyData.map(d => d.questions))}
              barColor="#4A6FFF"
            />
            
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>难度分布</Text>
            <View style={styles.difficultyDistribution}>
              {learningData.difficultyData.map((item, index) => (
                <View key={index} style={styles.difficultyItem}>
                  <View
                    style={[
                      styles.difficultyDot,
                      { backgroundColor: getDifficultyColor(item.difficulty) },
                    ]}
                  />
                  <Text style={styles.difficultyItemText}>
                    {item.difficulty}: {item.questions}题 ({item.accuracy}%)
                  </Text>
                </View>
              ))}
            </View>
            
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>最近错题</Text>
            <View style={styles.mistakesList}>
              {learningData.recentMistakes.map(mistake => (
                <TouchableOpacity
                  key={mistake.id}
                  style={styles.mistakeItem}
                  onPress={() => handleMistakePress(mistake.id)}
                >
                  <View style={styles.mistakeHeader}>
                    <View style={styles.mistakeSubject}>
                      <Text style={styles.mistakeSubjectText}>{mistake.subject}</Text>
                    </View>
                    <View
                      style={[
                        styles.mistakeDifficulty,
                        { backgroundColor: getDifficultyColor(mistake.difficulty) },
                      ]}
                    >
                      <Text style={styles.mistakeDifficultyText}>
                        {mistake.difficulty === 'easy'
                          ? '简单'
                          : mistake.difficulty === 'medium'
                          ? '中等'
                          : '困难'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.mistakeText}>{mistake.questionText}</Text>
                  <Text style={styles.mistakeDate}>{mistake.date}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 学科分析 */}
        {activeTab === 'subject' && (
          <View style={styles.contentCard}>
            <Text style={styles.sectionTitle}>学科题目分布</Text>
            <BarChart
              data={learningData.subjectData}
              valueKey="questions"
              maxValue={Math.max(...learningData.subjectData.map(d => d.questions))}
              barColor="#4A6FFF"
            />
            
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>学科正确率</Text>
            <View style={styles.accuracyContainer}>
              {learningData.subjectData.map((subject, index) => (
                <View key={index} style={styles.subjectAccuracyItem}>
                  <View style={styles.subjectAccuracyHeader}>
                    <Text style={styles.subjectAccuracyName}>{subject.subject}</Text>
                    <Text
                      style={[
                        styles.subjectAccuracyValue,
                        { color: subject.accuracy >= 70 ? '#28A745' : '#DC3545' },
                      ]}
                    >
                      {subject.accuracy}%
                    </Text>
                  </View>
                  <View style={styles.accuracyBarContainer}>
                    <View
                      style={[
                        styles.accuracyBar,
                        {
                          width: `${subject.accuracy}%`,
                          backgroundColor:
                            subject.accuracy >= 70 ? '#28A745' : '#DC3545',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.subjectAccuracyStats}>
                    {subject.correct} / {subject.questions} 正确
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 改进建议 */}
        {activeTab === 'recommend' && (
          <View style={styles.contentCard}>
            <Text style={styles.sectionTitle}>你的优势</Text>
            <View style={styles.strengthsList}>
              {learningData.strengths.map((strength, index) => (
                <View key={index} style={styles.strengthItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#28A745" />
                  <Text style={styles.strengthText}>{strength}</Text>
                </View>
              ))}
            </View>
            
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>需要改进</Text>
            <View style={styles.weaknessesList}>
              {learningData.weaknesses.map((weakness, index) => (
                <View key={index} style={styles.weaknessItem}>
                  <Ionicons name="alert-circle" size={20} color="#DC3545" />
                  <Text style={styles.weaknessText}>{weakness}</Text>
                </View>
              ))}
            </View>
            
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>学习建议</Text>
            <View style={styles.recommendationsList}>
              {learningData.recommendations.map((recommendation, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Text style={styles.recommendationNumber}>{index + 1}</Text>
                  <Text style={styles.recommendationText}>{recommendation}</Text>
                </View>
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/learn')}
            >
              <Text style={styles.actionButtonText}>查看推荐题目</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'PingFangSC-Regular',
    color: '#6C757D',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'PingFangSC-Regular',
    color: '#6C757D',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4A6FFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'PingFangSC-Medium',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'PingFangSC-Medium',
    color: '#212529',
    marginBottom: 16,
  },
  statCirclesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCircle: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 64) / 4,
  },
  statCircleValue: {
    fontSize: 24,
    fontFamily: 'PingFangSC-Semibold',
    color: '#212529',
    marginBottom: 4,
  },
  statCircleLabel: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Regular',
    color: '#6C757D',
  },
  accuracyCircle: {
    backgroundColor: '#EBF1FF',
    borderRadius: 12,
    paddingVertical: 8,
    width: '100%',
    maxWidth: 80,
  },
  accuracyValue: {
    fontSize: 20,
    fontFamily: 'PingFangSC-Semibold',
    color: '#4A6FFF',
  },
  accuracyLabel: {
    fontSize: 12,
    fontFamily: 'PingFangSC-Regular',
    color: '#4A6FFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#EBF1FF',
  },
  tabButtonText: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Medium',
    color: '#6C757D',
  },
  activeTabButtonText: {
    color: '#4A6FFF',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'PingFangSC-Medium',
    color: '#212529',
    marginBottom: 16,
  },
  barChartContainer: {
    marginTop: 8,
  },
  barChartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barChartLabelContainer: {
    width: 40,
    marginRight: 12,
  },
  barChartLabel: {
    fontSize: 12,
    fontFamily: 'PingFangSC-Regular',
    color: '#6C757D',
  },
  barChartBarContainer: {
    flex: 1,
    height: 16,
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  barChartBar: {
    height: '100%',
    borderRadius: 8,
  },
  barChartValue: {
    fontSize: 12,
    fontFamily: 'PingFangSC-Medium',
    color: '#212529',
    marginLeft: 8,
    width: 24,
    textAlign: 'right',
  },
  difficultyDistribution: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  difficultyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  difficultyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  difficultyItemText: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Regular',
    color: '#212529',
  },
  mistakesList: {
    marginTop: 8,
  },
  mistakeItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  mistakeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mistakeSubject: {
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  mistakeSubjectText: {
    fontSize: 12,
    fontFamily: 'PingFangSC-Medium',
    color: '#495057',
  },
  mistakeDifficulty: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  mistakeDifficultyText: {
    fontSize: 12,
    fontFamily: 'PingFangSC-Medium',
    color: '#FFFFFF',
  },
  mistakeText: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Regular',
    color: '#212529',
    marginBottom: 8,
  },
  mistakeDate: {
    fontSize: 12,
    fontFamily: 'PingFangSC-Regular',
    color: '#ADB5BD',
    textAlign: 'right',
  },
  accuracyContainer: {
    marginTop: 8,
  },
  subjectAccuracyItem: {
    marginBottom: 16,
  },
  subjectAccuracyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  subjectAccuracyName: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Medium',
    color: '#212529',
  },
  subjectAccuracyValue: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Semibold',
  },
  accuracyBarContainer: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  accuracyBar: {
    height: '100%',
    borderRadius: 4,
  },
  subjectAccuracyStats: {
    fontSize: 12,
    fontFamily: 'PingFangSC-Regular',
    color: '#6C757D',
    textAlign: 'right',
  },
  strengthsList: {
    marginTop: 8,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  strengthText: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Regular',
    color: '#212529',
    marginLeft: 12,
    flex: 1,
  },
  weaknessesList: {
    marginTop: 8,
  },
  weaknessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weaknessText: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Regular',
    color: '#212529',
    marginLeft: 12,
    flex: 1,
  },
  recommendationsList: {
    marginTop: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  recommendationNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4A6FFF',
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PingFangSC-Medium',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  recommendationText: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Regular',
    color: '#212529',
    flex: 1,
    lineHeight: 22,
  },
  actionButton: {
    backgroundColor: '#4A6FFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Medium',
    color: '#FFFFFF',
    marginRight: 8,
  },
});
