/**
 * Discord Bot Configuration Example
 * 
 * This example shows how to implement a Discord bot that reads
 * bot configuration from the shared database via API.
 * 
 * Usage:
 * 1. Set up environment variables: DISCORD_TOKEN, API_BASE_URL
 * 2. Install discord.js: pnpm add discord.js
 * 3. Update token and API base URL below
 */

import { Client, GatewayIntentBits, EmbedBuilder, Events } from 'discord.js';
import fetch from 'node-fetch';

interface BotConfig {
  welcomeMessage: string;
  primaryColor: string;
  notificationChannel: string;
  autoRespond: boolean;
  respondDelay: number;
}

/**
 * Bot Configuration Manager
 * Fetches and caches bot settings from the API
 */
class DiscordBotConfigManager {
  private config: BotConfig | null = null;
  private lastFetch: number = 0;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = process.env.API_BASE_URL || 'http://localhost:3000/api') {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Fetch bot configuration from API
   */
  async getConfig(): Promise<BotConfig> {
    const now = Date.now();

    // Return cached config if fresh
    if (this.config && now - this.lastFetch < this.cacheDuration) {
      return this.config;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/bot-config`);
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      this.config = (await response.json()) as BotConfig;
      this.lastFetch = now;
      console.log('✅ Bot config updated from API');
      return this.config;
    } catch (error) {
      console.error('❌ Failed to fetch bot config:', error);
      // Return cached config or default
      return (
        this.config || {
          welcomeMessage: 'สวัสดีครับ! ยินดีต้อนรับเข้าสู่เซิร์ฟเวอร์ของเรา 🎉',
          primaryColor: '#3B82F6',
          notificationChannel: 'general',
          autoRespond: true,
          respondDelay: 1000,
        }
      );
    }
  }

  /**
   * Get a specific config property
   */
  async getProperty<K extends keyof BotConfig>(key: K): Promise<BotConfig[K]> {
    const config = await this.getConfig();
    return config[key];
  }

  /**
   * Invalidate cache to force refresh
   */
  invalidateCache(): void {
    this.config = null;
    this.lastFetch = 0;
  }
}

/**
 * Initialize Discord Bot with Config Manager
 */
class ConfigurableDiscordBot {
  private client: Client;
  private configManager: DiscordBotConfigManager;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
    });

    this.configManager = new DiscordBotConfigManager();
    this.setupEventListeners();
  }

  /**
   * Setup Discord event listeners
   */
  private setupEventListeners(): void {
    // Bot ready event
    this.client.on(Events.ClientReady, () => {
      console.log(`✅ Bot logged in as ${this.client.user?.tag}`);
      console.log('🔄 Fetching bot configuration...');
      this.configManager.getConfig();
    });

    // Member join event - send welcome message
    this.client.on(Events.GuildMemberAdd, async (member) => {
      try {
        const config = await this.configManager.getConfig();
        const channel = member.guild.channels.cache.find(
          (ch) => ch.name === config.notificationChannel && ch.isTextBased()
        );

        if (!channel || !channel.isTextBased()) {
          console.warn(`Channel "${config.notificationChannel}" not found`);
          return;
        }

        // Create embed with configured color
        const hexToDecimal = (hex: string) => parseInt(hex.replace('#', ''), 16);
        const embed = new EmbedBuilder()
          .setColor(hexToDecimal(config.primaryColor))
          .setTitle('🎉 สมาชิกใหม่')
          .setDescription(config.welcomeMessage)
          .addFields(
            { name: 'สมาชิก', value: member.user.username, inline: true },
            { name: 'เข้าเมื่อ', value: new Date().toLocaleString('th-TH'), inline: true }
          )
          .setThumbnail(member.user.displayAvatarURL())
          .setTimestamp();

        await channel.send({ embeds: [embed] });
        console.log(`📢 Welcome message sent to ${member.user.username}`);
      } catch (error) {
        console.error('Failed to send welcome message:', error);
      }
    });

    // Message event - auto respond if enabled
    this.client.on(Events.MessageCreate, async (message) => {
      if (message.author.bot) return;

      try {
        const config = await this.configManager.getConfig();

        if (config.autoRespond && message.mentions.has(this.client.user!)) {
          // Add delay before responding
          await new Promise((resolve) => setTimeout(resolve, config.respondDelay));

          const embed = new EmbedBuilder()
            .setColor(parseInt(config.primaryColor.replace('#', ''), 16))
            .setTitle('🤖 อัตโนมัติตอบสนอง')
            .setDescription('ขอบคุณที่ติดต่อ! ทีมงานจะตอบกลับให้เร็วที่สุด')
            .setTimestamp();

          await message.reply({ embeds: [embed] });
        }
      } catch (error) {
        console.error('Failed to process message:', error);
      }
    });

    // Error handler
    this.client.on('error', (error) => console.error('Discord client error:', error));
  }

  /**
   * Start the bot
   */
  async start(): Promise<void> {
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      throw new Error('DISCORD_TOKEN environment variable is required');
    }

    try {
      await this.client.login(token);
    } catch (error) {
      console.error('Failed to login:', error);
      process.exit(1);
    }
  }

  /**
   * Get the Discord client instance
   */
  getClient(): Client {
    return this.client;
  }

  /**
   * Get config manager for manual config updates
   */
  getConfigManager(): DiscordBotConfigManager {
    return this.configManager;
  }
}

// Export for use in other modules
export { ConfigurableDiscordBot, DiscordBotConfigManager, BotConfig };

// Example usage / Main entry point
if (require.main === module) {
  const bot = new ConfigurableDiscordBot();
  bot.start().catch(console.error);

  // Periodically refresh config (every 10 minutes)
  setInterval(() => {
    bot.getConfigManager().getConfig().catch(console.error);
  }, 10 * 60 * 1000);
}
