import { useState } from 'react';
import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const FOOD_IMAGE_QUALITY = 0.4;
const OCR_IMAGE_QUALITY = 0.5;

export interface PickResult {
  base64: string;
  uri: string;
}

export function toBase64(uri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (uri.startsWith('data:')) {
      const base64 = uri.includes('base64,') ? uri.split('base64,')[1] : uri;
      resolve(base64);
      return;
    }
    const reader = new FileReader();
    fetch(uri)
      .then(res => res.blob())
      .then(blob => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.includes('base64,') ? result.split('base64,')[1] : result;
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });
}

export function useImagePicker() {
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);
  const isWeb = Platform.OS === 'web';

  const pickImage = async (quality: number = FOOD_IMAGE_QUALITY): Promise<PickResult | null> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality,
        base64: !isWeb,
      });

      if (result.canceled || !result.assets?.[0]) return null;

      const asset = result.assets[0];
      let base64: string;
      if (asset.base64) {
        base64 = asset.base64;
      } else if (isWeb && asset.uri) {
        base64 = await toBase64(asset.uri);
      } else {
        return null;
      }

      return { base64, uri: asset.uri };
    } catch {
      return null;
    }
  };

  const takePhoto = async (quality: number = FOOD_IMAGE_QUALITY): Promise<PickResult | null> => {
    if (isWeb) {
      Alert.alert('提示', '浏览器端不支持拍照，请使用"相册选择"上传食物图片，或者用手机App拍照');
      return null;
    }

    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('权限不足', '需要相机权限来拍照识别食物');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) return null;

      const asset = result.assets[0];
      if (asset.base64) {
        return { base64: asset.base64, uri: asset.uri };
      }

      return null;
    } catch {
      return null;
    }
  };

  return {
    pickImage,
    takePhoto,
    imagePreviewUri,
    setImagePreviewUri,
    toBase64,
    isWeb,
    OCR_IMAGE_QUALITY,
    FOOD_IMAGE_QUALITY,
  };
}
