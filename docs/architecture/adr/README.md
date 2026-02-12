# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for the Headlamp Sealed Secrets plugin.

## What is an ADR?

An Architecture Decision Record captures an important architectural decision made along with its context and consequences.

## Format

Each ADR follows this structure:

- **Title**: Short descriptive name
- **Status**: Accepted | Superseded | Deprecated
- **Context**: What is the issue we're seeing that is motivating this decision?
- **Decision**: What is the change we're actually proposing/doing?
- **Consequences**: What becomes easier or harder as a result?
- **Alternatives Considered**: What other options did we evaluate?

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [001](001-result-types.md) | Result Types for Error Handling | Accepted | 2026-02-11 |
| [002](002-branded-types.md) | Branded Types for Type Safety | Accepted | 2026-02-11 |
| [003](003-client-side-crypto.md) | Client-Side Encryption | Accepted | 2026-02-11 |
| [004](004-rbac-integration.md) | RBAC-Aware UI | Accepted | 2026-02-11 |
| [005](005-react-hooks-extraction.md) | Custom React Hooks | Accepted | 2026-02-12 |

## Creating New ADRs

When making significant architectural decisions:

1. Copy template:
   ```bash
   cp docs/architecture/adr/template.md docs/architecture/adr/NNN-title.md
   ```

2. Fill in the template

3. Update this index

4. Link from relevant documentation

## References

- [ADR GitHub Organization](https://adr.github.io/)
- [Michael Nygard's ADR Template](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
