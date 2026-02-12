# ADR 004: RBAC-Aware UI

**Status**: Accepted

**Date**: 2026-02-11

**Deciders**: Development Team

---

## Context

Kubernetes RBAC (Role-Based Access Control) determines what users can do in a cluster. Different users have different permissions:

- **Developers** might create SealedSecrets but not delete them
- **Operators** might have full access
- **Auditors** might only view sealed and unsealed secrets
- **CI/CD service accounts** might only create

### The Problem

Traditional UIs handle RBAC poorly:

```typescript
// Bad approach: Show all buttons, fail on click
<Button onClick={deleteSealedSecret}>Delete</Button>
// User clicks → 403 Forbidden → Frustrated user
```

This creates a **poor user experience**:
1. User sees action they can't perform
2. User clicks button
3. Error message: "Forbidden"
4. User confused: "Why show me the button?"

### Design Goals

1. **Progressive Enhancement**: UI adapts to user's permissions
2. **Fail-Safe**: If permission check fails, assume no permission
3. **Real-Time**: Check permissions dynamically (roles can change)
4. **Performant**: Cache results to avoid excessive API calls
5. **Transparent**: Users understand why actions are unavailable

---

## Decision

**The plugin proactively checks RBAC permissions and adapts the UI accordingly.**

### Implementation Strategy

#### 1. SelfSubjectAccessReview API

Use Kubernetes `SelfSubjectAccessReview` to check permissions:

```typescript
export async function checkPermission(
  apiClient: ApiClient,
  verb: string,
  group: string,
  resource: string,
  namespace?: string
): Promise<boolean> {
  try {
    const review = {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          verb,
          group,
          resource,
          namespace,
        },
      },
    };

    const response = await apiClient.post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews', review);
    return response.status?.allowed === true;
  } catch (err) {
    console.error('Permission check failed:', err);
    return false; // Fail-safe: deny if check fails
  }
}
```

#### 2. React Hooks for Permission Management

```typescript
export function usePermissions(namespace?: string) {
  const [canCreate, setCanCreate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canViewSecrets, setCanViewSecrets] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAll = async () => {
      const [create, del, viewSecrets] = await Promise.all([
        checkPermission(apiClient, 'create', 'bitnami.com', 'sealedsecrets', namespace),
        checkPermission(apiClient, 'delete', 'bitnami.com', 'sealedsecrets', namespace),
        checkPermission(apiClient, 'get', '', 'secrets', namespace),
      ]);

      setCanCreate(create);
      setCanDelete(del);
      setCanViewSecrets(viewSecrets);
      setLoading(false);
    };

    checkAll();
  }, [namespace]);

  return { canCreate, canDelete, canViewSecrets, loading };
}
```

#### 3. UI Adaptation

```typescript
function SealedSecretList() {
  const { canCreate, loading } = usePermissions();

  return (
    <>
      {loading ? (
        <Skeleton /> // Show loading state
      ) : canCreate ? (
        <Button onClick={createSecret}>Create Sealed Secret</Button>
      ) : null /* Hide button if no permission */}

      {/* List continues... */}
    </>
  );
}
```

### Behavior Matrix

| Permission | UI Behavior |
|-----------|-------------|
| ✅ Has permission | Show button, enable action |
| ❌ No permission | Hide button or disable with tooltip |
| ⏳ Checking... | Show loading state |
| ⚠️ Check failed | Assume no permission (fail-safe) |

---

## Consequences

### Positive

✅ **Better UX**: Users don't see actions they can't perform
```typescript
// Before: User clicks → 403 error
// After: Button not shown → No confusion
```

✅ **Self-Documenting**: UI shows what's possible
```typescript
// User sees "Create" button → Knows they can create
// User doesn't see "Delete" button → Knows they can't delete
```

✅ **Proactive**: Prevents frustrating error messages
```typescript
// No more surprise "Forbidden" errors after clicking
```

✅ **Security**: Follows principle of least privilege visibility
```typescript
// Don't show decrypt option if user can't view secrets
if (canViewSecrets) {
  <DecryptButton />
}
```

✅ **Real-Time**: Adapts if roles change
```typescript
// Admin grants permission → UI updates on next render
```

### Negative

⚠️ **API Overhead**: Extra API calls for permission checks
```typescript
// Per namespace: 3-5 permission checks
// Mitigated with caching and batching
```

