[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [lib/controller](../README.md) / fetchPublicCertificate

# Function: fetchPublicCertificate()

> **fetchPublicCertificate**(`config`): [`AsyncResult`](../../../types/type-aliases/AsyncResult.md)\<[`PEMCertificate`](../../../types/type-aliases/PEMCertificate.md), `string`\>

Defined in: [src/lib/controller.ts:70](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/controller.ts#L70)

Fetch the controller's public certificate with retry logic

Automatically retries on network errors with exponential backoff:
- Max 3 attempts
- Initial delay: 1s
- Max delay: 10s
- Exponential backoff with jitter

## Parameters

### config

[`PluginConfig`](../../../types/interfaces/PluginConfig.md)

Plugin configuration

## Returns

[`AsyncResult`](../../../types/type-aliases/AsyncResult.md)\<[`PEMCertificate`](../../../types/type-aliases/PEMCertificate.md), `string`\>

Result containing PEM-encoded certificate (branded type) or error message
