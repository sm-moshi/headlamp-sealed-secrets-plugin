[**Headlamp Sealed Secrets API v0.2.0**](../../README.md)

***

[Headlamp Sealed Secrets API](../../README.md) / [types](../README.md) / EncryptedValue

# Type Alias: EncryptedValue

> **EncryptedValue** = `string` & `object`

Defined in: [src/types.ts:85](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L85)

Create a branded encrypted value
This is typically used by encryption functions

## Type Declaration

### \[EncryptedBrand\]

> `readonly` **\[EncryptedBrand\]**: *typeof* `EncryptedBrand`

## Example

```ts
return Ok(EncryptedValue(encryptedString));
```
