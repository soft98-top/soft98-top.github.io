/**
 * Filter Manager Tests
 * Basic tests for search and filtering functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FilterManager } from './filter-manager.js';

// Mock DOM elements
const mockDOM = () => {
  document.body.innerHTML = `
    <div id="search-input"></div>
    <div id="clear-search"></div>
    <div id="tag-filters"></div>
    <div id="clear-filters"></div>
    <div id="results-info"></div>
    <div id="app-grid"></div>
  `;
};

const mockApps = [
  {
    id: 'time-tracker',
    name: 'Time Tracker',
    description: 'A flexible time management tool',
    tags: ['React', 'TypeScript', 'PWA', 'Productivity']
  },
  {
    id: 'portfolio',
    name: 'Portfolio Website',
    description: 'A modern portfolio website',
    tags: ['HTML', 'CSS', 'JavaScript', 'Portfolio']
  },
  {
    id: 'task-manager',
    name: 'Task Manager',
    description: 'A simple task management application',
    tags: ['React', 'TypeScript', 'Productivity']
  }
];

describe('FilterManager', () => {
  let filterManager;

  beforeEach(() => {
    mockDOM();
    filterManager = new FilterManager(mockApps);
  });

  describe('initialization', () => {
    it('should initialize with apps data', () => {
      expect(filterManager.apps).toEqual(mockApps);
      expect(filterManager.filteredApps).toEqual(mockApps);
    });

    it('should extract all unique tags', () => {
      const expectedTags = new Set(['React', 'TypeScript', 'PWA', 'Productivity', 'HTML', 'CSS', 'JavaScript', 'Portfolio']);
      expect(filterManager.allTags).toEqual(expectedTags);
    });
  });

  describe('search functionality', () => {
    it('should filter apps by search term', () => {
      filterManager.searchTerm = 'time';
      filterManager.applyFilters();
      
      expect(filterManager.filteredApps).toHaveLength(1);
      expect(filterManager.filteredApps[0].id).toBe('time-tracker');
    });

    it('should be case insensitive', () => {
      filterManager.searchTerm = 'TIME';
      filterManager.applyFilters();
      
      expect(filterManager.filteredApps).toHaveLength(1);
      expect(filterManager.filteredApps[0].id).toBe('time-tracker');
    });

    it('should search in description', () => {
      filterManager.searchTerm = 'portfolio';
      filterManager.applyFilters();
      
      expect(filterManager.filteredApps).toHaveLength(1);
      expect(filterManager.filteredApps[0].id).toBe('portfolio');
    });

    it('should search in tags', () => {
      filterManager.searchTerm = 'React';
      filterManager.applyFilters();
      
      expect(filterManager.filteredApps).toHaveLength(2);
      expect(filterManager.filteredApps.map(app => app.id)).toContain('time-tracker');
      expect(filterManager.filteredApps.map(app => app.id)).toContain('task-manager');
    });
  });

  describe('tag filtering', () => {
    it('should filter apps by single tag', () => {
      filterManager.activeTags.add('PWA');
      filterManager.applyFilters();
      
      expect(filterManager.filteredApps).toHaveLength(1);
      expect(filterManager.filteredApps[0].id).toBe('time-tracker');
    });

    it('should filter apps by multiple tags (AND logic)', () => {
      filterManager.activeTags.add('React');
      filterManager.activeTags.add('TypeScript');
      filterManager.applyFilters();
      
      expect(filterManager.filteredApps).toHaveLength(2);
      expect(filterManager.filteredApps.map(app => app.id)).toContain('time-tracker');
      expect(filterManager.filteredApps.map(app => app.id)).toContain('task-manager');
    });

    it('should return no results for non-matching tag combination', () => {
      filterManager.activeTags.add('React');
      filterManager.activeTags.add('HTML');
      filterManager.applyFilters();
      
      expect(filterManager.filteredApps).toHaveLength(0);
    });
  });

  describe('combined filtering', () => {
    it('should combine search and tag filters', () => {
      filterManager.searchTerm = 'simple';
      filterManager.activeTags.add('React');
      filterManager.applyFilters();
      
      expect(filterManager.filteredApps).toHaveLength(1);
      expect(filterManager.filteredApps[0].id).toBe('task-manager');
    });

    it('should return no results when search and tags dont match', () => {
      filterManager.searchTerm = 'portfolio';
      filterManager.activeTags.add('React');
      filterManager.applyFilters();
      
      expect(filterManager.filteredApps).toHaveLength(0);
    });
  });

  describe('utility methods', () => {
    it('should get correct tag count', () => {
      expect(filterManager.getTagCount('React')).toBe(2);
      expect(filterManager.getTagCount('PWA')).toBe(1);
      expect(filterManager.getTagCount('NonExistent')).toBe(0);
    });

    it('should get active filters', () => {
      filterManager.searchTerm = 'test';
      filterManager.activeTags.add('React');
      filterManager.activeTags.add('TypeScript');
      
      const filters = filterManager.getActiveFilters();
      expect(filters.searchTerm).toBe('test');
      expect(filters.activeTags).toEqual(['React', 'TypeScript']);
    });

    it('should set filters', () => {
      filterManager.setFilters({
        searchTerm: 'new search',
        activeTags: ['HTML', 'CSS']
      });
      
      expect(filterManager.searchTerm).toBe('new search');
      expect(filterManager.activeTags).toEqual(new Set(['HTML', 'CSS']));
    });
  });

  describe('app updates', () => {
    it('should update apps and re-initialize', () => {
      const newApps = [
        {
          id: 'new-app',
          name: 'New App',
          description: 'A new application',
          tags: ['Vue', 'JavaScript']
        }
      ];
      
      filterManager.updateApps(newApps);
      
      expect(filterManager.apps).toEqual(newApps);
      expect(filterManager.filteredApps).toEqual(newApps);
      expect(filterManager.allTags).toEqual(new Set(['Vue', 'JavaScript']));
    });
  });
});