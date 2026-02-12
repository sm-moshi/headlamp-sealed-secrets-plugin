[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [hooks/useSealedSecretEncryption](../README.md) / EncryptionRequest

# Interface: EncryptionRequest

Defined in: [src/hooks/useSealedSecretEncryption.ts:30](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/hooks/useSealedSecretEncryption.ts#L30)

Request parameters for encryption

## Properties

### name

> **name**: `string`

Defined in: [src/hooks/useSealedSecretEncryption.ts:32](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/hooks/useSealedSecretEncryption.ts#L32)

Name of the SealedSecret to create

***

### namespace

> **namespace**: `string`

Defined in: [src/hooks/useSealedSecretEncryption.ts:34](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/hooks/useSealedSecretEncryption.ts#L34)

Namespace to create the SealedSecret in

***

### scope

> **scope**: [`SealedSecretScope`](../../../types/type-aliases/SealedSecretScope.md)

Defined in: [src/hooks/useSealedSecretEncryption.ts:36](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/hooks/useSealedSecretEncryption.ts#L36)

Encryption scope (strict, namespace-wide, cluster-wide)

***

### keyValues

> **keyValues**: `object`[]

Defined in: [src/hooks/useSealedSecretEncryption.ts:38](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/hooks/useSealedSecretEncryption.ts#L38)

Key-value pairs to encrypt

#### key

> **key**: `string`

#### value

> **value**: `string`
