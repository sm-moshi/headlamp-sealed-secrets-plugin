# ADR 005: Custom React Hooks Extraction

**Status**: Accepted

**Date**: 2026-02-12

**Deciders**: Development Team

---

## Context

As the plugin grew, React components became large and complex, mixing:

- **Business logic** (encryption, API calls, validation)
- **UI state management** (loading, errors, form state)
- **Side effects** (fetching data, polling, event listeners)
- **Presentation** (JSX, styling)

Example of problematic component:

```typescript
function EncryptDialog() {
  // 300+ lines of mixed concerns:
  const [publicKey, setPublicKey] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [plaintext, setPlaintext] = useState('');
  const [encrypted, setEncrypted] = useState('');

  // Fetch certificate
  useEffect(() => {
    const fetchCert = async () => {
      setLoading(true);
      try {
        const result = await fetchPublicCertificate(...);
        if (result.ok) setPublicKey(result.value);
        else setError(result.error);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCert();
  }, []);

  // Encrypt value
  const handleEncrypt = async () => {
    setLoading(true);
    try {
      const result = encryptValue(publicKey, plaintext);
      if (result.ok) setEncrypted(result.value);
      else setError(result.error);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 200 lines of JSX...
  return <Dialog>...</Dialog>;
}
```

### Problems

1. **Hard to test**: Must render component to test business logic
2. **Hard to reuse**: Business logic tied to specific component
3. **Hard to maintain**: Mixing concerns makes changes risky
4. **Hard to understand**: 300+ line components are cognitive overhead
5. **Performance**: Can't memoize effectively

---

## Decision

**Extract business logic into custom React hooks.**

### Design Principles

1. **Single Responsibility**: Each hook handles one concern
2. **Reusability**: Hooks can be used across components
3. **Testability**: Test hooks independently
4. **Composability**: Hooks can call other hooks
5. **Declarative**: Hooks expose clean, intention-revealing APIs

### Implementation Pattern

```typescript
// Before: Logic in component
function EncryptDialog() {
  const [publicKey, setPublicKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 50 lines of certificate fetching logic
  }, []);

  const encrypt = () => {
    // 50 lines of encryption logic
  };

  return <Dialog>...</Dialog>; // 200 lines
}

// After: Logic in hook
function useSealedSecretEncryption(namespace: string) {
  const [publicKey, setPublicKey] = useState<PEMCertificate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCertificate();
  }, [namespace]);

  const encrypt = useCallback((plaintext: PlaintextValue) => {
    // Encryption logic
  }, [publicKey]);

  return { publicKey, loading, error, encrypt };
}

// Component becomes simple
function EncryptDialog() {
  const { publicKey, loading, error, encrypt } = useSealedSecretEncryption(namespace);

  return <Dialog>...</Dialog>; // Just UI
}
```

---

## Consequences

### Positive

✅ **Testable**: Test hooks independently
```typescript
// Test hook without rendering component
const { result } = renderHook(() => useSealedSecretEncryption('default'));

await waitFor(() => {
  expect(result.current.publicKey).toBeDefined();
});
```

✅ **Reusable**: Same logic in multiple components
```typescript
// Use in dialog
function EncryptDialog() {
  const { encrypt } = useSealedSecretEncryption(namespace);
  // ...
}

// Use in detail view
function SealedSecretDetail() {
  const { encrypt } = useSealedSecretEncryption(namespace);
  // ...
}
```

✅ **Maintainable**: Separation of concerns
```typescript
// Hook: Business logic (50 lines)
function useSealedSecretEncryption() { ... }

// Component: Presentation (50 lines)
function EncryptDialog() {
  const { encrypt } = useSealedSecretEncryption();
  return <Dialog>...</Dialog>;
}
```

✅ **Composable**: Hooks can use other hooks
```typescript
function useSealedSecretEncryption() {
  const { canCreate } = usePermissions(); // Compose hooks
  const { isHealthy } = useControllerHealth();

  const encrypt = useCallback(() => {
    if (!canCreate) return Err('No permission');
    if (!isHealthy) return Err('Controller unhealthy');
    // ...
  }, [canCreate, isHealthy]);

  return { encrypt };
}
```

✅ **Performance**: Easier to optimize
```typescript
// Memoize expensive operations
const encrypt = useCallback((plaintext) => {
  return encryptValue(publicKey, plaintext);
}, [publicKey]); // Only recreate if publicKey changes

// Memoize derived state
const isReady = useMemo(() => {
  return publicKey !== null && !loading && !error;
}, [publicKey, loading, error]);
```

