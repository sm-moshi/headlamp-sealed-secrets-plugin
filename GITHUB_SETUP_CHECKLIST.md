# GitHub Setup Checklist

This document provides step-by-step instructions to configure the repository for the optimized CI/CD workflow.

## Quick Setup (15 minutes)

### 1. Enable Actions

```
Settings → Actions → General
- Allow all actions and reusable workflows: [x] CHECKED
- Fork pull request workflows from outside collaborators: "Run workflows from fork pull requests"
```

### 2. Configure Runners

```
Settings → Actions → Runners
- Ensure "local-ubuntu-latest" runner is available
  (Or configure your self-hosted runner)
```

### 3. Create Secrets (Optional)

```
Settings → Secrets and variables → Actions

If publishing to NPM:
  Add secret "NPM_TOKEN"
  - Value: Get from https://www.npmjs.com/settings/[USERNAME]/tokens
  - Type: "Automation" token recommended

GITHUB_TOKEN is automatic (no setup needed)
```

### 4. Protect Main Branch

```
Settings → Branches → Branch protection rules

CREATE NEW RULE:
  Pattern: main

  Require pull request reviews before merging:
    [x] Required number of approvals: 1
    [x] Dismiss stale pull request approvals when new commits are pushed
    [ ] Require code review from owner before merge (unless required)

  Require status checks to pass before merging:
    [x] Require branches to be up to date before merging
    [x] Status checks that must pass: "test" (from CI workflow)

  Additional settings:
    [ ] Include administrators
    [x] Allow force pushes (only for admins if needed)
    [ ] Allow deletions
```

## Detailed Configuration

### Step 1: Repository Settings

Visit: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/settings

#### Basic Settings
```
Repository name: headlamp-sealed-secrets-plugin
Description: Headlamp plugin for Bitnami Sealed Secrets - manage encrypted Kubernetes secrets
Website: https://artifacthub.io/packages/headlamp-sealed-secrets
Visibility: Public
```

#### Features
```
[x] Discussions
[ ] Projects
[ ] Wiki
[ ] Sponsorships
```

### Step 2: Actions Settings

Visit: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/settings/actions

#### General
```
Actions permissions: "Allow all actions and reusable workflows"

Fork pull request workflows from outside collaborators:
"Run workflows from fork pull requests"
```

#### Runners
```
Check: Settings → Actions → Runners

Ensure runner is available:
- Name: local-ubuntu-latest
- Status: Idle or Online
- Labels: local-ubuntu-latest
```

If self-hosted runner not available:
1. Contact infrastructure team
2. Or use GitHub-hosted: `ubuntu-latest`
3. Update workflow YAML: `runs-on: ubuntu-latest`

### Step 3: Secrets Configuration

Visit: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/settings/secrets/actions

#### Optional: NPM Token (Only if publishing to NPM)

```
Name: NPM_TOKEN
Value: [Get from npm.js]

To get token:
1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Create new token: Type "Automation"
3. Copy token
4. Paste in GitHub secret
```

#### GITHUB_TOKEN (Automatic)

No setup needed. Pre-installed and automatically available.

### Step 4: Branch Protection

Visit: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/settings/branches

#### Protect Main Branch

**Step 4.1**: Click "Add rule" (or edit existing main rule)

**Step 4.2**: Enter pattern
```
Pattern: main
```

**Step 4.3**: Require pull requests
```
[x] Require a pull request before merging
    [x] Require approvals: 1
    [x] Dismiss stale pull request approvals when new commits are pushed
    [ ] Require review from Code Owners
```

**Step 4.4**: Require status checks
```
[x] Require status checks to pass before merging
[x] Require branches to be up to date before merging

Status checks that must pass:
- Search and select: "test"
  (This is from CI workflow in .github/workflows/ci.yml)
```

**Step 4.5**: Additional settings
```
[ ] Include administrators
[x] Allow force pushes → "Allow force pushes by administrators"
[ ] Allow deletions
[x] Lock branch: Do not lock
```

**Step 4.6**: Click "Create" or "Save changes"

## Verification

### Verify CI Workflow Works

```bash
# Create test branch and push
git checkout -b test/workflow-verify
git push origin test/workflow-verify

# Open pull request
# https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/pull/new/test/workflow-verify

# Verify:
# - CI workflow appears in PR checks
# - Lint passes
# - Build passes
# - Workflow completes in 2-3 minutes

# Clean up
git checkout main
git branch -D test/workflow-verify
git push origin -d test/workflow-verify
```

### Verify Branch Protection

```bash
# Try to push directly to main (should fail)
git checkout main
git commit --allow-empty -m "test"
git push origin main

# Expected: Rejected by remote (can't push directly)

# Correct way: Create PR
git checkout -b fix/test
git commit --allow-empty -m "test commit"
git push origin fix/test

# Open PR: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/compare/main...fix/test
# - Check that PR cannot be merged without approval
# - Check that PR cannot be merged until CI passes

# Clean up after testing
```

### Verify Release Workflow

```bash
# Manually trigger or wait for next release
git tag -a v0.2.5 -m "Test release"
git push origin v0.2.5

# Verify in GitHub Actions:
# https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/actions

# Expected:
# - "Publish Release" workflow starts
# - Completes in 3-5 minutes
# - Creates GitHub release with tarball
# - Updates artifacthub-pkg.yml with checksum

# Verify release created:
# https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/releases/tag/v0.2.5

# Clean up test tag
git tag -d v0.2.5
git push origin -d v0.2.5
```

