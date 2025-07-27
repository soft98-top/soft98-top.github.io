// Test setup file
import { vi } from 'vitest';

// Mock fetch for testing
global.fetch = vi.fn();

// Mock URL constructor for older environments
if (!global.URL) {
  global.URL = class URL {
    protocol: string;
    hostname: string;
    pathname: string;
    search: string;
    hash: string;
    href: string;

    constructor(url: string, base?: string) {
      // Simple URL parsing for tests
      const fullUrl = base ? new URL(url, base).href : url;
      this.href = fullUrl;
      
      const match = fullUrl.match(/^(https?:)\/\/([^\/]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?$/);
      if (match) {
        this.protocol = match[1];
        this.hostname = match[2];
        this.pathname = match[3] || '/';
        this.search = match[4] || '';
        this.hash = match[5] || '';
      } else {
        throw new Error('Invalid URL');
      }
    }
  };
}