# Release Guide

This guide provides step-by-step instructions for releasing a new version of the Headlamp Sealed Secrets plugin.

## Prerequisites

- Ensure you're on the `main` branch with all changes committed
- All new features are documented and tested
- CHANGELOG.md is updated with release notes

## Quick Release (5 minutes)

### For Patch Releases (e.g., 0.2.4 → 0.2.5)

```bash
# 1. Enter plugin directory
cd headlamp-sealed-secrets

# 2. Bump patch version (updates package.json)
npm version patch

# 3. Return to repo root
cd ..

# 4. Update artifacthub-pkg.yml with new version
# Edit the file manually:
# - Change version: 0.2.5
# - Change appVersion: 0.2.5
# OR use sed:
sed -i '' 's/version: 0.2.4/version: 0.2.5/' artifacthub-pkg.yml
sed -i '' 's/appVersion: 0.2.4/appVersion: 0.2.5/' artifacthub-pkg.yml

# 5. Update CHANGELOG.md with release date
# Edit manually or ensure version section exists with today's date

# 6. Commit version bump
git add headlamp-sealed-secrets/package.json artifacthub-pkg.yml CHANGELOG.md
git commit -m "chore(release): bump version to 0.2.5"

# 7. Push to main
git push origin main

# 8. Create and push tag (triggers publish workflow)
git tag -a v0.2.5 -m "Release version 0.2.5"
git push origin v0.2.5

# 9. Monitor GitHub Actions
# Visit: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/actions
```

## Detailed Release Process

### Step 1: Prepare Release Branch

```bash
# Ensure on main with latest changes
git checkout main
git pull origin main

# Verify no uncommitted changes
git status

# Optional: Create feature branch for release prep (for discussion)
git checkout -b release/v0.2.5
```

### Step 2: Verify Quality

```bash
# Build and test locally
cd headlamp-sealed-secrets

# Install dependencies
npm ci

# Type check
npm run tsc

# Lint
npm run lint

# Build
npm run build

# Test locally (if applicable)
npm test

cd ..
```

### Step 3: Update Version

#### Option A: Automated (Recommended)

```bash
cd headlamp-sealed-secrets

# Use npm version to update package.json
# This automatically updates version in package.json
npm version patch    # For patch releases (0.2.4 → 0.2.5)
npm version minor    # For minor releases (0.2.4 → 0.3.0)
npm version major    # For major releases (0.2.4 → 1.0.0)

cd ..

# Verify it was updated
grep '"version"' headlamp-sealed-secrets/package.json
```

#### Option B: Manual

Edit `headlamp-sealed-secrets/package.json`:
```json
{
  "version": "0.2.5",
  ...
}
```

### Step 4: Update Artifact Hub Metadata

Edit `artifacthub-pkg.yml` in repository root:

```yaml
version: 0.2.5              # Must match package.json
appVersion: 0.2.5           # Must match package.json
createdAt: "2026-02-12T00:00:00Z"

annotations:
  headlamp/plugin/archive-url: "https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/releases/download/v0.2.5/headlamp-sealed-secrets-0.2.5.tar.gz"
  headlamp/plugin/archive-checksum: "SHA256:..."  # Will be auto-updated by workflow
```

Note: The archive-checksum will be auto-calculated by the publish workflow, so you can leave it as-is or set a placeholder.

### Step 5: Update CHANGELOG

Edit `CHANGELOG.md`:

```markdown
# Changelog

## Unreleased

...future changes...

## [0.2.5] - 2026-02-12

### Added
- New feature description

### Fixed
- Bug fix description

### Changed
- Changed behavior description

## [0.2.4] - 2026-02-11

...previous releases...
```

Format guidelines:
- Date in ISO format: YYYY-MM-DD
- Sections: Added, Fixed, Changed, Deprecated, Removed, Security
- Link to version tag at bottom

### Step 6: Commit Release Changes

```bash
# Stage version and changelog updates
git add headlamp-sealed-secrets/package.json artifacthub-pkg.yml CHANGELOG.md

# Verify changes
git diff --cached

# Commit with conventional message
git commit -m "chore(release): bump version to 0.2.5"
```

### Step 7: Push to Main

```bash
# Push commit to main
git push origin main

# Verify on GitHub
# https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/commits/main
```

### Step 8: Create Release Tag

```bash
# Create annotated tag (not lightweight)
git tag -a v0.2.5 -m "Release version 0.2.5"

# Verify tag
git tag -l -n v0.2.5

# Push tag to remote (triggers publish workflow)
git push origin v0.2.5

# Verify it was pushed
git ls-remote origin | grep tags | tail -5
```

### Step 9: Monitor Publish Workflow

```bash
# Watch workflow execution
# GitHub URL: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/actions

# Expected steps (3-5 minutes):
# 1. ✓ Build and lint
# 2. ✓ Create tarball
# 3. ✓ Upload to GitHub release
# 4. ✓ Update artifacthub-pkg.yml with checksum
# 5. ✓ Push metadata update to main
```

### Step 10: Verify Release

#### GitHub Release
```bash
# Check GitHub releases page
# https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/releases

# Verify:
# - Release tag v0.2.5 exists
# - Release description (auto-generated from commits)
# - Tarball artifact: headlamp-sealed-secrets-0.2.5.tar.gz
# - Size looks reasonable (~90-100 KB)
```

#### Artifact Hub
```bash
# Wait 5-10 minutes for sync
# Visit: https://artifacthub.io/packages/headlamp-sealed-secrets

# Verify:
# - Version 0.2.5 appears
# - Archive URL points to GitHub release
# - Checksum matches GitHub release
# - Description and metadata display correctly
```