### Negative

⚠️ **More files**: Each hook is a separate file
```
src/hooks/
  useSealedSecretEncryption.ts
  usePermissions.ts
  useControllerHealth.ts
```

⚠️ **Learning curve**: Team must understand hooks
- When to use `useState` vs `useReducer`
- When to use `useCallback` vs `useMemo`
- Dependency arrays

⚠️ **Indirection**: Logic not in component file
```typescript
// Must navigate to hook file to see implementation
const { encrypt } = useSealedSecretEncryption(); // Where is this?
```

### Mitigation

- **Naming convention**: `use*` prefix makes hooks obvious
- **Co-location**: Hooks in `src/hooks/` directory
- **Documentation**: JSDoc comments on hooks
- **TypeScript**: Types make hooks self-documenting

---

## Hooks Implemented

### 1. useSealedSecretEncryption

**Purpose**: Manage encryption workflow

```typescript
export function useSealedSecretEncryption(namespace: string) {
  return {
    publicKey: PEMCertificate | null,
    loading: boolean,
    error: string | null,
    encrypt: (plaintext: PlaintextValue) => Result<EncryptedValue, string>,
    refetch: () => Promise<void>
  };
}
```

**Use Cases**:
- EncryptDialog
- SealedSecretDetail (re-encryption)
- Settings page (test encryption)

---

### 2. usePermissions

**Purpose**: Check RBAC permissions

```typescript
export function usePermissions(namespace?: string) {
  return {
    canCreate: boolean,
    canDelete: boolean,
    canViewSecrets: boolean,
    loading: boolean,
    refetch: () => Promise<void>
  };
}
```

**Use Cases**:
- SealedSecretList (show/hide create button)
- SealedSecretDetail (show/hide delete button)
- DecryptDialog (show/hide decrypt feature)

---

### 3. useControllerHealth

**Purpose**: Monitor controller health

```typescript
export function useControllerHealth(options?: {
  pollInterval?: number;
  namespace?: string;
}) {
  return {
    isHealthy: boolean,
    status: 'healthy' | 'unhealthy' | 'unknown',
    error: string | null,
    lastChecked: Date | null,
    refetch: () => Promise<void>
  };
}
```

**Use Cases**:
- SettingsPage (display health status)
- SealingKeysView (warning if unhealthy)
- EncryptDialog (disable if unhealthy)

---

## Implementation Details

### Hook Structure

```typescript
export function useCustomHook(params) {
  // 1. State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 2. Side effects
  useEffect(() => {
    fetchData();
  }, [params]);

  // 3. Callbacks (memoized)
  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params]);

  // 4. Return interface
  return { data, loading, error, refetch };
}
```

### Testing Pattern

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useSealedSecretEncryption } from './useSealedSecretEncryption';

describe('useSealedSecretEncryption', () => {
  it('fetches certificate on mount', async () => {
    const { result } = renderHook(() => useSealedSecretEncryption('default'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.publicKey).toBeDefined();
    });
  });

  it('encrypts plaintext', async () => {
    const { result } = renderHook(() => useSealedSecretEncryption('default'));

    await waitFor(() => expect(result.current.publicKey).toBeDefined());

    const encrypted = result.current.encrypt(PlaintextValue('secret'));
    expect(encrypted.ok).toBe(true);
  });
});
```

---

## Alternatives Considered

### 1. Keep Logic in Components

**Pros**:
- Everything in one place
- No indirection
- Simple structure

**Cons**:
- ❌ Large components (300+ lines)
- ❌ Hard to test
- ❌ Hard to reuse
- ❌ Mixing concerns

**Rejected**: Doesn't scale as complexity grows.

---

### 2. Higher-Order Components (HOCs)

```typescript
const withEncryption = (Component) => {
  return (props) => {
    const encryption = useEncryptionLogic();
    return <Component {...props} encryption={encryption} />;
  };
};

export default withEncryption(EncryptDialog);
```

**Pros**:
- Reusable logic
- Separation of concerns

**Cons**:
- ❌ "Wrapper hell" with multiple HOCs
- ❌ Props naming collisions
- ❌ Harder to type with TypeScript
- ❌ Less idiomatic in modern React

**Rejected**: Hooks are more ergonomic.

---

### 3. Render Props

```typescript
<EncryptionProvider>
  {({ encrypt, loading, error }) => (
    <Dialog>
      {/* Use encrypt */}
    </Dialog>
  )}
