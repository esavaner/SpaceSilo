import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const storage = {
  // Sync read (SecureStore.getItem is sync since SDK 51) lets providers start with the saved value instead of flashing a default.
  getSync: (key: string) => {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    }
    try {
      return SecureStore.getItem(key);
    } catch {
      // Unreadable keystore entry must not crash startup; caller falls back to its default.
      return null;
    }
  },
  get: async (key: string) => {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    }
    return await SecureStore.getItemAsync(key);
  },
  set: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  delete: async (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};
