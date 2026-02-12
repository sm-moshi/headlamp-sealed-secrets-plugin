# Development Workflow Guide

Quick reference for developing and testing the Headlamp Sealed Secrets plugin.

---

## 🚀 Quick Start

### Initial Setup

```bash
cd headlamp-sealed-secrets
npm install
```

### Development Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm start` | Start development server with hot reload | Active development |
| `npm run build` | Build for production | Before testing/releasing |
| `npm run tsc` | Type check without building | Verify TypeScript |
| `npm run lint` | Check code quality | Before commit |
| `npm run lint-fix` | Auto-fix linting issues | Fix style issues |
| `npm run format` | Format code with Prettier | Before commit |
| `npm run package` | Create distributable tarball | Before release |
| `npm test` | Run tests | Verify changes |

---

## 🔄 Development Workflow

### 1. **Making Changes**

```bash
# Start development server
npm start

# In another terminal, make code changes
# The dev server will hot-reload automatically
```

### 2. **Before Committing**

```bash
# Fix any linting issues
npm run lint-fix

# Verify TypeScript types
npm run tsc

# Ensure linting passes
npm run lint

# Build to verify production bundle
npm run build
```

### 3. **Testing Changes**

#### Option A: Development Server
```bash
npm start
# Opens Headlamp with plugin loaded at http://localhost:4466
# Changes hot-reload automatically
```

#### Option B: Install Plugin Locally
```bash
# Build and package
npm run build
npm run package

# Install to Headlamp
headlamp plugin install ./headlamp-sealed-secrets-0.1.0.tar.gz

# Or manually extract to plugins directory
mkdir -p ~/.headlamp/plugins/headlamp-sealed-secrets
tar -xzf headlamp-sealed-secrets-0.1.0.tar.gz -C ~/.headlamp/plugins/
```

#### Option C: Test Against Real Cluster
```bash
# Ensure kubectl is configured
kubectl cluster-info

# Start Headlamp with plugin
npm start

# Or use Headlamp desktop app with installed plugin
headlamp
```

---

## ✅ Pre-Commit Checklist

- [ ] `npm run lint-fix` - Fix auto-fixable issues
- [ ] `npm run tsc` - No type errors
- [ ] `npm run lint` - Passes all checks
- [ ] `npm run build` - Builds successfully
- [ ] Test manually in Headlamp
- [ ] Update CHANGELOG.md if needed

---

## 📦 Build & Release Process

### Current Build Status

✅ **Build:** Working (339.42 kB → 93.21 kB gzipped)
✅ **TypeScript:** No errors
✅ **Linting:** All checks passing
✅ **Package:** Creates `headlamp-sealed-secrets-0.1.0.tar.gz` (92K)

### Verified Commands

```bash
# ✅ Build production bundle
npm run build
# Output: dist/main.js (339.42 kB)

# ✅ Type check
npm run tsc
# Output: No errors

# ✅ Lint check
npm run lint
# Output: All checks passing

# ✅ Create package
npm run package
# Output: headlamp-sealed-secrets-0.1.0.tar.gz (92K)
```

### Release Checklist

1. **Update Version**
   ```bash
   # Edit package.json version field
   # Update CHANGELOG.md
   ```

2. **Clean Build**
   ```bash
   rm -rf dist/ node_modules/
   npm install
   npm run build
   ```

3. **Quality Checks**
   ```bash
   npm run tsc
   npm run lint
   npm test  # When tests are added
   ```

4. **Package**
   ```bash
   npm run package
   ```

5. **Test Installation**
   ```bash
   headlamp plugin install ./headlamp-sealed-secrets-*.tar.gz
   ```

6. **Git Tag & Push**
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

7. **Publish**
   - Create GitHub Release
   - Attach `.tar.gz` file
   - Update Artifact Hub (if applicable)

---

## 🧪 Testing Strategy

### Manual Testing Workflow

1. **Start Development Environment**
   ```bash
   npm start
   ```

2. **Access Headlamp**
   - Open http://localhost:4466
   - Navigate to "Sealed Secrets" in sidebar

3. **Test Core Features**
   - [ ] List view loads sealed secrets
   - [ ] Create dialog opens
   - [ ] Encrypt secret works
   - [ ] Detail view shows secret info
   - [ ] Settings page loads config
   - [ ] Sealing keys view shows certificates

4. **Test Error Cases**
   - [ ] Invalid secret name
   - [ ] Empty key-value pairs
   - [ ] Controller unreachable
   - [ ] Invalid certificate
   - [ ] Permission denied

### Testing with Real Cluster

**Prerequisites:**
```bash
# Install sealed-secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Verify installation
kubectl get deployment -n kube-system sealed-secrets-controller
kubectl get svc -n kube-system sealed-secrets-controller
```

**Test Scenarios:**

1. **Create Sealed Secret**
   - Click "Create Sealed Secret"
   - Fill in name, namespace, scope
   - Add key-value pairs
   - Submit → Verify secret created in cluster

2. **Verify Encryption**
   ```bash
   kubectl get sealedsecret <name> -n <namespace> -o yaml
   # Should see encrypted data
   ```

3. **Verify Secret Creation**
   ```bash
   kubectl get secret <name> -n <namespace>
   # Controller should create corresponding Secret
   ```

---

## 🛠️ Troubleshooting

