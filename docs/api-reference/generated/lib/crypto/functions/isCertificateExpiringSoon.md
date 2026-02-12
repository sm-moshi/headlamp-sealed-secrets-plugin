[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [lib/crypto](../README.md) / isCertificateExpiringSoon

# Function: isCertificateExpiringSoon()

> **isCertificateExpiringSoon**(`info`, `daysThreshold?`): `boolean`

Defined in: [src/lib/crypto.ts:220](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/crypto.ts#L220)

Check if certificate will expire soon (within threshold)

## Parameters

### info

[`CertificateInfo`](../../../types/interfaces/CertificateInfo.md)

Certificate information

### daysThreshold?

`number` = `30`

Number of days to consider "expiring soon" (default: 30)

## Returns

`boolean`

true if certificate will expire within threshold days
