# Publishing Guide for Headlamp Sealed Secrets Plugin

This guide covers how to publish the plugin to NPM, GitHub, and Artifact Hub.

## Prerequisites

Before publishing, ensure you have:

1. **NPM Account** - Create one at https://www.npmjs.com
2. **GitHub Account** - Already set up (cpfarhood)
3. **Artifact Hub** - Repository already configured (ID: 5574d37c-c4ae-45ab-a378-ef24aaba5b4c)

## Step 1: Initial Setup

### 1.1 NPM Authentication

```bash
npm login
# Enter your NPM username, password, and email
```

### 1.2 Verify Package Configuration

Check that `package.json` has correct metadata:
```bash
cd headlamp-sealed-secrets
cat package.json | grep -A 5 '"name"'
```

## Step 2: Prepare for Publishing

### 2.1 Build and Test

```bash
cd headlamp-sealed-secrets

# Install dependencies
npm install

# Type check
npm run tsc

# Lint
npm run lint

# Build for production
npm run build

# Verify dist/ directory exists
ls -la dist/
```

### 2.2 Test Package Locally

```bash
# Create a tarball to inspect what will be published
npm pack

# This creates headlamp-sealed-secrets-0.1.0.tgz
# Extract and verify contents:
tar -tzf headlamp-sealed-secrets-0.1.0.tgz

# Clean up
rm headlamp-sealed-secrets-0.1.0.tgz
```

## Step 3: Publish to NPM

### Option A: Manual Publishing

```bash
cd headlamp-sealed-secrets

# Publish to NPM
npm publish

# If this is your first publish and you want to make it public
npm publish --access public
```

### Option B: Automated Publishing via GitHub Actions

The repository includes automated workflows:

1. **Push code to GitHub:**
   ```bash
   cd ..
   git add .
   git commit -m "Initial release of Headlamp Sealed Secrets plugin"
   git push origin main
   ```

2. **Create and push a version tag:**
   ```bash
   git tag -a v0.1.0 -m "Release version 0.1.0"
   git push origin v0.1.0
   ```

3. **Configure NPM token in GitHub:**
   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Create a new "Automation" token
   - Copy the token
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Create a new secret named `NPM_TOKEN` with your token

4. **The workflow will automatically:**
   - Build the plugin
   - Run tests and linting
   - Publish to NPM
   - Create a GitHub Release

## Step 4: GitHub Setup

### 4.1 Create GitHub Repository

```bash
# Initialize git (if not already done)
cd /Users/cpfarhood/Documents/Repositories/headlamp-sealed-secrets-plugin
git init
git add .
git commit -m "Initial commit: Headlamp Sealed Secrets plugin"

# Create repository on GitHub first, then:
git remote add origin https://github.com/cpfarhood/headlamp-sealed-secrets-plugin.git
git branch -M main
git push -u origin main
```

### 4.2 Configure Repository

On GitHub, configure:
1. **Description**: "Headlamp plugin for Bitnami Sealed Secrets - manage encrypted Kubernetes secrets"
2. **Topics**: `headlamp`, `kubernetes`, `sealed-secrets`, `encryption`, `security`
3. **Website**: Link to Artifact Hub (once published)

## Step 5: Artifact Hub

### 5.1 Verify Repository Configuration

The repository is already configured with:
- Repository ID: `5574d37c-c4ae-45ab-a378-ef24aaba5b4c`
- Metadata files:
  - `artifacthub-repo.yml` (root)
  - `headlamp-sealed-secrets/artifacthub-pkg.yml`

### 5.2 Trigger Artifact Hub Sync

Artifact Hub automatically syncs from your GitHub repository every few hours. To force a sync:

1. Go to https://artifacthub.io/control-panel/repositories
2. Find your repository
3. Click "Trigger sync"

Alternatively, push a change to trigger automatic sync:
```bash
git commit --allow-empty -m "Trigger Artifact Hub sync"
git push origin main
```

### 5.3 Verify Publication

1. Wait 5-10 minutes for sync
2. Visit https://artifacthub.io/packages/headlamp/headlamp-sealed-secrets
3. Verify all metadata is correct