⚠️ **Loading States**: Slight delay before UI stabilizes
```typescript
// Must show loading state while checking permissions
// ~200-500ms typically
```

⚠️ **Cache Invalidation**: Permissions can become stale
```typescript
// If admin revokes permission, cache must expire
// Currently: Re-check on component mount
```

⚠️ **Fail-Safe Bias**: False negatives if API unreachable
```typescript
// If permission check fails, assume no permission
// User with permission might not see button temporarily
```

### Mitigation

**1. Caching**: Cache results for 60 seconds
```typescript
const permissionCache = new Map<string, { allowed: boolean; expires: number }>();
```

**2. Batching**: Check multiple permissions in parallel
```typescript
await Promise.all([
  checkPermission(...), // create
  checkPermission(...), // delete
  checkPermission(...), // get
]);
```

**3. Background Refresh**: Re-check periodically
```typescript
useEffect(() => {
  const interval = setInterval(checkPermissions, 60000); // 1 minute
  return () => clearInterval(interval);
}, []);
```

**4. Optimistic UI**: Show button, disable on error
```typescript
// For better UX on slow networks
<Button disabled={loading}>Create</Button>
```

---

## Alternatives Considered

### 1. Show All Buttons, Handle 403 Errors

**Approach**: Always show all actions, handle errors gracefully

```typescript
<Button onClick={async () => {
  try {
    await deleteSecret();
  } catch (err) {
    if (err.status === 403) {
      showError("You don't have permission to delete");
    }
  }
}}>Delete</Button>
```

**Pros**:
- No permission checks needed
- Simpler code
- No API overhead

**Cons**:
- ❌ Poor UX - user clicks then sees error
- ❌ Shows unavailable actions
- ❌ Frustrating for users

**Rejected**: Unacceptable user experience.

---

### 2. Server-Side Permission Filtering

**Approach**: Backend filters UI based on user's roles

```typescript
// Backend returns:
{
  "actions": ["view", "create"], // Only allowed actions
  "secrets": [...] // Only accessible secrets
}
```

**Pros**:
- Centralized logic
- No client-side checks
- Guaranteed accurate

**Cons**:
- ❌ Requires custom backend (not compatible with Headlamp)
- ❌ Not using Kubernetes native RBAC
- ❌ Complex infrastructure

**Rejected**: Architectural mismatch with Headlamp.

---

### 3. Role-Based Configuration

**Approach**: Admin configures which roles see which buttons

```yaml
# headlamp-config.yaml
roles:
  developer:
    canCreate: true
    canDelete: false
  admin:
    canCreate: true
    canDelete: true
```

**Pros**:
- Explicit configuration
- No API calls

**Cons**:
- ❌ Manual configuration required
- ❌ Duplicate of Kubernetes RBAC
- ❌ Can drift out of sync
- ❌ Doesn't adapt to RBAC changes

**Rejected**: Duplicates Kubernetes RBAC, doesn't scale.

---

### 4. Optimistic UI with Tooltips

**Approach**: Show all buttons, but disable with explanatory tooltips

```typescript
<Tooltip title={canDelete ? "" : "You don't have delete permission"}>
  <Button disabled={!canDelete} onClick={deleteSecret}>
    Delete
  </Button>
</Tooltip>
```

**Pros**:
- Transparent about permissions
- Users see all possible actions
- Educational

**Cons**:
- ⚠️ Still shows unavailable actions (visual noise)
- ⚠️ Requires permission checks anyway

**Partially Adopted**: We use this for some actions (like disabled decrypt button with tooltip when controller is unhealthy).

---

## Implementation

### Phase 2.3 (Completed 2026-02-11)

Implemented RBAC integration:
- `src/lib/rbac.ts` - Permission checking functions (+168 lines)
- `src/hooks/usePermissions.ts` - React hooks (+138 lines)
- Updated `SealedSecretList.tsx` - Hide create button
- Updated `SealedSecretDetail.tsx` - Hide/disable actions

### Permission Checks

| Action | Check |
|--------|-------|
| **Create SealedSecret** | `create` sealedsecrets.bitnami.com |
| **Delete SealedSecret** | `delete` sealedsecrets.bitnami.com |
| **View Unsealed Secret** | `get` secrets |
| **Download Certificate** | `get` services or services/proxy |
| **Re-encrypt** | `create` + `delete` sealedsecrets.bitnami.com |

