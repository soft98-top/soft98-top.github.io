/**
 * Main application entry point
 * Handles app loading and initialization
 */

import { AppLoader } from './app-loader.js';
import { MobileHandler } from './mobile-handler.js';
import { PerformanceOptimizer } from './performance-optimizer.js';

class NavigationApp {
  constructor() {
    this.appLoader = new AppLoader();
    this.mobileHandler = new MobileHandler();
    this.performanceOptimizer = new PerformanceOptimizer();
    this.init();
  }

  async init() {
    try {
      await this.appLoader.loadApps();
      this.setupEventListeners();
      
      // Refresh mobile interactions after apps are loaded
      this.mobileHandler.refreshInteractions();
      
      // Refresh lazy loading for new images
      this.performanceOptimizer.refreshLazyImages();
    } catch (error) {
      console.error('Failed to initialize navigation app:', error);
      this.showError('Failed to load applications. Please try again later.');
    }
  }

  setupEventListeners() {
    // Handle external link clicks
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[target="_blank"]');
      if (link) {
        // Add analytics or tracking here if needed
        console.log(`External link clicked: ${link.href}`);
      }
    });

    // Handle keyboard navigation
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        const focusedCard = document.activeElement.closest('.app-card');
        if (focusedCard) {
          const primaryLink = focusedCard.querySelector('.btn-primary');
          if (primaryLink) {
            event.preventDefault();
            primaryLink.click();
          }
        }
      }
    });
  }

  showError(message) {
    const appGrid = document.getElementById('app-grid');
    appGrid.innerHTML = `
      <div class="error-message">
        <h3>Oops! Something went wrong</h3>
        <p>${message}</p>
        <button onclick="location.reload()" class="btn btn-primary">Retry</button>
      </div>
    `;
  }
}

// Global functions for filter actions (used in no-results template)
window.clearAllFilters = function() {
  if (window.filterManager) {
    window.filterManager.clearAllFilters();
  }
};

window.focusSearch = function() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.focus();
  }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new NavigationApp();
});