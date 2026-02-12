[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [lib/controller](../README.md) / ControllerHealthStatus

# Interface: ControllerHealthStatus

Defined in: [src/lib/controller.ts:14](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/controller.ts#L14)

Controller health status information

## Properties

### healthy

> **healthy**: `boolean`

Defined in: [src/lib/controller.ts:16](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/controller.ts#L16)

Whether the controller is healthy and responding

***

### reachable

> **reachable**: `boolean`

Defined in: [src/lib/controller.ts:18](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/controller.ts#L18)

Whether the controller is reachable

***

### version?

> `optional` **version**: `string`

Defined in: [src/lib/controller.ts:20](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/controller.ts#L20)

Controller version if available

***

### latencyMs?

> `optional` **latencyMs**: `number`

Defined in: [src/lib/controller.ts:22](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/controller.ts#L22)

Response latency in milliseconds

***

### error?

> `optional` **error**: `string`

Defined in: [src/lib/controller.ts:24](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/controller.ts#L24)

Error message if not healthy
