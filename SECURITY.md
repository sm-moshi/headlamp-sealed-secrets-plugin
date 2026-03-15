# Security Policy

## Overview

The Headlamp Sealed Secrets Plugin enables users to create and manage SealedSecret resources within the Headlamp UI. Unlike read-only plugins, this plugin performs **write operations** against the Kubernetes API, creating and updating SealedSecret custom resources.

## Security Model

### Write Operations

The plugin creates and updates `SealedSecret` custom resources in the cluster. All encryption of secret values happens **client-side** using the `node-forge` library and the cluster's public sealing certificate. Plaintext secret values are never sent to the Kubernetes API -- only the encrypted SealedSecret manifests are written.

### Data Flow

```
User Browser
    ↓ (user enters secret values)
Plugin Frontend (React + node-forge)
    ↓ (encrypts values client-side using sealing certificate)
Headlamp Pod
    ↓ (in-cluster service account or user token)
Kubernetes API Server
    ↓ (creates/updates SealedSecret CR)
Sealed Secrets Controller
    ↓ (decrypts and creates Secret)
```

Plaintext secret values exist only in the browser's memory during the encryption step. They are never persisted to disk, localStorage, or transmitted unencrypted.

### RBAC Requirements

The plugin requires permissions on SealedSecret custom resources and the ability to fetch the sealing certificate:

| Verb | API Group | Resource | Notes |
|------|-----------|----------|-------|
| `get`, `list`, `watch` | `bitnami.com` | `sealedsecrets` | Read existing SealedSecrets |
| `create`, `update`, `patch` | `bitnami.com` | `sealedsecrets` | Create/update SealedSecrets |
| `get` | `""` (core) | `services/proxy` | Fetch sealing certificate from controller |

Apply the principle of least privilege: scope permissions to specific namespaces where users should be able to manage SealedSecrets.

## Vulnerability Reporting

### Supported Versions

Security updates are applied to the latest release only.

| Version | Supported |
| ------- | --------- |
| latest  | Yes       |
| < latest| No        |

### Reporting a Vulnerability

If you discover a security vulnerability, please report it via:

1. **GitHub Security Advisories**: [Report a vulnerability](https://github.com/sm-moshi/headlamp-sealed-secrets-plugin/security/advisories/new)

**Please do not** open public GitHub issues for security vulnerabilities or disclose vulnerabilities publicly before a fix is available.

**Response Timeline:**
- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Fix Timeline**: Depends on severity

## Dependency Security

Key dependencies with security implications:

- **node-forge**: Used for client-side encryption of secret values with the cluster's sealing certificate. Keep this dependency up to date.
- **@kinvolk/headlamp-plugin**: Peer dependency providing the Kubernetes API proxy. Update by upgrading your Headlamp installation.

The project uses `npm audit` and Dependabot to monitor for known vulnerabilities.

## Contact

- **Security Issues**: [GitHub Security Advisories](https://github.com/sm-moshi/headlamp-sealed-secrets-plugin/security/advisories)
- **Bug Reports**: [GitHub Issues](https://github.com/sm-moshi/headlamp-sealed-secrets-plugin/issues)

## License

This plugin is provided under the Apache-2.0 License. See [LICENSE](LICENSE) for details.