## Step 6: Post-Publishing

### 6.1 Update README Links

Once published, update README.md with real links:

```markdown
## Installation

npm install -g headlamp-sealed-secrets
```

### 6.2 Add Badges

Add badges to README.md:

```markdown
[![NPM Version](https://img.shields.io/npm/v/headlamp-sealed-secrets)](https://www.npmjs.com/package/headlamp-sealed-secrets)
[![Artifact Hub](https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/headlamp-sealed-secrets)](https://artifacthub.io/packages/headlamp/headlamp-sealed-secrets)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
```

### 6.3 Announce Release

Consider announcing on:
- Headlamp community channels
- Kubernetes Slack (#headlamp)
- Twitter/Social media
- Dev.to or Medium blog post

## Version Updates

When releasing new versions:

1. **Update version:**
   ```bash
   cd headlamp-sealed-secrets
   npm version patch  # or minor, or major
   ```

2. **Update artifacthub-pkg.yml:**
   ```yaml
   version: 0.1.1  # Match package.json
   ```

3. **Commit and tag:**
   ```bash
   git add .
   git commit -m "Release v0.1.1: <description>"
   git tag -a v0.1.1 -m "Release version 0.1.1"
   git push origin main
   git push origin v0.1.1
   ```

4. **GitHub Actions will auto-publish** to NPM and create a release

## Troubleshooting

### "Package already exists"
If the NPM package name is taken, update `package.json`:
```json
{
  "name": "@cpfarhood/headlamp-sealed-secrets"
}
```

### NPM Publish Fails
- Verify you're logged in: `npm whoami`
- Check package.json has correct `name` and `version`
- Ensure version hasn't been published before

### Artifact Hub Not Syncing
- Verify `artifacthub-repo.yml` is in repository root
- Verify `artifacthub-pkg.yml` is in plugin directory
- Check repository URL in Artifact Hub settings
- Wait 24 hours for initial sync
- Trigger manual sync from control panel

### GitHub Actions Failing
- Check workflow logs in GitHub Actions tab
- Verify `NPM_TOKEN` secret is set correctly
- Ensure node version matches (20.x)

## Files Checklist

Before publishing, verify these files exist and are correct:

- [ ] `headlamp-sealed-secrets/package.json` - Correct name, version, metadata
- [ ] `headlamp-sealed-secrets/LICENSE` - Apache 2.0 license
- [ ] `headlamp-sealed-secrets/README.md` - Comprehensive documentation
- [ ] `headlamp-sealed-secrets/artifacthub-pkg.yml` - Artifact Hub metadata
- [ ] `artifacthub-repo.yml` - Repository metadata (root)
- [ ] `.github/workflows/publish.yml` - Publish workflow
- [ ] `.github/workflows/ci.yml` - CI workflow
- [ ] `.gitignore` - Excludes node_modules, dist, etc.

## Quick Checklist

For a new release:

```bash
# 1. Update version
cd headlamp-sealed-secrets
npm version patch

# 2. Build and test
npm run tsc
npm run lint
npm run build

# 3. Update Artifact Hub metadata
# Edit artifacthub-pkg.yml version to match package.json

# 4. Commit and tag
cd ..
git add .
git commit -m "Release v0.1.1"
git tag -a v0.1.1 -m "Release version 0.1.1"

# 5. Push (triggers auto-publish)
git push origin main
git push origin v0.1.1

# 6. Verify
# - Check GitHub Actions workflow
# - Verify on NPM: https://www.npmjs.com/package/headlamp-sealed-secrets
# - Check Artifact Hub (may take 24h): https://artifacthub.io
```

## Support

If you encounter issues:
- NPM: https://docs.npmjs.com/
- Artifact Hub: https://artifacthub.io/docs
- Headlamp: https://headlamp.dev/docs/latest/development/plugins/

---

**Repository:** https://github.com/cpfarhood/headlamp-sealed-secrets-plugin
**Artifact Hub ID:** 5574d37c-c4ae-45ab-a378-ef24aaba5b4c
