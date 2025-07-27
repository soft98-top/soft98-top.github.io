/**
 * AppCard component
 * Handles individual app card rendering and interactions
 */

export class AppCard {
  constructor(appData) {
    this.data = appData;
    this.element = null;
  }

  render() {
    const tagsHtml = this.data.tags
      ? this.data.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')
      : '';

    const featuredClass = this.data.featured ? 'featured' : '';
    const sourceButton = this.data.sourceUrl 
      ? `<a href="${this.escapeHtml(this.data.sourceUrl)}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer" aria-label="View source code for ${this.escapeHtml(this.data.name)}">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
             <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
           </svg>
           Source
         </a>`
      : '';

    const longDescription = this.data.longDescription || this.data.description;

    const cardHtml = `
      <div class="app-card ${featuredClass}" 
           data-id="${this.escapeHtml(this.data.id)}"
           tabindex="0"
           role="article"
           aria-label="Application: ${this.escapeHtml(this.data.name)}">
        <div class="app-image">
          <img data-src="${this.escapeHtml(this.data.image)}" 
               src="${this.getPlaceholderImage()}"
               alt="${this.escapeHtml(this.data.name)} preview" 
               class="lazy-image"
               onerror="this.src='${this.getErrorPlaceholderImage()}'">
          <div class="app-overlay">
            <div class="overlay-content">
              <p class="overlay-description">${this.escapeHtml(longDescription)}</p>
              <div class="overlay-actions">
                <a href="${this.escapeHtml(this.data.url)}" class="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7zM19 19H5V5h7V3H5c-1.11 0-2 .89-2 2v14c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2v-7h-2v7z"/>
                  </svg>
                  Launch
                </a>
              </div>
            </div>
          </div>
        </div>
        <div class="app-content">
          <h3 class="app-title">${this.escapeHtml(this.data.name)}</h3>
          <p class="app-description">${this.escapeHtml(this.data.description)}</p>
          ${tagsHtml ? `<div class="app-tags">${tagsHtml}</div>` : ''}
          <div class="app-actions">
            <a href="${this.escapeHtml(this.data.url)}" 
               class="btn btn-primary" 
               target="_blank" 
               rel="noopener noreferrer"
               aria-label="Open ${this.escapeHtml(this.data.name)} application">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7zM19 19H5V5h7V3H5c-1.11 0-2 .89-2 2v14c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2v-7h-2v7z"/>
              </svg>
              Live Demo
            </a>
            ${sourceButton}
          </div>
        </div>
      </div>
    `;

    // Create DOM element
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cardHtml;
    this.element = tempDiv.firstElementChild;

    // Add event listeners
    this.addEventListeners();

    return this.element;
  }

  addEventListeners() {
    if (!this.element) return;

    // Hover effects
    this.element.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    this.element.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

    // Keyboard navigation
    this.element.addEventListener('keydown', this.handleKeyDown.bind(this));

    // Focus management
    this.element.addEventListener('focus', this.handleFocus.bind(this));
    this.element.addEventListener('blur', this.handleBlur.bind(this));

    // Click analytics
    const links = this.element.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', (event) => {
        this.trackClick(event.target, this.data);
      });
    });
  }

  handleMouseEnter() {
    this.element.classList.add('hovered');
    
    // Add subtle animation to tags
    const tags = this.element.querySelectorAll('.tag');
    tags.forEach((tag, index) => {
      setTimeout(() => {
        tag.style.transform = 'translateY(-2px)';
      }, index * 50);
    });
  }

  handleMouseLeave() {
    this.element.classList.remove('hovered');
    
    // Reset tag animations
    const tags = this.element.querySelectorAll('.tag');
    tags.forEach(tag => {
      tag.style.transform = '';
    });
  }

  handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const primaryButton = this.element.querySelector('.btn-primary');
      if (primaryButton) {
        primaryButton.click();
      }
    }
  }

  handleFocus() {
    this.element.classList.add('focused');
  }

  handleBlur() {
    this.element.classList.remove('focused');
  }

  trackClick(element, appData) {
    const isSourceLink = element.classList.contains('btn-secondary');
    const action = isSourceLink ? 'source_view' : 'demo_launch';
    
    // Log for analytics (can be replaced with actual analytics service)
    console.log('App interaction:', {
      app_id: appData.id,
      app_name: appData.name,
      action: action,
      timestamp: new Date().toISOString()
    });

    // Could integrate with Google Analytics, Mixpanel, etc.
    if (typeof gtag !== 'undefined') {
      gtag('event', 'app_interaction', {
        app_id: appData.id,
        action: action
      });
    }
  }

  getPlaceholderImage() {
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="320" height="200" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="200" fill="#F3F4F6"/>
        <rect x="120" y="70" width="80" height="60" rx="8" fill="#9CA3AF"/>
        <rect x="100" y="150" width="120" height="8" rx="4" fill="#9CA3AF"/>
        <rect x="110" y="165" width="100" height="6" rx="3" fill="#D1D5DB"/>
        <text x="160" y="45" text-anchor="middle" fill="#6B7280" font-family="system-ui" font-size="12">Loading...</text>
      </svg>
    `)}`;
  }

  getErrorPlaceholderImage() {
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="320" height="200" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="200" fill="#FEF2F2"/>
        <rect x="120" y="70" width="80" height="60" rx="8" fill="#FCA5A5"/>
        <text x="160" y="45" text-anchor="middle" fill="#EF4444" font-family="system-ui" font-size="12">Failed to load</text>
      </svg>
    `)}`;
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Static method to create and render a card
  static create(appData) {
    const card = new AppCard(appData);
    return card.render();
  }
}