### Build Issues

**Problem:** Build fails with TypeScript errors
```bash
# Solution: Check types
npm run tsc
# Fix type errors shown
```

**Problem:** Linting fails
```bash
# Solution: Auto-fix
npm run lint-fix

# Then manually fix remaining issues
npm run lint
```

### Development Server Issues

**Problem:** Hot reload not working
```bash
# Solution: Restart dev server
# Ctrl+C to stop
npm start
```

**Problem:** Plugin not loading in Headlamp
```bash
# Solution: Check console for errors
# Verify plugin name matches in package.json
# Ensure build completed successfully
```

### Plugin Installation Issues

**Problem:** `headlamp plugin install` fails
```bash
# Solution: Check tarball exists
ls -lh headlamp-sealed-secrets-*.tar.gz

# Verify tarball contents
tar -tzf headlamp-sealed-secrets-*.tar.gz

# Should contain:
# headlamp-sealed-secrets/main.js
# headlamp-sealed-secrets/package.json
```

**Problem:** Plugin not appearing in Headlamp
```bash
# Check installation location
ls ~/.headlamp/plugins/

# Restart Headlamp after installation
```

---

## 📂 Project Structure

```
headlamp-sealed-secrets/
├── src/
│   ├── components/          # React UI components
│   │   ├── DecryptDialog.tsx
│   │   ├── EncryptDialog.tsx
│   │   ├── SealedSecretDetail.tsx
│   │   ├── SealedSecretList.tsx
│   │   ├── SealingKeysView.tsx
│   │   ├── SecretDetailsSection.tsx
│   │   └── SettingsPage.tsx
│   ├── lib/                 # Core logic
│   │   ├── controller.ts    # Controller API
│   │   ├── crypto.ts        # Encryption logic
│   │   └── SealedSecretCRD.ts
│   ├── types.ts             # TypeScript types
│   └── index.tsx            # Plugin entry point
├── dist/                    # Build output (generated)
│   └── main.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔧 Configuration

### TypeScript Configuration

The plugin extends Headlamp's base TypeScript config:

```json
{
  "extends": "./node_modules/@kinvolk/headlamp-plugin/config/plugins-tsconfig.json",
  "include": ["./src/**/*"]
}
```

### ESLint Configuration

```json
{
  "eslintConfig": {
    "extends": [
      "@headlamp-k8s",
      "prettier",
      "plugin:jsx-a11y/recommended"
    ]
  }
}
```

### Dependencies

**Runtime:**
- `node-forge` - Cryptography (RSA-OAEP, AES-GCM)

**Development:**
- `@kinvolk/headlamp-plugin` - Headlamp plugin SDK
- `@types/node-forge` - TypeScript definitions

---

## 📝 Code Style Guidelines

### Import Order
Auto-sorted by `simple-import-sort`:
1. React/external libraries
2. Headlamp imports
3. Material-UI imports
4. Local imports (lib, components, types)

### Component Structure
```typescript
/**
 * Component description
 */
export function ComponentName({ prop1, prop2 }: Props) {
  // 1. Hooks
  const [state, setState] = useState();

  // 2. Callbacks
  const handleAction = () => { };

  // 3. Effects
  useEffect(() => { }, []);

  // 4. Render
  return ( );
}
```

### File Naming
- Components: `PascalCase.tsx`
- Libraries: `camelCase.ts`
- Types: `types.ts`

---

## 🎯 Next Steps for Development

### Immediate (Pre-Enhancement)
1. ✅ Verify build works
2. ✅ Fix linting issues
3. ✅ Test package creation
4. 🔄 Test plugin installation locally
5. 📝 Document workflow (this file)

### Short Term (Phase 1 Preparation)
1. Set up testing framework (Vitest)
2. Add initial unit tests
3. Create test utilities (mock controller, cert generator)
4. Set up CI/CD pipeline

### Enhancement Implementation
- Follow [ENHANCEMENT_PLAN.md](./ENHANCEMENT_PLAN.md)
- Implement changes iteratively
- Test after each enhancement
- Update docs as you go

---

## 🤝 Contributing Workflow

1. **Create Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow code style
   - Add tests for new features
   - Update documentation

3. **Pre-Commit**
   ```bash
   npm run lint-fix
   npm run tsc
   npm run build
   npm test
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

5. **Push & PR**
   ```bash
   git push origin feature/your-feature-name
   # Create Pull Request on GitHub
   ```

---

## 📊 Performance Metrics

**Current Build:**
- Bundle size: 339.42 kB (93.21 kB gzipped)
- Build time: ~3.87s
- Package size: 92 KB

**Goals:**
- Keep bundle < 400 kB
- Build time < 5s
- Maintain tree-shaking

---

## 🔍 Useful Debug Commands

```bash
# Check plugin is loaded in Headlamp
# Open browser console → Look for plugin logs

# Inspect tarball contents
tar -tzf headlamp-sealed-secrets-*.tar.gz

# Check TypeScript compilation output
npm run tsc -- --listFiles

# View linting cache
ls node_modules/.cache/eslint/

# Clear caches
rm -rf node_modules/.cache/
npm run build
```

---

**Last Updated:** 2026-02-11
**Plugin Version:** 0.1.0

Generated with [Claude Code](https://claude.ai/code)
via [Happy](https://happy.engineering)

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>
