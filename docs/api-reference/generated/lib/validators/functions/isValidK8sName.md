[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [lib/validators](../README.md) / isValidK8sName

# Function: isValidK8sName()

> **isValidK8sName**(`name`): `boolean`

Defined in: [src/lib/validators.ts:64](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/validators.ts#L64)

Validate Kubernetes resource name

Must match DNS-1123 subdomain:
- lowercase alphanumeric characters, '-' or '.'
- start and end with alphanumeric character
- max 253 characters

## Parameters

### name

`string`

Name to validate

## Returns

`boolean`

true if valid Kubernetes resource name
