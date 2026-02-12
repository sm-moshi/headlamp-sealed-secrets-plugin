[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [lib/crypto](../README.md) / encryptValue

# Function: encryptValue()

> **encryptValue**(`publicKey`, `value`, `namespace`, `name`, `key`, `scope`): [`Result`](../../../types/type-aliases/Result.md)\<[`Base64String`](../../../types/type-aliases/Base64String.md), `string`\>

Defined in: [src/lib/crypto.ts:55](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/crypto.ts#L55)

Encrypt a secret value using the kubeseal format

## Parameters

### publicKey

`PublicKey`

RSA public key from the controller's certificate

### value

[`PlaintextValue`](../../../types/type-aliases/PlaintextValue.md)

The plaintext secret value to encrypt (branded type)

### namespace

`string`

The namespace (for strict/namespace-wide scoping)

### name

`string`

The secret name (for strict scoping)

### key

`string`

The key name within the secret

### scope

[`SealedSecretScope`](../../../types/type-aliases/SealedSecretScope.md)

The encryption scope

## Returns

[`Result`](../../../types/type-aliases/Result.md)\<[`Base64String`](../../../types/type-aliases/Base64String.md), `string`\>

Result containing base64-encoded encrypted value or error message
