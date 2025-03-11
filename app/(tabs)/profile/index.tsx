import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { UserRole } from '../../../types/user';

// 设置选项类型
interface SettingOption {
  id: string;
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  type: 'toggle' | 'action' | 'link';
  value?: boolean;
  action?: () => void;
  linkTo?: string;
}

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuth();
  
  // 设置选项状态
  const [settings, setSettings] = useState<SettingOption[]>([
    {
      id: 'notification',
      title: '推送通知',
      icon: 'notifications-outline',
      iconColor: '#FF9500',
      type: 'toggle',
      value: true,
    },
    {
      id: 'darkMode',
      title: '深色模式',
      icon: 'moon-outline',
      iconColor: '#AF52DE',
      type: 'toggle',
      value: false,
    },
    {
      id: 'report',
      title: '学习报告',
      icon: 'analytics-outline',
      iconColor: '#34C759',
      type: 'link',
      linkTo: '/reports',
    },
    {
      id: 'favorites',
      title: '收藏题目',
      icon: 'bookmark-outline',
      iconColor: '#4A6FFF',
      type: 'link',
      linkTo: '/favorites',
    },
    {
      id: 'feedback',
      title: '问题反馈',
      icon: 'chatbubble-outline',
      iconColor: '#5AC8FA',
      type: 'action',
      action: () => {
        Alert.alert('功能提示', '问题反馈功能开发中，敬请期待！');
      },
    },
    {
      id: 'about',
      title: '关于我们',
      icon: 'information-circle-outline',
      iconColor: '#6C757D',
      type: 'action',
      action: () => {
        Alert.alert('关于智能学伴', '智能学伴是一款为中小学生设计的学习辅助应用，通过AI技术帮助学生解决学习难题。\n\n版本: 1.0.0\n\n© 2023 智能学伴团队. 保留所有权利。');
      },
    },
  ]);

  // 处理设置值变化
  const handleSettingChange = (id: string, newValue: boolean) => {
    setSettings(prevSettings => 
      prevSettings.map(setting => 
        setting.id === id ? { ...setting, value: newValue } : setting
      )
    );
  };

  // 处理编辑个人资料
  const handleEditProfile = () => {
    router.push('./edit');
  };

  // 处理退出登录
  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        { text: '确定', onPress: logout },
      ]
    );
  };

  // 获取用户角色文本
  const getRoleText = (role: UserRole) => {
    switch (role) {
      case UserRole.STUDENT:
        return '学生';
      case UserRole.PARENT:
        return '家长';
      case UserRole.TEACHER:
        return '教师';
      default:
        return '用户';
    }
  };

  // 渲染设置选项
  const renderSettingItem = (setting: SettingOption) => (
    <TouchableOpacity
      key={setting.id}
      style={styles.settingItem}
      onPress={() => {
        if (setting.type === 'action' && setting.action) {
          setting.action();
        } else if (setting.type === 'link' && setting.linkTo) {
          router.push(setting.linkTo as any);
        }
      }}
      disabled={setting.type === 'toggle'}
    >
      <View style={styles.settingIconContainer}>
        <Ionicons name={setting.icon} size={22} color={setting.iconColor} />
      </View>
      <Text style={styles.settingTitle}>{setting.title}</Text>
      
      {setting.type === 'toggle' ? (
        <Switch
          value={setting.value}
          onValueChange={(newValue) => handleSettingChange(setting.id, newValue)}
          trackColor={{ false: '#E9ECEF', true: '#4A6FFF' }}
          thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : setting.value ? '#FFFFFF' : '#F4F3F4'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#ADB5BD" />
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6FFF" />
        <Text style={styles.loadingText}>加载中...</Text>
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
        {/* 个人资料卡片 */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={user?.avatarUrl ? { uri: user.avatarUrl } : require('../../../assets/images/default-avatar.png')}
                style={styles.avatar}
              />
              <TouchableOpacity
                style={styles.editAvatarButton}
                onPress={handleEditProfile}
              >
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.userInfoContainer}>
              <Text style={styles.displayName}>{user?.displayName || '用户'}</Text>
              <View style={styles.roleContainer}>
                <Text style={styles.roleText}>
                  {user ? getRoleText(user.role) : '用户'}
                </Text>
              </View>
              {user?.grade && (
                <Text style={styles.gradeText}>{user.grade}</Text>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Ionicons name="create-outline" size={18} color="#4A6FFF" />
              <Text style={styles.editButtonText}>编辑</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>解题</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statLabel}>收藏</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>85%</Text>
              <Text style={styles.statLabel}>正确率</Text>
            </View>
          </View>
        </View>

        {/* 设置选项 */}
        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>设置</Text>
          <View style={styles.settingsList}>
            {settings.map(renderSettingItem)}
          </View>
        </View>

        {/* 退出登录按钮 */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>退出登录</Text>
        </TouchableOpacity>

        {/* 版本信息 */}
        <Text style={styles.versionText}>智能学伴 v1.0.0</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  editAvatarButton: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4A6FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfoContainer: {
    flex: 1,
  },
  displayName: {
    fontSize: 18,
    fontFamily: 'PingFangSC-Medium',
    color: '#212529',
    marginBottom: 4,
  },
  roleContainer: {
    backgroundColor: '#EBF1FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'PingFangSC-Medium',
    color: '#4A6FFF',
  },
  gradeText: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Regular',
    color: '#6C757D',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF1FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Medium',
    color: '#4A6FFF',
    marginLeft: 4,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'PingFangSC-Semibold',
    color: '#212529',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Regular',
    color: '#6C757D',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E9ECEF',
    alignSelf: 'center',
  },
  settingsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PingFangSC-Medium',
    color: '#212529',
    marginBottom: 16,
  },
  settingsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'PingFangSC-Regular',
    color: '#212529',
  },
  logoutButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  logoutButtonText: {
    fontSize: 16,
    fontFamily: 'PingFangSC-Medium',
    color: '#DC3545',
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'PingFangSC-Regular',
    color: '#ADB5BD',
    textAlign: 'center',
  },
});
