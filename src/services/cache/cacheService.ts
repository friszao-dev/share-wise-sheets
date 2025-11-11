interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();

  set<T>(key: string, data: T, ttlMs: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
    console.log(`[Cache] Armazenado: ${key}`);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      console.log(`[Cache] Expirado: ${key}`);
      return null;
    }
    
    console.log(`[Cache Hit] ${key}`);
    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
    console.log('[Cache] Limpo');
  }

  delete(key: string): void {
    this.cache.delete(key);
    console.log(`[Cache] Deletado: ${key}`);
  }

  getSize(): number {
    return this.cache.size;
  }
}

export default new CacheService();
