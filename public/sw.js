/**
 * Service Worker for caching and performance optimization
 */

const CACHE_NAME = 'soft98-navigation-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/apps.json',
  // CSS and JS files will be added by the build process
];

const DYNAMIC_CACHE_NAME = 'soft98-navigation-dynamic-v1';

// Install event - cache static resources with error tolerance
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache files individually to avoid one failure breaking all
        return Promise.allSettled(
          STATIC_CACHE_URLS.map(url => 
            cache.add(url).catch(error => {
              console.warn(`Failed to cache ${url}:`, error);
              return null; // Continue with other files
            })
          )
        );
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker install failed:', error);
        return self.skipWaiting(); // Still proceed even if caching fails
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback and better error handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle same-origin requests
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(request)
            .then((response) => {
              // Don't cache non-successful responses
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clone the response
              const responseToCache = response.clone();

              // Cache dynamic content with error handling
              caches.open(DYNAMIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                })
                .catch(error => {
                  console.warn(`Failed to cache ${request.url}:`, error);
                });

              return response;
            })
            .catch(error => {
              console.warn(`Failed to fetch ${request.url}:`, error);
              
              // For navigation requests, return offline page
              if (request.mode === 'navigate') {
                return caches.match('/index.html')
                  .catch(() => {
                    // If even the offline page fails, return a basic response
                    return new Response('Offline - Please check your connection', {
                      status: 503,
                      statusText: 'Service Unavailable',
                      headers: { 'Content-Type': 'text/plain' }
                    });
                  });
              }
              
              // For other requests, return a generic error response
              return new Response('Resource not available', {
                status: 404,
                statusText: 'Not Found',
                headers: { 'Content-Type': 'text/plain' }
              });
            });
        })
        .catch(error => {
          console.warn(`Cache match failed for ${request.url}:`, error);
          
          // Fallback to network request
          return fetch(request).catch(fetchError => {
            console.warn(`Network request failed for ${request.url}:`, fetchError);
            
            if (request.mode === 'navigate') {
              return new Response('Offline - Please check your connection', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' }
              });
            }
            
            return new Response('Resource not available', {
              status: 404,
              statusText: 'Not Found',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
        })
    );
  }
});

// Background sync for offline functionality (if needed)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      console.log('Background sync triggered')
    );
  }
});

// Push notifications (if needed in the future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});