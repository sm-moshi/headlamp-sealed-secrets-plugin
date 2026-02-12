# Headlamp Sealed Secrets Plugin Documentation

Complete documentation for the Headlamp Sealed Secrets plugin.

## 📚 Documentation Index

### Getting Started

New to the plugin? Start here:

- **[Installation Guide](getting-started/installation.md)** - Install the plugin on Headlamp
- **[Quick Start](getting-started/quick-start.md)** - Create your first sealed secret in 5 minutes

### User Guide

Learn how to use all the features:

- **[Creating Secrets](user-guide/creating-secrets.md)** - Encrypt and create sealed secrets
- **[Managing Keys](user-guide/managing-keys.md)** - View and download sealing certificates
- **[Scopes Explained](user-guide/scopes-explained.md)** - Understand strict/namespace/cluster-wide scopes
- **[RBAC Permissions](user-guide/rbac-permissions.md)** - Required permissions and access control
- **[Settings](user-guide/settings.md)** - Configure plugin behavior

### Tutorials

Step-by-step guides for common workflows:

- **[CI/CD Integration](tutorials/ci-cd-integration.md)** - Automate secret creation with GitHub Actions, GitLab CI
- **[Multi-Cluster Setup](tutorials/multi-cluster-setup.md)** - Manage secrets across multiple clusters
- **[Secret Rotation](tutorials/secret-rotation.md)** - Rotate secrets and sealing keys safely
- **[Disaster Recovery](tutorials/disaster-recovery.md)** - Backup and restore procedures
- **[Migration from kubeseal](tutorials/migration-from-kubeseal.md)** - Migrate from CLI-based workflow

### Troubleshooting

Solutions for common issues:

- **[Common Errors](troubleshooting/common-errors.md)** - Error messages and fixes
- **[Controller Issues](troubleshooting/controller-issues.md)** - Connection and deployment problems
- **[Encryption Failures](troubleshooting/encryption-failures.md)** - Debugging encryption errors
- **[Permission Errors](troubleshooting/permission-errors.md)** - RBAC troubleshooting
- **[Performance](troubleshooting/performance.md)** - Optimization tips

### Development

Contributing to the plugin:

- **[Setup](development/setup.md)** - Development environment configuration
- **[Workflow](development/workflow.md)** - Development and testing workflow
- **[Testing](development/testing.md)** - Running and writing tests
- **[Code Style](development/code-style.md)** - Coding standards
- **[Debugging](development/debugging.md)** - Debugging tips and tools
- **[Release Process](development/release-process.md)** - How to release new versions

### API Reference

Technical documentation:

- **[Functions](api-reference/functions.md)** - Exported function reference
- **[Types](api-reference/types.md)** - TypeScript type definitions
- **[Hooks](api-reference/hooks.md)** - React hooks API
- **[Components](api-reference/components.md)** - Component props reference
- **[Examples](api-reference/examples.md)** - Code examples and patterns

### Architecture

Technical design and decisions:

- **[Overview](architecture/overview.md)** - System architecture
- **[Encryption Flow](architecture/encryption-flow.md)** - How encryption works
- **[Type System](architecture/type-system.md)** - Result types and branded types explained
- **[Error Handling](architecture/error-handling.md)** - Error handling patterns
- **[Accessibility](architecture/accessibility.md)** - WCAG 2.1 AA compliance details
- **[ADRs](architecture/adr/)** - Architecture Decision Records

### Deployment

Production deployment guides:

- **[Kubernetes](deployment/kubernetes.md)** - Deploy in K8s clusters
- **[Helm](deployment/helm.md)** - Using with Helm deployments
- **[Security Hardening](deployment/security-hardening.md)** - Security best practices
- **[Monitoring](deployment/monitoring.md)** - Observability setup

## 🔍 Quick Links

### Popular Pages

- [Quick Start Guide](getting-started/quick-start.md) - Get started in 5 minutes
- [CI/CD Integration](tutorials/ci-cd-integration.md) - Automate your workflow
- [Troubleshooting](troubleshooting/README.md) - Solve common issues
- [Development Workflow](development/workflow.md) - Contribute to the plugin

### External Resources

- **GitHub**: [privilegedescalation/headlamp-sealed-secrets-plugin](https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin)
- **Issues**: [Report bugs](https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/issues)
- **Discussions**: [Ask questions](https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/discussions)
- **Headlamp**: [headlamp.dev](https://headlamp.dev)
- **Sealed Secrets**: [bitnami-labs/sealed-secrets](https://github.com/bitnami-labs/sealed-secrets)

## 📖 About This Documentation

This documentation is organized by user journey:

- **Getting Started** - For new users
- **User Guide** - For daily usage
- **Tutorials** - For specific workflows
- **Troubleshooting** - For problem-solving
- **Development** - For contributors
- **API Reference** - For developers using the plugin
- **Architecture** - For understanding the design
- **Deployment** - For production deployments

## 🤝 Contributing to Docs

Found an error or want to improve the documentation?

1. **Quick fixes**: Edit on GitHub and submit a PR
2. **Larger changes**: Open an issue first to discuss
3. **New tutorials**: Share your use case in Discussions

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## 📝 Documentation Status

### Completed ✅

- Installation guides
- Quick start tutorial
- Development workflow documentation
- Testing guides
- Architecture overview

### In Progress 🚧

- User guide sections (creating secrets, managing keys, scopes)
- Tutorial content (CI/CD, multi-cluster, rotation)
- Troubleshooting guides
- API reference (auto-generated coming soon)

### Planned 📅

- Video tutorials
- Interactive examples
- Detailed architecture diagrams
- More CI/CD platform examples
- Advanced use cases

## 🔄 Documentation Updates

This documentation is kept in sync with code changes:

- **Version**: Matches plugin version (currently v0.2.0)
- **Auto-generated**: API reference generated from TypeScript source
- **CI Checks**: Links validated on every pull request
- **Examples Tested**: Code examples validated against current API

Last updated: 2026-02-12
