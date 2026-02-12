[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [hooks/usePermissions](../README.md) / useHasWriteAccess

# Function: useHasWriteAccess()

> **useHasWriteAccess**(`namespace?`): `object`

Defined in: [src/hooks/usePermissions.ts:104](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/hooks/usePermissions.ts#L104)

Hook to check if user has any write permissions

Returns true if user can create, update, or delete.
Useful for showing/hiding entire sections of UI.

## Parameters

### namespace?

`string`

Optional namespace to check

## Returns

`object`

Object with loading state and hasWriteAccess flag

### loading

> **loading**: `boolean`

### hasWriteAccess

> **hasWriteAccess**: `boolean`

## Example

```ts
const { loading, hasWriteAccess } = useHasWriteAccess('default');
if (hasWriteAccess) {
  // Show management UI
}
```
