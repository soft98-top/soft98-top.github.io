/**
 * Mobile interaction handler
 * Manages touch interactions, mobile navigation, and responsive behaviors
 */

export class MobileHandler {
  constructor() {
    this.isMobile = this.detectMobile();
    this.isTouch = this.detectTouch();
    this.navToggle = null;
    this.navLinks = null;
    this.isNavOpen = false;
    
    this.init();
  }

  detectMobile() {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  detectTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  init() {
    this.setupMobileNavigation();
    this.setupTouchInteractions();
    this.setupViewportHandling();
    this.setupAccessibility();
    
    // Listen for resize events
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  setupMobileNavigation() {
    this.navToggle = document.querySelector('.mobile-nav-toggle');
    this.navLinks = document.querySelector('.nav-links');
    
    if (!this.navToggle || !this.navLinks) return;

    // Toggle navigation menu
    this.navToggle.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleNavigation();
    });

    // Close navigation when clicking on links
    this.navLinks.addEventListener('click', (e) => {
      if (e.target.classList.contains('nav-link')) {
        this.closeNavigation();
      }
    });

    // Close navigation when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isNavOpen && 
          !this.navToggle.contains(e.target) && 
          !this.navLinks.contains(e.target)) {
        this.closeNavigation();
      }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isNavOpen) {
        this.closeNavigation();
        this.navToggle.focus();
      }
    });
  }

  toggleNavigation() {
    if (this.isNavOpen) {
      this.closeNavigation();
    } else {
      this.openNavigation();
    }
  }

  openNavigation() {
    this.isNavOpen = true;
    this.navLinks.classList.add('open');
    this.navToggle.setAttribute('aria-expanded', 'true');
    
    // Update icon to close icon
    this.navToggle.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    `;
    
    // Focus first link for accessibility
    const firstLink = this.navLinks.querySelector('.nav-link');
    if (firstLink) {
      setTimeout(() => firstLink.focus(), 100);
    }
  }

  closeNavigation() {
    this.isNavOpen = false;
    this.navLinks.classList.remove('open');
    this.navToggle.setAttribute('aria-expanded', 'false');
    
    // Update icon to menu icon
    this.navToggle.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
      </svg>
    `;
  }

  setupTouchInteractions() {
    if (!this.isTouch) return;

    // Add touch feedback to app cards
    const appCards = document.querySelectorAll('.app-card');
    appCards.forEach(card => {
      this.addTouchFeedback(card);
    });

    // Add touch feedback to buttons
    const buttons = document.querySelectorAll('.btn, .tag-filter');
    buttons.forEach(button => {
      this.addTouchFeedback(button);
    });

    // Optimize scroll behavior for mobile
    this.optimizeScrolling();
  }

  addTouchFeedback(element) {
    let touchStartTime = 0;
    let touchStartPos = { x: 0, y: 0 };

    element.addEventListener('touchstart', (e) => {
      touchStartTime = Date.now();
      const touch = e.touches[0];
      touchStartPos = { x: touch.clientX, y: touch.clientY };
      
      element.classList.add('touch-active');
    }, { passive: true });

    element.addEventListener('touchend', (e) => {
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;
      
      // Remove active state after a short delay
      setTimeout(() => {
        element.classList.remove('touch-active');
      }, 150);

      // Handle tap if it was a quick touch
      if (touchDuration < 300) {
        this.handleTap(element, e);
      }
    }, { passive: true });

    element.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const moveDistance = Math.sqrt(
        Math.pow(touch.clientX - touchStartPos.x, 2) + 
        Math.pow(touch.clientY - touchStartPos.y, 2)
      );
      
      // Remove active state if user moves too far (scrolling)
      if (moveDistance > 10) {
        element.classList.remove('touch-active');
      }
    }, { passive: true });

    element.addEventListener('touchcancel', () => {
      element.classList.remove('touch-active');
    }, { passive: true });
  }

  handleTap(element, event) {
    // Handle app card taps
    if (element.classList.contains('app-card')) {
      const primaryButton = element.querySelector('.btn-primary');
      if (primaryButton && !event.target.closest('.btn')) {
        // Simulate click on primary button if tapping the card
        primaryButton.click();
      }
    }
  }

  optimizeScrolling() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // Optimize scroll performance
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Close mobile nav on scroll
          if (this.isNavOpen && window.scrollY > 50) {
            this.closeNavigation();
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  setupViewportHandling() {
    // Handle viewport changes (orientation, keyboard)
    const handleViewportChange = () => {
      // Close navigation on orientation change
      if (this.isNavOpen) {
        this.closeNavigation();
      }

      // Update mobile detection
      this.isMobile = this.detectMobile();
      
      // Adjust viewport height for mobile browsers
      if (this.isMobile) {
        this.setViewportHeight();
      }
    };

    window.addEventListener('orientationchange', handleViewportChange);
    window.addEventListener('resize', handleViewportChange);
    
    // Initial viewport setup
    if (this.isMobile) {
      this.setViewportHeight();
    }
  }

  setViewportHeight() {
    // Fix viewport height issues on mobile browsers
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  setupAccessibility() {
    // Improve focus management for mobile
    document.addEventListener('focusin', (e) => {
      const focusedElement = e.target;
      
      // Ensure focused elements are visible
      if (focusedElement.classList.contains('app-card') || 
          focusedElement.classList.contains('btn') ||
          focusedElement.classList.contains('nav-link')) {
        
        setTimeout(() => {
          focusedElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
          });
        }, 100);
      }
    });

    // Handle keyboard navigation for mobile
    document.addEventListener('keydown', (e) => {
      // Close mobile nav with escape
      if (e.key === 'Escape' && this.isNavOpen) {
        this.closeNavigation();
        this.navToggle.focus();
      }
      
      // Navigate through app cards with arrow keys
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const focusedCard = document.activeElement.closest('.app-card');
        if (focusedCard) {
          e.preventDefault();
          const cards = Array.from(document.querySelectorAll('.app-card'));
          const currentIndex = cards.indexOf(focusedCard);
          
          let nextIndex;
          if (e.key === 'ArrowDown') {
            nextIndex = (currentIndex + 1) % cards.length;
          } else {
            nextIndex = currentIndex === 0 ? cards.length - 1 : currentIndex - 1;
          }
          
          cards[nextIndex].focus();
        }
      }
    });
  }

  handleResize() {
    // Update mobile detection
    const wasMobile = this.isMobile;
    this.isMobile = this.detectMobile();
    
    // Close navigation if switching from mobile to desktop
    if (wasMobile && !this.isMobile && this.isNavOpen) {
      this.closeNavigation();
    }
    
    // Update viewport height
    if (this.isMobile) {
      this.setViewportHeight();
    }
  }

  // Public method to refresh mobile interactions for dynamically added content
  refreshInteractions() {
    const newCards = document.querySelectorAll('.app-card:not([data-touch-enabled])');
    const newButtons = document.querySelectorAll('.btn:not([data-touch-enabled]), .tag-filter:not([data-touch-enabled])');
    
    newCards.forEach(card => {
      this.addTouchFeedback(card);
      card.setAttribute('data-touch-enabled', 'true');
    });
    
    newButtons.forEach(button => {
      this.addTouchFeedback(button);
      button.setAttribute('data-touch-enabled', 'true');
    });
  }
}