## Troubleshooting Setup

### "Actions not enabled"

```
Go to: Settings → Actions
Select: "Allow all actions and reusable workflows"
Save
```

### "Status checks don't appear in PR"

```
1. Verify CI workflow has correct syntax
2. Push to any branch to trigger workflow
3. Check: Actions tab → See if workflow runs
4. If workflow runs:
   - Wait 2-3 minutes for checks to appear in PR
   - Refresh PR page
5. If workflow doesn't run:
   - Check workflow file for syntax errors
   - Check trigger conditions (on: push, on: pull_request)
```

### "Can't create branch protection"

```
1. Verify you're repository admin
2. Verify main branch exists
3. Try again with pattern "main" (exact match)
4. Check if rule already exists (edit instead of create new)
```

### "Runner not available"

```
If "local-ubuntu-latest" not available:

Option 1: Use GitHub-hosted runner
- Edit .github/workflows/ci.yml
- Change: runs-on: ubuntu-latest
- Change: .github/workflows/publish.yml to ubuntu-latest

Option 2: Set up self-hosted runner
- Settings → Actions → Runners
- Follow GitHub instructions to install runner
- Register with label: local-ubuntu-latest
```

### "Push rejected (branch protected)"

```
This is expected! Do not force push.

Correct workflow:
1. Create feature branch: git checkout -b fix/my-fix
2. Make changes and commit
3. Push to feature branch: git push origin fix/my-fix
4. Open PR on GitHub
5. Get approval from code reviewer
6. Merge via GitHub UI (not git push)
```

## Workflow Summary

After setup, development flow is:

```
┌─ Feature Branch (develop/feature)
│  └─ git push origin develop
│     └─ CI workflow runs (lint, build, test)
│
├─ Open Pull Request to main
│  └─ CI workflow runs again
│  └─ Requires 1 approval to merge
│
├─ Code Review → Approve → Merge to main
│  └─ CI workflow runs (final check)
│  └─ Auto-merge or manual merge
│
└─ Create release tag
   └─ git tag -a v0.2.5
   └─ git push origin v0.2.5
   └─ Publish workflow runs
   └─ Creates GitHub release
   └─ Updates Artifact Hub metadata
```

## Artifact Hub Integration

### Prerequisites

Repository must be registered:
- Repository ID: 5574d37c-c4ae-45ab-a378-ef24aaba5b4c
- Metadata file: artifacthub-pkg.yml

### Verification

```
1. Go to: https://artifacthub.io/packages/headlamp-sealed-secrets
2. Check: Version displays correctly
3. Check: Archive URL is correct
4. Check: Checksum matches released tarball
5. Check: Installation instructions display
```

### Sync Manually

If version not appearing after 10 minutes:

```
1. Go to: https://artifacthub.io/control-panel/repositories
2. Find: headlamp-sealed-secrets-plugin
3. Click: "Trigger sync"
4. Wait: 5-10 minutes
5. Refresh: artifacthub.io package page
```

## Final Verification Checklist

```
Repository Settings:
- [ ] Repository is public
- [ ] Description is set
- [ ] Website/Homepage is set
- [ ] Topics include: headlamp, kubernetes, sealed-secrets

Actions:
- [ ] Actions are enabled
- [ ] local-ubuntu-latest runner available
- [ ] CI workflow (.github/workflows/ci.yml) exists
- [ ] Publish workflow (.github/workflows/publish.yml) exists

Secrets:
- [ ] NPM_TOKEN created (optional, only if publishing to NPM)
- [ ] GITHUB_TOKEN is automatic

Branch Protection (main):
- [ ] Require 1 PR approval before merge
- [ ] Require CI workflow to pass
- [ ] Require branches up to date
- [ ] Stale reviews dismissed on push

Testing:
- [ ] Push to PR triggers CI workflow
- [ ] CI workflow completes successfully
- [ ] Cannot merge without approval
- [ ] Cannot merge without passing CI
- [ ] Direct push to main is rejected

Release:
- [ ] Tag push triggers Publish workflow
- [ ] Publish workflow creates GitHub release
- [ ] Tarball is uploaded to release
- [ ] artifacthub-pkg.yml is updated with checksum
- [ ] Artifact Hub shows new version within 10 minutes
```

## Support

- GitHub Actions Docs: https://docs.github.com/en/actions
- GitHub Branch Protection: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- Artifact Hub: https://artifacthub.io/docs
- Headlamp Plugin Publishing: https://headlamp.dev/docs/latest/development/plugins/publishing/

## Related Documents

- [GIT_WORKFLOW.md](/Users/cpfarhood/Documents/Repositories/headlamp-sealed-secrets-plugin/GIT_WORKFLOW.md) - Branching and commit strategy
- [RELEASE_GUIDE.md](/Users/cpfarhood/Documents/Repositories/headlamp-sealed-secrets-plugin/RELEASE_GUIDE.md) - How to cut releases
- [CI_CD_DESIGN.md](/Users/cpfarhood/Documents/Repositories/headlamp-sealed-secrets-plugin/CI_CD_DESIGN.md) - Technical design
- [RELEASE_QUICK_REFERENCE.md](/Users/cpfarhood/Documents/Repositories/headlamp-sealed-secrets-plugin/RELEASE_QUICK_REFERENCE.md) - Copy-paste commands
