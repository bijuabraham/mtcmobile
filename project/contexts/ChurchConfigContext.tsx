import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ChurchConfiguration } from '@/types/database';

interface ChurchConfigContextType {
  config: ChurchConfiguration | null;
  loading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
}

const ChurchConfigContext = createContext<ChurchConfigContextType | undefined>(undefined);

export function ChurchConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ChurchConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.getConfig();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <ChurchConfigContext.Provider value={{ config, loading, error, refreshConfig: fetchConfig }}>
      {children}
    </ChurchConfigContext.Provider>
  );
}

export function useChurchConfig() {
  const context = useContext(ChurchConfigContext);
  if (context === undefined) {
    throw new Error('useChurchConfig must be used within a ChurchConfigProvider');
  }
  return context;
}
