import { SiteConfig, ValidationResult } from '../types/app.js';
import { ConfigValidator } from './config-validator.js';
import { ConfigHelper } from './config-helper.js';

/**
 * 配置文件加载器
 * 负责加载、解析和验证配置文件
 */
export class ConfigLoader {
  private static readonly DEFAULT_CONFIG_PATH = '/apps.json';
  // private static readonly CACHE_KEY = 'site-config-cache';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  private validator: ConfigValidator;
  private cache: Map<string, { data: SiteConfig; timestamp: number }>;

  constructor() {
    this.validator = new ConfigValidator();
    this.cache = new Map();
  }

  /**
   * 加载配置文件
   */
  async loadConfig(configPath: string = ConfigLoader.DEFAULT_CONFIG_PATH): Promise<SiteConfig> {
    try {
      // 检查缓存
      const cached = this.getCachedConfig(configPath);
      if (cached) {
        return cached;
      }

      // 加载配置文件
      const response = await fetch(configPath);
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status} ${response.statusText}`);
      }

      const rawConfig = await response.json();
      
      // 验证配置
      const validationResult = this.validator.validate(rawConfig);
      if (!validationResult.isValid) {
        throw new ConfigValidationError('Configuration validation failed', validationResult.errors);
      }

      // 处理配置数据
      const config = this.processConfig(rawConfig);
      
      // 缓存配置
      this.setCachedConfig(configPath, config);

      return config;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      
      // 返回默认配置作为后备
      return this.getDefaultConfig();
    }
  }

  /**
   * 重新加载配置（忽略缓存）
   */
  async reloadConfig(configPath: string = ConfigLoader.DEFAULT_CONFIG_PATH): Promise<SiteConfig> {
    this.clearCache(configPath);
    return this.loadConfig(configPath);
  }

  /**
   * 验证配置文件
   */
  async validateConfig(configPath: string = ConfigLoader.DEFAULT_CONFIG_PATH): Promise<ValidationResult> {
    try {
      const response = await fetch(configPath);
      if (!response.ok) {
        return {
          isValid: false,
          errors: [{
            field: 'file',
            message: `Failed to load config file: ${response.status} ${response.statusText}`,
            value: configPath
          }]
        };
      }

      const rawConfig = await response.json();
      return this.validator.validate(rawConfig);
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'file',
          message: `Error loading config file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          value: configPath
        }]
      };
    }
  }

  /**
   * 处理原始配置数据
   */
  private processConfig(rawConfig: any): SiteConfig {
    const config: SiteConfig = {
      title: rawConfig.title || 'Soft98 Top',
      description: rawConfig.description || 'Personal Project Collection',
      author: rawConfig.author || 'Soft98 Top',
      social: rawConfig.social || {},
      apps: rawConfig.apps || []
    };

    // 处理应用数据
    config.apps = config.apps.map(app => ({
      ...app,
      // 确保必需字段有默认值
      tags: app.tags || [],
      status: app.status || 'active',
      featured: app.featured || false,
      // 添加时间戳（如果不存在）
      createdAt: app.createdAt || new Date().toISOString(),
      updatedAt: app.updatedAt || new Date().toISOString()
    }));

    // 验证应用ID唯一性
    const uniqueIdErrors = ConfigValidator.validateUniqueIds(config.apps);
    if (uniqueIdErrors.length > 0) {
      throw new ConfigValidationError('Duplicate app IDs found', uniqueIdErrors);
    }

    return config;
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): SiteConfig {
    return ConfigHelper.createDefaultSiteConfig();
  }

  /**
   * 获取缓存的配置
   */
  private getCachedConfig(configPath: string): SiteConfig | null {
    const cached = this.cache.get(configPath);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > ConfigLoader.CACHE_DURATION) {
      this.cache.delete(configPath);
      return null;
    }

    return cached.data;
  }

  /**
   * 设置缓存配置
   */
  private setCachedConfig(configPath: string, config: SiteConfig): void {
    this.cache.set(configPath, {
      data: config,
      timestamp: Date.now()
    });
  }

  /**
   * 清除缓存
   */
  private clearCache(configPath?: string): void {
    if (configPath) {
      this.cache.delete(configPath);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 获取单例实例
   */
  private static instance: ConfigLoader | null = null;

  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }
}

/**
 * 配置验证错误类
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string; value?: any }>
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * 便捷函数：加载配置
 */
export async function loadSiteConfig(configPath?: string): Promise<SiteConfig> {
  const loader = ConfigLoader.getInstance();
  return loader.loadConfig(configPath);
}

/**
 * 便捷函数：验证配置
 */
export async function validateSiteConfig(configPath?: string): Promise<ValidationResult> {
  const loader = ConfigLoader.getInstance();
  return loader.validateConfig(configPath);
}