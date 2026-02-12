# Changelog

All notable changes to the Headlamp Sealed Secrets Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-02-11

### Added
- Initial release of Headlamp Sealed Secrets plugin
- SealedSecret CRD integration with list and detail views
- Client-side encryption using controller's public key
- Support for all three scoping modes (strict, namespace-wide, cluster-wide)
- Encryption dialog for creating new SealedSecrets
- Decryption dialog for viewing secret values (RBAC-aware)
- Sealing keys management view
- Settings page for controller configuration
- Integration with Headlamp's Secret detail view
- Comprehensive documentation and README
- Apache 2.0 license
- Artifact Hub metadata for publishing

### Security
- All encryption performed client-side in browser
- Plaintext values never transmitted over network
- RSA-OAEP + AES-256-GCM encryption (compatible with kubeseal)
- Auto-hide decrypted values after 30 seconds
- Password-masked inputs with show/hide toggle

### Technical
- Full TypeScript with strict mode
- ~1,345 lines of code
- Build size: 339.42 kB (93.21 kB gzipped)
- Dependencies: node-forge for cryptography
- Compatible with Headlamp v0.13.0+

[Unreleased]: https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/releases/tag/v0.1.0
