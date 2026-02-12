[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [lib/controller](../README.md) / verifySealedSecret

# Function: verifySealedSecret()

> **verifySealedSecret**(`config`, `sealedSecretYaml`): [`AsyncResult`](../../../types/type-aliases/AsyncResult.md)\<`boolean`, `string`\>

Defined in: [src/lib/controller.ts:87](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/controller.ts#L87)

Verify that a SealedSecret can be decrypted by the controller

## Parameters

### config

[`PluginConfig`](../../../types/interfaces/PluginConfig.md)

Plugin configuration

### sealedSecretYaml

`string`

YAML or JSON of the SealedSecret

## Returns

[`AsyncResult`](../../../types/type-aliases/AsyncResult.md)\<`boolean`, `string`\>

Result containing verification status or error message
