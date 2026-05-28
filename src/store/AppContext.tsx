import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  securityScore: number;
  protectionEnabled: boolean;
  notificationsEnabled: boolean;
  backgroundMonitoring: boolean;
  scanHistory: any[];
  threatMessages: any[];
  dailyTip: string;
}

type Action =
  | { type: 'SET_SECURITY_SCORE'; payload: number }
  | { type: 'TOGGLE_PROTECTION' }
  | { type: 'TOGGLE_NOTIFICATIONS' }
  | { type: 'ADD_SCAN_RESULT'; payload: any }
  | { type: 'ADD_THREAT_MESSAGE'; payload: any }
  | { type: 'SET_DAILY_TIP'; payload: string }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

const initialState: AppState = {
  securityScore: 100,
  protectionEnabled: true,
  notificationsEnabled: true,
  backgroundMonitoring: true,
  scanHistory: [],
  threatMessages: [],
  dailyTip: 'Never share your OTP or passwords with anyone.',
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_SECURITY_SCORE':
      return { ...state, securityScore: action.payload };
    case 'TOGGLE_PROTECTION':
      return { ...state, protectionEnabled: !state.protectionEnabled };
    case 'TOGGLE_NOTIFICATIONS':
      return { ...state, notificationsEnabled: !state.notificationsEnabled };
    case 'ADD_SCAN_RESULT':
      return {
        ...state,
        scanHistory: [action.payload, ...state.scanHistory].slice(0, 100),
      };
    case 'ADD_THREAT_MESSAGE':
      return {
        ...state,
        threatMessages: [action.payload, ...state.threatMessages].slice(0, 100),
      };
    case 'SET_DAILY_TIP':
      return { ...state, dailyTip: action.payload };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

export const useApp = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    loadState();
  }, []);

  useEffect(() => {
    saveState();
  }, [state]);

  const loadState = async () => {
    try {
      const saved = await AsyncStorage.getItem('app_state');
      if (saved) {
        dispatch({ type: 'LOAD_STATE', payload: JSON.parse(saved) });
      }
    } catch (error) {
      console.error('Error loading state:', error);
    }
  };

  const saveState = async () => {
    try {
      await AsyncStorage.setItem('app_state', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};
