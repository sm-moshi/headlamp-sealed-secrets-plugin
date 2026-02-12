[**Headlamp Sealed Secrets API v0.2.0**](../../../README.md)

***

[Headlamp Sealed Secrets API](../../../README.md) / [lib/crypto](../README.md) / parseCertificateInfo

# Function: parseCertificateInfo()

> **parseCertificateInfo**(`pemCert`): [`Result`](../../../types/type-aliases/Result.md)\<[`CertificateInfo`](../../../types/interfaces/CertificateInfo.md), `string`\>

Defined in: [src/lib/crypto.ts:168](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/blob/bdf19cd3bf5a2d679b7ba949108fe9df1843c5f4/headlamp-sealed-secrets/src/lib/crypto.ts#L168)

Parse certificate and extract metadata

Extracts validity dates, issuer/subject information, and calculates
expiration status and fingerprint.

## Parameters

### pemCert

[`PEMCertificate`](../../../types/type-aliases/PEMCertificate.md)

PEM-encoded certificate string (branded type)

## Returns

[`Result`](../../../types/type-aliases/Result.md)\<[`CertificateInfo`](../../../types/interfaces/CertificateInfo.md), `string`\>

Result containing certificate information or error message
