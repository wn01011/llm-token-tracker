/**
 * File-based storage for token usage data
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { TokenUsage, UserUsage } from './index.js';

export interface StorageData {
  history: Record<string, TokenUsage[]>;
  totals: Record<string, UserUsage>;
  lastSaved: string;
}

export class FileStorage {
  private storagePath: string;
  private autoSave: boolean;

  constructor(customPath?: string, autoSave: boolean = true) {
    if (customPath) {
      this.storagePath = customPath;
    } else {
      // Use user's home directory
      const homeDir = os.homedir();
      const storageDir = path.join(homeDir, '.llm-token-tracker');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }
      
      this.storagePath = path.join(storageDir, 'sessions.json');
    }
    
    this.autoSave = autoSave;
  }

  /**
   * Load data from file
   */
  load(): StorageData | null {
    try {
      if (!fs.existsSync(this.storagePath)) {
        return null;
      }

      const data = fs.readFileSync(this.storagePath, 'utf-8');
      const parsed = JSON.parse(data) as StorageData;
      
      // Convert string dates back to Date objects
      Object.values(parsed.history).forEach(userHistory => {
        userHistory.forEach(usage => {
          usage.timestamp = new Date(usage.timestamp);
        });
      });
      
      Object.values(parsed.totals).forEach(userTotal => {
        userTotal.lastUsed = new Date(userTotal.lastUsed);
      });
      
      return parsed;
    } catch (error) {
      console.error('Failed to load storage:', error);
      return null;
    }
  }

  /**
   * Save data to file
   */
  save(history: Map<string, TokenUsage[]>, totals: Map<string, UserUsage>): boolean {
    try {
      const data: StorageData = {
        history: Object.fromEntries(history),
        totals: Object.fromEntries(totals),
        lastSaved: new Date().toISOString()
      };

      const json = JSON.stringify(data, null, 2);
      fs.writeFileSync(this.storagePath, json, 'utf-8');
      
      return true;
    } catch (error) {
      console.error('Failed to save storage:', error);
      return false;
    }
  }

  /**
   * Clear all stored data
   */
  clear(): boolean {
    try {
      if (fs.existsSync(this.storagePath)) {
        fs.unlinkSync(this.storagePath);
      }
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }

  /**
   * Get storage file path
   */
  getPath(): string {
    return this.storagePath;
  }

  /**
   * Check if storage file exists
   */
  exists(): boolean {
    return fs.existsSync(this.storagePath);
  }

  /**
   * Get storage file size in bytes
   */
  getSize(): number {
    try {
      if (!this.exists()) return 0;
      const stats = fs.statSync(this.storagePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Convert Map to Record for JSON serialization
   */
  private mapToRecord<K extends string, V>(map: Map<K, V>): Record<K, V> {
    const record = {} as Record<K, V>;
    map.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }

  /**
   * Convert Record to Map
   */
  private recordToMap<K extends string, V>(record: Record<K, V>): Map<K, V> {
    const map = new Map<K, V>();
    Object.entries(record).forEach(([key, value]) => {
      map.set(key as K, value as V);
    });
    return map;
  }
}
