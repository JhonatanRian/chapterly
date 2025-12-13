import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

interface SystemConfig {
  id: number;
  chapter_enabled: boolean;
  retro_enabled: boolean;
  updated_at: string;
  updated_by: number | null;
  updated_by_username: string | null;
}

interface ConfigContextType {
  config: SystemConfig | null;
  loading: boolean;
  error: string | null;
  isChapterEnabled: boolean;
  isRetroEnabled: boolean;
  refetchConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/auth/config/');
      setConfig(response.data);
    } catch (err: any) {
      console.error('Erro ao buscar configuração:', err);
      setError(err.message || 'Erro ao buscar configuração');
      // Define valores padrão em caso de erro
      setConfig({
        id: 1,
        chapter_enabled: true,
        retro_enabled: false,
        updated_at: new Date().toISOString(),
        updated_by: null,
        updated_by_username: null,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const value: ConfigContextType = {
    config,
    loading,
    error,
    isChapterEnabled: config?.chapter_enabled ?? true,
    isRetroEnabled: config?.retro_enabled ?? false,
    refetchConfig: fetchConfig,
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig deve ser usado dentro de um ConfigProvider');
  }
  return context;
};
