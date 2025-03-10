import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { analysisService, QuestionAnalysisResult, SolutionStep, KnowledgePoint, RelatedResource } from '../../services/analysis';

const SCREEN_WIDTH = Dimensions.get('window').width;

// 模拟题目分析结果（实际应从API获取）
const mockAnalysisResult: QuestionAnalysisResult = {
  questionId: 'q123',
  questionText: '求解方程: x² - 5x + 6 = 0',
  questionLatex: 'x^2 - 5x + 6 = 0',
  subject: '数学',
  difficulty: 'medium',
  solutionSteps: [
    {
      id: 's1',
      stepNumber: 1,
      content: '使用因式分解法，我们需要找到两个数，它们的和为-5，积为6',
      latex: '',
    },
    {
      id: 's2',
      stepNumber: 2,
      content: '这两个数是-2和-3，因为(-2) + (-3) = -5，且(-2) × (-3) = 6',
      latex: '',
    },
    {
      id: 's3',
      stepNumber: 3,
      content: '因此，方程可以重写为: (x - 2)(x - 3) = 0',
      latex: '(x - 2)(x - 3) = 0',
    },
    {
      id: 's4',
      stepNumber: 4,
      content: '当两个因子的乘积为0时，至少有一个因子必须为0',
      latex: '',
    },
    {
      id: 's5',
      stepNumber: 5,
      content: 'x - 2 = 0 或 x - 3 = 0',
      latex: 'x - 2 = 0 \\quad \\text{或} \\quad x - 3 = 0',
    },
    {
      id: 's6',
      stepNumber: 6,
      content: 'x = 2 或 x = 3',
      latex: 'x = 2 \\quad \\text{或} \\quad x = 3',
    },
  ],
  explanation: '这是一个可以使用因式分解法解决的二次方程。通过找到两个和为-5，积为6的数(-2和-3)，我们可以将方程重写为(x-2)(x-3)=0。然后利用零乘性质，当两个因子的乘积为0时，至少有一个因子等于0，从而得到x=2或x=3。',
  knowledgePoints: [
    {
      id: 'kp1',
      name: '二次方程',
      description: '含有未知数的二次项的方程',
      difficulty: 'medium',
    },
    {
      id: 'kp2',
      name: '因式分解',
      description: '将代数式分解为若干因式的乘积',
      difficulty: 'medium',
    },
    {
      id: 'kp3',
      name: '零乘性质',
      description: '如果a×b=0，那么a=0或b=0',
      difficulty: 'easy',
    },
  ],
  relatedResources: [
    {
      id: 'r1',
      title: '因式分解法解二次方程',
      type: 'video',
      url: 'https://example.com/video1',
      thumbnail: 'https://example.com/thumbnail1.jpg',
    },
    {
      id: 'r2',
      title: '二次方程综合练习',
      type: 'exercise',
      url: 'https://example.com/exercise1',
    },
    {
      id: 'r3',
      title: '二次方程的应用',
      type: 'article',
      url: 'https://example.com/article1',
    },
  ],
  createdAt: '2023-03-09T10:30:00Z',
};

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

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

// 知识点标签组件
const KnowledgeTag = ({ knowledgePoint }: { knowledgePoint: KnowledgePoint }) => (
  <TouchableOpacity
    style={[
      styles.knowledgeTag,
      { borderColor: getDifficultyColor(knowledgePoint.difficulty) }
    ]}
  >
    <Text style={styles.knowledgeTagText}>{knowledgePoint.name}</Text>
  </TouchableOpacity>
);

// 解题步骤组件
const SolutionStepItem = ({ step, isLast }: { step: SolutionStep; isLast: boolean }) => (
  <View style={styles.stepContainer}>
    <View style={styles.stepNumberContainer}>
      <Text style={styles.stepNumber}>{step.stepNumber}</Text>
    </View>
    <View style={styles.stepContent}>
      <Text style={styles.stepText}>{step.content}</Text>
      {step.latex && (
        <View style={styles.latexContainer}>
          <Text style={styles.latexText}>{step.latex}</Text>
        </View>
      )}
      {!isLast && <View style={styles.stepConnector} />}
    </View>
  </View>
);

