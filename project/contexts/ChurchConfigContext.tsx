import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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

      const { data, error: fetchError } = await supabase
        .from('church_configurations')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();

    const channel = supabase
      .channel('church_config_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'church_configurations',
        },
        () => {
          fetchConfig();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
