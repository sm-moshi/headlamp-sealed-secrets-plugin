[**Headlamp Sealed Secrets API v0.2.0**](../../README.md)

***

[Headlamp Sealed Secrets API](../../README.md) / [types](../README.md) / unwrap

# Function: unwrap()

> **unwrap**\<`T`\>(`value`): `string`

Defined in: [src/types.ts:116](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L116)

Unwrap a branded type to get the raw string
Use sparingly - only when you need the raw value

## Type Parameters

### T

`T` *extends* `string`

## Parameters

### value

`T`

## Returns

`string`

## Example

```ts
const rawValue = unwrap(plaintextValue);
```
