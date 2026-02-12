# Release Quick Reference

## One-Minute Release (Copy & Paste)

```bash
# 1. Bump version
cd headlamp-sealed-secrets
npm version patch     # or minor/major
cd ..

# 2. Update metadata (edit artifacthub-pkg.yml manually)
# Change: version: 0.2.5 and appVersion: 0.2.5

# 3. Commit and tag
NEWVER=$(grep '"version"' headlamp-sealed-secrets/package.json | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
git add headlamp-sealed-secrets/package.json artifacthub-pkg.yml CHANGELOG.md
git commit -m "chore(release): bump version to $NEWVER"
git push origin main
git tag -a v$NEWVER -m "Release version $NEWVER"
git push origin v$NEWVER

# Done! Publish workflow runs automatically.
```

## Version Bump Levels

| Command | Before | After | Use Case |
|---------|--------|-------|----------|
| `npm version patch` | 0.2.4 | 0.2.5 | Bug fixes |
| `npm version minor` | 0.2.4 | 0.3.0 | New features |
| `npm version major` | 0.2.4 | 1.0.0 | Breaking changes |

## Three Files to Update

1. **headlamp-sealed-secrets/package.json**
   - `npm version patch` does this automatically

2. **artifacthub-pkg.yml** (root)
   ```yaml
   version: 0.2.5
   appVersion: 0.2.5
   ```

3. **CHANGELOG.md** (optional but recommended)
   ```markdown
   ## [0.2.5] - 2026-02-12

   ### Fixed
   - Description of fix
   ```

## Verification Steps

After pushing tag:

1. GitHub Actions: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/actions
   - Watch for "Publish Release" workflow
   - Should complete in 3-5 minutes

2. GitHub Releases: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/releases
   - New release should appear
   - Should contain tarball artifact

3. Artifact Hub: https://artifacthub.io/packages/headlamp-sealed-secrets
   - Wait 5-10 minutes for sync
   - Verify new version appears

## Git Commands Cheat Sheet

```bash
# See current version
grep '"version"' headlamp-sealed-secrets/package.json

# See all tags
git tag -l | sort -V

# See recent commits
git log --oneline -10

# See if anything is uncommitted
git status

# Update main from remote
git pull origin main

# Create annotated tag
git tag -a v0.2.5 -m "Release version 0.2.5"

# Push tag (triggers workflow)
git push origin v0.2.5

# Delete tag if you made mistake
git tag -d v0.2.5
git push origin -d v0.2.5
```

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "tag already exists" | `git tag -d v0.2.5 && git push origin -d v0.2.5` |
| "workflow failed" | Check Actions tab for error, fix locally, delete tag, retry |
| "checksum mismatch" | Use tarball from GitHub release, never rebuild locally |
| "Artifact Hub out of sync" | Force sync from ArtifactHub UI or wait 10 minutes |
| "version doesn't match" | Ensure package.json, artifacthub-pkg.yml, and tag all match |

## File Locations

```
headlamp-sealed-secrets-plugin/
├── headlamp-sealed-secrets/package.json      ← Version source of truth
├── artifacthub-pkg.yml                       ← Must match above
├── CHANGELOG.md                              ← Release notes
├── .github/workflows/publish.yml             ← Automation
└── .github/workflows/ci.yml                  ← CI checks
```

## Pre-Release Checklist

```
- [ ] All tests green on main branch
- [ ] Code merged and CI passing
- [ ] CHANGELOG updated (optional)
- [ ] No uncommitted changes: git status
```

## After Release

```
- [ ] Verify GitHub Actions succeeded
- [ ] Verify GitHub Release created with tarball
- [ ] Wait 5-10 min, verify Artifact Hub updated
- [ ] Download tarball and verify it works locally (optional)
- [ ] Close related GitHub issues (optional)
```

## Documentation Links

- Full Guide: [RELEASE_GUIDE.md](/Users/cpfarhood/Documents/Repositories/headlamp-sealed-secrets-plugin/RELEASE_GUIDE.md)
- Git Workflow: [GIT_WORKFLOW.md](/Users/cpfarhood/Documents/Repositories/headlamp-sealed-secrets-plugin/GIT_WORKFLOW.md)
- Development: [DEVELOPMENT.md](/Users/cpfarhood/Documents/Repositories/headlamp-sealed-secrets-plugin/DEVELOPMENT.md)
