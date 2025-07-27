/**
 * Performance optimization utilities
 * Handles lazy loading, resource preloading, and performance monitoring
 */

export class PerformanceOptimizer {
  constructor() {
    this.lazyImages = new Set();
    this.preloadedResources = new Set();
    this.intersectionObserver = null;
    this.performanceMetrics = {
      loadTime: 0,
      renderTime: 0,
      imageLoadTimes: []
    };
    
    this.init();
  }

  init() {
    this.setupLazyLoading();
    this.setupResourcePreloading();
    this.setupPerformanceMonitoring();
    this.optimizeCSS();
    this.optimizeJavaScript();
  }

  setupLazyLoading() {
    // Create intersection observer for lazy loading
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          root: null,
          rootMargin: '50px',
          threshold: 0.1
        }
      );
    }

    // Initialize lazy loading for existing images
    this.initializeLazyImages();
    
    // Set up mutation observer to handle dynamically added images
    this.setupMutationObserver();
  }

  initializeLazyImages() {
    const images = document.querySelectorAll('img[data-src], img[src]');
    
    images.forEach(img => {
      if (img.hasAttribute('data-src')) {
        // Image is already set up for lazy loading
        this.observeImage(img);
      } else if (img.src && !img.complete) {
        // Convert existing images to lazy loading
        this.convertToLazyImage(img);
      }
    });
  }

  convertToLazyImage(img) {
    // Only convert images that are not in the viewport
    const rect = img.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
    
    if (!isInViewport && img.src) {
      img.setAttribute('data-src', img.src);
      img.src = this.generatePlaceholder(img.width || 300, img.height || 200);
      img.classList.add('lazy-image');
      this.observeImage(img);
    }
  }

  generatePlaceholder(width, height) {
    // Generate a simple SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f1f5f9"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#94a3b8" font-family="system-ui" font-size="14">
          Loading...
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  observeImage(img) {
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(img);
      this.lazyImages.add(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        this.loadImage(img);
        this.intersectionObserver.unobserve(img);
        this.lazyImages.delete(img);
      }
    });
  }

  loadImage(img) {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const actualSrc = img.getAttribute('data-src') || img.src;
      
      if (!actualSrc) {
        reject(new Error('No image source found'));
        return;
      }

      // Create a new image to preload
      const newImg = new Image();
      
      newImg.onload = () => {
        const loadTime = performance.now() - startTime;
        this.performanceMetrics.imageLoadTimes.push(loadTime);
        
        // Apply the loaded image
        img.src = actualSrc;
        img.classList.remove('lazy-image');
        img.classList.add('lazy-loaded');
        
        // Add fade-in animation
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        
        requestAnimationFrame(() => {
          img.style.opacity = '1';
        });
        
        resolve(img);
      };
      
      newImg.onerror = () => {
        // Show error placeholder
        img.src = this.generateErrorPlaceholder();
        img.classList.add('lazy-error');
        reject(new Error('Failed to load image'));
      };
      
      newImg.src = actualSrc;
    });
  }

  generateErrorPlaceholder() {
    const svg = `
      <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#fef2f2"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#ef4444" font-family="system-ui" font-size="14">
          Failed to load
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  setupMutationObserver() {
    if ('MutationObserver' in window) {
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check for new images
              const images = node.tagName === 'IMG' ? [node] : node.querySelectorAll('img');
              images.forEach(img => {
                if (!this.lazyImages.has(img) && img.src) {
                  this.convertToLazyImage(img);
                }
              });
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  setupResourcePreloading() {
    // Preload critical resources
    this.preloadCriticalResources();
    
    // Set up link prefetching for likely navigation
    this.setupLinkPrefetching();
    
    // Preload fonts
    this.preloadFonts();
  }

  preloadCriticalResources() {
    const criticalResources = [
      // Add critical CSS if split
      // Add critical JavaScript modules
      // Add hero images
    ];

    criticalResources.forEach(resource => {
      if (resource && !this.preloadedResources.has(resource)) {
        this.preloadResource(resource);
      }
    });
  }

  preloadResource(href, as = 'script', crossorigin = false) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      
      if (crossorigin) {
        link.crossOrigin = 'anonymous';
      }
      
      link.onload = () => {
        this.preloadedResources.add(href);
        resolve(link);
      };
      
      link.onerror = () => {
        reject(new Error(`Failed to preload ${href}`));
      };
      
      document.head.appendChild(link);
    });
  }

  setupLinkPrefetching() {
    // Prefetch external links on hover
    document.addEventListener('mouseover', (e) => {
      const link = e.target.closest('a[href^="http"]');
      if (link && !this.preloadedResources.has(link.href)) {
        this.prefetchLink(link.href);
      }
    }, { passive: true });
  }

  prefetchLink(href) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.createPrefetchLink(href);
      });
    } else {
      setTimeout(() => {
        this.createPrefetchLink(href);
      }, 100);
    }
  }

  createPrefetchLink(href) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    link.crossOrigin = 'anonymous';
    
    document.head.appendChild(link);
    this.preloadedResources.add(href);
  }

  preloadFonts() {
    // Preload system fonts are already optimized
    // Add custom font preloading if needed in the future
    const fontPreloads = [
      // Add font URLs here if custom fonts are added
    ];

    fontPreloads.forEach(fontUrl => {
      this.preloadResource(fontUrl, 'font', true);
    });
  }

  optimizeCSS() {
    // Inline critical CSS (already done in build process)
    // Remove unused CSS classes (done by build tools)
    
    // Optimize CSS animations for performance
    this.optimizeAnimations();
  }

  optimizeAnimations() {
    // Use will-change property for animated elements
    const animatedElements = document.querySelectorAll('.app-card, .btn, .tag-filter');
    
    animatedElements.forEach(element => {
      element.addEventListener('mouseenter', () => {
        element.style.willChange = 'transform, box-shadow';
      }, { passive: true });
      
      element.addEventListener('mouseleave', () => {
        element.style.willChange = 'auto';
      }, { passive: true });
    });
  }

  optimizeJavaScript() {
    // Defer non-critical JavaScript
    this.deferNonCriticalScripts();
    
    // Optimize event listeners
    this.optimizeEventListeners();
    
    // Set up service worker if supported
    this.setupServiceWorker();
  }

  deferNonCriticalScripts() {
    // Mark scripts as deferred (handled by build process)
    // Lazy load analytics or other non-critical scripts
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.loadNonCriticalScripts();
      });
    }
  }

  loadNonCriticalScripts() {
    // Load analytics, social widgets, etc. when idle
    // This is where you'd load Google Analytics, social media widgets, etc.
  }

  optimizeEventListeners() {
    // Use passive listeners where possible
    const passiveEvents = ['scroll', 'touchstart', 'touchmove', 'wheel'];
    
    passiveEvents.forEach(eventType => {
      // Override addEventListener to add passive by default for these events
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (passiveEvents.includes(type) && typeof options !== 'object') {
          options = { passive: true };
        } else if (typeof options === 'object' && options.passive === undefined) {
          options.passive = true;
        }
        
        return originalAddEventListener.call(this, type, listener, options);
      };
    });
  }

  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('SW registered: ', registration);
          })
          .catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }

  setupPerformanceMonitoring() {
    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();
    
    // Monitor custom metrics
    this.monitorCustomMetrics();
    
    // Set up performance observer
    this.setupPerformanceObserver();
  }

  monitorCoreWebVitals() {
    // Monitor Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.performanceMetrics.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // Fallback for browsers that don't support LCP
      }

      // Monitor First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.performanceMetrics.fid = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // Fallback for browsers that don't support FID
      }
    }
  }

  monitorCustomMetrics() {
    // Monitor app-specific metrics
    window.addEventListener('load', () => {
      this.performanceMetrics.loadTime = performance.now();
    });

    // Monitor time to interactive
    document.addEventListener('DOMContentLoaded', () => {
      this.performanceMetrics.domContentLoaded = performance.now();
    });
  }

  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          // Log performance entries for debugging
          if (entry.entryType === 'navigation') {
            this.performanceMetrics.navigationTiming = entry;
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['navigation', 'resource'] });
      } catch (e) {
        // Fallback for older browsers
      }
    }
  }

  // Public methods
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  refreshLazyImages() {
    // Re-initialize lazy loading for new content
    this.initializeLazyImages();
  }

  preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // Cleanup method
  destroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    this.lazyImages.clear();
    this.preloadedResources.clear();
  }
}