[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [hooks/usePermissions](../README.md) / usePermissions

# Function: usePermissions()

> **usePermissions**(`namespace?`): `object`

Defined in: [src/hooks/usePermissions.ts:26](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/hooks/usePermissions.ts#L26)

Hook to check SealedSecret permissions for a namespace

Automatically fetches permissions on mount and when namespace changes.
Returns loading state and permissions.

## Parameters

### namespace?

`string`

Optional namespace to check (cluster-wide if omitted)

## Returns

`object`

Object with loading state, permissions, and error

### loading

> **loading**: `boolean`

### permissions

> **permissions**: [`ResourcePermissions`](../../../lib/rbac/interfaces/ResourcePermissions.md)

### error

> **error**: `string`

## Example

```ts
const { loading, permissions, error } = usePermissions('default');
if (!loading && permissions?.canCreate) {
  // Show create button
}
```
