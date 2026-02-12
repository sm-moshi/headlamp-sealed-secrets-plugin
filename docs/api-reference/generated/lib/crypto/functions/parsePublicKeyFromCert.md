[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [lib/crypto](../README.md) / parsePublicKeyFromCert

# Function: parsePublicKeyFromCert()

> **parsePublicKeyFromCert**(`pemCert`): [`Result`](../../../types/type-aliases/Result.md)\<`PublicKey`, `string`\>

Defined in: [src/lib/crypto.ts:32](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/crypto.ts#L32)

Parse a PEM certificate and extract the RSA public key

## Parameters

### pemCert

[`PEMCertificate`](../../../types/type-aliases/PEMCertificate.md)

PEM-encoded certificate string (branded type)

## Returns

[`Result`](../../../types/type-aliases/Result.md)\<`PublicKey`, `string`\>

Result containing the public key or an error message
