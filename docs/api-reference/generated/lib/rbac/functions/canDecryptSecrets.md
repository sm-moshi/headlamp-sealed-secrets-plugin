[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [lib/rbac](../README.md) / canDecryptSecrets

# Function: canDecryptSecrets()

> **canDecryptSecrets**(`namespace`): `Promise`\<`boolean`\>

Defined in: [src/lib/rbac.ts:65](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/rbac.ts#L65)

Check if user can decrypt secrets (requires get permission on Secrets)

## Parameters

### namespace

`string`

Namespace to check Secret permissions in

## Returns

`Promise`\<`boolean`\>

true if user has permission to get Secrets
