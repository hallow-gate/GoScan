import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Store {
  securityScore: number;
  setSecurityScore: (score: number) => void;
  protectionEnabled: boolean;
  toggleProtection: () => void;
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
  scanHistory: any[];
  addScanResult: (result: any) => void;
  threatMessages: any[];
  addThreatMessage: (message: any) => void;
  clearHistory: () => void;
}

export const useStore = create<Store>((set) => ({
  securityScore: 100,
  setSecurityScore: (score) => set({ securityScore: score }),
  protectionEnabled: true,
  toggleProtection: () => set((state) => ({ protectionEnabled: !state.protectionEnabled })),
  notificationsEnabled: true,
  toggleNotifications: () => set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),
  scanHistory: [],
  addScanResult: (result) =>
    set((state) => ({
      scanHistory: [result, ...state.scanHistory].slice(0, 100),
    })),
  threatMessages: [],
  addThreatMessage: (message) =>
    set((state) => ({
      threatMessages: [message, ...state.threatMessages].slice(0, 100),
    })),
  clearHistory: () => set({ scanHistory: [], threatMessages: [] }),
}));
