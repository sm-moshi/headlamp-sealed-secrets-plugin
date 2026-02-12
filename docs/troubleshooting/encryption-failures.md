# Encryption Failures

Debugging encryption errors when creating sealed secrets.

## Table of Contents

- [Understanding the Encryption Flow](#understanding-the-encryption-flow)
- [Certificate Problems](#certificate-problems)
- [Value Issues](#value-issues)
- [Scope Problems](#scope-problems)
- [Browser Issues](#browser-issues)
- [Network Issues](#network-issues)

---

## Understanding the Encryption Flow

Before troubleshooting, understand how encryption works:

```
1. Plugin fetches public certificate from controller
   GET /api/v1/namespaces/kube-system/services/sealed-secrets-controller:http/proxy/v1/cert.pem

2. Plugin validates certificate (PEM format, expiry, fingerprint)

3. Plugin encrypts value client-side using RSA-OAEP
   - Generates random AES-256 key
   - Encrypts value with AES-256-GCM
   - Encrypts AES key with RSA public key
   - Combines into encrypted payload

4. Plugin creates SealedSecret with encrypted data
   POST /apis/bitnami.com/v1alpha1/namespaces/<ns>/sealedsecrets

5. Controller unseals secret server-side
```

**Key Points**:
- Encryption happens **in browser** (plaintext never leaves your machine)
- Certificate must be **valid PEM format** and **not expired**
- Maximum value size: **~1MB** (RSA limitation)

---

## Certificate Problems

### "Failed to fetch certificate"

#### Symptom
```
Failed to fetch certificate: Network error
```

#### Diagnosis

```bash
# 1. Check controller is running
kubectl get pods -n kube-system -l name=sealed-secrets-controller

# 2. Test certificate endpoint directly
kubectl port-forward -n kube-system service/sealed-secrets-controller 8080:8080
# In another terminal:
curl http://localhost:8080/v1/cert.pem
```

#### Solutions

**Controller not running**: See [Controller Issues](controller-issues.md)

**Certificate endpoint not responding**:
```bash
# Check controller logs
kubectl logs -n kube-system -l name=sealed-secrets-controller --tail=50

# Restart controller
kubectl rollout restart deployment -n kube-system sealed-secrets-controller
```

**RBAC permission denied**:
```bash
# Check service access permission
kubectl auth can-i get services/sealed-secrets-controller -n kube-system

# If no, apply RBAC (requires cluster-admin):
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: sealed-secrets-cert-downloader
rules:
- apiGroups: [""]
  resources: ["services", "services/proxy"]
  verbs: ["get"]
  resourceNames: ["sealed-secrets-controller"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: $(kubectl config view --minify -o jsonpath='{.contexts[0].context.user}')-cert-downloader
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: sealed-secrets-cert-downloader
subjects:
- kind: User
  name: $(kubectl config view --minify -o jsonpath='{.contexts[0].context.user}')
  apiGroup: rbac.authorization.k8s.io
EOF
```

---

### "Certificate expired"

#### Symptom
```
Encryption failed: Certificate expired on 2025-01-15T10:30:00Z
```

#### Diagnosis

```bash
# Check certificate expiry
kubectl get secret -n kube-system sealed-secrets-key -o jsonpath='{.data.tls\.crt}' | \
  base64 -d | \
  openssl x509 -noout -dates

# Example output:
# notBefore=Jan  1 00:00:00 2025 GMT
# notAfter=Jan 15 10:30:00 2025 GMT  ← Expired!
```

#### Solution

Rotate sealing keys (see [Secret Rotation Tutorial](../tutorials/secret-rotation.md)):

```bash
# Option 1: Delete old key (generates new automatically)
kubectl delete secret -n kube-system sealed-secrets-key
kubectl rollout restart deployment -n kube-system sealed-secrets-controller

# Option 2: Annotate for rotation (keeps old for decryption)
kubectl annotate secret -n kube-system sealed-secrets-key \
  sealedsecrets.bitnami.com/sealed-secrets-key-rotation=rotate
kubectl rollout restart deployment -n kube-system sealed-secrets-controller

# Wait for new key
kubectl wait --for=condition=ready pod -n kube-system -l name=sealed-secrets-controller --timeout=60s

# Verify new certificate
kubectl get secret -n kube-system -l sealedsecrets.bitnami.com/sealed-secrets-key
```

**Warning**: After key rotation:
- ✅ Existing SealedSecrets continue to work (controller keeps old key for decryption)
- ❌ Cannot modify existing SealedSecrets (must delete and recreate with new key)

---

### "Invalid PEM format"

#### Symptom
```
Encryption failed: Certificate is not valid PEM format
```

#### Diagnosis

```bash
# Fetch and validate certificate
kubectl get secret -n kube-system sealed-secrets-key -o jsonpath='{.data.tls\.crt}' | base64 -d > cert.pem

# Should start with:
# -----BEGIN CERTIFICATE-----
# Should end with:
# -----END CERTIFICATE-----

cat cert.pem
```

#### Solutions

**Corrupted certificate**:
```bash
# Regenerate certificate
kubectl delete secret -n kube-system sealed-secrets-key
kubectl rollout restart deployment -n kube-system sealed-secrets-controller
```

**Wrong secret**: Ensure you're using correct secret:
```bash
# List all sealing keys
kubectl get secrets -n kube-system -l sealedsecrets.bitnami.com/sealed-secrets-key

# Should show sealed-secrets-key
```

---

### "Certificate expiring soon" Warning

#### Symptom
```
⚠️ Warning: Certificate expires in 15 days
```

This is an **advance warning**, not an error. Plugin warns 30 days before expiry.

#### Action

Plan key rotation before expiry:

1. **Schedule maintenance window**
2. **Backup existing keys**:
   ```bash
   kubectl get secret -n kube-system -l sealedsecrets.bitnami.com/sealed-secrets-key -o yaml > sealing-keys-backup.yaml
   ```
3. **Rotate keys**: See [Secret Rotation Tutorial](../tutorials/secret-rotation.md)
4. **Recreate SealedSecrets** if needed

---

## Value Issues

### "Value too large"

#### Symptom
```
Encryption failed: Value exceeds maximum size (1MB)
```

#### Cause

RSA encryption has size limit (~1MB for RSA-2048).

#### Solutions

**Split into multiple secrets**:
```yaml
# Instead of:
apiVersion: v1
kind: Secret
metadata:
  name: large-config
data:
  config.json: <2MB base64 data>  ❌

# Use:
---
apiVersion: v1
kind: Secret
metadata:
  name: config-part1
data:
  config-part1.json: <500KB base64 data>  ✅
---
apiVersion: v1
kind: Secret
metadata:
  name: config-part2
data:
  config-part2.json: <500KB base64 data>  ✅
```

**Use external secret management** for very large files:
- HashiCorp Vault
- AWS Secrets Manager
- Azure Key Vault
- GCP Secret Manager

Then store only references in SealedSecrets:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: external-ref
stringData:
  vault-path: "secret/data/myapp/large-config"
```

**Compress data** before encrypting:
```bash
# Compress config file
gzip -c config.json | base64

# Then use compressed value in plugin
```

---

### "Empty value"

#### Symptom
```
Validation failed: Secret value cannot be empty
```

#### Cause

Trying to create secret with empty value.

#### Solutions

**Provide a value**:
```yaml
stringData:
  password: "mysecretvalue"  ✅
```

**Use placeholder** if value unknown:
```yaml
stringData:
  password: "changeme"  # Replace later
```

**Remove key** if not needed:
Don't create keys with empty values.

---

### "Invalid characters"

#### Symptom
```
Encryption failed: Value contains invalid characters
```

This error is **rare** (plugin accepts any binary data). If you see it:

#### Solutions

**Base64-encode first** (for binary data):
```bash
# Encode binary file
base64 < binary-file.bin

# Use in plugin with base64-encoded value
```

**Check for null bytes** in text:
```bash
# Remove null bytes
tr -d '\0' < file.txt
```

---

## Scope Problems

### "Scope validation failed"

#### Symptom
```
Validation failed: Invalid scope for namespace-scoped secret
```

#### Cause

Scope mismatch between plugin setting and cluster policy.

#### Understanding Scopes

| Scope | Can Rename? | Can Move Namespace? | Use Case |
|-------|------------|---------------------|----------|
| `strict` | ❌ No | ❌ No | Production secrets |
| `namespace-wide` | ✅ Yes | ❌ No | Dev environments |
| `cluster-wide` | ✅ Yes | ✅ Yes | Shared configs |

#### Solution

**Use strict scope** (most secure):
```yaml
# In plugin:
Scope: strict
Name: my-secret
Namespace: production
```

**Match cluster policy**: If cluster enforces specific scope, use that:
```bash
# Check cluster policy
kubectl get sealedsecrets.bitnami.com -o yaml | grep -A 5 scope
```

---

### "Scope annotation missing"

#### Symptom

SealedSecret created but controller doesn't unseal it.

#### Diagnosis

```bash
# Check SealedSecret
kubectl get sealedsecret my-secret -n default -o yaml

# Look for annotation:
metadata:
  annotations:
    sealedsecrets.bitnami.com/scope: strict  ← Should be present
```

#### Solution

Plugin automatically adds scope annotation. If missing:

1. **Delete SealedSecret**:
   ```bash
   kubectl delete sealedsecret my-secret -n default
   ```

2. **Recreate with plugin** (don't create manually)

---

## Browser Issues

### "Crypto API not available"

#### Symptom
```
Encryption failed: Web Crypto API not available
```

#### Cause

Browser doesn't support Web Crypto API (very old browser).

#### Solution

**Upgrade browser**:
- Chrome 37+
- Firefox 34+
- Safari 11+
- Edge 79+

**Use HTTPS**: Web Crypto requires HTTPS (or localhost):
```bash
# If using custom Headlamp deployment, enable HTTPS
```

---

### "Encryption timeout"

#### Symptom
```
Encryption failed: Operation timeout after 30000ms
```

#### Cause

Browser crypto operation taking too long (rare).

#### Solutions

**Reduce value size**: If encrypting large value, split it.

**Close other tabs**: Free up browser resources.

**Try different browser**: Some browsers have better crypto performance.

**Check browser console** for JavaScript errors:
1. View → Toggle Developer Tools
2. Console tab
3. Look for errors during encryption

---

## Network Issues

### "Certificate fetch timeout"

#### Symptom
```
Failed to fetch certificate: Request timeout after 30000ms
```

#### Diagnosis

```bash
# Test cluster connectivity
kubectl cluster-info

# Test service endpoint
kubectl get svc -n kube-system sealed-secrets-controller

# Test with curl
kubectl port-forward -n kube-system service/sealed-secrets-controller 8080:8080
curl -m 5 http://localhost:8080/v1/cert.pem
```

#### Solutions

**Slow network**: Increase timeout in plugin settings:
- Settings → Sealed Secrets → Network Timeout: 60s

**VPN disconnected**: Reconnect VPN if using one.

**Firewall blocking**: Check firewall allows Kubernetes API access.

---

### "CORS error"

#### Symptom (Browser Console)
```
Access blocked by CORS policy
```

#### Cause

Cross-origin request blocked (should not happen in normal usage).

#### Solution

**Use Headlamp's built-in proxy** (enabled by default).

If developing plugin locally:
```bash
# Start Headlamp in dev mode
npm start

# Headlamp automatically proxies requests
```

---

## Debugging Encryption

### Enable Debug Logging

In browser console:
```javascript
// Enable debug logs
localStorage.setItem('debug', 'headlamp-sealed-secrets:*')

// Reload page
location.reload()

// Try encryption again
// Check console for detailed logs
```

### Manual Encryption Test

Test encryption manually:

```javascript
// In browser console
const cert = await fetch('/api/v1/namespaces/kube-system/services/sealed-secrets-controller:http/proxy/v1/cert.pem')
  .then(r => r.text());

console.log('Certificate:', cert);

// Should show PEM certificate starting with:
// -----BEGIN CERTIFICATE-----
```

### Verify Encrypted Output

```bash
# After creating SealedSecret, verify it
kubectl get sealedsecret my-secret -n default -o yaml

# Should show:
# spec:
#   encryptedData:
#     password: AgB... (base64 encrypted value)
```

---

## Advanced Debugging

### Test with kubeseal CLI

If plugin fails but kubeseal works, it's a plugin issue:

```bash
# Install kubeseal
wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/kubeseal-0.24.0-linux-amd64.tar.gz
tar -xzf kubeseal-0.24.0-linux-amd64.tar.gz
sudo install -m 755 kubeseal /usr/local/bin/kubeseal

# Test encryption
echo -n mysecretvalue | kubeseal \
  --controller-namespace=kube-system \
  --controller-name=sealed-secrets-controller \
  --format=yaml \
  --name=my-secret \
  --namespace=default \
  --scope=strict

# If this works, plugin has a bug
# If this fails too, controller/cluster issue
```

### Compare Encryption

```bash
# Encrypt same value with both methods
# Plugin output:
kubectl get sealedsecret my-secret-plugin -n default -o jsonpath='{.spec.encryptedData.password}'

# kubeseal output:
echo -n mysecretvalue | kubeseal --raw --cert cert.pem --scope strict --name my-secret --namespace default

# Values should be different (encryption is random)
# But both should unseal to same plaintext
```

---

## Getting Help

If encryption still fails:

1. **Gather diagnostics**:
   ```bash
   # Controller version
   kubectl get deployment -n kube-system sealed-secrets-controller -o jsonpath='{.spec.template.spec.containers[0].image}'

   # Certificate validity
   kubectl get secret -n kube-system sealed-secrets-key -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -text

   # Plugin version (in Headlamp UI)
   Settings → Sealed Secrets → About
   ```

2. **Enable debug logging** (see above)

3. **Try kubeseal CLI** to isolate issue

4. **Report issue**:
   - [Plugin Issues](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/issues)
   - [Controller Issues](https://github.com/bitnami-labs/sealed-secrets/issues)

Include:
- Browser and version
- Plugin version
- Controller version
- Full error message
- Browser console logs
- Steps to reproduce

## See Also

- [Common Errors](common-errors.md) - General troubleshooting
- [Controller Issues](controller-issues.md) - Controller-specific problems
- [Encryption Flow](../architecture/encryption-flow.md) - How encryption works
- [Creating Secrets](../user-guide/creating-secrets.md) - Usage guide
