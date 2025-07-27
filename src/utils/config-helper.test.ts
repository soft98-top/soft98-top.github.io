import { describe, it, expect, vi } from 'vitest';
import { ConfigHelper } from './config-helper.js';
import { AppData, SiteConfig } from '../types/app.js';

// Mock Date for consistent timestamps
const mockDate = new Date('2024-01-01T00:00:00.000Z');
vi.setSystemTime(mockDate);

describe('ConfigHelper', () => {
  describe('createAppConfig', () => {
    it('should create app config with default values', () => {
      const result = ConfigHelper.createAppConfig({
        id: 'test-app',
        name: 'Test App'
      });

      expect(result.id).toBe('test-app');
      expect(result.name).toBe('Test App');
      expect(result.description).toBe('');
      expect(result.url).toBe('');
      expect(result.image).toBe('');
      expect(result.tags).toEqual([]);
      expect(result.status).toBe('active');
      expect(result.featured).toBe(false);
      expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(result.updatedAt).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should preserve provided values', () => {
      const input = {
        id: 'custom-app',
        name: 'Custom App',
        description: 'Custom description',
        url: 'https://example.com',
        image: 'custom.png',
        tags: ['React', 'TypeScript'],
        status: 'beta' as const,
        featured: true,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-06-01T00:00:00.000Z'
      };

      const result = ConfigHelper.createAppConfig(input);

      expect(result).toEqual(input);
    });
  });

  describe('createDefaultSiteConfig', () => {
    it('should create default site configuration', () => {
      const result = ConfigHelper.createDefaultSiteConfig();

      expect(result.title).toBe('Soft98 Top');
      expect(result.description).toBe('Personal Project Collection');
      expect(result.author).toBe('Soft98 Top');
      expect(result.social?.github).toBe('https://github.com/soft98-top');
      expect(result.social?.email).toBe('contact@soft98-top.github.io');
      expect(result.apps).toEqual([]);
    });
  });

  describe('addAppToConfig', () => {
    let baseConfig: SiteConfig;
    let testApp: AppData;

    beforeEach(() => {
      baseConfig = ConfigHelper.createDefaultSiteConfig();
      testApp = ConfigHelper.createAppConfig({
        id: 'test-app',
        name: 'Test App',
        description: 'Test description',
        url: 'https://example.com',
        image: 'test.png'
      });
    });

    it('should add app to empty config', () => {
      const result = ConfigHelper.addAppToConfig(baseConfig, testApp);

      expect(result.apps).toHaveLength(1);
      expect(result.apps[0]).toEqual(testApp);
    });

    it('should add app to existing config', () => {
      const existingApp = ConfigHelper.createAppConfig({
        id: 'existing-app',
        name: 'Existing App'
      });
      
      const configWithApp = { ...baseConfig, apps: [existingApp] };
      const result = ConfigHelper.addAppToConfig(configWithApp, testApp);

      expect(result.apps).toHaveLength(2);
      expect(result.apps[0]).toEqual(existingApp);
      expect(result.apps[1]).toEqual(testApp);
    });

    it('should throw error for duplicate ID', () => {
      const configWithApp = { ...baseConfig, apps: [testApp] };
      
      expect(() => {
        ConfigHelper.addAppToConfig(configWithApp, testApp);
      }).toThrow('App with ID "test-app" already exists');
    });
  });

  describe('updateAppInConfig', () => {
    let configWithApps: SiteConfig;

    beforeEach(() => {
      const app1 = ConfigHelper.createAppConfig({
        id: 'app1',
        name: 'App 1',
        description: 'Description 1'
      });
      const app2 = ConfigHelper.createAppConfig({
        id: 'app2',
        name: 'App 2',
        description: 'Description 2'
      });

      configWithApps = {
        ...ConfigHelper.createDefaultSiteConfig(),
        apps: [app1, app2]
      };
    });

    it('should update existing app', () => {
      const updates = {
        name: 'Updated App 1',
        description: 'Updated description'
      };

      const result = ConfigHelper.updateAppInConfig(configWithApps, 'app1', updates);

      expect(result.apps[0].name).toBe('Updated App 1');
      expect(result.apps[0].description).toBe('Updated description');
      expect(result.apps[0].id).toBe('app1'); // ID should remain unchanged
      expect(result.apps[0].updatedAt).toBe('2024-01-01T00:00:00.000Z');
      expect(result.apps[1]).toEqual(configWithApps.apps[1]); // Other apps unchanged
    });

    it('should throw error for non-existent app', () => {
      expect(() => {
        ConfigHelper.updateAppInConfig(configWithApps, 'non-existent', { name: 'New Name' });
      }).toThrow('App with ID "non-existent" not found');
    });
  });

  describe('removeAppFromConfig', () => {
    let configWithApps: SiteConfig;

    beforeEach(() => {
      const app1 = ConfigHelper.createAppConfig({ id: 'app1', name: 'App 1' });
      const app2 = ConfigHelper.createAppConfig({ id: 'app2', name: 'App 2' });

      configWithApps = {
        ...ConfigHelper.createDefaultSiteConfig(),
        apps: [app1, app2]
      };
    });

    it('should remove existing app', () => {
      const result = ConfigHelper.removeAppFromConfig(configWithApps, 'app1');

      expect(result.apps).toHaveLength(1);
      expect(result.apps[0].id).toBe('app2');
    });

    it('should throw error for non-existent app', () => {
      expect(() => {
        ConfigHelper.removeAppFromConfig(configWithApps, 'non-existent');
      }).toThrow('App with ID "non-existent" not found');
    });
  });

  describe('filterAppsByStatus', () => {
    let configWithApps: SiteConfig;

    beforeEach(() => {
      const activeApp = ConfigHelper.createAppConfig({ id: 'active', name: 'Active App', status: 'active' });
      const betaApp = ConfigHelper.createAppConfig({ id: 'beta', name: 'Beta App', status: 'beta' });
      const archivedApp = ConfigHelper.createAppConfig({ id: 'archived', name: 'Archived App', status: 'archived' });

      configWithApps = {
        ...ConfigHelper.createDefaultSiteConfig(),
        apps: [activeApp, betaApp, archivedApp]
      };
    });

    it('should filter apps by active status', () => {
      const result = ConfigHelper.filterAppsByStatus(configWithApps, 'active');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('active');
    });

    it('should filter apps by beta status', () => {
      const result = ConfigHelper.filterAppsByStatus(configWithApps, 'beta');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('beta');
    });

    it('should return empty array for status with no matches', () => {
      const configWithoutBeta = {
        ...configWithApps,
        apps: configWithApps.apps.filter(app => app.status !== 'beta')
      };
      
      const result = ConfigHelper.filterAppsByStatus(configWithoutBeta, 'beta');
      expect(result).toHaveLength(0);
    });
  });

  describe('getFeaturedApps', () => {
    it('should return only featured apps', () => {
      const featuredApp = ConfigHelper.createAppConfig({ id: 'featured', name: 'Featured App', featured: true });
      const normalApp = ConfigHelper.createAppConfig({ id: 'normal', name: 'Normal App', featured: false });

      const config = {
        ...ConfigHelper.createDefaultSiteConfig(),
        apps: [featuredApp, normalApp]
      };

      const result = ConfigHelper.getFeaturedApps(config);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('featured');
    });
  });

  describe('filterAppsByTag', () => {
    it('should return apps with specified tag', () => {
      const reactApp = ConfigHelper.createAppConfig({ id: 'react-app', name: 'React App', tags: ['React', 'TypeScript'] });
      const vueApp = ConfigHelper.createAppConfig({ id: 'vue-app', name: 'Vue App', tags: ['Vue', 'JavaScript'] });

      const config = {
        ...ConfigHelper.createDefaultSiteConfig(),
        apps: [reactApp, vueApp]
      };

      const result = ConfigHelper.filterAppsByTag(config, 'React');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('react-app');
    });
  });

  describe('getAllTags', () => {
    it('should return unique sorted tags', () => {
      const app1 = ConfigHelper.createAppConfig({ id: 'app1', name: 'App 1', tags: ['React', 'TypeScript', 'CSS'] });
      const app2 = ConfigHelper.createAppConfig({ id: 'app2', name: 'App 2', tags: ['Vue', 'TypeScript', 'HTML'] });

      const config = {
        ...ConfigHelper.createDefaultSiteConfig(),
        apps: [app1, app2]
      };

      const result = ConfigHelper.getAllTags(config);
      expect(result).toEqual(['CSS', 'HTML', 'React', 'TypeScript', 'Vue']);
    });

    it('should return empty array for config with no apps', () => {
      const config = ConfigHelper.createDefaultSiteConfig();
      const result = ConfigHelper.getAllTags(config);
      expect(result).toEqual([]);
    });
  });

  describe('generateAppId', () => {
    it('should generate valid ID from name', () => {
      expect(ConfigHelper.generateAppId('My Awesome App')).toBe('my-awesome-app');
      expect(ConfigHelper.generateAppId('React & TypeScript Project')).toBe('react-typescript-project');
      expect(ConfigHelper.generateAppId('  Multiple   Spaces  ')).toBe('multiple-spaces');
      expect(ConfigHelper.generateAppId('Special!@#$%Characters')).toBe('specialcharacters');
    });

    it('should handle edge cases', () => {
      expect(ConfigHelper.generateAppId('')).toBe('');
      expect(ConfigHelper.generateAppId('---')).toBe('');
      expect(ConfigHelper.generateAppId('123 Numbers')).toBe('123-numbers');
    });
  });

  describe('isValidAppId', () => {
    it('should validate correct IDs', () => {
      expect(ConfigHelper.isValidAppId('valid-id')).toBe(true);
      expect(ConfigHelper.isValidAppId('app123')).toBe(true);
      expect(ConfigHelper.isValidAppId('my-awesome-app-2024')).toBe(true);
    });

    it('should reject invalid IDs', () => {
      expect(ConfigHelper.isValidAppId('-invalid')).toBe(false);
      expect(ConfigHelper.isValidAppId('invalid-')).toBe(false);
      expect(ConfigHelper.isValidAppId('Invalid_ID')).toBe(false);
      expect(ConfigHelper.isValidAppId('invalid ID')).toBe(false);
      expect(ConfigHelper.isValidAppId('invalid.id')).toBe(false);
    });
  });
});