#### Direct Download
```bash
# Verify tarball integrity
ARCHIVE="headlamp-sealed-secrets-0.2.5.tar.gz"
DOWNLOAD_URL="https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/releases/download/v0.2.5/${ARCHIVE}"

# Download and verify
wget "${DOWNLOAD_URL}"
sha256sum "${ARCHIVE}"

# Compare with artifacthub-pkg.yml checksum
grep archive-checksum artifacthub-pkg.yml
```

## Version Numbering

Follow Semantic Versioning (SemVer):

```
MAJOR.MINOR.PATCH

0.2.5
├── 0 = Major version (breaking changes)
├── 2 = Minor version (new features, backward compatible)
└── 5 = Patch version (bug fixes)
```

### When to bump each number:

- **Patch (0.2.4 → 0.2.5)**: Bug fixes, security patches
  - Command: `npm version patch`
  - Example: Fix dialog close button, improve error handling

- **Minor (0.2.0 → 0.3.0)**: New features (backward compatible)
  - Command: `npm version minor`
  - Example: Add certificate expiry warnings

- **Major (0.x.x → 1.0.0)**: Breaking changes, significant redesign
  - Command: `npm version major`
  - Example: Change UI structure, new required permissions

## Pre-Release Versions (Optional)

For pre-release testing:

```bash
cd headlamp-sealed-secrets
npm version preminor --preid=rc  # Results in 0.3.0-rc.0
cd ..

git tag -a v0.3.0-rc.0 -m "Release candidate 0.3.0-rc.0"
git push origin v0.3.0-rc.0
```

Note: Artifact Hub will skip pre-release versions by default.

## Release Checklist

Before releasing:

```
General Checklist:
- [ ] All tests passing (CI workflow)
- [ ] Code reviewed and merged to main
- [ ] No uncommitted changes in working directory
- [ ] CHANGELOG.md updated with release notes

Version Updates:
- [ ] headlamp-sealed-secrets/package.json version updated
- [ ] artifacthub-pkg.yml version matches package.json
- [ ] CHANGELOG.md has version heading with date

Git Steps:
- [ ] Changes committed to main
- [ ] Changes pushed to origin/main
- [ ] Tag created with format v0.2.5
- [ ] Tag pushed to origin

Verification:
- [ ] Publish workflow completes successfully
- [ ] GitHub release created with tarball
- [ ] Artifact Hub synced within 10 minutes
- [ ] Archive URL accessible
- [ ] Checksum matches

Post-Release:
- [ ] Close related issues/PRs
- [ ] Announce release if applicable
- [ ] Monitor for bug reports
```

## Troubleshooting

### "Tag already exists"

```bash
# If you made a mistake with tag name:
git tag -d v0.2.5              # Delete local tag
git push origin -d v0.2.5      # Delete remote tag
git tag -a v0.2.5 -m "..."    # Create correct tag
git push origin v0.2.5
```

### "Publish workflow failed"

1. Check workflow logs: GitHub Actions → workflow run
2. Common issues:
   - Missing dependencies: Run `npm ci` in headlamp-sealed-secrets/
   - Build errors: Run `npm run build` locally to reproduce
   - Type errors: Run `npm run tsc` locally
3. Fix and retry:
   ```bash
   git tag -d v0.2.5
   git push origin -d v0.2.5
   # Fix the issue
   git push origin main
   git tag -a v0.2.5 -m "..."
   git push origin v0.2.5
   ```

### "Artifact Hub still shows old version"

```bash
# Option 1: Wait 10 minutes for auto-sync
# Option 2: Force sync from Artifact Hub UI:
# - Login to artifacthub.io
# - Go to control-panel/repositories
# - Find this repository
# - Click "Trigger sync"

# Option 3: Verify metadata is correct
grep "version:" artifacthub-pkg.yml
grep "archive-url:" artifacthub-pkg.yml
grep "archive-checksum:" artifacthub-pkg.yml
```

### "Checksum mismatch"

**Problem**: Local checksum doesn't match Artifact Hub

**Solution**: Never rebuild locally - always use the released tarball from GitHub

```bash
# WRONG (don't do this):
npm run build
npm pack
sha256sum headlamp-sealed-secrets-0.2.5.tar.gz

# RIGHT (use released tarball):
wget https://github.com/.../releases/download/v0.2.5/headlamp-sealed-secrets-0.2.5.tar.gz
sha256sum headlamp-sealed-secrets-0.2.5.tar.gz
```

## Automation & Cleanup

### Auto-Cleanup Old Version Directories (Optional)

The `/headlamp-sealed-secrets-plugin/0.2.X/` directories are historical artifacts and no longer needed. They were used before automated releases:

```bash
# Optional: Archive for historical reference
tar -czf releases-archive.tar.gz headlamp-sealed-secrets-plugin/

# Delete the directory
rm -rf headlamp-sealed-secrets-plugin/

# Commit cleanup
git add -u
git commit -m "chore: remove legacy version directories (GitHub releases are now source of truth)"
git push origin main
```

### NPM Publishing (Optional)

If you want to also publish to NPM (note: Headlamp doesn't support NPM plugin downloads):

1. Create NPM token: https://www.npmjs.com/settings/your-username/tokens
2. Add to GitHub secret: `NPM_TOKEN`
3. Uncomment in publish workflow (optional step)

For Headlamp plugins, GitHub releases are the standard distribution method.

## Support

- Headlamp Plugin Docs: https://headlamp.dev/docs/latest/development/plugins/publishing/
- Artifact Hub Docs: https://artifacthub.io/docs
- Repository: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin
- Issues: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/issues
