import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

// 定义各个标签页的图标
function TabBarIcon({
  name,
  color,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={24} name={name} color={color} />;
}

export default function TabsLayout() {
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
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#212529',
        headerTitleStyle: {
          fontFamily: 'PingFangSC-Medium',
        },
        headerShadowVisible: false,
        tabBarActiveTintColor: '#4A6FFF',
        tabBarInactiveTintColor: '#6C757D',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E9ECEF',
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'PingFangSC-Regular',
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => <TabBarIcon name="home-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          title: '拍照识题',
          tabBarIcon: ({ color }) => <TabBarIcon name="camera-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: '学习内容',
          tabBarIcon: ({ color }) => <TabBarIcon name="book-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '个人中心',
          tabBarIcon: ({ color }) => <TabBarIcon name="person-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
