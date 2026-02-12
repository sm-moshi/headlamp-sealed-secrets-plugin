[**Headlamp Sealed Secrets API v0.2.0**](../../README.md)

***

[Headlamp Sealed Secrets API](../../README.md) / [types](../README.md) / PlaintextValue

# Type Alias: PlaintextValue

> **PlaintextValue** = `string` & `object`

Defined in: [src/types.ts:74](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L74)

Create a branded plaintext value
Use this to mark user input as plaintext before encryption

## Type Declaration

### \[PlaintextBrand\]

> `readonly` **\[PlaintextBrand\]**: *typeof* `PlaintextBrand`

## Example

```ts
const secret = PlaintextValue('my-password');
```
