# Deployment Guide

This document describes the deployment process for the Soft98 Top navigation site.

## Overview

The site is automatically deployed to GitHub Pages using GitHub Actions whenever changes are pushed to the main branch.

## Deployment Workflow

### Automatic Deployment

1. **Trigger**: Push to `main` or `master` branch
2. **Build Process**: 
   - Install dependencies
   - Run type checking
   - Run linting
   - Run tests
   - Build project
   - Validate build output
3. **Deploy**: Upload to GitHub Pages

### Manual Deployment

You can also run the deployment process locally:

```bash
# Run full deployment process (build + validate)
npm run deploy

# Individual steps
npm run build
npm run validate-build
npm run check-deployment
```

## Scripts

### `npm run deploy`
Runs the complete deployment process locally:
- Cleans previous build
- Installs dependencies
- Runs type checking, linting, and tests
- Builds the project
- Validates the build output

### `npm run validate-build`
Validates the build output to ensure:
- All required files are present
- HTML structure is correct
- Apps configuration is valid
- Assets are properly generated

### `npm run check-deployment`
Checks the live deployment:
- Verifies site accessibility
- Validates content structure
- Checks asset loading
- Retries on failure with exponential backoff

## GitHub Actions Workflow

The deployment workflow (`.github/workflows/deploy.yml`) includes:

### Build Job
- **Environment**: Ubuntu Latest
- **Node.js**: Version 18
- **Steps**:
  1. Checkout code
  2. Setup Node.js with npm cache
  3. Install dependencies
  4. Run type checking
  5. Run linting
  6. Run tests
  7. Build project
  8. Upload build artifact

### Deploy Job
- **Condition**: Only on main/master branch
- **Dependencies**: Requires build job to complete
- **Steps**:
  1. Download build artifact
  2. Deploy to GitHub Pages

## Monitoring

### Build Status
Monitor deployment status at:
- GitHub Actions: `https://github.com/soft98-top/soft98-top.github.io/actions`
- Live Site: `https://soft98-top.github.io`

### Deployment Verification
After deployment, the system automatically:
- Checks site accessibility
- Validates content structure
- Verifies asset loading
- Reports any issues

## Troubleshooting

### Common Issues

#### Build Failures
- **Type Errors**: Run `npm run type-check` locally
- **Lint Errors**: Run `npm run lint:fix` to auto-fix
- **Test Failures**: Run `npm run test` to debug

#### Deployment Failures
- **Permission Issues**: Check GitHub Pages settings
- **Asset Loading**: Verify build output with `npm run validate-build`
- **Site Accessibility**: Run `npm run check-deployment`

#### Configuration Issues
- **Apps Config**: Validate `public/apps.json` structure
- **Build Config**: Check `vite.config.js` settings
- **GitHub Actions**: Review workflow permissions

### Debug Commands

```bash
# Check build output
npm run validate-build

# Test deployment locally
npm run preview

# Check live site
npm run check-deployment

# Full deployment test
npm run deploy
```

## Security

### Permissions
The GitHub Actions workflow uses minimal permissions:
- `contents: read` - Read repository content
- `pages: write` - Deploy to GitHub Pages
- `id-token: write` - OIDC token for deployment

### Dependencies
- All dependencies are installed from `package-lock.json`
- No external scripts or CDNs in build process
- Build artifacts are validated before deployment

## Performance

### Build Optimization
- **Minification**: JavaScript and CSS are minified
- **Tree Shaking**: Unused code is removed
- **Asset Optimization**: Images and assets are optimized
- **Caching**: Build cache is used in CI/CD

### Runtime Optimization
- **Lazy Loading**: Images are loaded on demand
- **Service Worker**: Caches resources for offline access
- **Compression**: Assets are served compressed

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review and update apps configuration
- Monitor deployment metrics
- Check for security vulnerabilities

### Adding New Apps
1. Update `public/apps.json` with new app data
2. Add preview images to `public/assets/images/`
3. Test locally with `npm run dev`
4. Deploy with `npm run deploy` or push to main branch

## Support

For deployment issues:
1. Check GitHub Actions logs
2. Run local validation scripts
3. Review this documentation
4. Check GitHub Pages settings