import React, { useEffect } from 'react';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { View, Text, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import { getLogger } from '../services/config';

// 获取日志记录器
const logger = getLogger('ROOT_LAYOUT');

// 预加载字体
SplashScreen.preventAutoHideAsync();

// 认证导航保护组件
function AuthenticationGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // 当认证状态或当前路径段发生变化时，检查导航
  useEffect(() => {
    if (isLoading) {
      // 仍在加载用户状态，不执行导航
      return;
    }

    // 获取第一个路径段，确定当前处于哪个导航栈
    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    logger.debug('Navigation check:', { 
      isAuthenticated, 
      inAuthGroup, 
      inTabsGroup, 
      segments 
    });

    if (isAuthenticated && inAuthGroup) {
      // 已登录用户试图访问认证页面，重定向到应用主页
      logger.info('Redirecting authenticated user to tabs');
      router.replace('/(tabs)');
    } else if (!isAuthenticated && !inAuthGroup && segments[0] !== undefined) {
      // 未登录用户试图访问需要认证的页面，重定向到登录页
      // 特殊情况：可能有些公共路由不需要认证，可以在这里添加例外
      logger.info('Redirecting unauthenticated user to login');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, segments]);

  // 如果正在加载用户状态，显示加载指示器
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4A6FFF" />
        <Text style={{ marginTop: 12, color: '#4A6FFF', fontFamily: 'PingFangSC-Medium' }}>
          正在初始化...
        </Text>
      </View>
    );
  }

  // 渲染子组件，通常是一个 <Slot />
  return <>{children}</>;
}

// 根布局组件
export default function RootLayout() {
  // 加载自定义字体
  const [fontsLoaded] = useFonts({
    'PingFangSC-Regular': require('../assets/fonts/PingFangSC-Regular.ttf'),
    'PingFangSC-Medium': require('../assets/fonts/PingFangSC-Medium.ttf'),
    'PingFangSC-Semibold': require('../assets/fonts/PingFangSC-Semibold.ttf'),
  });

  // 当字体加载完成时
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // 如果字体未加载完成，返回null
  if (!fontsLoaded) {
    return null;
  }

  // 完整的根布局：认证提供者 + 认证导航保护 + 路由插槽
  return (
    <AuthProvider>
      <AuthenticationGuard>
        <StatusBar style="auto" />
        <Slot />
      </AuthenticationGuard>
    </AuthProvider>
  );
}