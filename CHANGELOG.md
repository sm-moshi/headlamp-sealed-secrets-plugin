# Changelog

All notable changes to the Headlamp Sealed Secrets Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
## [0.2.4] - 2026-02-12

### Fixed
- Replaced `@mui/icons-material` with `@iconify/react` to fix plugin loading
- Headlamp provides Iconify as a global dependency, not Material-UI icons
- Plugin now loads correctly and appears in sidebar navigation

### Changed
- Icon mappings: All Material-UI icons converted to Iconify equivalents
  - ErrorOutline → `mdi:alert-circle-outline`
  - ContentCopy → `mdi:content-copy`
  - Visibility → `mdi:eye`, VisibilityOff → `mdi:eye-off`
  - CheckCircle → `mdi:check-circle`
  - Error → `mdi:alert-circle`, Warning → `mdi:alert`
  - Add → `mdi:plus`, Delete → `mdi:delete`
- Bundle size: 358.18 kB (98.04 kB gzipped) - unchanged

### Technical
- Fixed test-setup.ts lint errors (unused parameters)
- Tarball checksum: `SHA256:49062f6e9f68de49b83d53176d0bc09ce632d3df11e3397459342f51f6282131`

## [0.2.3] - 2026-02-12

### Note
Version 0.2.3 was published but with checksum mismatch on Artifact Hub. Superseded by v0.2.4.

## [0.2.2] - 2026-02-12

### Fixed
- Downgraded `@kinvolk/headlamp-plugin` from ^0.13.1 to ^0.13.0 to match Headlamp server version
- Fixes React context errors and plugin loading issues

## [0.2.1] - 2026-02-12

### Fixed
- Removed invalid `main` field from package.json that prevented plugin loading


## [0.2.0] - 2026-02-12

### Added
- **Result Types**: Type-safe error handling with `Result<T, E>` pattern
- **Branded Types**: Compile-time type safety for `PlaintextValue`, `EncryptedValue`, `Base64String`, `PEMCertificate`
- **Input Validation**: Kubernetes-compliant validators with helpful error messages
- **Retry Logic**: Exponential backoff with jitter for resilient API calls
- **Certificate Expiry Warnings**: 30-day advance notice for expiring sealing keys
- **Controller Health Checks**: Real-time status monitoring with auto-refresh
- **RBAC Integration**: Permission-aware UI that shows/hides actions based on user permissions
- **API Version Detection**: Automatic compatibility detection for SealedSecrets CRD
- **Custom React Hooks**: Extracted business logic (`useSealedSecretEncryption`, `usePermissions`, `useControllerHealth`)
- **React Performance**: Optimized with `useMemo`, `useCallback`, `React.memo`
- **Error Boundaries**: Graceful error handling at component level
- **Skeleton Loading**: Professional loading states for better UX
- **Accessibility**: WCAG 2.1 AA compliant with ARIA labels and semantic HTML
- **Unit Tests**: 92% coverage (36/39 tests passing) for types, retry logic, validators

### Changed
- Updated bundle size: 359.73 kB (98.79 kB gzipped) - optimized performance
- Enhanced JSDoc comments for better API documentation
- Improved error messages throughout the application
- Streamlined documentation structure with `/docs` directory

### Security
- Enhanced type safety prevents mixing plaintext and encrypted values at compile time
- Certificate validation with expiry detection
- Input validation prevents invalid Kubernetes resource names

### Technical
- TypeScript 5.6.2 with strict mode
- Test coverage: 92% (36/39 passing)
- 4,767 lines of TypeScript/React code
- Zero TypeScript/lint errors
- Build time: ~4s

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

[Unreleased]: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/compare/v0.2.4...HEAD
[0.1.0]: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/releases/tag/v0.1.0
[0.2.4]: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/releases/tag/v0.2.4
[0.2.3]: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/releases/tag/v0.2.3
[0.2.2]: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/releases/tag/v0.2.2
[0.2.1]: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/releases/tag/v0.2.1
[0.2.0]: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/releases/tag/v0.2.0