// 相关资源卡片组件
const ResourceCard = ({ resource }: { resource: RelatedResource }) => {
  const getIconName = () => {
    switch (resource.type) {
      case 'video':
        return 'videocam-outline';
      case 'article':
        return 'document-text-outline';
      case 'exercise':
        return 'create-outline';
      default:
        return 'link-outline';
    }
  };

  return (
    <TouchableOpacity style={styles.resourceCard}>
      <View style={styles.resourceIconContainer}>
        <Ionicons name={getIconName()} size={24} color="#4A6FFF" />
      </View>
      <View style={styles.resourceContent}>
        <Text style={styles.resourceTitle}>{resource.title}</Text>
        <Text style={styles.resourceType}>
          {resource.type === 'video' ? '视频教程' : 
           resource.type === 'article' ? '文章讲解' : '练习题'}
        </Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={20} color="#ADB5BD" />
    </TouchableOpacity>
  );
};

export default function AnalysisDetailScreen() {
  const params = useLocalSearchParams();
  const taskId = typeof params.id === 'string' ? params.id : '';
  
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<QuestionAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'solution' | 'knowledge' | 'resources'>('solution');

  // 加载分析结果
  useEffect(() => {
    const fetchAnalysisResult = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 实际应用中，应该使用任务ID获取真实数据
        // const result = await analysisService.pollAnalysisResult(
        //   taskId,
        //   15,
        //   2000,
        //   (status, currentProgress) => {
        //     if (currentProgress) {
        //       setProgress(currentProgress);
        //     }
        //   }
        // );
        
        // 模拟加载
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 使用模拟数据
        setAnalysisResult(mockAnalysisResult);
      } catch (err) {
        console.error('加载分析结果错误:', err);
        setError(err instanceof Error ? err.message : '加载分析结果失败');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisResult();
  }, [taskId]);

  // 处理收藏
  const handleFavorite = () => {
    // 实现收藏功能
    Alert.alert('提示', '收藏成功');
  };

  // 处理分享
  const handleShare = () => {
    // 实现分享功能
    Alert.alert('提示', '分享功能即将上线');
  };

  // 处理练习更多题目
  const handleMoreExercises = () => {
    // 跳转到相似题目页面
    router.push('/(tabs)/learn');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen 
        options={{
          title: '题目解析',
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleFavorite}
              >
                <Ionicons name="bookmark-outline" size={22} color="#212529" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={22} color="#212529" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A6FFF" />
          <Text style={styles.loadingText}>正在分析题目... {progress > 0 ? `${Math.round(progress)}%` : ''}</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#DC3545" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>返回重试</Text>
          </TouchableOpacity>
        </View>
      ) : analysisResult ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 题目卡片 */}
          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.subjectContainer}>
                <Text style={styles.subjectText}>{analysisResult.subject}</Text>
              </View>
              <View
                style={[
                  styles.difficultyTag,
                  { backgroundColor: getDifficultyColor(analysisResult.difficulty) }
                ]}
              >
                <Text style={styles.difficultyText}>
                  {getDifficultyText(analysisResult.difficulty)}
                </Text>
              </View>
            </View>
            
            <Text style={styles.questionTitle}>题目</Text>
            <Text style={styles.questionText}>{analysisResult.questionText}</Text>
            
            {analysisResult.questionLatex && (
              <View style={styles.latexContainer}>
                <Text style={styles.latexText}>{analysisResult.questionLatex}</Text>
              </View>
            )}
            
            <Text style={styles.createdAt}>
              解析时间: {formatDate(analysisResult.createdAt)}
            </Text>
          </View>

          {/* 内容选项卡 */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeSection === 'solution' && styles.activeTabButton
              ]}
              onPress={() => setActiveSection('solution')}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeSection === 'solution' && styles.activeTabButtonText
                ]}
              >
                解题步骤
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeSection === 'knowledge' && styles.activeTabButton
              ]}
              onPress={() => setActiveSection('knowledge')}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeSection === 'knowledge' && styles.activeTabButtonText
                ]}
              >
                知识点
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeSection === 'resources' && styles.activeTabButton
              ]}
              onPress={() => setActiveSection('resources')}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeSection === 'resources' && styles.activeTabButtonText
                ]}
              >
                学习资源
              </Text>
            </TouchableOpacity>
          </View>

          {/* 解题步骤部分 */}
          {activeSection === 'solution' && (
            <View style={styles.sectionContainer}>
              {analysisResult.solutionSteps.map((step, index) => (
                <SolutionStepItem
                  key={step.id}
                  step={step}
                  isLast={index === analysisResult.solutionSteps.length - 1}
                />
              ))}
              
              <View style={styles.explanationContainer}>
                <Text style={styles.explanationTitle}>解题思路</Text>
                <Text style={styles.explanationText}>{analysisResult.explanation}</Text>
              </View>
            </View>
          )}

          {/* 知识点部分 */}
          {activeSection === 'knowledge' && (
            <View style={styles.sectionContainer}>
              <View style={styles.knowledgeTagsContainer}>
                {analysisResult.knowledgePoints.map(kp => (
                  <KnowledgeTag key={kp.id} knowledgePoint={kp} />
                ))}
              </View>
              
              <View style={styles.knowledgeDetailsContainer}>
                {analysisResult.knowledgePoints.map(kp => (
                  <View key={kp.id} style={styles.knowledgeDetail}>
                    <View style={styles.knowledgeDetailHeader}>
                      <Text style={styles.knowledgeDetailTitle}>{kp.name}</Text>
                      <View
                        style={[
                          styles.difficultyTag,
                          { backgroundColor: getDifficultyColor(kp.difficulty) }
                        ]}
                      >
                        <Text style={styles.difficultyText}>
                          {getDifficultyText(kp.difficulty)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.knowledgeDetailDescription}>
                      {kp.description}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 学习资源部分 */}
          {activeSection === 'resources' && (
            <View style={styles.sectionContainer}>
              <View style={styles.resourcesContainer}>
                {analysisResult.relatedResources.map(resource => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </View>
              
              <TouchableOpacity
                style={styles.moreExercisesButton}
                onPress={handleMoreExercises}
              >
                <Text style={styles.moreExercisesButtonText}>查看更多相关练习</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    textAlign: 'center',
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
  questionCard: {
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
  questionHeader: {
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
  questionTitle: {
    fontSize: 16,
    fontFamily: 'PingFangSC-Medium',
    color: '#212529',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    fontFamily: 'PingFangSC-Regular',
    color: '#212529',
    lineHeight: 24,
    marginBottom: 12,
  },
  latexContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  latexText: {
    fontSize: 16,
    fontFamily: 'PingFangSC-Regular',
    color: '#212529',
  },
  createdAt: {
    fontSize: 12,
    fontFamily: 'PingFangSC-Regular',
    color: '#ADB5BD',
    textAlign: 'right',
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
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4A6FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumber: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Medium',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
    position: 'relative',
  },
  stepConnector: {
    position: 'absolute',
    left: -18,
    top: 28,
    bottom: -8,
    width: 2,
    backgroundColor: '#E9ECEF',
  },
  stepText: {
    fontSize: 15,
    fontFamily: 'PingFangSC-Regular',
    color: '#212529',
    lineHeight: 22,
    marginBottom: 8,
  },
  explanationContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4A6FFF',
  },
  explanationTitle: {
    fontSize: 16,
    fontFamily: 'PingFangSC-Medium',
    color: '#212529',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Regular',
    color: '#495057',
    lineHeight: 22,
  },
  knowledgeTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  knowledgeTag: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  knowledgeTagText: {
    fontSize: 12,
    fontFamily: 'PingFangSC-Medium',
    color: '#212529',
  },
  knowledgeDetailsContainer: {
    marginTop: 8,
  },
  knowledgeDetail: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  knowledgeDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  knowledgeDetailTitle: {
    fontSize: 16,
    fontFamily: 'PingFangSC-Medium',
    color: '#212529',
  },
  knowledgeDetailDescription: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Regular',
    color: '#495057',
    lineHeight: 20,
  },
  resourcesContainer: {
    marginBottom: 16,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  resourceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Medium',
    color: '#212529',
    marginBottom: 4,
  },
  resourceType: {
    fontSize: 12,
    fontFamily: 'PingFangSC-Regular',
    color: '#6C757D',
  },
  moreExercisesButton: {
    backgroundColor: '#4A6FFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreExercisesButtonText: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Medium',
    color: '#FFFFFF',
    marginRight: 8,
  },
});
