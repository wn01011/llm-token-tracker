/**
 * Exchange rate management with caching
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface ExchangeRateCache {
  rate: number;
  lastUpdated: string;
  source: string;
}

export class ExchangeRateManager {
  private cachePath: string;
  private cacheExpiryHours: number;
  private fallbackRate: number = 1380; // Default fallback rate

  constructor(cacheExpiryHours: number = 24) {
    const homeDir = os.homedir();
    const cacheDir = path.join(homeDir, '.llm-token-tracker');
    
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    this.cachePath = path.join(cacheDir, 'exchange-rate.json');
    this.cacheExpiryHours = cacheExpiryHours;
  }

  /**
   * Get current USD to KRW exchange rate
   */
  async getUSDtoKRW(): Promise<number> {
    // Try to get from cache first
    const cached = this.loadFromCache();
    if (cached && !this.isCacheExpired(cached.lastUpdated)) {
      return cached.rate;
    }

    // Fetch fresh rate
    try {
      const rate = await this.fetchExchangeRate();
      this.saveToCache(rate, 'exchangerate-api');
      return rate;
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      
      // Use cached rate even if expired
      if (cached) {
        console.log('Using expired cache due to API failure');
        return cached.rate;
      }
      
      // Fall back to default rate
      console.log(`Using fallback rate: ${this.fallbackRate}`);
      return this.fallbackRate;
    }
  }

  /**
   * Fetch exchange rate from API
   */
  private async fetchExchangeRate(): Promise<number> {
    // Using exchangerate-api.com (free tier, no API key required)
    const url = 'https://api.exchangerate-api.com/v4/latest/USD';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data: any = await response.json();
    
    if (!data.rates || !data.rates.KRW) {
      throw new Error('Invalid API response format');
    }
    
    return data.rates.KRW as number;
  }

  /**
   * Load exchange rate from cache
   */
  private loadFromCache(): ExchangeRateCache | null {
    try {
      if (!fs.existsSync(this.cachePath)) {
        return null;
      }

      const data = fs.readFileSync(this.cachePath, 'utf-8');
      return JSON.parse(data) as ExchangeRateCache;
    } catch (error) {
      console.error('Failed to load exchange rate cache:', error);
      return null;
    }
  }

  /**
   * Save exchange rate to cache
   */
  private saveToCache(rate: number, source: string): void {
    try {
      const cache: ExchangeRateCache = {
        rate,
        lastUpdated: new Date().toISOString(),
        source
      };

      fs.writeFileSync(this.cachePath, JSON.stringify(cache, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save exchange rate cache:', error);
    }
  }

  /**
   * Check if cache is expired
   */
  private isCacheExpired(lastUpdated: string): boolean {
    const lastUpdateTime = new Date(lastUpdated).getTime();
    const now = Date.now();
    const expiryMs = this.cacheExpiryHours * 60 * 60 * 1000;
    
    return (now - lastUpdateTime) > expiryMs;
  }

  /**
   * Force refresh exchange rate
   */
  async forceRefresh(): Promise<number> {
    try {
      const rate = await this.fetchExchangeRate();
      this.saveToCache(rate, 'exchangerate-api');
      return rate;
    } catch (error) {
      console.error('Failed to force refresh exchange rate:', error);
      throw error;
    }
  }

  /**
   * Get cached rate info
   */
  getCacheInfo(): ExchangeRateCache | null {
    return this.loadFromCache();
  }

  /**
   * Clear cache
   */
  clearCache(): boolean {
    try {
      if (fs.existsSync(this.cachePath)) {
        fs.unlinkSync(this.cachePath);
      }
      return true;
    } catch (error) {
      console.error('Failed to clear exchange rate cache:', error);
      return false;
    }
  }

  /**
   * Set fallback rate
   */
  setFallbackRate(rate: number): void {
    this.fallbackRate = rate;
  }

  /**
   * Get fallback rate
   */
  getFallbackRate(): number {
    return this.fallbackRate;
  }
}
