[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [lib/rbac](../README.md) / checkMultiNamespacePermissions

# Function: checkMultiNamespacePermissions()

> **checkMultiNamespacePermissions**(`namespaces`): [`AsyncResult`](../../../types/type-aliases/AsyncResult.md)\<`Record`\<`string`, [`ResourcePermissions`](../interfaces/ResourcePermissions.md)\>, `string`\>

Defined in: [src/lib/rbac.ts:143](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/rbac.ts#L143)

Check permissions for multiple namespaces

Useful for multi-namespace views to determine which namespaces the user
can interact with.

## Parameters

### namespaces

`string`[]

Array of namespace names to check

## Returns

[`AsyncResult`](../../../types/type-aliases/AsyncResult.md)\<`Record`\<`string`, [`ResourcePermissions`](../interfaces/ResourcePermissions.md)\>, `string`\>

Map of namespace to permissions
