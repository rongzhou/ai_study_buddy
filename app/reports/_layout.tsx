import { Stack } from 'expo-router';
import { getLogger } from '../../services/config';

// 获取日志记录器
const logger = getLogger('REPORTS_LAYOUT');

export default function ReportsLayout() {
  logger.debug('Rendering reports layout');
  
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