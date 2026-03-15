# Headlamp Sealed Secrets Plugin

[![Artifact Hub](https://img.shields.io/endpoint?url=https://artifacthub.io/badge/package/headlamp/sealed-secrets/sealed-secrets)](https://artifacthub.io/packages/headlamp/sealed-secrets/sealed-secrets)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub release](https://img.shields.io/github/v/release/sm-moshi/headlamp-sealed-secrets-plugin)](https://github.com/sm-moshi/headlamp-sealed-secrets-plugin/releases)
[![GitHub issues](https://img.shields.io/github/issues/sm-moshi/headlamp-sealed-secrets-plugin)](https://github.com/sm-moshi/headlamp-sealed-secrets-plugin/issues)
[![Test Coverage](https://img.shields.io/badge/coverage-92%25-brightgreen)](docs/development/testing.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue)](https://www.typescriptlang.org/)

A comprehensive [Headlamp](https://headlamp.dev) plugin for managing [Bitnami Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) with **client-side encryption** and **RBAC-aware UI**.

## Features

- Client-side encryption using RSA-OAEP + AES-256-GCM
- List, view, create, and manage SealedSecrets
- View and download sealing key certificates
- Decrypt sealed values (requires RBAC permissions)
- RBAC-aware UI adapts to user permissions
- Support for all three scoping modes (strict, namespace-wide, cluster-wide)
- Type-safe implementation with branded types
- 92% test coverage


## Quick Start

### Installation

#### Option 1: Headlamp Plugin Manager (Recommended)

Browse the Headlamp Plugin Manager (Settings → Plugins → Catalog) and install **sealed-secrets** directly.

#### Option 2: Manual Tarball Install

Download the latest tarball from the [Releases page](https://github.com/sm-moshi/headlamp-sealed-secrets-plugin/releases), then extract it into your Headlamp plugins directory:

```bash
# macOS
tar -xzf sealed-secrets-*.tar.gz -C ~/Library/Application\ Support/Headlamp/plugins/

# Linux
tar -xzf sealed-secrets-*.tar.gz -C ~/.config/Headlamp/plugins/

# Restart Headlamp after installing
```

#### Option 3: Build from Source

```bash
git clone https://github.com/sm-moshi/headlamp-sealed-secrets-plugin.git
cd headlamp-sealed-secrets-plugin
npm install
npm run build
npx @kinvolk/headlamp-plugin extract . /headlamp/plugins
```

### First Secret

```bash
# 1. Install Sealed Secrets controller (if not already installed)
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# 2. In Headlamp UI:
#    - Navigate to "Sealed Secrets" in sidebar
#    - Click "Create Sealed Secret"
#    - Fill in name, namespace, and secret data
#    - Click "Create"

# 3. Verify the secret was created
kubectl get sealedsecret -A
kubectl get secret <your-secret-name> -n <namespace>
```


## Documentation

### Getting Started
- **[Installation Guide](docs/getting-started/installation.md)** - Multiple installation methods (macOS, Linux, Windows)
- **[Quick Start Tutorial](docs/getting-started/quick-start.md)** - Create your first sealed secret

### User Guides
- **[Scopes Explained](docs/user-guide/scopes-explained.md)** - Strict vs namespace-wide vs cluster-wide
- **[RBAC Permissions](docs/user-guide/rbac-permissions.md)** - Configure access control

### Tutorials
- **[CI/CD Integration](docs/tutorials/ci-cd-integration.md)** - GitHub Actions, GitLab CI, Jenkins

### Reference
- **[Troubleshooting](docs/troubleshooting/)** - Common issues and solutions
- **[API Reference](docs/api-reference/generated/)** - Auto-generated TypeScript docs
- **[Architecture ADRs](docs/architecture/adr/)** - Design decisions and rationale
- **[Development Guide](docs/development/workflow.md)** - Contributing and testing


## Prerequisites

- **Headlamp** v0.13.0 or later
- **Sealed Secrets controller** in your cluster:
  ```bash
  kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml
  ```
- **kubectl** access with appropriate RBAC permissions

## Architecture

```
src/
├── index.tsx              # Plugin entry point
├── types.ts               # Branded types, Result type, interfaces
├── hooks/                 # Custom React hooks (controller health, RBAC, encryption)
├── lib/                   # Utility library (CRD, crypto, controller, RBAC, retry, validators)
└── components/            # React components (list, detail, dialogs, settings)
```

The plugin uses custom hooks and a utility library instead of a single data context provider. Client-side encryption is handled entirely in the browser via `node-forge` (RSA-OAEP + AES-256-GCM).

### System Diagram

```
┌─────────────┐
│   Headlamp  │
│   Browser   │
└──────┬──────┘
       │
       ├─ Client-Side Encryption (node-forge)
       │  └─ RSA-OAEP + AES-256-GCM
       │
       ├─ Headlamp Plugin
       │  ├─ React Components (WCAG 2.1 AA)
       │  ├─ Type-Safe API (Result types)
       │  ├─ RBAC Integration
       │  └─ Health Monitoring
       │
       ▼
┌──────────────────┐
│  Kubernetes API  │
└─────────┬────────┘
          │
          ▼
┌──────────────────┐
│ Sealed Secrets   │
│   Controller     │
└──────────────────┘
```

## Security


### How It Works

The plugin encrypts secrets client-side before sending them to Kubernetes:

1. User enters plaintext values in the browser
2. Plugin fetches controller's public certificate
3. Values are encrypted using RSA-OAEP + AES-256-GCM
4. Only encrypted data is sent to Kubernetes
5. Controller decrypts and creates the Secret

Plaintext values never leave your browser.


### Security Features

| Feature | Implementation | Purpose |
|---------|----------------|---------|
| **Client-Side Encryption** | RSA-OAEP + AES-256-GCM | Plaintext never transmitted |
| **Branded Types** | TypeScript compile-time checks | Prevent mixing plaintext/encrypted |
| **Certificate Validation** | PEM parsing + expiry checks | Ensure valid encryption keys |
| **RBAC Integration** | SelfSubjectAccessReview API | Permission-aware UI |
| **Input Validation** | Kubernetes DNS-1123 format | Prevent invalid resources |
| **Retry Logic** | Exponential backoff + jitter | Resilient against transient failures |

### Threat Model

| Threat | Mitigation | Status |
|--------|-----------|--------|
| Man-in-the-middle | Client-side encryption | ✅ Protected |
| Network sniffing | No plaintext on network | ✅ Protected |
| Compromised proxy | Only sees encrypted data | ✅ Protected |
| Browser XSS | Headlamp CSP policies | ⚠️ Standard web security |
| Supply chain | Package locks, dependabot | ⚠️ Ongoing monitoring |

See: [ADR 003: Client-Side Encryption](docs/architecture/adr/003-client-side-crypto.md)

## Technical Details

### Code Quality Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| **Test Coverage** | 92% | Unit + integration tests |
| **TypeScript** | 5.6.2 strict mode | Zero type errors |
| **Dependencies** | node-forge (crypto) | Minimal, audited dependencies |

### Technology Stack

- **Language**: TypeScript 5.6.2 (strict mode)
- **UI Framework**: React 18 with hooks
- **Crypto Library**: node-forge (RSA-OAEP + AES-256-GCM)
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier
- **Build Tool**: Headlamp plugin SDK

### Architecture

- **Result Types**: Type-safe error handling ([ADR 001](docs/architecture/adr/001-result-types.md))
- **Branded Types**: Compile-time type safety ([ADR 002](docs/architecture/adr/002-branded-types.md))
- **Custom Hooks**: Separated business logic ([ADR 005](docs/architecture/adr/005-react-hooks-extraction.md))
- **RBAC Integration**: Permission-aware UI ([ADR 004](docs/architecture/adr/004-rbac-integration.md))

See: [Architecture Decision Records](docs/architecture/adr/) for detailed design rationale

## Contributing

We welcome contributions.

### Quick Start for Contributors

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/headlamp-sealed-secrets-plugin
cd headlamp-sealed-secrets-plugin

# 2. Install dependencies
npm install

# 3. Start development (hot reload)
npm start

# 4. Run tests
npm test

# 5. Lint and type-check
npm run lint
npm run tsc
```

### Contribution Areas

| Area | What We Need | Good First Issue |
|------|-------------|------------------|
| **Documentation** | Tutorials, guides, examples | ✅ Yes |
| **Testing** | More test coverage, edge cases | ✅ Yes |
| **Features** | Bulk operations, secret templates | ⚠️ Discuss first |
| **Bug Fixes** | See [open issues](https://github.com/sm-moshi/headlamp-sealed-secrets-plugin/issues) | ✅ Yes |
| **Accessibility** | ARIA improvements, keyboard nav | ✅ Yes |
| **Translations** | i18n support (future) | 📅 Planned |

### Before Submitting

- [ ] Read [Development Guide](docs/development/workflow.md)
- [ ] Tests pass (`npm test`)
- [ ] Lint passes (`npm run lint`)
- [ ] TypeScript compiles (`npm run tsc`)
- [ ] Documentation updated (if applicable)
- [ ] Changelog updated (if user-facing change)

See: [Development Workflow](docs/development/workflow.md) | [Testing Guide](docs/development/testing.md)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

See [CHANGELOG.md](CHANGELOG.md) for details on each release.

## Issues & Support

### Need Help?

1. ** Check Documentation First**
   - [Troubleshooting Guide](docs/troubleshooting/) - Common issues and solutions
   - [User Guide](docs/user-guide/) - Feature documentation
   - [API Reference](docs/api-reference/generated/) - TypeScript API docs

2. **🔍 Search Existing Issues**
   - [Open Issues](https://github.com/sm-moshi/headlamp-sealed-secrets-plugin/issues)
   - [Closed Issues](https://github.com/sm-moshi/headlamp-sealed-secrets-plugin/issues?q=is%3Aissue+is%3Aclosed)

3. ** Ask the Community**
   - [GitHub Discussions](https://github.com/sm-moshi/headlamp-sealed-secrets-plugin/discussions)

4. ** Report a Bug**
   - [Create New Issue](https://github.com/sm-moshi/headlamp-sealed-secrets-plugin/issues/new)
   - Include: Plugin version, Headlamp version, error messages, steps to reproduce

### Common Issues

| Issue | Quick Fix | Guide |
|-------|-----------|-------|
| Plugin not loading | Check installation path | [Installation](docs/getting-started/installation.md) |
| Controller not found | Install controller | [Troubleshooting](docs/troubleshooting/) |
| Permission denied | Configure RBAC | [RBAC Permissions](docs/user-guide/rbac-permissions.md) |
| Encryption fails | Check certificate | [Troubleshooting](docs/troubleshooting/) |

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.

## Credits

Built with:
- [Headlamp](https://headlamp.dev) - Kubernetes UI
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) - Encryption controller
- [node-forge](https://github.com/digitalbazaar/forge) - Cryptography library

## Links

### Project Resources
- **[Releases](https://github.com/sm-moshi/headlamp-sealed-secrets-plugin/releases)** - Download plugin
-  **[Documentation](docs/README.md)** - Complete docs
-  **[Issues](https://github.com/sm-moshi/headlamp-sealed-secrets-plugin/issues)** - Bug reports
-  **[Discussions](https://github.com/sm-moshi/headlamp-sealed-secrets-plugin/discussions)** - Q&A
-  **[Changelog](CHANGELOG.md)** - Version history

### External Resources
- **[Headlamp](https://headlamp.dev)** - Kubernetes UI framework
- **[Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)** - Encryption controller
- **[kubeseal CLI](https://github.com/bitnami-labs/sealed-secrets#installation)** - Command-line tool
- **[Kubernetes RBAC](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)** - Access control




# Test runner

