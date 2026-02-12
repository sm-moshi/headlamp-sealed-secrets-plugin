[**Headlamp Sealed Secrets API v0.2.0**](../../README.md)

***

[Headlamp Sealed Secrets API](../../README.md) / [types](../README.md) / CertificateInfo

# Interface: CertificateInfo

Defined in: [src/types.ts:266](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L266)

Certificate information extracted from PEM certificate

## Properties

### validFrom

> **validFrom**: `Date`

Defined in: [src/types.ts:268](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L268)

Validity period start date

***

### validTo

> **validTo**: `Date`

Defined in: [src/types.ts:270](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L270)

Validity period end date

***

### isExpired

> **isExpired**: `boolean`

Defined in: [src/types.ts:272](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L272)

Whether certificate is currently expired

***

### daysUntilExpiry

> **daysUntilExpiry**: `number`

Defined in: [src/types.ts:274](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L274)

Days until expiry (negative if expired)

***

### issuer

> **issuer**: `string`

Defined in: [src/types.ts:276](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L276)

Certificate issuer (formatted as DN string)

***

### subject

> **subject**: `string`

Defined in: [src/types.ts:278](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L278)

Certificate subject (formatted as DN string)

***

### fingerprint

> **fingerprint**: `string`

Defined in: [src/types.ts:280](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L280)

SHA-256 fingerprint of certificate

***

### serialNumber

> **serialNumber**: `string`

Defined in: [src/types.ts:282](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/types.ts#L282)

Serial number of certificate
