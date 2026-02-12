# CI/CD Design Document

## Overview

This document describes the CI/CD architecture and design decisions for the Headlamp Sealed Secrets plugin.

## Goals

1. **Single Source of Truth**: Build once, use everywhere
2. **Deterministic Builds**: Same input produces same output
3. **Reproducible Releases**: Verify artifacts can be rebuilt
4. **Automated Checksums**: Never manually edit checksums
5. **Fast Feedback**: Tests run in < 5 minutes
6. **Simple Process**: Easy for developers to cut releases

## Architecture

### Workflow Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Main Branch                          │
│                                                           │
│  Developer pushes commits                                │
│           │                                              │
│           ├──→ CI Workflow (*.yml)                       │
│           │        ├─ Lint                               │
│           │        ├─ Type check                         │
│           │        └─ Build (verification only)          │
│           │                                              │
│           └──→ PR review → merge to main                 │
│                                                           │
└─────────────────────────────────────────────────────────┘
                        │
                        │ (All commits merged)
                        │
┌─────────────────────────────────────────────────────────┐
│                   Release Process                        │
│                                                           │
│  1. Bump version (npm version patch)                    │
│  2. Update artifacthub-pkg.yml                          │
│  3. Commit to main                                      │
│  4. Create tag: git tag -a v0.2.5                       │
│  5. Push tag: git push origin v0.2.5                    │
│           │                                              │
│           └──→ Publish Workflow (publish.yml)            │
│                    ├─ Lint                               │
│                    ├─ Type check                         │
│                    ├─ Build (deterministic)              │
│                    ├─ Create tarball                     │
│                    ├─ Calculate checksum                 │
│                    ├─ Create GitHub Release              │
│                    ├─ Update artifacthub-pkg.yml         │
│                    └─ Push metadata update               │
│                                                           │
└─────────────────────────────────────────────────────────┘
                        │
                        │ (Release created)
                        │
┌─────────────────────────────────────────────────────────┐
│               Distribution & Verification                │
│                                                           │
│  GitHub Releases                                         │
│  ├─ headlamp-sealed-secrets-0.2.5.tar.gz               │
│  └─ Release notes (auto-generated)                       │
│                                                           │
│  Artifact Hub (syncs automatically)                      │
│  ├─ Discovers from artifacthub-pkg.yml                  │
│  ├─ Shows archive URL                                   │
│  └─ Displays checksum for verification                  │
│                                                           │
│  Users/Headlamp                                          │
│  └─ Download from GitHub or Artifact Hub                │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Workflow Specifications

### CI Workflow

**File**: `.github/workflows/ci.yml`

**Triggers**:
- Push to `main`
- Pull requests to `main`

**Jobs**: Single `test` job

| Step | Command | Purpose | Time |
|------|---------|---------|------|
| Checkout | `actions/checkout@v4` | Get source code | <1s |
| Node Setup | `actions/setup-node@v4` | Install Node 20 + cache | 1s |
| Dependencies | `npm ci` | Clean install | 30s |
| Type Check | `npm run tsc` | TypeScript validation | 15s |
| Lint | `npm run lint` | Code quality | 10s |
| Build | `npm run build` | Production build | 4s |
| Verify Artifacts | shell script | Check dist/ exists | <1s |
| Upload Artifacts | `actions/upload-artifact@v4` | Store for inspection | 5s |

**Total Time**: ~2 minutes
**Failure Behavior**: Blocks PR merge
**Retention**: 7 days (artifacts)

**Key Features**:
- NPM cache enabled for speed
- Deterministic dependencies with `npm ci`
- Upload dist/ for manual inspection
- Clear error messages on failure

### Publish Workflow

**File**: `.github/workflows/publish.yml`

**Triggers**:
- Push of version tag (e.g., `v0.2.5`)
- Manual trigger via workflow_dispatch

**Jobs**: Single `publish` job