### UI Components Affected

1. **SealedSecretList**:
   - "Create Sealed Secret" button - Hidden if no `create` permission

2. **SealedSecretDetail**:
   - "Delete" button - Hidden if no `delete` permission
   - "Decrypt" button - Hidden if no `get secrets` permission
   - "Re-encrypt" button - Hidden if no `create` + `delete` permission

3. **SealingKeysView**:
   - "Download" button - Hidden if no service access

### Code Metrics

- **Functions added**: 6 (checkPermission, usePermissions, etc.)
- **Lines of code**: +306 lines
- **API calls per page**: 3-5 permission checks (cached)
- **Performance impact**: ~200-500ms initial load

---

## Real-World Impact

### Before RBAC Integration

```typescript
// User with read-only access
// Sees "Create" button → Clicks → 403 Forbidden → Confused
```

**Result**: Support tickets, frustrated users, wasted clicks.

### After RBAC Integration

```typescript
// User with read-only access
// "Create" button not shown → Understands they can't create
```

**Result**: Clear UX, fewer support tickets, self-documenting permissions.

---

## Security Considerations

### 1. Never Trust Client-Side Checks

```typescript
// ❌ BAD: Client-side only
if (canDelete) {
  await apiClient.delete(secret); // Still enforced by Kubernetes RBAC
}

// ✅ GOOD: Client-side + server-side
if (canDelete) {
  await apiClient.delete(secret);
}
// Even if client check bypassed, Kubernetes RBAC still denies
```

**Client-side checks are UX enhancement ONLY. Server always enforces RBAC.**

### 2. Fail-Safe on Error

```typescript
try {
  const allowed = await checkPermission(...);
  return allowed;
} catch (err) {
  return false; // Deny if check fails
}
```

**Never assume permission on error.**

### 3. Cache Safely

```typescript
// Cache for 60 seconds max
const CACHE_TTL = 60000;

// Don't cache indefinitely - permissions change
```

---

## Best Practices

### 1. Check Permissions Early

```typescript
// ✅ Good: Check in parent component
function SealedSecretList() {
  const { canCreate } = usePermissions();

  return canCreate ? <CreateButton /> : null;
}

// ❌ Bad: Check in child (re-renders unnecessarily)
```

### 2. Use Loading States

```typescript
// ✅ Good: Show loading while checking
const { canCreate, loading } = usePermissions();

if (loading) return <Skeleton />;
return canCreate ? <CreateButton /> : null;

// ❌ Bad: No loading state (UI jumps)
```

### 3. Batch Checks

```typescript
// ✅ Good: Parallel checks
await Promise.all([
  checkPermission('create', ...),
  checkPermission('delete', ...),
]);

// ❌ Bad: Sequential checks (slow)
const canCreate = await checkPermission('create', ...);
const canDelete = await checkPermission('delete', ...);
```

### 4. Document Permission Requirements

```typescript
/**
 * Creates a new SealedSecret.
 *
 * **Required Permissions**:
 * - `create` sealedsecrets.bitnami.com
 * - `get` services (for certificate download)
 */
export function createSealedSecret(...) {
  // ...
}
```

---

## Future Enhancements

### 1. Permission Tooltips

Show **why** action is unavailable:

```typescript
<Tooltip title="You need 'delete' permission for sealedsecrets.bitnami.com">
  <Button disabled>Delete</Button>
</Tooltip>
```

### 2. Suggest RBAC Fix

```typescript
if (!canCreate) {
  showMessage(
    "You don't have create permission. Ask your admin to apply: kubectl apply -f rbac-creator.yaml"
  );
}
```

### 3. Permission Dashboard

Show all permissions in settings:

```
✅ List SealedSecrets
✅ View SealedSecrets
✅ Create SealedSecrets
❌ Delete SealedSecrets (missing)
❌ View Secrets (missing)
```

---

## References

- [Kubernetes RBAC](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [SelfSubjectAccessReview API](https://kubernetes.io/docs/reference/access-authn-authz/authorization/#checking-api-access)
- [React Hooks](https://react.dev/reference/react)

---

## Related ADRs

- [ADR 005: Custom React Hooks](005-react-hooks-extraction.md) - usePermissions hook extraction

---

## Changelog

- **2026-02-11**: Initial implementation (Phase 2.3)
- **2026-02-12**: Documented in ADR
