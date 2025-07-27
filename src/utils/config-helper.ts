import { AppData, SiteConfig } from '../types/app.js';

/**
 * 配置文件辅助工具
 * 提供配置文件创建、更新和管理功能
 */
export class ConfigHelper {
  /**
   * 创建新的应用配置
   */
  static createAppConfig(data: Partial<AppData>): AppData {
    const now = new Date().toISOString();
    
    return {
      id: data.id || '',
      name: data.name || '',
      description: data.description || '',
      longDescription: data.longDescription,
      url: data.url || '',
      sourceUrl: data.sourceUrl,
      image: data.image || '',
      tags: data.tags || [],
      status: data.status || 'active',
      featured: data.featured || false,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
      ...data
    };
  }

  /**
   * 创建默认站点配置
   */
  static createDefaultSiteConfig(): SiteConfig {
    return {
      title: 'Soft98 Top',
      description: 'Personal Project Collection',
      author: 'Soft98 Top',
      social: {
        github: 'https://github.com/soft98-top',
        email: 'contact@soft98-top.github.io'
      },
      apps: []
    };
  }

  /**
   * 添加应用到配置
   */
  static addAppToConfig(config: SiteConfig, app: AppData): SiteConfig {
    // 检查ID是否已存在
    const existingApp = config.apps.find(existingApp => existingApp.id === app.id);
    if (existingApp) {
      throw new Error(`App with ID "${app.id}" already exists`);
    }

    return {
      ...config,
      apps: [...config.apps, app]
    };
  }

  /**
   * 更新配置中的应用
   */
  static updateAppInConfig(config: SiteConfig, appId: string, updates: Partial<AppData>): SiteConfig {
    const appIndex = config.apps.findIndex(app => app.id === appId);
    if (appIndex === -1) {
      throw new Error(`App with ID "${appId}" not found`);
    }

    const updatedApp = {
      ...config.apps[appIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const newApps = [...config.apps];
    newApps[appIndex] = updatedApp;

    return {
      ...config,
      apps: newApps
    };
  }

  /**
   * 从配置中移除应用
   */
  static removeAppFromConfig(config: SiteConfig, appId: string): SiteConfig {
    const appExists = config.apps.some(app => app.id === appId);
    if (!appExists) {
      throw new Error(`App with ID "${appId}" not found`);
    }

    return {
      ...config,
      apps: config.apps.filter(app => app.id !== appId)
    };
  }

  /**
   * 按状态过滤应用
   */
  static filterAppsByStatus(config: SiteConfig, status: AppData['status']): AppData[] {
    return config.apps.filter(app => app.status === status);
  }

  /**
   * 获取特色应用
   */
  static getFeaturedApps(config: SiteConfig): AppData[] {
    return config.apps.filter(app => app.featured);
  }

  /**
   * 按标签过滤应用
   */
  static filterAppsByTag(config: SiteConfig, tag: string): AppData[] {
    return config.apps.filter(app => app.tags.includes(tag));
  }

  /**
   * 获取所有使用的标签
   */
  static getAllTags(config: SiteConfig): string[] {
    const allTags = config.apps.flatMap(app => app.tags);
    return [...new Set(allTags)].sort();
  }

  /**
   * 生成应用ID（基于名称）
   */
  static generateAppId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-') // 空格替换为连字符
      .replace(/-+/g, '-') // 多个连字符合并为一个
      .replace(/^-|-$/g, ''); // 移除开头和结尾的连字符
  }

  /**
   * 验证应用ID格式
   */
  static isValidAppId(id: string): boolean {
    return /^[a-z0-9-]+$/.test(id) && !id.startsWith('-') && !id.endsWith('-');
  }
}