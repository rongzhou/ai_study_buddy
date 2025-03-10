import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '../../types/user';

export default function RegisterScreen() {
  // 从认证上下文获取状态和方法
  const { register, isLoading, error, clearError } = useAuth();

  // 表单状态
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [grade, setGrade] = useState('');
  const [school, setSchool] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // 当表单字段变化时，更新表单有效性
  useEffect(() => {
    const isValid =
      username.trim().length > 0 &&
      password.length >= 6 &&
      password === confirmPassword &&
      displayName.trim().length > 0;
    
    setIsFormValid(isValid);
  }, [username, password, confirmPassword, displayName]);

  // 处理注册
  const handleRegister = async () => {
    if (isFormValid) {
      const userData = {
        username,
        password,
        confirmPassword,
        displayName,
        email: email.trim() || undefined,
        role,
        grade: grade.trim() || undefined,
        school: school.trim() || undefined,
        preferences: {
          favoriteSubjects: []
        }
      };

      await register(userData);
    }
  };

  // 显示错误提示
  useEffect(() => {
    if (error) {
      Alert.alert('注册失败', error, [
        { text: '确定', onPress: clearError },
      ]);
    }
  }, [error, clearError]);

  // 可选择的年级
  const grades = [
    '小学一年级', '小学二年级', '小学三年级', 
    '小学四年级', '小学五年级', '小学六年级',
    '初中一年级', '初中二年级', '初中三年级',
    '高中一年级', '高中二年级', '高中三年级'
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar style="dark" />
      <Stack.Screen options={{ title: '注册账号' }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          
          {/* 用户名 */}
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={22} color="#4A6FFF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="用户名"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#9E9E9E"
            />
          </View>

          {/* 密码 */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={22} color="#4A6FFF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="密码 (至少6位)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#9E9E9E"
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={22}
                color="#9E9E9E"
              />
            </TouchableOpacity>
          </View>

          {/* 确认密码 */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={22} color="#4A6FFF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="确认密码"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#9E9E9E"
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                size={22}
                color="#9E9E9E"
              />
            </TouchableOpacity>
          </View>

          {/* 昵称 */}
          <View style={styles.inputContainer}>
            <Ionicons name="text-outline" size={22} color="#4A6FFF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="昵称"
              value={displayName}
              onChangeText={setDisplayName}
              autoCorrect={false}
              placeholderTextColor="#9E9E9E"
            />
          </View>

          {/* 电子邮箱 (可选) */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={22} color="#4A6FFF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="电子邮箱 (可选)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholderTextColor="#9E9E9E"
            />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>身份信息</Text>

          {/* 角色选择 */}
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === UserRole.STUDENT && styles.roleButtonActive
              ]}
              onPress={() => setRole(UserRole.STUDENT)}
            >
              <Ionicons 
                name="school-outline" 
                size={24} 
                color={role === UserRole.STUDENT ? "#FFFFFF" : "#4A6FFF"} 
              />
              <Text 
                style={[
                  styles.roleText,
                  role === UserRole.STUDENT && styles.roleTextActive
                ]}
              >
                学生
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                role === UserRole.PARENT && styles.roleButtonActive
              ]}
              onPress={() => setRole(UserRole.PARENT)}
            >
              <Ionicons 
                name="people-outline" 
                size={24} 
                color={role === UserRole.PARENT ? "#FFFFFF" : "#4A6FFF"} 
              />
              <Text 
                style={[
                  styles.roleText,
                  role === UserRole.PARENT && styles.roleTextActive
                ]}
              >
                家长
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                role === UserRole.TEACHER && styles.roleButtonActive
              ]}
              onPress={() => setRole(UserRole.TEACHER)}
            >
              <Ionicons 
                name="book-outline" 
                size={24} 
                color={role === UserRole.TEACHER ? "#FFFFFF" : "#4A6FFF"} 
              />
              <Text 
                style={[
                  styles.roleText,
                  role === UserRole.TEACHER && styles.roleTextActive
                ]}
              >
                教师
              </Text>
            </TouchableOpacity>
          </View>

          {/* 年级 (学生) */}
          {role === UserRole.STUDENT && (
            <View style={styles.inputContainer}>
              <Ionicons name="school-outline" size={22} color="#4A6FFF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="年级"
                value={grade}
                onChangeText={setGrade}
                autoCorrect={false}
                placeholderTextColor="#9E9E9E"
              />
            </View>
          )}

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

          {/* 注册按钮 */}
          <TouchableOpacity
            style={[styles.registerButton, !isFormValid && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.registerButtonText}>创建账号</Text>
            )}
          </TouchableOpacity>

          {/* 登录链接 */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>已有账号？</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>返回登录</Text>
              </TouchableOpacity>
            </Link>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  formContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
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
  passwordToggle: {
    padding: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    flexDirection: 'row',
    marginHorizontal: 4,
  },
  roleButtonActive: {
    backgroundColor: '#4A6FFF',
    borderColor: '#4A6FFF',
  },
  roleText: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Medium',
    color: '#4A6FFF',
    marginLeft: 8,
  },
  roleTextActive: {
    color: '#FFFFFF',
  },
  registerButton: {
    backgroundColor: '#4A6FFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  registerButtonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  registerButtonText: {
    fontSize: 18,
    fontFamily: 'PingFangSC-Medium',
    color: '#FFFFFF',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Regular',
    color: '#6C757D',
  },
  loginLink: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Medium',
    color: '#4A6FFF',
    marginLeft: 4,
  },
});
