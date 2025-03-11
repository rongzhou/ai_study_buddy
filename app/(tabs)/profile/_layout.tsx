import { Stack } from 'expo-router';
import { getLogger } from '../../../services/config';

// 获取日志记录器
const logger = getLogger('PROFILE_LAYOUT');

export default function ProfileLayout() {
  logger.debug('Rendering profile layout');
  
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
      {/* 注意：这里不要包含'index'作为名称，因为它已经由父级tabs处理了 */}
      <Stack.Screen
        name="edit"
        options={{
          title: '编辑资料',
        }}
      />
      {/* 将来可以在这里添加更多profile相关页面 */}
    </Stack>
  );
}