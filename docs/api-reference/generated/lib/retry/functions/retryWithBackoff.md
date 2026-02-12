[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [lib/retry](../README.md) / retryWithBackoff

# Function: retryWithBackoff()

> **retryWithBackoff**\<`T`, `E`\>(`operation`, `options?`): [`AsyncResult`](../../../types/type-aliases/AsyncResult.md)\<`T`, `string`\>

Defined in: [src/lib/retry.ts:86](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/retry.ts#L86)

Retry an async operation with exponential backoff

## Type Parameters

### T

`T`

### E

`E`

## Parameters

### operation

() => [`AsyncResult`](../../../types/type-aliases/AsyncResult.md)\<`T`, `E`\>

Async operation to retry (should return AsyncResult)

### options?

[`RetryOptions`](../interfaces/RetryOptions.md) = `{}`

Retry configuration

## Returns

[`AsyncResult`](../../../types/type-aliases/AsyncResult.md)\<`T`, `string`\>

Result of the operation or final error after all retries

## Example

```ts
const result = await retryWithBackoff(
  async () => fetchPublicCertificate(config),
  { maxAttempts: 3, initialDelayMs: 1000 }
);
```
