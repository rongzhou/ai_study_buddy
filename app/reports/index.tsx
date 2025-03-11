import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { 
  analyticsService, 
  LearningReport 
} from '../../services/analytics';
import { getLogger } from '../../services/config';

// 获取日志记录器
const logger = getLogger('REPORTS_SCREEN');

const SCREEN_WIDTH = Dimensions.get('window').width;

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
  const [learningData, setLearningData] = useState<LearningReport | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'subject' | 'recommend'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 使用analyticsService获取学习报告
        const report = await analyticsService.getLearningReport();
        setLearningData(report);
        logger.info('Learning report loaded successfully');
      } catch (error) {
        logger.error('Error loading learning report:', error);
        Alert.alert(
          '加载失败', 
          error instanceof Error ? error.message : '获取报告数据失败，请重试'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 处理错题点击
  const handleMistakePress = (id: string) => {
    router.push(`/analysis/${id}`);
  };

  // 处理刷新
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // 强制刷新数据
      const report = await analyticsService.getLearningReport(true);
      setLearningData(report);
      logger.info('Learning report refreshed successfully');
    } catch (error) {
      logger.error('Error refreshing learning report:', error);
      Alert.alert(
        '刷新失败', 
        error instanceof Error ? error.message : '刷新报告数据失败，请重试'
      );
    } finally {
      setRefreshing(false);
    }
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4A6FFF']} />
        }
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
