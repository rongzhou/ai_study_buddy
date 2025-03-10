import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { View, Text, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';

// 预加载字体
SplashScreen.preventAutoHideAsync();

// 根导航组件 - 根据认证状态条件渲染
function RootLayoutNav() {
  const { isLoading, isAuthenticated } = useAuth();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // 在组件挂载后标记导航已准备好
  useEffect(() => {
    setIsNavigationReady(true);
  }, []);

  // 如果正在加载认证状态，显示加载指示器
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4A6FFF" />
        <Text style={{ marginTop: 12, color: '#4A6FFF', fontFamily: 'PingFangSC-Medium' }}>
          加载中...
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
         {/* 移除 Fragment，直接使用条件渲染 */}
         {isAuthenticated ? (
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="(auth)"
            options={{ headerShown: false }}
          />
        )}
        <Stack.Screen
          name="analysis/[id]"
          options={{
            title: '题目解析',
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="reports"
          options={{
            title: '学习报告',
            presentation: 'card',
            headerShown: true,
          }}
        />
      </Stack>
    </>
  );
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

  // 包装根布局
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}