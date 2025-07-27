import { AppData, SiteConfig, ValidationError, ValidationResult } from '../types/app.js';

/**
 * 配置文件验证器
 * 提供配置文件格式验证和数据完整性检查
 */
export class ConfigValidator {
  private errors: ValidationError[] = [];

  /**
   * 验证完整的站点配置
   */
  validate(config: any): ValidationResult {
    this.errors = [];

    if (!config || typeof config !== 'object') {
      this.addError('root', 'Configuration must be an object', config);
      return this.getResult();
    }

    // 验证apps数组
    if (!Array.isArray(config.apps)) {
      this.addError('apps', 'Apps must be an array', config.apps);
      return this.getResult();
    }

    // 验证每个应用配置
    config.apps.forEach((app: any, index: number) => {
      this.validateApp(app, `apps[${index}]`);
    });

    // 验证可选的站点信息
    this.validateSiteInfo(config);

    return this.getResult();
  }

  /**
   * 验证单个应用配置
   */
  private validateApp(app: any, path: string): void {
    if (!app || typeof app !== 'object') {
      this.addError(path, 'App must be an object', app);
      return;
    }

    // 必需字段验证
    this.validateRequired(app, path, 'id', 'string');
    this.validateRequired(app, path, 'name', 'string');
    this.validateRequired(app, path, 'description', 'string');
    this.validateRequired(app, path, 'url', 'string');
    this.validateRequired(app, path, 'image', 'string');
    this.validateRequired(app, path, 'tags', 'array');
    this.validateRequired(app, path, 'status', 'string');
    this.validateRequired(app, path, 'featured', 'boolean');

    // 特定字段验证
    if (app.status && !['active', 'beta', 'archived'].includes(app.status)) {
      this.addError(`${path}.status`, 'Status must be one of: active, beta, archived', app.status);
    }

    if (app.url && !this.isValidUrl(app.url)) {
      this.addError(`${path}.url`, 'URL must be a valid HTTP/HTTPS URL', app.url);
    }

    if (app.sourceUrl && !this.isValidUrl(app.sourceUrl)) {
      this.addError(`${path}.sourceUrl`, 'Source URL must be a valid HTTP/HTTPS URL', app.sourceUrl);
    }

    if (app.tags && Array.isArray(app.tags)) {
      app.tags.forEach((tag: any, tagIndex: number) => {
        if (typeof tag !== 'string') {
          this.addError(`${path}.tags[${tagIndex}]`, 'Tag must be a string', tag);
        }
      });
    }

    // ID唯一性验证（需要在上层调用中处理）
    if (app.id && typeof app.id === 'string' && app.id.trim() === '') {
      this.addError(`${path}.id`, 'ID cannot be empty', app.id);
    }
  }

  /**
   * 验证站点信息
   */
  private validateSiteInfo(config: any): void {
    if (config.title !== undefined && typeof config.title !== 'string') {
      this.addError('title', 'Title must be a string', config.title);
    }

    if (config.description !== undefined && typeof config.description !== 'string') {
      this.addError('description', 'Description must be a string', config.description);
    }

    if (config.author !== undefined && typeof config.author !== 'string') {
      this.addError('author', 'Author must be a string', config.author);
    }

    if (config.social !== undefined) {
      if (typeof config.social !== 'object') {
        this.addError('social', 'Social must be an object', config.social);
      } else {
        if (config.social.github !== undefined && typeof config.social.github !== 'string') {
          this.addError('social.github', 'GitHub URL must be a string', config.social.github);
        }
        if (config.social.email !== undefined && typeof config.social.email !== 'string') {
          this.addError('social.email', 'Email must be a string', config.social.email);
        }
      }
    }
  }

  /**
   * 验证必需字段
   */
  private validateRequired(obj: any, path: string, field: string, type: string): void {
    const value = obj[field];
    
    if (value === undefined || value === null) {
      this.addError(`${path}.${field}`, `${field} is required`, value);
      return;
    }

    if (type === 'array' && !Array.isArray(value)) {
      this.addError(`${path}.${field}`, `${field} must be an array`, value);
    } else if (type !== 'array' && typeof value !== type) {
      this.addError(`${path}.${field}`, `${field} must be a ${type}`, value);
    }
  }

  /**
   * 验证URL格式
   */
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * 添加验证错误
   */
  private addError(field: string, message: string, value?: any): void {
    this.errors.push({ field, message, value });
  }

  /**
   * 获取验证结果
   */
  private getResult(): ValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: [...this.errors],
      data: this.errors.length === 0 ? undefined : undefined
    };
  }

  /**
   * 验证应用ID的唯一性
   */
  static validateUniqueIds(apps: AppData[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const ids = new Set<string>();
    
    apps.forEach((app, index) => {
      if (ids.has(app.id)) {
        errors.push({
          field: `apps[${index}].id`,
          message: `Duplicate app ID: ${app.id}`,
          value: app.id
        });
      } else {
        ids.add(app.id);
      }
    });

    return errors;
  }
}