[**Headlamp Sealed Secrets API v0.2.0**](../../README.md)

***

[Headlamp Sealed Secrets API](../../README.md) / [types](../README.md) / Result

# Type Alias: Result\<T, E\>

> **Result**\<`T`, `E`\> = \{ `ok`: `true`; `value`: `T`; \} \| \{ `ok`: `false`; `error`: `E`; \}

Defined in: [src/types.ts:17](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L17)

Result type for operations that can fail
Replaces throw/catch with explicit error handling

## Type Parameters

### T

`T`

### E

`E` = `Error`

## Example

```ts
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return Err('Division by zero');
  return Ok(a / b);
}
```
