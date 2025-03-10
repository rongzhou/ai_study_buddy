import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';

export default function ReportsLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // 在组件挂载后标记导航已准备好
  useEffect(() => {
    setIsNavigationReady(true);
  }, []);

  // 只有在组件挂载后且用户未登录时才进行重定向
  useEffect(() => {
    if (isNavigationReady && !isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, isNavigationReady]);

  // 如果认证状态正在加载，先不渲染内容
  if (isLoading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#212529',
        headerTitleStyle: {
          fontFamily: 'PingFangSC-Medium',
        },
        headerShadowVisible: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '学习报告',
        }}
      />
    </Stack>
  );
}
