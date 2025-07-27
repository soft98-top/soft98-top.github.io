# Soft98 Top - Project Navigation

A modern GitHub Pages navigation site that serves as the main entry point for all Soft98 Top projects.

## Features

- 🎨 Modern, responsive design
- 📱 Mobile-first approach
- ⚡ Fast loading with Vite
- 🔍 TypeScript support
- 🎯 SEO optimized
- ♿ Accessibility compliant

## Development

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Setup

```bash
npm install
```

### Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── index.html          # Main HTML template
├── styles/             # CSS files
│   ├── main.css       # Base styles
│   ├── components.css # Component styles
│   └── responsive.css # Responsive design
└── scripts/           # JavaScript modules
    ├── main.js        # Main application
    └── app-loader.js  # App loading logic

public/
├── apps.json          # Application configuration
└── assets/            # Static assets
```

## Adding New Applications

Edit `public/apps.json` to add new applications:

```json
{
  "apps": [
    {
      "id": "your-app",
      "name": "Your App Name",
      "description": "Brief description",
      "url": "https://your-app-url.com",
      "sourceUrl": "https://github.com/your-repo",
      "image": "assets/your-app-preview.png",
      "tags": ["React", "TypeScript"],
      "status": "active",
      "featured": false
    }
  ]
}
```

## Deployment

This site is automatically deployed to GitHub Pages via GitHub Actions when changes are pushed to the main branch.

## License

MIT