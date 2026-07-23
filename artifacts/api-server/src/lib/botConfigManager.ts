import { db, botConfigTable, defaultBotConfig, type BotConfigData } from "@workspace/db";

/**
 * Bot Configuration Manager
 * Handles fetching and caching bot configuration from the database
 */
class BotConfigManager {
  private cache: BotConfigData | null = null;
  private lastFetch: number = 0;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes cache

  /**
   * Get the latest bot configuration
   * Uses cache to reduce database queries
   */
  async getConfig(): Promise<BotConfigData> {
    const now = Date.now();
    
    // Return cached config if still fresh
    if (this.cache && now - this.lastFetch < this.cacheDuration) {
      return this.cache;
    }

    try {
      const rows = await db.select().from(botConfigTable).limit(1);
      if (rows.length > 0) {
        this.cache = rows[0].data;
        this.lastFetch = now;
        return this.cache;
      }
    } catch (error) {
      console.error("Error fetching bot config:", error);
      // Return cached config if available, or default
      if (this.cache) return this.cache;
    }

    return defaultBotConfig;
  }

  /**
   * Get specific config property
   */
  async getConfigProperty<K extends keyof BotConfigData>(
    key: K
  ): Promise<BotConfigData[K]> {
    const config = await this.getConfig();
    return config[key];
  }

  /**
   * Invalidate cache to force fresh fetch
   */
  invalidateCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }
}

export const botConfigManager = new BotConfigManager();
