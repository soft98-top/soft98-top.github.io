/**
 * Filter Manager
 * Handles search and tag filtering functionality
 */

export class FilterManager {
  constructor(apps = []) {
    this.apps = apps;
    this.filteredApps = [...apps];
    this.searchTerm = '';
    this.activeTags = new Set();
    this.allTags = new Set();
    
    // DOM elements
    this.searchInput = document.getElementById('search-input');
    this.clearSearchBtn = document.getElementById('clear-search');
    this.tagFiltersContainer = document.getElementById('tag-filters');
    this.clearFiltersBtn = document.getElementById('clear-filters');
    this.resultsInfo = document.getElementById('results-info');
    this.appGrid = document.getElementById('app-grid');
    
    this.init();
  }

  init() {
    this.extractAllTags();
    this.renderTagFilters();
    this.setupEventListeners();
    this.updateResultsInfo();
  }

  setupEventListeners() {
    // Search input events
    if (this.searchInput) {
      this.searchInput.addEventListener('input', this.handleSearchInput.bind(this));
      this.searchInput.addEventListener('keydown', this.handleSearchKeydown.bind(this));
    }

    // Clear search button
    if (this.clearSearchBtn) {
      this.clearSearchBtn.addEventListener('click', this.clearSearch.bind(this));
    }

    // Clear all filters button
    if (this.clearFiltersBtn) {
      this.clearFiltersBtn.addEventListener('click', this.clearAllFilters.bind(this));
    }

    // Tag filter events are handled in renderTagFilters
  }

