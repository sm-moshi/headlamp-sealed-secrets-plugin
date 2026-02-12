# Git Workflow & Release Management

This document defines the recommended Git workflow and release process for the Headlamp Sealed Secrets plugin.

## Overview

The workflow implements a simplified Git Flow strategy optimized for Headlamp plugins:
- **Development**: All active development on `main` branch
- **Releases**: Tagged on `main`, published from tags
- **Hotfixes**: Emergency fixes committed to `main` with patch version bumps
- **Feature Branches**: Optional for large features (cleanup after merge)

## Branching Strategy

### Main Branch (`main`)
- Single integration branch for all development
- Protected: requires PR review before merge
- All commits must pass CI checks
- Always releasable

### Feature/Fix Branches (Optional)
- Naming: `feature/description`, `fix/description`, `docs/description`, `chore/description`
- Created from: `main`
- Merged back to: `main` via PR
- Deleted after: merge to main

### Release Tags
- Format: `v<MAJOR>.<MINOR>.<PATCH>` (semantic versioning)
- Created from: `main` branch (latest commit)
- Example: `v0.2.4`, `v0.3.0`
- Never force-push or delete release tags

## Commit Convention

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, semicolons)
- `refactor`: Code refactor (no feature/fix)
- `perf`: Performance improvement
- `test`: Test additions/changes
- `chore`: Build, dependencies, CI/CD
- `ci`: CI/CD workflow changes

### Scope (optional)
- `crypto`: Encryption/decryption functions
- `ui`: UI components
- `api`: Kubernetes API calls
- `rbac`: Permission checking
- `types`: TypeScript types
- `artifacthub`: Release artifacts
- etc.

### Subject
- Imperative mood ("add" not "added")
- No period at end
- Maximum 50 characters

### Examples
```
feat(crypto): add certificate expiry detection
fix(ui): resolve dialog form submission error
docs: update installation instructions
chore(ci): optimize build cache
```

## Versioning

### Semantic Versioning (SemVer)
- `MAJOR.MINOR.PATCH`
- `MAJOR`: Breaking changes to UI or API
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes

### Version Files
Update these three files for each release:

1. **headlamp-sealed-secrets/package.json**
   ```json
   "version": "0.2.4"
   ```

2. **artifacthub-pkg.yml** (root)
   ```yaml
   version: 0.2.4
   appVersion: 0.2.4
   ```

3. **CHANGELOG.md**
   - Add entry under `## Unreleased` → move to version heading
   - Format: Markdown with `### Added`, `### Fixed`, `### Changed`, etc.

## Release Process

### Step 1: Prepare Release

```bash
# Ensure on main and up-to-date
git checkout main
git pull origin main

# Verify no uncommitted changes
git status

# Build and test locally
cd headlamp-sealed-secrets
npm run tsc
npm run lint
npm run build

# Package to verify tarball
npm run package
# Verify package size and contents
tar -tzf headlamp-sealed-secrets-*.tar.gz | head -20

# Cleanup
rm headlamp-sealed-secrets-*.tar.gz
cd ..
```

### Step 2: Update Version Files

```bash
# Update package.json version
cd headlamp-sealed-secrets
npm version patch  # or minor, or major
cd ..

# Update artifacthub-pkg.yml (root only)
# Change version and appVersion to match package.json

# Update CHANGELOG.md
# Move unreleased items under new version heading
# Add release date in ISO format
```

### Step 3: Commit Version Bump

```bash
# Commit all version updates
git add headlamp-sealed-secrets/package.json artifacthub-pkg.yml CHANGELOG.md
git commit -m "chore(release): bump version to 0.2.5"

# Push to main
git push origin main
```

### Step 4: Create and Push Tag

```bash
# Create annotated tag with message
git tag -a v0.2.5 -m "Release version 0.2.5"

# Push tag to remote (triggers publish workflow)
git push origin v0.2.5
```

### Step 5: Verify Release

1. **GitHub Actions**: Check `.github/workflows/publish.yml`
   - Workflow runs automatically on tag push
   - Builds plugin and creates GitHub release
   - Logs available in Actions tab

2. **GitHub Release**: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/releases
   - Should see new release with tarball
   - Release notes auto-generated from commits
   - Verify tarball filename and checksum

3. **Artifact Hub**: https://artifacthub.io/packages/headlamp-sealed-secrets
   - Syncs automatically (may take 5-10 minutes)
   - Verify version appears with correct metadata
   - Check archive URL and checksum match

## CI/CD Workflows

### CI Workflow (`.github/workflows/ci.yml`)

**Trigger**: Push to `main` and PR to `main`

**Jobs**:
1. Lint and typecheck
2. Build plugin
3. Upload build artifact (for PRs)

**Duration**: ~2 minutes

### Publish Workflow (`.github/workflows/publish.yml`)

**Trigger**: Push of version tag (e.g., `v0.2.4`)

**Jobs**:
1. Lint and typecheck
2. Build plugin
3. Create tarball (deterministic)
4. Upload tarball to GitHub release
5. Update `artifacthub-pkg.yml` with checksum (NEW)
6. Auto-calculate checksum (NEW)
7. Commit checksum update (NEW)

**Notes**:
- Deterministic builds (reproducible checksums)
- Single artifact: tarball only
- Automatic checksum management

