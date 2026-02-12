[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [hooks/usePermissions](../README.md) / useIsReadOnly

# Function: useIsReadOnly()

> **useIsReadOnly**(`namespace?`): `object`

Defined in: [src/hooks/usePermissions.ts:127](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/hooks/usePermissions.ts#L127)

Hook to check if user has read-only access

Returns true if user can read/list but cannot create/update/delete.

## Parameters

### namespace?

`string`

Optional namespace to check

## Returns

`object`

Object with loading state and isReadOnly flag

### loading

> **loading**: `boolean`

### isReadOnly

> **isReadOnly**: `boolean`

## Example

```ts
const { loading, isReadOnly } = useIsReadOnly('default');
if (isReadOnly) {
  // Show read-only warning
}
```
