[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [lib/rbac](../README.md) / checkSealedSecretPermissions

# Function: checkSealedSecretPermissions()

> **checkSealedSecretPermissions**(`namespace?`): [`AsyncResult`](../../../types/type-aliases/AsyncResult.md)\<[`ResourcePermissions`](../interfaces/ResourcePermissions.md), `string`\>

Defined in: [src/lib/rbac.ts:35](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/rbac.ts#L35)

Check user permissions for SealedSecrets in a namespace

Uses Kubernetes SelfSubjectAccessReview API to verify what the current
user is allowed to do with SealedSecret resources.

## Parameters

### namespace?

`string`

Optional namespace to check (cluster-wide if omitted)

## Returns

[`AsyncResult`](../../../types/type-aliases/AsyncResult.md)\<[`ResourcePermissions`](../interfaces/ResourcePermissions.md), `string`\>

Result containing permission flags or error message