| Step | Purpose | Key Details |
|------|---------|------------|
| Checkout | Get source at tag | Include full history |
| Node Setup | Install Node 20 + cache | Consistent with CI |
| Extract Version | Parse version from tag | e.g., v0.2.5 → 0.2.5 |
| Dependencies | Clean install | Deterministic |
| Type Check | Validate types | Same as CI |
| Lint | Code quality | Same as CI |
| Build | Production build | Deterministic output |
| Create Tarball | `npm pack` | Single artifact |
| Verify Contents | Check main.js exists | Sanity check |
| Create Release | Upload to GitHub | Make artifact accessible |
| Update Metadata | Calculate checksum | Auto-populate artifacthub-pkg.yml |
| Commit Update | Push checksum update | Update main branch |
| Print Summary | Display results | For manual verification |

**Total Time**: ~3 minutes
**Failure Behavior**: Release not created
**Retention**: Permanent (GitHub releases)

**Key Features**:
- **Deterministic**: Same input produces same tarball
- **Automatic Checksums**: No manual checksum editing
- **Single Artifact**: Only tarball uploaded (not individual files)
- **Metadata Updated**: artifacthub-pkg.yml auto-updated with correct values

## Design Decisions

### 1. Build Once, Use Everywhere

**Decision**: Publish workflow builds once, creates tarball, uses for all releases

**Rationale**:
- Non-deterministic builds → different checksums each time
- Running build locally → can't verify released artifact
- Multiple builds → harder to debug

**Implementation**:
- Publish workflow is single source of truth for released artifacts
- Never rebuild locally for verification
- Always download from GitHub for verification

### 2. Deterministic Builds

**Decision**: Use exact Node version, npm ci, fixed dependencies

**Rationale**:
- Reproducible builds = user trust
- Same build steps should produce same output
- Different environment = different artifact = checksum mismatch

**Implementation**:
```yaml
- Node: 20.x (fixed in workflow)
- npm ci (not install)
- package-lock.json (committed to repo)
- NODE_ENV: production
```

### 3. Automatic Checksum Management

**Decision**: Calculate checksum in workflow, update metadata programmatically

**Rationale**:
- Manual edits → errors
- Checksum after build → guaranteed to match released artifact
- Automation → always correct

**Implementation**:
```bash
# In publish workflow
CHECKSUM=$(sha256sum "tarball.tar.gz" | awk '{print $1}')

# Python updates YAML
python3 -c "update artifacthub-pkg.yml with checksum"

# Git commits the update
git commit -m "chore(release): update checksums"
```

### 4. Single Artifact Distribution

**Decision**: Only release tarball, not individual files

**Rationale**:
- Headlamp expects tarball
- Checksum verification requires single file
- Smaller release size
- Cleaner GitHub releases page

**Implementation**:
- Use `npm pack` to create tarball
- Upload only tarball to GitHub release
- Don't upload individual main.js, package.json, etc.

### 5. Protected Main Branch

**Decision**: Require PR review before merging to main

**Rationale**:
- All releases come from main
- Protect main → protect releases
- Code review → quality assurance

**Implementation**:
```
GitHub Settings → Branches → main
- Require pull request reviews: ≥1
- Require status checks pass: CI workflow
- Dismiss stale reviews on push
- Require branches up to date
```

### 6. Semantic Versioning

**Decision**: MAJOR.MINOR.PATCH (SemVer 2.0.0)

**Rationale**:
- Standard in package ecosystems
- Clear upgrade impact to users
- Matches Artifact Hub expectations

**Implementation**:
- Use `npm version patch/minor/major`
- Update artifacthub-pkg.yml to match
- Tag with `v<VERSION>`

### 7. Conventional Commits

**Decision**: Use types (feat, fix, docs, chore) in commit messages

**Rationale**:
- Structured commit history
- Auto-generate release notes from commits
- Easy to scan changelog

**Implementation**:
```
feat(ui): add new component
fix(api): handle null response
docs: update README
chore(release): bump version
```

## Repository Structure

