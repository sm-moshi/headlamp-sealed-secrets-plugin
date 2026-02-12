[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [lib/controller](../README.md) / rotateSealedSecret

# Function: rotateSealedSecret()

> **rotateSealedSecret**(`config`, `sealedSecretYaml`): [`AsyncResult`](../../../types/type-aliases/AsyncResult.md)\<`string`, `string`\>

Defined in: [src/lib/controller.ts:119](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/controller.ts#L119)

Rotate (re-encrypt) a SealedSecret with the current active key

## Parameters

### config

[`PluginConfig`](../../../types/interfaces/PluginConfig.md)

Plugin configuration

### sealedSecretYaml

`string`

YAML or JSON of the SealedSecret

## Returns

[`AsyncResult`](../../../types/type-aliases/AsyncResult.md)\<`string`, `string`\>

Result containing the re-encrypted SealedSecret or error message