  handleSearchInput(event) {
    const value = event.target.value.trim();
    this.searchTerm = value;
    
    // Show/hide clear button
    if (this.clearSearchBtn) {
      this.clearSearchBtn.style.display = value ? 'flex' : 'none';
    }
    
    // Debounce the filtering
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.applyFilters();
    }, 300);
  }

  handleSearchKeydown(event) {
    if (event.key === 'Escape') {
      this.clearSearch();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.applyFilters();
    }
  }

  clearSearch() {
    if (this.searchInput) {
      this.searchInput.value = '';
      this.searchInput.focus();
    }
    
    if (this.clearSearchBtn) {
      this.clearSearchBtn.style.display = 'none';
    }
    
    this.searchTerm = '';
    this.applyFilters();
  }

  clearAllFilters() {
    // Clear search
    this.clearSearch();
    
    // Clear active tags
    this.activeTags.clear();
    
    // Update tag filter UI
    const tagButtons = this.tagFiltersContainer?.querySelectorAll('.tag-filter');
    tagButtons?.forEach(button => {
      button.classList.remove('active');
      button.setAttribute('aria-pressed', 'false');
    });
    
    // Hide clear filters button
    if (this.clearFiltersBtn) {
      this.clearFiltersBtn.style.display = 'none';
    }
    
    this.applyFilters();
  }

  extractAllTags() {
    this.allTags.clear();
    
    this.apps.forEach(app => {
      if (app.tags && Array.isArray(app.tags)) {
        app.tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            this.allTags.add(tag.trim());
          }
        });
      }
    });
  }

  renderTagFilters() {
    if (!this.tagFiltersContainer) return;

    if (this.allTags.size === 0) {
      this.tagFiltersContainer.innerHTML = `
        <div class="no-tags-message">
          <span>No tags available</span>
        </div>
      `;
      return;
    }

    // Sort tags alphabetically
    const sortedTags = Array.from(this.allTags).sort();
    
    // Create tag filter buttons
    const tagButtons = sortedTags.map(tag => {
      const count = this.getTagCount(tag);
      return `
        <button 
          type="button" 
          class="tag-filter" 
          data-tag="${this.escapeHtml(tag)}"
          aria-pressed="false"
          title="Filter by ${this.escapeHtml(tag)} (${count} project${count !== 1 ? 's' : ''})"
        >
          <span class="tag-filter-text">${this.escapeHtml(tag)}</span>
          <span class="tag-filter-count">${count}</span>
        </button>
      `;
    }).join('');

    this.tagFiltersContainer.innerHTML = tagButtons;

    // Add event listeners to tag buttons
    const buttons = this.tagFiltersContainer.querySelectorAll('.tag-filter');
    buttons.forEach(button => {
      button.addEventListener('click', this.handleTagClick.bind(this));
      button.addEventListener('keydown', this.handleTagKeydown.bind(this));
    });
  }

  handleTagClick(event) {
    const button = event.currentTarget;
    const tag = button.dataset.tag;
    
    if (!tag) return;

    const isActive = button.classList.contains('active');
    
    if (isActive) {
      // Remove tag from active filters
      this.activeTags.delete(tag);
      button.classList.remove('active');
      button.setAttribute('aria-pressed', 'false');
    } else {
      // Add tag to active filters
      this.activeTags.add(tag);
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
    }

    // Show/hide clear filters button
    this.updateClearFiltersButton();
    
    this.applyFilters();
  }

  handleTagKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleTagClick(event);
    }
  }

  getTagCount(tag) {
    return this.apps.filter(app => 
      app.tags && app.tags.includes(tag)
    ).length;
  }

  updateClearFiltersButton() {
    if (!this.clearFiltersBtn) return;
    
    const hasActiveFilters = this.activeTags.size > 0 || this.searchTerm;
    this.clearFiltersBtn.style.display = hasActiveFilters ? 'block' : 'none';
  }

  applyFilters() {
    this.filteredApps = this.apps.filter(app => {
      return this.matchesSearch(app) && this.matchesTags(app);
    });

    this.updateResultsInfo();
    this.updateAppGrid();
    this.updateClearFiltersButton();
  }

  matchesSearch(app) {
    if (!this.searchTerm) return true;

    const searchLower = this.searchTerm.toLowerCase();
    const searchableText = [
      app.name,
      app.description,
      app.longDescription,
      ...(app.tags || [])
    ].join(' ').toLowerCase();

    return searchableText.includes(searchLower);
  }

  matchesTags(app) {
    if (this.activeTags.size === 0) return true;

    if (!app.tags || !Array.isArray(app.tags)) return false;

    // Check if app has ALL active tags (AND logic)
    return Array.from(this.activeTags).every(tag => 
      app.tags.includes(tag)
    );
  }

  updateResultsInfo() {
    if (!this.resultsInfo) return;

    const totalApps = this.apps.length;
    const filteredCount = this.filteredApps.length;
    const hasFilters = this.searchTerm || this.activeTags.size > 0;

    let message = '';
    
    if (!hasFilters) {
      message = `Showing all ${totalApps} project${totalApps !== 1 ? 's' : ''}`;
    } else if (filteredCount === 0) {
      message = 'No projects match your filters';
    } else if (filteredCount === totalApps) {
      message = `All ${totalApps} project${totalApps !== 1 ? 's' : ''} match your filters`;
    } else {
      message = `Showing ${filteredCount} of ${totalApps} project${totalApps !== 1 ? 's' : ''}`;
    }

    this.resultsInfo.textContent = message;
    this.resultsInfo.className = hasFilters ? 'results-info has-filters' : 'results-info';
  }

  updateAppGrid() {
    if (!this.appGrid) return;

    const appCards = this.appGrid.querySelectorAll('.app-card');
    
    if (this.filteredApps.length === 0) {
      this.showNoResults();
      return;
    }

    // Hide no-results if it exists
    const noResults = this.appGrid.querySelector('.no-results');
    if (noResults) {
      noResults.remove();
    }

    // Filter app cards
    appCards.forEach(card => {
      const appId = card.dataset.id;
      const shouldShow = this.filteredApps.some(app => app.id === appId);
      
      if (shouldShow) {
        card.classList.remove('filtered-out');
        card.classList.add('filtered-in');
        card.style.display = '';
        card.setAttribute('aria-hidden', 'false');
      } else {
        card.classList.remove('filtered-in');
        card.classList.add('filtered-out');
        card.setAttribute('aria-hidden', 'true');
        
        // Hide completely after animation
        setTimeout(() => {
          if (card.classList.contains('filtered-out')) {
            card.style.display = 'none';
          }
        }, 300);
      }
    });
  }

  showNoResults() {
    // Remove existing no-results
    const existingNoResults = this.appGrid.querySelector('.no-results');
    if (existingNoResults) {
      existingNoResults.remove();
    }

    // Hide all app cards
    const appCards = this.appGrid.querySelectorAll('.app-card');
    appCards.forEach(card => {
      card.style.display = 'none';
      card.setAttribute('aria-hidden', 'true');
    });

    // Create no results message
    const noResultsHtml = `
      <div class="no-results" role="status">
        <div class="no-results-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </div>
        <div class="no-results-content">
          <h3 class="no-results-title">No Projects Found</h3>
          <p class="no-results-message">
            ${this.getNoResultsMessage()}
          </p>
          <div class="no-results-actions">
            <button class="btn btn-primary" onclick="window.clearAllFilters()">
              Clear Filters
            </button>
            <button class="btn btn-secondary" onclick="window.focusSearch()">
              Try Different Search
            </button>
          </div>
        </div>
      </div>
    `;

    this.appGrid.insertAdjacentHTML('beforeend', noResultsHtml);
  }

  getNoResultsMessage() {
    const hasSearch = this.searchTerm;
    const hasTags = this.activeTags.size > 0;

    if (hasSearch && hasTags) {
      const tagList = Array.from(this.activeTags).join(', ');
      return `No projects match "${this.searchTerm}" with tags: ${tagList}`;
    } else if (hasSearch) {
      return `No projects match "${this.searchTerm}". Try a different search term.`;
    } else if (hasTags) {
      const tagList = Array.from(this.activeTags).join(', ');
      return `No projects have all the selected tags: ${tagList}`;
    } else {
      return 'Try adjusting your search or filter criteria.';
    }
  }

  updateApps(newApps) {
    this.apps = newApps || [];
    this.filteredApps = [...this.apps];
    this.extractAllTags();
    this.renderTagFilters();
    this.applyFilters();
  }

  getFilteredApps() {
    return this.filteredApps;
  }

  getActiveFilters() {
    return {
      searchTerm: this.searchTerm,
      activeTags: Array.from(this.activeTags)
    };
  }

  setFilters(filters) {
    if (filters.searchTerm !== undefined) {
      this.searchTerm = filters.searchTerm;
      if (this.searchInput) {
        this.searchInput.value = this.searchTerm;
      }
    }

    if (filters.activeTags && Array.isArray(filters.activeTags)) {
      this.activeTags = new Set(filters.activeTags);
      
      // Update tag button states
      const tagButtons = this.tagFiltersContainer?.querySelectorAll('.tag-filter');
      tagButtons?.forEach(button => {
        const tag = button.dataset.tag;
        const isActive = this.activeTags.has(tag);
        
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', isActive.toString());
      });
    }

    this.applyFilters();
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  destroy() {
    // Clean up event listeners and timers
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Remove event listeners
    if (this.searchInput) {
      this.searchInput.removeEventListener('input', this.handleSearchInput);
      this.searchInput.removeEventListener('keydown', this.handleSearchKeydown);
    }
    
    if (this.clearSearchBtn) {
      this.clearSearchBtn.removeEventListener('click', this.clearSearch);
    }
    
    if (this.clearFiltersBtn) {
      this.clearFiltersBtn.removeEventListener('click', this.clearAllFilters);
    }
  }
}