[**Headlamp Sealed Secrets API v0.2.0**](../../README.md)

***

[Headlamp Sealed Secrets API](../../README.md) / [types](../README.md) / PEMCertificate

# Function: PEMCertificate()

> **PEMCertificate**(`value`): [`PEMCertificate`](../type-aliases/PEMCertificate.md)

Defined in: [src/types.ts:105](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L105)

Create a branded PEM certificate

## Parameters

### value

`string`

## Returns

[`PEMCertificate`](../type-aliases/PEMCertificate.md)

## Example

```ts
return Ok(PEMCertificate(certPem));
```
