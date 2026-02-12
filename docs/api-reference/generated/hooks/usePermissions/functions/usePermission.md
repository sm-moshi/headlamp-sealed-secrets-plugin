[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [hooks/usePermissions](../README.md) / usePermission

# Function: usePermission()

> **usePermission**(`namespace`, `permission`): `object`

Defined in: [src/hooks/usePermissions.ts:79](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/hooks/usePermissions.ts#L79)

Hook to check a specific permission

Useful when you only need to check one permission (e.g., canCreate)
instead of fetching all permissions.

## Parameters

### namespace

`string`

Optional namespace to check

### permission

keyof [`ResourcePermissions`](../../../lib/rbac/interfaces/ResourcePermissions.md)

Permission key to check

## Returns

`object`

Object with loading state and allowed flag

### loading

> **loading**: `boolean`

### allowed

> **allowed**: `boolean`

## Example

```ts
const { loading, allowed } = usePermission('default', 'canCreate');
if (allowed) {
  // Show create button
}
```
