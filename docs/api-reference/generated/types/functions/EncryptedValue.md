[**Headlamp Sealed Secrets API v0.2.0**](../../README.md)

***

[Headlamp Sealed Secrets API](../../README.md) / [types](../README.md) / EncryptedValue

# Function: EncryptedValue()

> **EncryptedValue**(`value`): [`EncryptedValue`](../type-aliases/EncryptedValue.md)

Defined in: [src/types.ts:85](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L85)

Create a branded encrypted value
This is typically used by encryption functions

## Parameters

### value

`string`

## Returns

[`EncryptedValue`](../type-aliases/EncryptedValue.md)

## Example

```ts
return Ok(EncryptedValue(encryptedString));
```
