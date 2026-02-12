[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [lib/crypto](../README.md) / encryptKeyValues

# Function: encryptKeyValues()

> **encryptKeyValues**(`publicKey`, `keyValues`, `namespace`, `name`, `scope`): [`Result`](../../../types/type-aliases/Result.md)\<`Record`\<`string`, [`Base64String`](../../../types/type-aliases/Base64String.md)\>, `string`\>

Defined in: [src/lib/crypto.ts:126](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/crypto.ts#L126)

Encrypt multiple key-value pairs for a SealedSecret

## Parameters

### publicKey

`PublicKey`

RSA public key from the controller's certificate

### keyValues

`object`[]

Array of {key, value} pairs to encrypt (values are branded plaintext)

### namespace

`string`

The namespace

### name

`string`

The secret name

### scope

[`SealedSecretScope`](../../../types/type-aliases/SealedSecretScope.md)

The encryption scope

## Returns

[`Result`](../../../types/type-aliases/Result.md)\<`Record`\<`string`, [`Base64String`](../../../types/type-aliases/Base64String.md)\>, `string`\>

Result containing object mapping keys to encrypted values, or error message
