import { useState, useCallback } from 'react';
import brapiService from '@/services/api/brapiService';
import { StockData, ApiError } from '@/services/api/types';

interface UseStockDataReturn {
  data: StockData | null;
  loading: boolean;
  error: ApiError | null;
  fetchStock: (symbol: string) => Promise<void>;
  fetchMultiple: (symbols: string[]) => Promise<StockData[]>;
  clearError: () => void;
}

export const useStockData = (): UseStockDataReturn => {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchStock = useCallback(async (symbol: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const stockData = await brapiService.getStockData(symbol);
      setData(stockData);
    } catch (err: any) {
      setError(err);
      console.error(`Erro ao buscar ${symbol}:`, err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMultiple = useCallback(async (symbols: string[]): Promise<StockData[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const stocksData = await brapiService.getMultipleStocks(symbols);
      return stocksData;
    } catch (err: any) {
      setError(err);
      console.error('Erro ao buscar múltiplas ações:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchStock, fetchMultiple, clearError };
};
