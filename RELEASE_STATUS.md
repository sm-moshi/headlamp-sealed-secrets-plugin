# v0.2.4 Release Status

## Current Status: ⏳ Waiting for Artifact Hub Sync

**Last Updated:** 2026-02-12 16:48 UTC

### ✅ Completed Steps

1. **Build & Package**
   - Plugin built successfully (358.18 kB, 98.04 kB gzipped)
   - All lint and type checks passing
   - Tarball created: `headlamp-sealed-secrets-0.2.4.tar.gz`

2. **GitHub Release**
   - Release created: v0.2.4
   - Tarball uploaded to GitHub
   - Release notes updated
   - **Checksum:** `42545048578d613483993a233326abf6a952b920baf3997fed00e989eb0aa5ba`

3. **Repository Metadata**
   - `headlamp-sealed-secrets/artifacthub-pkg.yml` updated with correct checksum
   - `headlamp-sealed-secrets-plugin/0.2.4/artifacthub-pkg.yml` updated
   - All commits pushed to `main` branch

4. **Kubernetes Deployment**
   - Plugin manually installed in pod: `headlamp-7597447d8-drhmg`
   - Installation path: `/headlamp/plugins/headlamp-sealed-secrets/`
   - ConfigMap updated to use Artifact Hub source
   - **Sidebar entry is visible and working!**

### ⏳ Pending: Artifact Hub Sync

**Current Artifact Hub Status:**
- **Version:** 0.2.4 ✅
- **Checksum:** `49062f6e9f68de49b83d53176d0bc09ce632d3df11e3397459342f51f6282131` ❌ (OLD)
- **Expected:** `42545048578d613483993a233326abf6a952b920baf3997fed00e989eb0aa5ba`
- **Last Sync:** 2026-02-11 19:00 UTC
- **Next Sync:** Within 30-60 minutes (automatic)

### 📋 Verification Checklist

Once Artifact Hub syncs:

- [ ] Artifact Hub shows correct checksum
- [ ] Remove manual plugin installation from pod
- [ ] Restart Headlamp pod to trigger fresh install
- [ ] Verify plugin installs via Artifact Hub (no checksum mismatch)
- [ ] Verify sidebar entry appears
- [ ] Test plugin functionality (create SealedSecret)

### 🔍 Monitoring Commands

```bash
# Check Artifact Hub checksum
curl -s "https://artifacthub.io/api/v1/packages/headlamp/sealed-secrets/headlamp-sealed-secrets" | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(f'Checksum: {data[\"data\"][\"headlamp/plugin/archive-checksum\"]}')"

# Check plugin installer logs
kubectl logs -n kube-system -l app.kubernetes.io/name=headlamp -c headlamp-plugin --tail=50

# Restart Headlamp to trigger fresh install
kubectl rollout restart deployment/headlamp -n kube-system
```

### 📚 Official Workflow Reference

Following [Headlamp plugin publishing docs](https://headlamp.dev/docs/latest/development/plugins/publishing/):

1. ✅ Build plugin locally: `npm run build && npm run package`
2. ✅ Create GitHub release with version tag
3. ✅ Upload tarball to GitHub release
4. ✅ Update `artifacthub-pkg.yml` with tarball checksum
5. ⏳ Wait for Artifact Hub to auto-sync (every 30-60 min)
6. ⏳ Plugin auto-installs via Headlamp's plugin manager

### ⚠️ Known Issues

**Non-Deterministic Builds:**
- Each `npm run build` produces different checksums
- This is normal behavior for Vite bundler
- **Solution:** Build once per release, use that tarball's checksum
- Never rebuild for the same version

**Temporary Manual Install:**
- Plugin manually installed in current pod for immediate testing
- Will be replaced with Artifact Hub install once sync completes
- Manual install won't survive pod restarts

### 🎯 Success Criteria

Release is complete when:
1. Artifact Hub shows checksum `42545048...`
2. Plugin installs without checksum mismatch errors
3. Sidebar entry appears automatically
4. All plugin features work correctly

---

**Notes:**
- Following official Headlamp workflow (GitHub releases + Artifact Hub)
- Not using NPM (not supported for plugin distribution)
- Plugin is working now via manual install (temporary)
- Permanent fix happens automatically when Artifact Hub syncs
