import { describe, it, expect } from 'vitest';
import { ConfigValidator } from './config-validator.js';
import { AppData } from '../types/app.js';

describe('ConfigValidator', () => {
  let validator: ConfigValidator;

  beforeEach(() => {
    validator = new ConfigValidator();
  });

  describe('validate', () => {
    it('should validate a correct configuration', () => {
      const config = {
        title: 'Test Site',
        description: 'Test Description',
        author: 'Test Author',
        social: {
          github: 'https://github.com/test',
          email: 'test@example.com'
        },
        apps: [
          {
            id: 'test-app',
            name: 'Test App',
            description: 'Test Description',
            url: 'https://example.com',
            image: 'test.png',
            tags: ['React', 'TypeScript'],
            status: 'active',
            featured: true
          }
        ]
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-object configuration', () => {
      const result = validator.validate(null);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('root');
      expect(result.errors[0].message).toBe('Configuration must be an object');
    });

    it('should reject configuration without apps array', () => {
      const config = { title: 'Test' };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('apps');
      expect(result.errors[0].message).toBe('Apps must be an array');
    });

    it('should validate required app fields', () => {
      const config = {
        apps: [
          {
            id: 'test-app',
            // missing required fields
          }
        ]
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      
      const requiredFields = ['name', 'description', 'url', 'image', 'tags', 'status', 'featured'];
      requiredFields.forEach(field => {
        expect(result.errors.some(error => error.field === `apps[0].${field}`)).toBe(true);
      });
    });

    it('should validate app status values', () => {
      const config = {
        apps: [
          {
            id: 'test-app',
            name: 'Test App',
            description: 'Test Description',
            url: 'https://example.com',
            image: 'test.png',
            tags: ['React'],
            status: 'invalid-status',
            featured: true
          }
        ]
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.field === 'apps[0].status' && 
        error.message.includes('must be one of: active, beta, archived')
      )).toBe(true);
    });

    it('should validate URL formats', () => {
      const config = {
        apps: [
          {
            id: 'test-app',
            name: 'Test App',
            description: 'Test Description',
            url: 'invalid-url',
            sourceUrl: 'also-invalid',
            image: 'test.png',
            tags: ['React'],
            status: 'active',
            featured: true
          }
        ]
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.field === 'apps[0].url')).toBe(true);
      expect(result.errors.some(error => error.field === 'apps[0].sourceUrl')).toBe(true);
    });

    it('should validate tag array elements', () => {
      const config = {
        apps: [
          {
            id: 'test-app',
            name: 'Test App',
            description: 'Test Description',
            url: 'https://example.com',
            image: 'test.png',
            tags: ['React', 123, 'TypeScript'], // invalid tag type
            status: 'active',
            featured: true
          }
        ]
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.field === 'apps[0].tags[1]')).toBe(true);
    });

    it('should reject empty app IDs', () => {
      const config = {
        apps: [
          {
            id: '   ', // empty/whitespace ID
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

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.field === 'apps[0].id' && 
        error.message === 'ID cannot be empty'
      )).toBe(true);
    });

    it('should validate optional site information', () => {
      const config = {
        title: 123, // invalid type
        description: true, // invalid type
        author: [], // invalid type
        social: 'invalid', // invalid type
        apps: []
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.field === 'title')).toBe(true);
      expect(result.errors.some(error => error.field === 'description')).toBe(true);
      expect(result.errors.some(error => error.field === 'author')).toBe(true);
      expect(result.errors.some(error => error.field === 'social')).toBe(true);
    });

    it('should validate social links', () => {
      const config = {
        social: {
          github: 123, // invalid type
          email: true // invalid type
        },
        apps: []
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.field === 'social.github')).toBe(true);
      expect(result.errors.some(error => error.field === 'social.email')).toBe(true);
    });
  });

  describe('validateUniqueIds', () => {
    it('should pass for unique IDs', () => {
      const apps: AppData[] = [
        { id: 'app1', name: 'App 1', description: 'Desc 1', url: 'https://example.com/1', image: 'img1.png', tags: [], status: 'active', featured: false },
        { id: 'app2', name: 'App 2', description: 'Desc 2', url: 'https://example.com/2', image: 'img2.png', tags: [], status: 'active', featured: false }
      ];

      const errors = ConfigValidator.validateUniqueIds(apps);
      expect(errors).toHaveLength(0);
    });

    it('should detect duplicate IDs', () => {
      const apps: AppData[] = [
        { id: 'app1', name: 'App 1', description: 'Desc 1', url: 'https://example.com/1', image: 'img1.png', tags: [], status: 'active', featured: false },
        { id: 'app1', name: 'App 2', description: 'Desc 2', url: 'https://example.com/2', image: 'img2.png', tags: [], status: 'active', featured: false }
      ];

      const errors = ConfigValidator.validateUniqueIds(apps);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('apps[1].id');
      expect(errors[0].message).toBe('Duplicate app ID: app1');
    });

    it('should detect multiple duplicate IDs', () => {
      const apps: AppData[] = [
        { id: 'app1', name: 'App 1', description: 'Desc 1', url: 'https://example.com/1', image: 'img1.png', tags: [], status: 'active', featured: false },
        { id: 'app1', name: 'App 2', description: 'Desc 2', url: 'https://example.com/2', image: 'img2.png', tags: [], status: 'active', featured: false },
        { id: 'app2', name: 'App 3', description: 'Desc 3', url: 'https://example.com/3', image: 'img3.png', tags: [], status: 'active', featured: false },
        { id: 'app2', name: 'App 4', description: 'Desc 4', url: 'https://example.com/4', image: 'img4.png', tags: [], status: 'active', featured: false }
      ];

      const errors = ConfigValidator.validateUniqueIds(apps);
      expect(errors).toHaveLength(2);
      expect(errors[0].field).toBe('apps[1].id');
      expect(errors[1].field).toBe('apps[3].id');
    });
  });
});