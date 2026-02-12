[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [lib/retry](../README.md) / isRetryableError

# Function: isRetryableError()

> **isRetryableError**(`error`): `boolean`

Defined in: [src/lib/retry.ts:186](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/retry.ts#L186)

Combined predicate for network and HTTP errors

## Parameters

### error

`Error`

Error to check

## Returns

`boolean`

true if error is retryable
