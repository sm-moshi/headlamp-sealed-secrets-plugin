[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [lib/rbac](../README.md) / canViewSealingKeys

# Function: canViewSealingKeys()

> **canViewSealingKeys**(`controllerNamespace`): `Promise`\<`boolean`\>

Defined in: [src/lib/rbac.ts:79](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/rbac.ts#L79)

Check if user can view sealing keys (requires get permission on Secrets in controller namespace)

## Parameters

### controllerNamespace

`string`

Namespace where sealed-secrets controller is running

## Returns

`Promise`\<`boolean`\>

true if user has permission to get Secrets in controller namespace
