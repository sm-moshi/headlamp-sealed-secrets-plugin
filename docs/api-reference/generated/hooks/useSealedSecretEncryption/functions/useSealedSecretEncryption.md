[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [hooks/useSealedSecretEncryption](../README.md) / useSealedSecretEncryption

# Function: useSealedSecretEncryption()

> **useSealedSecretEncryption**(): `object`

Defined in: [src/hooks/useSealedSecretEncryption.ts:73](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/hooks/useSealedSecretEncryption.ts#L73)

Custom hook for SealedSecret encryption

Provides encryption functionality with built-in validation, error handling,
and user notifications.

## Returns

`object`

Object with encrypt function and encrypting state

### encrypt()

> **encrypt**: (`request`) => [`AsyncResult`](../../../types/type-aliases/AsyncResult.md)\<[`EncryptionResult`](../interfaces/EncryptionResult.md), `string`\>

#### Parameters

##### request

[`EncryptionRequest`](../interfaces/EncryptionRequest.md)

#### Returns

[`AsyncResult`](../../../types/type-aliases/AsyncResult.md)\<[`EncryptionResult`](../interfaces/EncryptionResult.md), `string`\>

### encrypting

> **encrypting**: `boolean`

## Example

```ts
const { encrypt, encrypting } = useSealedSecretEncryption();

const result = await encrypt({
  name: 'my-secret',
  namespace: 'default',
  scope: 'strict',
  keyValues: [{ key: 'password', value: 'secret123' }]
});

if (result.ok) {
  // Use result.value.sealedSecretData
}
```
