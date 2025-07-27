import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigLoader, ConfigValidationError, loadSiteConfig, validateSiteConfig } from './config-loader.js';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ConfigLoader', () => {
  let loader: ConfigLoader;

  beforeEach(() => {
    loader = new ConfigLoader();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('should load and validate a correct configuration', async () => {
      const mockConfig = {
        title: 'Test Site',
        apps: [
          {
            id: 'test-app',
            name: 'Test App',
            description: 'Test Description',
            url: 'https://example.com',
            image: 'test.png',
            tags: ['React'],
            status: 'active',
            featured: true
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfig)
      });

      const result = await loader.loadConfig();
      
      expect(result.title).toBe('Test Site');
      expect(result.apps).toHaveLength(1);
      expect(result.apps[0].id).toBe('test-app');
      expect(mockFetch).toHaveBeenCalledWith('/apps.json');
    });

    it('should return default config when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await loader.loadConfig();
      
      expect(result.title).toBe('Soft98 Top');
      expect(result.apps).toHaveLength(0);
    });

    it('should return default config when JSON parsing fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      const result = await loader.loadConfig();
      
      expect(result.title).toBe('Soft98 Top');
      expect(result.apps).toHaveLength(0);
    });

    it('should return default config when validation fails', async () => {
      const invalidConfig = {
        apps: 'not-an-array' // invalid
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidConfig)
      });

      const result = await loader.loadConfig();
      
      expect(result.title).toBe('Soft98 Top');
      expect(result.apps).toHaveLength(0);
    });

    it('should process config with default values', async () => {
      const mockConfig = {
        apps: [
          {
            id: 'test-app',
            name: 'Test App',
            description: 'Test Description',
            url: 'https://example.com',
            image: 'test.png',
            tags: [], // required field
            status: 'active',
            featured: true
            // missing optional fields like createdAt, updatedAt
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfig)
      });

      const result = await loader.loadConfig();
      
      expect(result.apps[0].tags).toEqual([]);
      expect(result.apps[0].createdAt).toBeDefined();
      expect(result.apps[0].updatedAt).toBeDefined();
    });

    it('should throw error for duplicate app IDs', async () => {
      const mockConfig = {
        apps: [
          {
            id: 'duplicate-id',
            name: 'App 1',
            description: 'Description 1',
            url: 'https://example.com/1',
            image: 'test1.png',
            tags: [],
            status: 'active',
            featured: false
          },
          {
            id: 'duplicate-id',
            name: 'App 2',
            description: 'Description 2',
            url: 'https://example.com/2',
            image: 'test2.png',
            tags: [],
            status: 'active',
            featured: false
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfig)
      });

      const result = await loader.loadConfig();
      
      // Should return default config due to validation error
      expect(result.title).toBe('Soft98 Top');
      expect(result.apps).toHaveLength(0);
    });

    it('should use custom config path', async () => {
      const customPath = '/custom-config.json';
      const mockConfig = { apps: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfig)
      });

      await loader.loadConfig(customPath);
      
      expect(mockFetch).toHaveBeenCalledWith(customPath);
    });
  });

  describe('reloadConfig', () => {
    it('should bypass cache and reload config', async () => {
      const mockConfig = { apps: [] };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockConfig)
      });

      // First load
      await loader.loadConfig();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second load (should use cache)
      await loader.loadConfig();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Reload (should bypass cache)
      await loader.reloadConfig();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateConfig', () => {
    it('should validate a correct configuration', async () => {
      const mockConfig = {
        apps: [
          {
            id: 'test-app',
            name: 'Test App',
            description: 'Test Description',
            url: 'https://example.com',
            image: 'test.png',
            tags: ['React'],
            status: 'active',
            featured: true
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfig)
      });

      const result = await loader.validateConfig();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors for invalid configuration', async () => {
      const invalidConfig = {
        apps: [
          {
            id: 'test-app',
            // missing required fields
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidConfig)
      });

      const result = await loader.validateConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await loader.validateConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('file');
      expect(result.errors[0].message).toContain('Failed to load config file');
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      const result = await loader.validateConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('file');
      expect(result.errors[0].message).toContain('Error loading config file');
    });
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ConfigLoader.getInstance();
      const instance2 = ConfigLoader.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});

describe('Convenience functions', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('loadSiteConfig', () => {
    it('should load configuration using singleton instance', async () => {
      const mockConfig = { apps: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfig)
      });

      const result = await loadSiteConfig();
      
      expect(result).toBeDefined();
      expect(mockFetch).toHaveBeenCalledWith('/apps.json');
    });
  });

  describe('validateSiteConfig', () => {
    it('should validate configuration using singleton instance', async () => {
      const mockConfig = { apps: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfig)
      });

      const result = await validateSiteConfig();
      
      expect(result.isValid).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/apps.json');
    });
  });
});

describe('ConfigValidationError', () => {
  it('should create error with message and errors', () => {
    const errors = [
      { field: 'test', message: 'Test error', value: 'test-value' }
    ];
    
    const error = new ConfigValidationError('Test message', errors);
    
    expect(error.message).toBe('Test message');
    expect(error.name).toBe('ConfigValidationError');
    expect(error.errors).toEqual(errors);
  });
});