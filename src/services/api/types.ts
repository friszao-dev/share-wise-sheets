export interface StockData {
  symbol: string;
  name: string;
  currentPrice: number;
  previousPrice: number;
  lpa: number;
  growthRate: number;
  pl: number;
  pbv: number;
  dy: number;
  roe: number;
  roic: number;
  netMargin: number;
  liquidezCorrente: number;
  dividaBrutaPl: number;
}

export interface BrapiResponse {
  results: Array<{
    symbol: string;
    name: string;
    price: number;
    priceClose: number;
    priceOpen: number;
    pl: number;
    pbv: number;
    psr: number;
    dy: number;
    roe: number;
    roic: number;
    netMargin: number;
  }>;
  requestedAt: string;
  responseStatus: string;
}

export interface ApiError {
  message: string;
  code: string;
  timestamp: Date;
}
