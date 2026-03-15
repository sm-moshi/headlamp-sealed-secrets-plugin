# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Headlamp plugin for managing Bitnami Sealed Secrets — client-side encryption, list/detail/create/decrypt SealedSecrets, and sealing key management.

- **Plugin name**: `sealed-secrets`
- **Runtime dependency**: `node-forge` for RSA-OAEP + AES-256-GCM client-side encryption
- **Target**: Headlamp >= v0.13.0
- **Reference plugin**: `../headlamp-polaris-plugin`

## Commands

```bash
npm start          # dev server with hot reload
npm run build      # production build
npm run package    # package for headlamp
npm run tsc        # TypeScript type check (no emit)
npm run lint       # ESLint
npm run lint:fix   # ESLint with auto-fix
npm run format     # Prettier write
npm run format:check # Prettier check
npm test           # vitest run
npm run test:watch # vitest watch mode
```

All tests and `tsc` must pass before committing.

## Architecture

```
src/
├── index.tsx                    # Plugin entry: registerRoute, registerSidebarEntry, registerDetailsViewSection, registerPluginSettings
├── types.ts                     # Branded types, Result type, SealedSecret/SealingKey interfaces
├── headlamp-plugin.d.ts        # Module declarations for headlamp plugin
├── hooks/
│   ├── useControllerHealth.ts   # Controller pod health monitoring
│   ├── useNotification.tsx      # MUI Snackbar notification provider + hook (notistack replacement)
│   ├── usePermissions.ts        # RBAC permission checking
│   └── useSealedSecretEncryption.ts  # Encryption workflow hook
├── lib/
│   ├── SealedSecretCRD.ts       # CRD definitions and API helpers
│   ├── controller.ts            # Sealed Secrets controller interaction
│   ├── crypto.ts                # RSA-OAEP + AES-256-GCM encryption via node-forge
│   ├── rbac.ts                  # RBAC utility functions
│   ├── retry.ts                 # Retry logic for API calls
│   └── validators.ts            # Input validation functions
└── components/
    ├── SealedSecretList.tsx      # List view with create/detail actions
    ├── SealedSecretDetail.tsx    # Detail view for individual SealedSecrets
    ├── SealingKeysView.tsx       # Sealing key management
    ├── SecretDetailsSection.tsx  # Injected into native Secret detail view
    ├── EncryptDialog.tsx         # Client-side encryption dialog
    ├── DecryptDialog.tsx         # Decryption dialog
    ├── ControllerStatus.tsx      # Controller health indicator
    ├── ErrorBoundary.tsx         # ApiErrorBoundary + GenericErrorBoundary
    ├── LoadingSkeletons.tsx      # Loading state skeletons
    ├── SettingsPage.tsx          # Plugin settings
    └── VersionWarning.tsx        # Controller version compatibility warning
```

## Data flow

Uses custom hooks (`hooks/`) and a utility library (`lib/`) instead of a single data context. `ErrorBoundary` has two variants: `ApiErrorBoundary` (for route-level) and `GenericErrorBoundary` (for injected sections). All encryption happens in the browser via `node-forge` — plaintext secrets never leave the client.

## Code conventions

- Functional React components only — no class components
- All imports from `@kinvolk/headlamp-plugin/lib` and `@kinvolk/headlamp-plugin/lib/CommonComponents`
- MUI (`@mui/material`) is available via Headlamp's bundled dependencies — no other UI libraries (no Ant Design, etc.)
- TypeScript strict mode — no `any`, use `unknown` + type guards at API boundaries
- Tests: vitest + @testing-library/react, mock with `vi.mock('@kinvolk/headlamp-plugin/lib', ...)`
- `vitest.setup.ts` provides a spec-compliant `localStorage` shim for Node 22+ compatibility

## Testing

Mock pattern for headlamp APIs:
```typescript
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { request: vi.fn().mockResolvedValue({}) },
  K8s: { ResourceClasses: {} },
}));
```
