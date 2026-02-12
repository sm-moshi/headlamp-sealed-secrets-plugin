[**Headlamp Sealed Secrets API v0.2.0**](../../README.md)

***

[Headlamp Sealed Secrets API](../../README.md) / [types](../README.md) / tryCatch

# Function: tryCatch()

> **tryCatch**\<`T`\>(`fn`): [`Result`](../type-aliases/Result.md)\<`T`, `Error`\>

Defined in: [src/types.ts:151](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L151)

Convert a throwing function to a Result-returning function

## Type Parameters

### T

`T`

## Parameters

### fn

() => `T`

## Returns

[`Result`](../type-aliases/Result.md)\<`T`, `Error`\>

## Example

```ts
const safeParseJSON = tryCatch(JSON.parse);
const result = safeParseJSON('{"key": "value"}');
if (result.ok) {
  console.log(result.value);
}
```