</EncryptionProvider>
```

**Pros**:
- Reusable logic
- Explicit data flow

**Cons**:
- ❌ Nested indentation ("render prop hell")
- ❌ Verbose
- ❌ Less idiomatic than hooks

**Rejected**: Hooks are cleaner.

---

### 4. State Management Library (Redux, MobX)

```typescript
// Redux store
const encryptionSlice = createSlice({
  name: 'encryption',
  initialState: { publicKey: null, loading: false },
  reducers: { ... }
});

// Component
function EncryptDialog() {
  const dispatch = useDispatch();
  const { publicKey } = useSelector(state => state.encryption);
  // ...
}
```

**Pros**:
- Centralized state
- Time-travel debugging
- Predictable state updates

**Cons**:
- ❌ Overkill for component-local state
- ❌ Boilerplate (actions, reducers, selectors)
- ❌ Large dependency (~50KB+)
- ❌ Learning curve

**Rejected**: Too heavy for our needs. Hooks provide sufficient state management.

---

## Best Practices

### 1. Keep Hooks Focused

```typescript
// ✅ Good: Single responsibility
function useSealedSecretEncryption() { ... }
function usePermissions() { ... }
function useControllerHealth() { ... }

// ❌ Bad: Too many concerns
function useSealedSecrets() {
  // Fetching, encryption, permissions, health checks, ...
  // 500 lines of mixed logic
}
```

### 2. Memoize Callbacks

```typescript
// ✅ Good: Memoized callback
const encrypt = useCallback((plaintext) => {
  return encryptValue(publicKey, plaintext);
}, [publicKey]);

// ❌ Bad: New function every render
const encrypt = (plaintext) => {
  return encryptValue(publicKey, plaintext);
};
```

### 3. Document Dependencies

```typescript
// ✅ Good: Document why dependency exists
useEffect(() => {
  fetchCertificate();
}, [namespace]); // Re-fetch when namespace changes

// ❌ Bad: Missing dependency (ESLint warning)
useEffect(() => {
  fetchCertificate(); // Uses namespace
}, []); // Missing namespace dependency!
```

### 4. Return Consistent Interface

```typescript
// ✅ Good: Consistent return type
function useData() {
  return { data, loading, error, refetch };
}

// ❌ Bad: Inconsistent return
function useData() {
  return loading ? null : data; // Changes type based on state
}
```

---

## Performance Impact

### Before (Components with Inline Logic)

- Component re-renders on every state change
- Hard to optimize with React.memo
- Difficult to track which state causes re-renders

### After (Hooks)

- Easy to memoize callbacks: `useCallback`
- Easy to memoize derived state: `useMemo`
- Easy to prevent re-renders: `React.memo` + memoized props

Example optimization:

```typescript
// Hook memoizes callback
const encrypt = useCallback((plaintext) => {
  return encryptValue(publicKey, plaintext);
}, [publicKey]); // Only recreate if publicKey changes

// Component memoization works
const EncryptDialog = React.memo(({ onClose }) => {
  const { encrypt } = useSealedSecretEncryption();
  // ...
});
// Only re-renders if onClose or hook return values change
```

---

## Migration Strategy

### Phase 1: Create Hooks (✅ Completed)

1. Extract `useSealedSecretEncryption`
2. Extract `usePermissions`
3. Extract `useControllerHealth`

### Phase 2: Refactor Components (✅ Completed)

1. Update `EncryptDialog` to use hooks
2. Update `SealedSecretList` to use hooks
3. Update `SealedSecretDetail` to use hooks
4. Update `SealingKeysView` to use hooks

### Phase 3: Add Tests (✅ Completed)

1. Test hooks independently
2. Test components with mocked hooks
3. Integration tests

### Metrics

- **Lines reduced**: ~200 lines (logic moved to hooks)
- **Test coverage**: 92% (hooks are easier to test)
- **Bundle size**: No change (same code, better organized)
- **Performance**: Improved (better memoization)

---

## References

- [React Hooks Documentation](https://react.dev/reference/react)
- [Testing React Hooks](https://react-hooks-testing-library.com/)
- [Rules of Hooks](https://react.dev/warnings/invalid-hook-call-warning)

---

## Related ADRs

- [ADR 004: RBAC Integration](004-rbac-integration.md) - usePermissions hook
- [ADR 001: Result Types](001-result-types.md) - Hooks return Result types

---

## Changelog

- **2026-02-12**: Extracted custom hooks (Phase 3.5)
- **2026-02-12**: Documented in ADR
