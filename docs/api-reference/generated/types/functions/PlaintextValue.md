[**Headlamp Sealed Secrets API v0.2.0**](../../README.md)

***

[Headlamp Sealed Secrets API](../../README.md) / [types](../README.md) / PlaintextValue

# Function: PlaintextValue()

> **PlaintextValue**(`value`): [`PlaintextValue`](../type-aliases/PlaintextValue.md)

Defined in: [src/types.ts:74](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L74)

Create a branded plaintext value
Use this to mark user input as plaintext before encryption

## Parameters

### value

`string`

## Returns

[`PlaintextValue`](../type-aliases/PlaintextValue.md)

## Example

```ts
const secret = PlaintextValue('my-password');
```
