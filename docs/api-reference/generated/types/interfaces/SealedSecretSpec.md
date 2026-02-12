[**Headlamp Sealed Secrets API v0.2.0**](../../README.md)

***

[Headlamp Sealed Secrets API](../../README.md) / [types](../README.md) / SealedSecretSpec

# Interface: SealedSecretSpec

Defined in: [src/types.ts:183](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L183)

SealedSecret CRD spec

## Properties

### encryptedData

> **encryptedData**: `Record`\<`string`, `string`\>

Defined in: [src/types.ts:185](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L185)

Map of key names to encrypted (base64-encoded) values

***

### template?

> `optional` **template**: `object`

Defined in: [src/types.ts:187](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L187)

Metadata template for the resulting Secret

#### metadata?

> `optional` **metadata**: `object`

##### metadata.labels?

> `optional` **labels**: `Record`\<`string`, `string`\>

##### metadata.annotations?

> `optional` **annotations**: `Record`\<`string`, `string`\>

#### type?

> `optional` **type**: `string`
