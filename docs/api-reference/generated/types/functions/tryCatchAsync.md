[**Headlamp Sealed Secrets API v0.2.0**](../../README.md)

***

[Headlamp Sealed Secrets API](../../README.md) / [types](../README.md) / tryCatchAsync

# Function: tryCatchAsync()

> **tryCatchAsync**\<`T`\>(`fn`): [`AsyncResult`](../type-aliases/AsyncResult.md)\<`T`, `Error`\>

Defined in: [src/types.ts:166](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L166)

Convert an async throwing function to an AsyncResult

## Type Parameters

### T

`T`

## Parameters

### fn

() => `Promise`\<`T`\>

## Returns

[`AsyncResult`](../type-aliases/AsyncResult.md)\<`T`, `Error`\>

## Example

```ts
const safeFetch = tryCatchAsync(() => fetch('/api/data'));
const result = await safeFetch();
```
