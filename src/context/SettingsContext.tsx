import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db, doc, onSnapshot, setDoc } from '../firebase';

interface Settings {
  siteName: string;
  primaryColor: string;
  backgroundColor: string;
  heroTitle: string;
  heroSubtitle: string;
  quizTitle: string;
  fontFamily: string;
}

const defaultSettings: Settings = {
  siteName: '강원금연지원센터',
  primaryColor: '#FACC15', // Yellow-400
  backgroundColor: '#000000',
  heroTitle: '세계 금연의 날 기념 OX 퀴즈 이벤트',
  heroSubtitle: '금연 상식을 뽐내고 푸짐한 경품을 받아가세요!',
  quizTitle: '금연 상식 OX 퀴즈',
  fontFamily: 'Inter, sans-serif'
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'config');
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as Settings);
      } else {
        // Initialize settings if they don't exist
        setDoc(settingsRef, defaultSettings);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    const settingsRef = doc(db, 'settings', 'config');
    await setDoc(settingsRef, { ...settings, ...newSettings }, { merge: true });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
