[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [lib/controller](../README.md) / checkControllerHealth

# Function: checkControllerHealth()

> **checkControllerHealth**(`config`): [`AsyncResult`](../../../types/type-aliases/AsyncResult.md)\<[`ControllerHealthStatus`](../interfaces/ControllerHealthStatus.md), `string`\>

Defined in: [src/lib/controller.ts:185](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/controller.ts#L185)

Check controller health and reachability

Attempts to reach the controller's health endpoint (/healthz) with a 5-second timeout.
Returns health status including latency and version information if available.

## Parameters

### config

[`PluginConfig`](../../../types/interfaces/PluginConfig.md)

Plugin configuration

## Returns

[`AsyncResult`](../../../types/type-aliases/AsyncResult.md)\<[`ControllerHealthStatus`](../interfaces/ControllerHealthStatus.md), `string`\>

Result containing health status (never fails - returns status even if unreachable)
