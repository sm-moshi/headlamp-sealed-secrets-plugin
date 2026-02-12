[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [hooks/useControllerHealth](../README.md) / useControllerHealth

# Function: useControllerHealth()

> **useControllerHealth**(`autoRefresh?`, `refreshIntervalMs?`): `object`

Defined in: [src/hooks/useControllerHealth.ts:30](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/hooks/useControllerHealth.ts#L30)

Custom hook for monitoring controller health

Automatically checks controller health on mount and can optionally
refresh at a specified interval.

## Parameters

### autoRefresh?

`boolean` = `false`

Whether to automatically refresh health status

### refreshIntervalMs?

`number` = `30000`

Refresh interval in milliseconds (default: 30000ms = 30s)

## Returns

`object`

Object with health status, loading state, and manual refresh function

### health

> **health**: [`ControllerHealthStatus`](../../../lib/controller/interfaces/ControllerHealthStatus.md)

### loading

> **loading**: `boolean`

### refresh()

> **refresh**: () => `Promise`\<`void`\> = `fetchHealth`

#### Returns

`Promise`\<`void`\>

## Example

```ts
// Manual refresh only
const { health, loading, refresh } = useControllerHealth();

// Auto-refresh every 30 seconds
const { health, loading } = useControllerHealth(true, 30000);

// Auto-refresh every 10 seconds
const { health, loading } = useControllerHealth(true, 10000);
```
