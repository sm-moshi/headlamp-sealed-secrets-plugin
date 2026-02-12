# ADR 001: Result Types for Error Handling

**Status**: Accepted

**Date**: 2026-02-11

**Deciders**: Development Team

---

## Context

JavaScript/TypeScript traditionally uses exceptions for error handling, but this has several drawbacks:

1. **Exceptions are invisible**: Function signatures don't indicate what errors can occur
2. **Easy to forget**: Developers may forget to handle errors
3. **Type safety**: TypeScript can't enforce error handling at compile time
4. **Control flow**: Exceptions can jump multiple stack frames, making code harder to reason about

Example problematic code:
```typescript
// What errors can this throw? Unknown!
async function encryptValue(publicKey: string, value: string): Promise<string> {
  // May throw: InvalidKeyError, EncryptionError, NetworkError, etc.
  const encrypted = await crypto.encrypt(publicKey, value);
  return encrypted;
}

// Easy to forget error handling
const encrypted = await encryptValue(key, value);
// What if encryption failed? Program crashes!
```

We needed a pattern that:
- Makes errors **explicit** in function signatures
- Forces **exhaustive error handling** at compile time
- Provides **type-safe** access to success values
- Allows **composable** error handling (map, flatMap, etc.)

---

## Decision

We adopt the `Result<T, E>` pattern for all functions that can fail:

```typescript
export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const Ok = <T>(value: T): Result<T, never> => ({
  ok: true,
  value,
});

export const Err = <E>(error: E): Result<never, E> => ({
  ok: false,
  error,
});
```

### Usage Pattern

**Function returns**:
```typescript
export function encryptValue(
  publicKey: PEMCertificate,
  plaintext: PlaintextValue
): Result<EncryptedValue, string> {
  try {
    const encrypted = performEncryption(publicKey, plaintext);
    return Ok(EncryptedValue(encrypted));
  } catch (err) {
    return Err(`Encryption failed: ${err.message}`);
  }
}
```

**Callers must handle errors**:
```typescript
const result = encryptValue(publicKey, plaintext);

// TypeScript forces you to check `ok` property
if (result.ok === false) {
  // result.error is string
  console.error(result.error);
  return;
}

// result.value is EncryptedValue (type-safe!)
const encrypted = result.value;
```

### Key Properties

1. **Explicit**: Function signature shows it can fail
2. **Type-safe**: TypeScript narrows types based on `ok` check
3. **No try/catch**: Error handling is part of normal control flow
4. **Composable**: Can chain operations with helper functions

---

## Consequences

### Positive

✅ **Type safety**: Errors are part of the type system
```typescript
// TypeScript error if you forget to check `ok`
const result = encryptValue(key, value);
console.log(result.value); // ❌ Type error: value might not exist
```

✅ **Explicit errors**: Can't forget error handling
```typescript
// Must handle both cases
if (result.ok === false) {
  return Err(result.error); // Propagate error
}
// Safe to use result.value here
```

✅ **Better error messages**: Context is preserved
```typescript
if (result.ok === false) {
  return Err(`Failed to encrypt secret: ${result.error}`);
  // Error message includes full context
}
```

✅ **Testable**: Easy to test error paths
```typescript
expect(encryptValue(invalidKey, value)).toEqual({
  ok: false,
  error: expect.stringContaining('Invalid key'),
});
```

### Negative

⚠️ **More verbose**: Requires explicit error checking
```typescript
// Before (exception-based):
const encrypted = await encryptValue(key, value);

// After (Result-based):
const result = await encryptValue(key, value);
if (result.ok === false) {
  return Err(result.error);
}
const encrypted = result.value;
```

⚠️ **Learning curve**: Team must learn Result pattern

⚠️ **Inconsistent with JavaScript ecosystem**: Most libraries use exceptions

### Mitigation

- **Helper functions** reduce boilerplate:
  ```typescript
  // Unwrap or throw (for top-level handlers)
  const unwrap = <T, E>(result: Result<T, E>): T => {
    if (result.ok === false) throw new Error(result.error);
    return result.value;
  };
  ```

- **Documentation** and examples for common patterns

- **Only use Result for plugin code**: Don't wrap third-party libraries unnecessarily

---

## Alternatives Considered

### 1. Continue with try/catch

**Pros**:
- Standard JavaScript pattern
- Less verbose
- Ecosystem compatibility

**Cons**:
- Errors invisible in signatures
- Easy to forget error handling
- Not type-safe
- Hard to track error flow

**Rejected**: Doesn't provide enough safety for encryption operations.

---

### 2. Use fp-ts or similar library

**Pros**:
- Battle-tested implementation
- Rich ecosystem (Either, Option, Task, etc.)
- Functional programming utilities

**Cons**:
- Large dependency (~200KB)
- Steep learning curve
- Overkill for our needs
- Not idiomatic TypeScript

**Rejected**: Too heavy for a Headlamp plugin.

---

### 3. Union types without Result wrapper

```typescript
type EncryptResult = EncryptedValue | Error;
```

**Pros**:
- Simpler than Result type
- Native TypeScript

**Cons**:
- `instanceof Error` checks are runtime-only
- Can't distinguish between `Ok(error)` and `Err(error)` if `T` is `Error`
- Less explicit

**Rejected**: Less ergonomic and less safe than Result.

---

### 4. Throw custom error classes

```typescript
class EncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EncryptionError';
  }
}
```

**Pros**:
- Standard JavaScript pattern
- Can use error inheritance

**Cons**:
- Still not in function signature
- TypeScript doesn't track thrown errors
- Callers can forget to catch

**Rejected**: Doesn't solve the core problem.

---

## Implementation

### Phase 1.1 (Completed 2026-02-11)

Applied Result types to:
- `src/lib/crypto.ts` (3 functions)
- `src/lib/controller.ts` (3 functions)
- `src/components/EncryptDialog.tsx`
- `src/components/SealingKeysView.tsx`

### Code Coverage

- **Functions using Result**: 6/6 critical functions (100%)
- **Tests**: 92% coverage
- **TypeScript errors**: 0
- **Lint errors**: 0

### Migration Strategy

1. ✅ Add Result type to `src/types.ts`
2. ✅ Update core functions (crypto, controller)
3. ✅ Update UI components to handle Results
4. ✅ Add tests for error paths
5. ⏭️ Future: Add helper functions (map, flatMap) if needed

---

## References

- [Rust's Result type](https://doc.rust-lang.org/std/result/)
- [Railway Oriented Programming](https://fsharpforfunandprofit.com/posts/recipe-part2/)
- [TypeScript discriminated unions](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#discriminating-unions)
- [ADR template](https://adr.github.io/)

---

## Related ADRs

- [ADR 002: Branded Types](002-branded-types.md) - Complements Result types with compile-time type safety

---

## Changelog

- **2026-02-11**: Initial decision
- **2026-02-11**: Implemented in Phase 1.1
- **2026-02-12**: Documented in ADR
