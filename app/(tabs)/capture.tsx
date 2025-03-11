import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Camera, CameraType, CameraView } from 'expo-camera';
import { FlashMode } from 'expo-camera/build/Camera.types';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { imageService } from '../../services/image';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function CaptureScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  // 请求相机权限
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      // 请求相册权限
      if (Platform.OS !== 'web') {
        const { status: mediaLibraryStatus } = 
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (mediaLibraryStatus !== 'granted') {
          Alert.alert(
            '需要权限',
            '需要相册权限才能从相册中选择图片。',
            [{ text: '确定' }]
          );
        }
      }
    })();
  }, []);

  // 切换相机类型（前置/后置）
  const toggleCameraType = () => {
    setCameraType(
      cameraType === 'back' ? 'front' : 'back'
    );
  };

  // 切换闪光灯模式
  const toggleFlashMode = () => {
    setFlashMode(
      flashMode === 'off' ? 'on' : 'off'
    );
  };

  // 拍摄照片
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });
        
        if (photo?.uri) {
          setCapturedImage(photo.uri);
          setIsPreview(true);
        }
      } catch (error) {
        console.error('拍照错误:', error);
        Alert.alert('错误', '拍照失败，请重试。');
      }
    }
  };

  // 从相册选择图片
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImage(result.assets[0].uri);
        setIsPreview(true);
      }
    } catch (error) {
      console.error('选择图片错误:', error);
      Alert.alert('错误', '选择图片失败，请重试。');
    }
  };

  // 处理图像分析
  const handleImageAnalysis = async () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);
    setUploadProgress(0);
    
    try {
      // 上传图像，使用我们的 imageService
      const response = await imageService.uploadImage(
        capturedImage,
        (progress) => setUploadProgress(progress)
      );
      
      // 上传成功后，导航到结果页面
      setIsProcessing(false);
      router.push(`/analysis/${response.taskId}`);
    } catch (error) {
      console.error('图像处理错误:', error);
      Alert.alert('错误', error instanceof Error ? error.message : '图像处理失败，请重试。');
      setIsProcessing(false);
    }
  };

  // 取消预览，返回相机
  const cancelPreview = () => {
    setCapturedImage(null);
    setIsPreview(false);
  };

  // 渲染相机权限检查
  if (hasPermission === null) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#4A6FFF" />
        <Text style={styles.permissionText}>检查相机权限中...</Text>
      </View>
    );
  }

  // 渲染权限被拒绝的情况
  if (hasPermission === false) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="camera-outline" size={48} color="#6C757D" />
        <Text style={styles.permissionText}>没有相机权限</Text>
        <Text style={styles.permissionSubtext}>
          请在设备设置中允许应用访问相机
        </Text>
      </View>
    );
  }

  // 渲染图像预览
  if (isPreview && capturedImage) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: capturedImage }}
            style={styles.previewImage}
            resizeMode="contain"
          />
          
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.processingText}>
                正在处理... {uploadProgress}%
              </Text>
            </View>
          ) : (
            <View style={styles.previewControls}>
              <TouchableOpacity
                style={styles.previewButton}
                onPress={cancelPreview}
                disabled={isProcessing}
              >
                <Ionicons name="close-outline" size={26} color="#FFFFFF" />
                <Text style={styles.previewButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.previewButton, styles.confirmButton]}
                onPress={handleImageAnalysis}
                disabled={isProcessing}
              >
                <Ionicons name="checkmark-outline" size={26} color="#FFFFFF" />
                <Text style={styles.previewButtonText}>使用</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  // 渲染相机视图
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
      >
        <View style={styles.cameraControls}>
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleFlashMode}
            >
              <Ionicons
                name={flashMode === 'on' ? 'flash' : 'flash-off'}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleCameraType}
            >
              <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.bottomControls}>
            <View style={styles.captureContainer}>
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={pickImage}
              >
                <Ionicons name="images-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              
              <View style={styles.emptySpace} />
            </View>
            
            <View style={styles.hintContainer}>
              <Text style={styles.hintText}>
                对准题目，点击拍照按钮
              </Text>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    fontFamily: 'PingFangSC-Medium',
    color: '#212529',
    marginTop: 16,
  },
  permissionSubtext: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Regular',
    color: '#6C757D',
    marginTop: 8,
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  captureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  galleryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  emptySpace: {
    width: 44,
  },
  hintContainer: {
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    fontFamily: 'PingFangSC-Regular',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.33, // 4:3 比例
  },
  previewControls: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 24,
    left: 0,
    right: 0,
    justifyContent: 'space-around',
    paddingHorizontal: 32,
  },
  previewButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: 'rgba(74, 111, 255, 0.8)',
  },
  previewButtonText: {
    fontSize: 16,
    fontFamily: 'PingFangSC-Medium',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  processingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 24,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 32,
  },
  processingText: {
    fontSize: 16,
    fontFamily: 'PingFangSC-Medium',
    color: '#FFFFFF',
    marginTop: 12,
  },
});
