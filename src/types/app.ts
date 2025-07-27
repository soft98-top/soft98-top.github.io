/**
 * 应用数据模型接口定义
 * 用于类型检查和配置文件验证
 */

export interface AppData {
  /** 唯一标识符 */
  id: string;
  /** 应用名称 */
  name: string;
  /** 简短描述 */
  description: string;
  /** 详细描述 */
  longDescription?: string;
  /** 应用链接 */
  url: string;
  /** 源码链接 */
  sourceUrl?: string;
  /** 预览图片路径 */
  image: string;
  /** 技术标签 */
  tags: string[];
  /** 状态 */
  status: 'active' | 'beta' | 'archived';
  /** 是否为特色项目 */
  featured: boolean;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

export interface SiteConfig {
  /** 站点标题 */
  title?: string;
  /** 站点描述 */
  description?: string;
  /** 作者信息 */
  author?: string;
  /** 社交链接 */
  social?: {
    github?: string;
    email?: string;
  };
  /** 应用列表 */
  apps: AppData[];
}

export interface ValidationError {
  /** 错误字段路径 */
  field: string;
  /** 错误消息 */
  message: string;
  /** 错误值 */
  value?: any;
}

export interface ValidationResult {
  /** 是否验证通过 */
  isValid: boolean;
  /** 验证错误列表 */
  errors: ValidationError[];
  /** 验证通过的数据 */
  data?: SiteConfig;
}