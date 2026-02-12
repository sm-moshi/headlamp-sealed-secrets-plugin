[**Headlamp Sealed Secrets API v0.2.0**](../../README.md)

***

[Headlamp Sealed Secrets API](../../README.md) / [types](../README.md) / Err

# Function: Err()

> **Err**\<`E`\>(`error`): [`Result`](../type-aliases/Result.md)\<`never`, `E`\>

Defined in: [src/types.ts:137](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L137)

Helper to create an error result

## Type Parameters

### E

`E`

## Parameters

### error

`E`

## Returns

[`Result`](../type-aliases/Result.md)\<`never`, `E`\>

## Example

```ts
return Err('Something went wrong');
return Err(new Error('Something went wrong'));
```
