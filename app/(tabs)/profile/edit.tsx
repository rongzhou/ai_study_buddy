import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../context/AuthContext';
import { UserRole, UpdateUserRequest } from '../../../types/user';
import { getLogger } from '../../../services/config';

// 获取日志记录器
const logger = getLogger('PROFILE_EDIT');

export default function EditProfileScreen() {
  const { user, updateProfile, isLoading } = useAuth();
  
  // 表单状态
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isFormChanged, setIsFormChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 从当前用户信息中加载初始数据
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setSchool(user.school || '');
      setGrade(user.grade || '');
      setAvatarUri(user.avatarUrl || null);
    }
  }, [user]);

  // 监听表单变化
  useEffect(() => {
    if (user) {
      const isChanged = 
        displayName !== user.displayName ||
        email !== user.email ||
        school !== user.school ||
        grade !== user.grade ||
        avatarUri !== user?.avatarUrl;
      
      setIsFormChanged(isChanged);
    }
  }, [displayName, email, school, grade, avatarUri, user]);

  // 处理头像选择
  const handleSelectAvatar = async () => {
    try {
      // 请求权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('权限错误', '需要访问相册权限来选择头像');
        return;
      }

      // 启动图片选择器
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      logger.error('选择头像错误:', error);
      Alert.alert('错误', '选择头像时出现错误');
    }
  };

  // 处理表单提交
  const handleSubmit = async () => {
    if (!isFormChanged || isSaving) return;
    
    setIsSaving(true);
    
    try {
      // 构建更新数据
      const updateData: UpdateUserRequest = {
        displayName: displayName.trim(),
        email: email.trim() || undefined,
        school: school.trim() || undefined,
        grade: grade.trim() || undefined,
        // 在实际应用中，这里需要先上传头像获取URL
        // 暂时只传递现有URI，后续可以优化
        avatarUrl: avatarUri || undefined,
      };
      
      logger.info('更新用户资料:', updateData);
      
      // 调用更新方法
      const success = await updateProfile(updateData);
      
      if (success) {
        Alert.alert('成功', '资料已更新', [
          { text: '确定', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('更新失败', '请检查您的输入并重试');
      }
    } catch (error) {
      logger.error('更新资料错误:', error);
      Alert.alert('错误', '更新资料时出现错误');
    } finally {
      setIsSaving(false);
    }
  };

  // 渲染不同角色可选择的年级选项
  const renderGradeOptions = () => {
    // 根据不同角色显示不同的年级选项
    if (user?.role === UserRole.STUDENT) {
      const grades = [
        '小学一年级', '小学二年级', '小学三年级', 
        '小学四年级', '小学五年级', '小学六年级',
        '初中一年级', '初中二年级', '初中三年级',
        '高中一年级', '高中二年级', '高中三年级'
      ];
      
      return (
        <View style={styles.gradeOptions}>
          {grades.map((g, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.gradeOption,
                grade === g && styles.selectedGradeOption
              ]}
              onPress={() => setGrade(g)}
            >
              <Text
                style={[
                  styles.gradeOptionText,
                  grade === g && styles.selectedGradeOptionText
                ]}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    
    // 非学生角色，只显示输入框
    return (
      <View style={styles.inputContainer}>
        <Ionicons name="school-outline" size={22} color="#4A6FFF" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="年级/教授课程"
          value={grade}
          onChangeText={setGrade}
          autoCorrect={false}
          placeholderTextColor="#9E9E9E"
        />
      </View>
    );
  };

  // 加载状态
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6FFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <StatusBar style="dark" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 头像区域 */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            <Image
              source={
                avatarUri
                  ? { uri: avatarUri }
                  : require('../../../assets/images/default-avatar.png')
              }
              style={styles.avatar}
            />
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={handleSelectAvatar}
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>点击编辑头像</Text>
        </View>
        
        {/* 表单 */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          
          {/* 昵称 */}
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={22} color="#4A6FFF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="昵称"
              value={displayName}
              onChangeText={setDisplayName}
              autoCorrect={false}
              placeholderTextColor="#9E9E9E"
            />
          </View>
          
          {/* 电子邮箱 */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={22} color="#4A6FFF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="电子邮箱 (可选)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              placeholderTextColor="#9E9E9E"
            />
          </View>
          
          {/* 学校/机构 */}
          <View style={styles.inputContainer}>
            <Ionicons name="business-outline" size={22} color="#4A6FFF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="学校/机构 (可选)"
              value={school}
              onChangeText={setSchool}
              autoCorrect={false}
              placeholderTextColor="#9E9E9E"
            />
          </View>
          
          {/* 年级 */}
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
            {user?.role === UserRole.STUDENT ? '年级' : '年级/教授课程'}
          </Text>
          {renderGradeOptions()}
          
          {/* 保存按钮 */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!isFormChanged || isSaving) && styles.saveButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!isFormChanged || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>保存修改</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarButton: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A6FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarHint: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Regular',
    color: '#6C757D',
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'PingFangSC-Medium',
    color: '#212529',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontFamily: 'PingFangSC-Regular',
    color: '#212529',
  },
  gradeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  gradeOption: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  selectedGradeOption: {
    backgroundColor: '#EBF1FF',
    borderColor: '#4A6FFF',
  },
  gradeOptionText: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Regular',
    color: '#212529',
  },
  selectedGradeOptionText: {
    color: '#4A6FFF',
    fontFamily: 'PingFangSC-Medium',
  },
  saveButton: {
    backgroundColor: '#4A6FFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'PingFangSC-Medium',
    color: '#FFFFFF',
  },
});