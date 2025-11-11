import axios, { AxiosInstance } from 'axios';
import { StockData, BrapiResponse, ApiError } from './types';
import cacheService from '../cache/cacheService';

class BrapiService {
  private api: AxiosInstance;
  private baseUrl = 'https://brapi.dev/api';
  private timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000');
  private cacheDuration = parseInt(import.meta.env.VITE_CACHE_DURATION || '300000');

  constructor() {
    const token = import.meta.env.VITE_BRAPI_KEY;
    
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
  }

  /**
   * Busca dados de uma única ação
   */
  async getStockData(symbol: string): Promise<StockData> {
    const cacheKey = `stock_${symbol}`;
    
    // Verificar cache
    const cached = cacheService.get<StockData>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      console.log(`[API] Buscando ${symbol}...`);
      const response = await this.api.get<BrapiResponse>(`/quote/${symbol}`);
      
      if (!response.data.results || response.data.results.length === 0) {
        throw new Error(`Ação ${symbol} não encontrada`);
      }

      const stock = response.data.results[0];
      
      const stockData: StockData = {
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: stock.price,
        previousPrice: stock.priceClose,
        lpa: this.estimateLPA(stock.price, stock.pl),
        growthRate: this.estimateGrowthRate(stock.roe),
        pl: stock.pl || 0,
        pbv: stock.pbv || 0,
        dy: stock.dy || 0,
        roe: stock.roe || 0,
        roic: stock.roic || 0,
        netMargin: stock.netMargin || 0,
        liquidezCorrente: 1.5, // Valor padrão
        dividaBrutaPl: 0.5, // Valor padrão
      };

      // Armazenar em cache
      cacheService.set(cacheKey, stockData, this.cacheDuration);
      
      console.log(`[API] ✓ ${symbol} carregado com sucesso`);
      return stockData;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Busca dados de múltiplas ações
   */
  async getMultipleStocks(symbols: string[]): Promise<StockData[]> {
    const cacheKey = `stocks_${symbols.join(',')}`;
    
    // Verificar cache
    const cached = cacheService.get<StockData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      console.log(`[API] Buscando ${symbols.length} ações...`);
      const response = await this.api.get<BrapiResponse>(
        `/quote/${symbols.join(',')}`
      );

      if (!response.data.results) {
        throw new Error('Nenhuma ação encontrada');
      }

      const stocksData: StockData[] = response.data.results.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: stock.price,
        previousPrice: stock.priceClose,
        lpa: this.estimateLPA(stock.price, stock.pl),
        growthRate: this.estimateGrowthRate(stock.roe),
        pl: stock.pl || 0,
        pbv: stock.pbv || 0,
        dy: stock.dy || 0,
        roe: stock.roe || 0,
        roic: stock.roic || 0,
        netMargin: stock.netMargin || 0,
        liquidezCorrente: 1.5,
        dividaBrutaPl: 0.5,
      }));

      // Armazenar em cache
      cacheService.set(cacheKey, stocksData, this.cacheDuration);
      
      console.log(`[API] ✓ ${symbols.length} ações carregadas com sucesso`);
      return stocksData;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Estima LPA baseado no P/L
   */
  private estimateLPA(price: number, pl: number): number {
    if (!pl || pl <= 0) return 0;
    return price / pl;
  }

  /**
   * Estima taxa de crescimento baseado no ROE
   */
  private estimateGrowthRate(roe: number): number {
    // Crescimento esperado é uma fração do ROE
    // Fórmula: Crescimento = ROE × Taxa de Retenção (assumindo 50%)
    if (!roe || roe <= 0) return 0;
    return Math.min(roe * 0.5, 25); // Máximo 25%
  }

  /**
   * Trata erros da API
   */
  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      let message = error.response?.data?.message || error.message;
      const code = error.code || 'UNKNOWN_ERROR';
      
      // Mensagens específicas por status HTTP
      if (status === 401) {
        message = 'Token de autenticação inválido ou ausente. Configure VITE_BRAPI_KEY no arquivo .env';
      } else if (status === 404) {
        message = 'Ação não encontrada. Verifique o símbolo digitado';
      } else if (status === 429) {
        message = 'Limite de requisições excedido. Aguarde alguns minutos';
      }
      
      console.error(`[API Error] ${code}: ${message}`);
      
      return {
        message,
        code,
        timestamp: new Date(),
      };
    }
    
    console.error('[API Error] Erro desconhecido:', error);
    
    return {
      message: 'Erro desconhecido ao buscar dados',
      code: 'UNKNOWN_ERROR',
      timestamp: new Date(),
    };
  }

  /**
   * Limpa o cache
   */
  clearCache(): void {
    cacheService.clear();
  }

  /**
   * Retorna o tamanho do cache
   */
  getCacheSize(): number {
    return cacheService.getSize();
  }
}

export default new BrapiService();
