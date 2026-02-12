[**Headlamp Sealed Secrets API v0.2.0**](../../README.md)

***

[Headlamp Sealed Secrets API](../../README.md) / [types](../README.md) / Ok

# Function: Ok()

> **Ok**\<`T`\>(`value`): [`Result`](../type-aliases/Result.md)\<`T`, `never`\>

Defined in: [src/types.ts:126](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L126)

Helper to create a success result

## Type Parameters

### T

`T`

## Parameters

### value

`T`

## Returns

[`Result`](../type-aliases/Result.md)\<`T`, `never`\>

## Example

```ts
return Ok(42);
```
