/**
 * App loader module
 * Handles loading and rendering of application cards
 */

import { AppCard } from './app-card.js';
import { FilterManager } from './filter-manager.js';

export class AppLoader {
  constructor() {
    this.apps = [];
    this.appGrid = document.getElementById('app-grid');
    this.filterManager = null;
    this.isLoading = false;
    this.loadingTimeout = null;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  async loadApps() {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.showLoadingState();

    try {
      // Add minimum loading time for better UX
      const loadingPromise = this.fetchAppsData();
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 800));
      
      const [data] = await Promise.all([loadingPromise, minLoadingTime]);
      
      this.apps = data.apps || [];
      this.updatePageInfo(data);
      this.validateAppsData();
      this.renderApps();
      this.initializeFilters();
      this.retryCount = 0; // Reset retry count on success
      
    } catch (error) {
      console.error('Error loading apps:', error);
      await this.handleLoadingError(error);
    } finally {
      this.isLoading = false;
      this.clearLoadingTimeout();
    }
  }

  async fetchAppsData() {
    try {
      const response = await fetch('./apps.json', {
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate basic structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid configuration format: expected object');
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch apps data:', error);
      
      // Return fallback data structure
      return {
        title: 'Soft98\'s Project',
        description: 'Personal Project Collection',
        author: 'Soft98',
        social: {
          github: 'https://github.com/soft98-top',
          email: 'soft98@foxmail.com'
        },
        apps: []
      };
    }
  }

  updatePageInfo(data) {
    try {
      // Update page title
      if (data.title) {
        try {
          document.title = data.title;
          const headerTitle = document.querySelector('.site-header h1');
          if (headerTitle) {
            headerTitle.textContent = data.title;
          }
        } catch (error) {
          console.warn('Failed to update page title:', error);
        }
      }

      // Update page description
      if (data.description) {
        try {
          const metaDescription = document.querySelector('meta[name="description"]');
          if (metaDescription) {
            metaDescription.setAttribute('content', data.description);
          }
          
          const headerSubtitle = document.querySelector('.header-subtitle');
          if (headerSubtitle) {
            headerSubtitle.textContent = data.description;
          }
        } catch (error) {
          console.warn('Failed to update page description:', error);
        }
      }

      // Update author
      if (data.author) {
        try {
          const metaAuthor = document.querySelector('meta[name="author"]');
          if (metaAuthor) {
            metaAuthor.setAttribute('content', data.author);
          }
        } catch (error) {
          console.warn('Failed to update author:', error);
        }
      }

      // Update social links
      if (data.social) {
        try {
          if (data.social.github) {
            const githubLinks = document.querySelectorAll('a[href*="github.com"]');
            githubLinks.forEach(link => {
              try {
                link.href = data.social.github;
              } catch (error) {
                console.warn('Failed to update GitHub link:', error);
              }
            });
          }

          if (data.social.email) {
            const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
            emailLinks.forEach(link => {
              try {
                link.href = `mailto:${data.social.email}`;
              } catch (error) {
                console.warn('Failed to update email link:', error);
              }
            });
          }
        } catch (error) {
          console.warn('Failed to update social links:', error);
        }
      }

      console.log('Page information updated from configuration');
    } catch (error) {
      console.error('Failed to update page information:', error);
      // Continue execution even if page info update fails
    }
  }

  validateAppsData() {
    if (!Array.isArray(this.apps)) {
      throw new Error('Invalid apps data: expected array');
    }

    // Validate each app has required fields
    this.apps.forEach((app, index) => {
      const requiredFields = ['id', 'name', 'description', 'url'];
      const missingFields = requiredFields.filter(field => !app[field]);
      
      if (missingFields.length > 0) {
        console.warn(`App at index ${index} missing required fields: ${missingFields.join(', ')}`);
      }

      // Ensure app has valid status
      if (app.status && !['active', 'beta', 'archived'].includes(app.status)) {
        console.warn(`App "${app.name}" has invalid status: ${app.status}`);
        app.status = 'active'; // Default to active
      }
    });

    // Filter out apps with missing critical data
    this.apps = this.apps.filter(app => app.id && app.name && app.url);
  }

  async handleLoadingError(error) {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`Retrying app loading (attempt ${this.retryCount}/${this.maxRetries})`);
      
      // Exponential backoff
      const delay = Math.pow(2, this.retryCount - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.loadApps();
    }

    this.showErrorState(error);
    throw error;
  }

  showLoadingState() {
    this.appGrid.innerHTML = `
      <div class="loading-container" role="status" aria-live="polite">
        <div class="loading-spinner"></div>
        <div class="loading-content">
          <h3 class="loading-title">Loading Projects</h3>
          <p class="loading-message">Fetching the latest applications...</p>
          <div class="loading-progress">
            <div class="progress-bar"></div>
          </div>
        </div>
      </div>
    `;

    // Add timeout for loading state
    this.loadingTimeout = setTimeout(() => {
      const loadingMessage = this.appGrid.querySelector('.loading-message');
      if (loadingMessage) {
        loadingMessage.textContent = 'This is taking longer than expected...';
      }
    }, 5000);
  }

  showErrorState(error) {
    const errorMessage = this.getErrorMessage(error);
    
    this.appGrid.innerHTML = `
      <div class="error-container" role="alert" aria-live="assertive">
        <div class="error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div class="error-content">
          <h3 class="error-title">Unable to Load Projects</h3>
          <p class="error-message">${this.escapeHtml(errorMessage)}</p>
          <div class="error-actions">
            <button class="btn btn-primary" onclick="location.reload()" aria-label="Reload page">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
              Try Again
            </button>
            <button class="btn btn-secondary" onclick="window.history.back()" aria-label="Go back">
              Go Back
            </button>
          </div>
          ${this.retryCount > 0 ? `<p class="retry-info">Attempted ${this.retryCount} time(s)</p>` : ''}
        </div>
      </div>
    `;
  }

  renderApps() {
    if (!this.apps.length) {
      this.showEmptyState();
      return;
    }

    // Sort apps: featured first, then by name
    const sortedApps = [...this.apps].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });

    // Clear the grid and prepare for rendering
    this.appGrid.innerHTML = '';
    this.appGrid.classList.add('apps-loaded');

    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();

    // Create and append app cards with individual error handling
    sortedApps.forEach((app, index) => {
      try {
        // Validate app data before rendering
        if (!app || !app.id || !app.name || !app.url) {
          console.warn(`Skipping invalid app at index ${index}:`, app);
          return;
        }

        const cardElement = AppCard.create(app);
        if (cardElement) {
          cardElement.style.animationDelay = `${(index + 1) * 0.1}s`;
          cardElement.classList.add('app-card-enter');
          fragment.appendChild(cardElement);
        } else {
          console.warn(`Failed to create card element for app "${app.name}"`);
        }
      } catch (error) {
        console.error(`Failed to render app card for "${app.name || 'unknown'}":`, error);
        
        // Create a fallback error card
        try {
          const errorCard = this.createErrorCard(app, error);
          if (errorCard) {
            errorCard.style.animationDelay = `${(index + 1) * 0.1}s`;
            errorCard.classList.add('app-card-enter');
            fragment.appendChild(errorCard);
          }
        } catch (fallbackError) {
          console.error('Failed to create error card:', fallbackError);
        }
      }
    });

    // Append all cards at once
    this.appGrid.appendChild(fragment);

    // Add global accessibility attributes
    this.enhanceAccessibility();

    // Trigger entrance animations
    requestAnimationFrame(() => {
      const cards = this.appGrid.querySelectorAll('.app-card-enter');
      cards.forEach(card => {
        card.classList.remove('app-card-enter');
        card.classList.add('app-card-visible');
      });
    });

    // Log successful render
    console.log(`Successfully rendered ${sortedApps.length} application cards`);
  }

  initializeFilters() {
    // Clean up existing filter manager
    if (this.filterManager) {
      this.filterManager.destroy();
    }

    // Create new filter manager with current apps
    this.filterManager = new FilterManager(this.apps);
    
    // Make filter manager globally accessible for no-results actions
    window.filterManager = this.filterManager;
    
    // Store reference in DOM for easy access
    const filterControls = document.getElementById('filter-controls');
    if (filterControls) {
      filterControls.setAttribute('data-initialized', 'true');
    }

    console.log('Filter system initialized with', this.apps.length, 'apps');
  }

  showEmptyState() {
    this.appGrid.innerHTML = `
      <div class="empty-state" role="status">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
        </div>
        <div class="empty-content">
          <h3 class="empty-title">No Projects Available</h3>
          <p class="empty-message">Check back later for new applications and tools!</p>
          <div class="empty-actions">
            <a href="https://github.com/soft98-top" class="btn btn-primary" target="_blank" rel="noopener">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              View GitHub
            </a>
          </div>
        </div>
      </div>
    `;
  }

  getErrorMessage(error) {
    if (error.message.includes('HTTP error')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    } else if (error.message.includes('Invalid configuration')) {
      return 'The application configuration is invalid. Please contact the administrator.';
    } else if (error.message.includes('fetch')) {
      return 'Network error occurred while loading applications. Please try again.';
    } else {
      return 'An unexpected error occurred while loading applications.';
    }
  }

  clearLoadingTimeout() {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
  }



  enhanceAccessibility() {
    const appCards = this.appGrid.querySelectorAll('.app-card');
    
    // Update grid accessibility
    this.appGrid.setAttribute('aria-label', `${appCards.length} applications available`);
    
    // Update individual card accessibility
    appCards.forEach((card, index) => {
      const appName = card.querySelector('.app-title').textContent;
      card.setAttribute('aria-label', `${appName} - Application ${index + 1} of ${appCards.length}`);
      
      // Add skip links for screen readers
      const skipLink = document.createElement('a');
      skipLink.href = '#';
      skipLink.className = 'sr-only';
      skipLink.textContent = `Skip to ${appName} actions`;
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const actions = card.querySelector('.app-actions');
        if (actions) {
          actions.querySelector('a').focus();
        }
      });
      
      card.insertBefore(skipLink, card.firstChild);
    });
  }

  createErrorCard(app, error) {
    const appName = app?.name || 'Unknown App';
    const appId = app?.id || 'unknown';
    
    const errorCardHtml = `
      <div class="app-card error-card" 
           data-id="${this.escapeHtml(appId)}"
           tabindex="0"
           role="article"
           aria-label="Error loading application: ${this.escapeHtml(appName)}">
        <div class="app-image">
          <div class="error-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Failed to load</span>
          </div>
        </div>
        <div class="app-content">
          <h3 class="app-title">${this.escapeHtml(appName)}</h3>
          <p class="app-description">This application failed to load properly. Please try refreshing the page.</p>
          <div class="app-actions">
            <button class="btn btn-secondary" onclick="location.reload()" aria-label="Refresh page">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
              Retry
            </button>
          </div>
        </div>
      </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = errorCardHtml;
    return tempDiv.firstElementChild;
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}