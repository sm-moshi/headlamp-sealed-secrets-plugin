[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [lib/retry](../README.md) / RetryOptions

# Interface: RetryOptions

Defined in: [src/lib/retry.ts:13](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/retry.ts#L13)

Retry configuration options

## Properties

### maxAttempts?

> `optional` **maxAttempts**: `number`

Defined in: [src/lib/retry.ts:15](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/retry.ts#L15)

Maximum number of retry attempts (default: 3)

***

### initialDelayMs?

> `optional` **initialDelayMs**: `number`

Defined in: [src/lib/retry.ts:17](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/retry.ts#L17)

Initial delay in milliseconds (default: 1000)

***

### maxDelayMs?

> `optional` **maxDelayMs**: `number`

Defined in: [src/lib/retry.ts:19](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/retry.ts#L19)

Maximum delay in milliseconds (default: 10000)

***

### backoffMultiplier?

> `optional` **backoffMultiplier**: `number`

Defined in: [src/lib/retry.ts:21](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/retry.ts#L21)

Backoff multiplier (default: 2 for exponential)

***

### useJitter?

> `optional` **useJitter**: `boolean`

Defined in: [src/lib/retry.ts:23](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/retry.ts#L23)

Whether to add jitter to delays (default: true)

***

### isRetryable()?

> `optional` **isRetryable**: (`error`) => `boolean`

Defined in: [src/lib/retry.ts:25](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/retry.ts#L25)

Predicate to determine if error is retryable (default: all errors retryable)

#### Parameters

##### error

`Error`

#### Returns

`boolean`