```
headlamp-sealed-secrets-plugin/
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Push to main, PR to main
│       └── publish.yml                # Tag push triggers release
│
├── headlamp-sealed-secrets/           # Plugin source
│   ├── src/                           # TypeScript source
│   ├── dist/                          # Built output (gitignored)
│   ├── package.json                   # Version source of truth
│   ├── package-lock.json              # Locked dependencies
│   └── artifacthub-pkg.yml            # DEPRECATED (see root)
│
├── artifacthub-pkg.yml                # SINGLE metadata file (root)
├── artifacthub-repo.yml               # Repository info
├── CHANGELOG.md                       # Release notes
├── GIT_WORKFLOW.md                    # Workflow guide
├── RELEASE_GUIDE.md                   # Detailed release steps
└── RELEASE_QUICK_REFERENCE.md         # Quick copy-paste commands
```

**Key Point**: Only ONE `artifacthub-pkg.yml` in repository root. Version-specific directories (`headlamp-sealed-secrets-plugin/0.2.X/`) are legacy and should be removed.

## Environment Variables

### CI Workflow
```yaml
# None required
# Uses standard GitHub Actions environment
```

### Publish Workflow
```yaml
NODE_ENV: production              # For build consistency
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Create release
# NPM_TOKEN: optional if publishing to NPM
```

## Secrets & Permissions

### Required GitHub Secrets
- `GITHUB_TOKEN`: Pre-installed, used for creating releases

### Optional GitHub Secrets
- `NPM_TOKEN`: Only if publishing to NPM (not required for Headlamp)

### Branch Protections
- Require PR review before merge
- Require CI workflow to pass
- Require branches up to date before merge

## Performance Tuning

### NPM Cache
```yaml
cache: 'npm'
cache-dependency-path: headlamp-sealed-secrets/package-lock.json
```
Reduces `npm ci` from 30s → 5s

### Parallel Jobs (Future)
Currently single job. Could parallelize:
```
- Lint & Type check (parallel)
- Build (sequential, depends on install)
- Upload artifacts (parallel)
```
Expected savings: ~20-30 seconds

### Build Optimization
See BUILD_VERIFICATION_SUMMARY.md for current metrics:
- Build time: 3.87s
- Bundle size: 359.73 KB (98.79 KB gzipped)

## Error Handling

### CI Workflow Failures
1. PR marked as "checks failed"
2. Cannot merge to main
3. Developer fixes locally
4. Pushes new commit
5. CI re-runs automatically

### Publish Workflow Failures
1. Release not created
2. Check Actions logs for error
3. Common causes:
   - Build error (run locally to debug)
   - Type error (npm run tsc)
   - Lint error (npm run lint)
4. Fix and try again:
   - Delete tag locally and remotely
   - Fix issue
   - Create new tag
   - Push tag again

## Monitoring & Debugging

### Check Workflow Status
- GitHub Actions tab: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/actions
- Shows all runs with timestamps and status
- Click to see detailed logs

### Monitor Specific Workflow
```bash
# See recent runs
gh run list -R privilegedescalation/headlamp-sealed-secrets-plugin

# See specific run details
gh run view <RUN_ID> -R privilegedescalation/headlamp-sealed-secrets-plugin
```

### Verify Artifact
```bash
# Check GitHub release
wget https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/releases/download/v0.2.5/headlamp-sealed-secrets-0.2.5.tar.gz

# Verify checksum
sha256sum headlamp-sealed-secrets-0.2.5.tar.gz

# Compare with artifacthub-pkg.yml
grep archive-checksum artifacthub-pkg.yml
```

## Future Improvements

### Phase 1 (Current)
- Basic CI on push/PR
- Tag-based publish with checksum automation
- GitHub release creation
- Artifact Hub metadata sync

### Phase 2 (Optional)
- Parallel CI jobs (lint + test in parallel)
- SBOM (Software Bill of Materials) generation
- Signed releases with GPG
- Automated changelog generation
- NPM publish option

### Phase 3 (Optional)
- Release notes template
- Automated security scanning
- Performance benchmarks
- Docker image builds
- Multi-platform support

## References

- [Headlamp Plugin Publishing](https://headlamp.dev/docs/latest/development/plugins/publishing/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Artifact Hub Documentation](https://artifacthub.io/docs)
- [Semantic Versioning](https://semver.org)
- [Conventional Commits](https://www.conventionalcommits.org/)
