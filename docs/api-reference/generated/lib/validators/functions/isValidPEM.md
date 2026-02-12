[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [lib/validators](../README.md) / isValidPEM

# Function: isValidPEM()

> **isValidPEM**(`value`): `boolean`

Defined in: [src/lib/validators.ts:96](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/validators.ts#L96)

Validate PEM certificate format

Checks for BEGIN/END CERTIFICATE markers and basic structure

## Parameters

### value

`string`

String to validate

## Returns

`boolean`

true if valid PEM format
