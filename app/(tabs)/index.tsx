import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// 模拟历史题目数据（实际应用中应从API获取）
const mockHistoryQuestions = [
  {
    id: '1',
    subject: '数学',
    title: '多项式因式分解',
    createdAt: '2023-03-08T12:30:00Z',
    content: 'x² - 9 = (x+3)(x-3)',
    difficulty: 'medium',
  },
  {
    id: '2',
    subject: '物理',
    title: '牛顿第二定律',
    createdAt: '2023-03-07T14:20:00Z',
    content: 'F = ma，其中F是力，m是质量，a是加速度',
    difficulty: 'hard',
  },
  {
    id: '3',
    subject: '语文',
    title: '古诗词赏析',
    createdAt: '2023-03-06T10:15:00Z',
    content: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
    difficulty: 'easy',
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

// 格式化日期时间
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

export default function HomeScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [historyQuestions, setHistoryQuestions] = useState(mockHistoryQuestions);
  const [loading, setLoading] = useState(false);

  // 处理下拉刷新
  const onRefresh = async () => {
    setRefreshing(true);
    
    // 在实际应用中，这里应该从API获取最新数据
    // 模拟网络请求
    setTimeout(() => {
      // 重新排序历史题目（模拟获取新数据）
      setHistoryQuestions([...historyQuestions].sort(() => 0.5 - Math.random()));
      setRefreshing(false);
    }, 1500);
  };

  // 跳转到拍照识题页面
  const handleCapturePress = () => {
    router.push('/(tabs)/capture');
  };

  // 跳转到学习报告页面
  const handleReportPress = () => {
    router.push('/reports');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A6FFF']} />
        }
      >
        {/* 欢迎区域 */}
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeText}>
              你好，<Text style={styles.username}>{user?.displayName || '同学'}</Text>
            </Text>
            <Text style={styles.welcomeSubtext}>今天想学习什么？</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Image 
              source={user?.avatarUrl ? { uri: user.avatarUrl } : require('../../assets/images/default-avatar.png')} 
              style={styles.avatar}
            />
          </View>
        </View>

        {/* 快捷操作区域 */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={handleCapturePress}
          >
            <View style={styles.quickActionIconContainer}>
              <Ionicons name="camera-outline" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.quickActionText}>拍照识题</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={handleReportPress}
          >
            <View style={[styles.quickActionIconContainer, { backgroundColor: '#34C759' }]}>
              <Ionicons name="analytics-outline" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.quickActionText}>学习报告</Text>
          </TouchableOpacity>

          <Link href="/(tabs)/learn" asChild>
            <TouchableOpacity style={styles.quickActionButton}>
              <View style={[styles.quickActionIconContainer, { backgroundColor: '#FF9500' }]}>
                <Ionicons name="book-outline" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>学习内容</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* 历史记录区域 */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>历史题目</Text>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>查看全部</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#4A6FFF" style={styles.loadingIndicator} />
          ) : historyQuestions.length > 0 ? (
            <View style={styles.historyList}>
              {historyQuestions.map((question) => (
                <Link key={question.id} href={`/analysis/${question.id}`} asChild>
                  <TouchableOpacity style={styles.historyItem}>
                    <View style={styles.historyItemHeader}>
                      <View style={styles.historyItemSubject}>
                        <Text style={styles.subjectText}>{question.subject}</Text>
                      </View>
                      <View 
                        style={[
                          styles.difficultyTag, 
                          { backgroundColor: getDifficultyColor(question.difficulty) }
                        ]}
                      >
                        <Text style={styles.difficultyText}>
                          {getDifficultyText(question.difficulty)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.historyItemTitle}>{question.title}</Text>
                    <Text style={styles.historyItemContent} numberOfLines={2}>
                      {question.content}
                    </Text>
                    <Text style={styles.historyItemDate}>
                      {formatDate(question.createdAt)}
                    </Text>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#E9ECEF" />
              <Text style={styles.emptyText}>暂无历史题目</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={handleCapturePress}
              >
                <Text style={styles.emptyButtonText}>立即拍照识题</Text>
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
  },
  welcomeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: 'PingFangSC-Medium',
    color: '#212529',
    marginBottom: 4,
  },
  username: {
    fontFamily: 'PingFangSC-Semibold',
    color: '#4A6FFF',
  },
  welcomeSubtext: {
    fontSize: 16,
    fontFamily: 'PingFangSC-Regular',
    color: '#6C757D',
  },
  avatarContainer: {
    marginLeft: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#4A6FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Medium',
    color: '#212529',
  },
  sectionContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PingFangSC-Medium',
    color: '#212529',
  },
  sectionAction: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Regular',
    color: '#4A6FFF',
  },
  loadingIndicator: {
    marginVertical: 24,
  },
  historyList: {
    marginTop: 8,
  },
  historyItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyItemSubject: {
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
  historyItemTitle: {
    fontSize: 16,
    fontFamily: 'PingFangSC-Medium',
    color: '#212529',
    marginBottom: 8,
  },
  historyItemContent: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Regular',
    color: '#6C757D',
    marginBottom: 12,
    lineHeight: 20,
  },
  historyItemDate: {
    fontSize: 12,
    fontFamily: 'PingFangSC-Regular',
    color: '#ADB5BD',
    textAlign: 'right',
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
  emptyButton: {
    backgroundColor: '#4A6FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Medium',
    color: '#FFFFFF',
  },
});
