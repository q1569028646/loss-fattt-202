import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';

export async function getItemAsync(key: string): Promise<string | null> {
  if (isWeb) {
    return AsyncStorage.getItem(key);
  }
  try {
    const { getItemAsync: nativeGetItem } = await import('expo-secure-store');
    return nativeGetItem(key);
  } catch {
    return AsyncStorage.getItem(key);
  }
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  if (isWeb) {
    return AsyncStorage.setItem(key, value);
  }
  try {
    const { setItemAsync: nativeSetItem } = await import('expo-secure-store');
    return nativeSetItem(key, value);
  } catch {
    return AsyncStorage.setItem(key, value);
  }
}

export async function deleteItemAsync(key: string): Promise<void> {
  if (isWeb) {
    return AsyncStorage.removeItem(key);
  }
  try {
    const { deleteItemAsync: nativeDeleteItem } = await import('expo-secure-store');
    return nativeDeleteItem(key);
  } catch {
    return AsyncStorage.removeItem(key);
  }
}