**Duration**: ~3 minutes

## Repository Structure

```
headlamp-sealed-secrets-plugin/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, build, test on main/PR
│       └── publish.yml               # Build and publish on tag
├── headlamp-sealed-secrets/          # Plugin source code
│   ├── src/
│   ├── package.json                  # Version source of truth
│   ├── artifacthub-pkg.yml           # (DEPRECATED - see root)
│   └── dist/                         # Built plugin (gitignored)
├── artifacthub-pkg.yml               # SINGLE source of truth for releases
├── artifacthub-repo.yml              # Repository metadata
├── CHANGELOG.md                      # Release notes
├── PUBLISHING.md                     # Publishing guide (legacy)
└── GIT_WORKFLOW.md                   # This file
```

## Cleanup Tasks

### Optional: Remove Redundant Version Directories

The `/headlamp-sealed-secrets-plugin/0.2.X/` directories are no longer needed with automated releases:

```bash
# These can be safely removed - GitHub releases are the source of truth
rm -rf headlamp-sealed-secrets-plugin/
```

Or keep for historical reference, but they won't be used for future releases.

### Clean Up Artifacts During Release

The publish workflow should only generate one artifact:
- `headlamp-sealed-secrets-<VERSION>.tar.gz`

Not:
- Individual `main.js` files
- Duplicated `package.json` files

## Best Practices

1. **Build Once, Use Everywhere**
   - Single build in publish workflow
   - Calculate checksum from that build
   - Use same tarball for GitHub release and Artifact Hub

2. **Deterministic Builds**
   - No non-deterministic timestamps
   - No random ID generation
   - Use `.npmrc` for fixed dependency versions

3. **Automatic Checksums**
   - Calculate checksum in publish workflow
   - Update `artifacthub-pkg.yml` programmatically
   - Never manually edit checksums

4. **Protected Main Branch**
   - Require PR reviews
   - Require CI checks pass
   - Dismiss stale reviews on push

5. **Clean History**
   - Squash merge feature branches (optional)
   - Keep linear history for releases
   - Use conventional commits

6. **Release Tags**
   - Annotated tags (not lightweight)
   - Descriptive messages
   - Never delete or force-push

## GitHub Setup Checklist

- [ ] Repository created at `github.com/privilegedescalation/headlamp-sealed-secrets-plugin`
- [ ] Default branch set to `main`
- [ ] Branch protection enabled for `main`:
  - [ ] Require PR review (1+ approved)
  - [ ] Require status checks pass (CI workflow)
  - [ ] Dismiss stale reviews on push
  - [ ] Require branches up to date before merge
- [ ] Actions enabled with `local-ubuntu-latest` runner
- [ ] Secrets configured:
  - [ ] `NPM_TOKEN` (if publishing to NPM, optional for Headlamp)
- [ ] Artifact Hub repository synced (ID: `5574d37c-c4ae-45ab-a378-ef24aaba5b4c`)

## Troubleshooting

### Build Checksums Don't Match

**Problem**: Checksum in `artifacthub-pkg.yml` differs from released tarball

**Cause**: Rebuilding locally instead of using released artifact

**Solution**: Use released tarball from GitHub, never rebuild for Artifact Hub

### Artifact Hub Shows Wrong Checksum

**Problem**: Artifact Hub metadata out of sync with release

**Cause**: Manual checksum edits or stale cache

**Solution**:
1. Verify checksum was updated automatically in publish workflow
2. Force Artifact Hub sync: control-panel → repositories → sync
3. Wait 5-10 minutes for sync completion

### Non-Deterministic Builds

**Problem**: Running `npm run build` twice produces different checksums

**Cause**: Timestamps, random IDs, or dependency variations

**Solution**:
1. Ensure Node version consistent (defined in `.nvmrc` or actions)
2. Use `npm ci` instead of `npm install`
3. Lock npm version in workflows
4. Avoid any dynamic content in builds

### Tag Naming Issues

**Problem**: Workflow doesn't trigger on tag push

**Cause**: Tag format doesn't match `v*` pattern

**Solution**: Ensure tags are exactly `v0.2.4` format (no extra characters)

## Related Files

- [PUBLISHING.md](/Users/cpfarhood/Documents/Repositories/headlamp-sealed-secrets-plugin/PUBLISHING.md) - Legacy publishing guide
- [.github/workflows/ci.yml](/Users/cpfarhood/Documents/Repositories/headlamp-sealed-secrets-plugin/.github/workflows/ci.yml) - CI workflow
- [.github/workflows/publish.yml](/Users/cpfarhood/Documents/Repositories/headlamp-sealed-secrets-plugin/.github/workflows/publish.yml) - Publish workflow
- [artifacthub-pkg.yml](/Users/cpfarhood/Documents/Repositories/headlamp-sealed-secrets-plugin/artifacthub-pkg.yml) - Release metadata
- [CHANGELOG.md](/Users/cpfarhood/Documents/Repositories/headlamp-sealed-secrets-plugin/CHANGELOG.md) - Release notes

## Resources

- [Headlamp Plugin Publishing](https://headlamp.dev/docs/latest/development/plugins/publishing/)
- [Artifact Hub Documentation](https://artifacthub.io/docs)
- [Semantic Versioning](https://semver.org)
- [Conventional Commits](https://www.conventionalcommits.org/)
