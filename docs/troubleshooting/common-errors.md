# Common Errors

Frequent error messages and their solutions.

## Table of Contents

- [Plugin Errors](#plugin-errors)
- [Controller Errors](#controller-errors)
- [Encryption Errors](#encryption-errors)
- [Permission Errors](#permission-errors)
- [Validation Errors](#validation-errors)

---

## Plugin Errors

### "Plugin failed to load"

**Full Error**:
```
Error loading plugin headlamp-sealed-secrets: Invalid plugin manifest
```

**Cause**: Corrupted or incompatible plugin installation

**Solution**:
1. Remove the plugin:
   ```bash
   rm -rf ~/Library/Application\ Support/Headlamp/plugins/headlamp-sealed-secrets/
   ```

2. Reinstall from latest release:
   ```bash
   curl -LO https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/releases/download/v0.2.0/headlamp-sealed-secrets-0.2.0.tar.gz
   tar -xzf headlamp-sealed-secrets-0.2.0.tar.gz -C ~/Library/Application\ Support/Headlamp/plugins/
   ```

3. Restart Headlamp

---

### "Headlamp version incompatible"

**Full Error**:
```
Plugin requires Headlamp v0.13.0 or later (current: v0.12.0)
```

**Cause**: Headlamp version too old

**Solution**:
Upgrade Headlamp:
```bash
# macOS with Homebrew
brew upgrade headlamp

# Or download from https://headlamp.dev/docs/latest/installation/
```

---

## Controller Errors

### "Failed to fetch controller certificate"

**Full Error**:
```
Failed to fetch certificate: Service 'sealed-secrets-controller' not found in namespace 'kube-system'
```

**Cause**: Sealed Secrets controller not installed

**Solution**:
```bash
# Install controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Wait for controller to be ready
kubectl wait --for=condition=ready pod -n kube-system -l name=sealed-secrets-controller --timeout=60s

# Verify
kubectl get pods -n kube-system -l name=sealed-secrets-controller
```

---

### "Controller health check failed"

**Full Error**:
```
Health check failed: Connection timeout after 3 attempts
```

**Cause**: Controller not responding or network issues

**Diagnosis**:
```bash
# 1. Check controller is running
kubectl get pods -n kube-system -l name=sealed-secrets-controller

# 2. Check logs
kubectl logs -n kube-system -l name=sealed-secrets-controller --tail=50

# 3. Test direct connection
kubectl port-forward -n kube-system service/sealed-secrets-controller 8080:8080
# In another terminal:
curl http://localhost:8080/v1/cert.pem
```

**Solutions**:

**If pod is not running**:
```bash
kubectl describe pod -n kube-system -l name=sealed-secrets-controller
```
Look for image pull errors, resource constraints, or CrashLoopBackOff.

**If pod is running but not responding**:
```bash
# Restart the controller
kubectl rollout restart deployment -n kube-system sealed-secrets-controller
```

---

### "Controller version mismatch"

**Full Error**:
```
Warning: Controller version v0.18.0 detected. Plugin tested with v0.24.0+
```

**Cause**: Old controller version

**Solution**:
```bash
# Upgrade controller (preserves existing secrets)
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Verify upgrade
kubectl get deployment -n kube-system sealed-secrets-controller -o jsonpath='{.spec.template.spec.containers[0].image}'
```

**Warning**: Backup sealing keys before upgrading:
```bash
kubectl get secret -n kube-system sealed-secrets-key -o yaml > sealed-secrets-key-backup.yaml
```

---

## Encryption Errors

### "Encryption failed: Invalid public key"

**Full Error**:
```
Encryption failed: Invalid public key format
```

**Cause**: Corrupted or malformed certificate

**Diagnosis**:
```bash
# Fetch and validate certificate
kubectl get secret -n kube-system sealed-secrets-key -o jsonpath='{.data.tls\.crt}' | base64 -d > cert.pem
openssl x509 -in cert.pem -noout -text
```

**Solution**:
If certificate is invalid, the controller may be corrupted. Restart it:
```bash
kubectl rollout restart deployment -n kube-system sealed-secrets-controller
```

---

### "Encryption failed: Certificate expired"

**Full Error**:
```
Encryption failed: Certificate expired on 2025-01-15
```

**Cause**: Sealing key has expired (typically after 30 days of inactivity)

**Solution**:

**Option 1: Use existing valid certificate** (if you have multiple keys):
```bash
# List all certificates
kubectl get secrets -n kube-system -l sealedsecrets.bitnami.com/sealed-secrets-key

# Plugin will automatically use the newest valid certificate
```

**Option 2: Rotate sealing keys**:
```bash
# Generate new key (requires cluster-admin)
kubectl delete secret -n kube-system sealed-secrets-key
kubectl rollout restart deployment -n kube-system sealed-secrets-controller

# Wait for new key generation
kubectl wait --for=condition=ready pod -n kube-system -l name=sealed-secrets-controller --timeout=60s
```

**Warning**: After key rotation, existing SealedSecrets remain valid but cannot be modified. See [Secret Rotation Tutorial](../tutorials/secret-rotation.md).

---

### "Value too large"

**Full Error**:
```
Encryption failed: Value exceeds maximum size (1MB)
```

**Cause**: Secret value larger than 1MB (RSA encryption limit)

**Solution**:

**For large files**: Store in external secret management (Vault, AWS Secrets Manager) and reference:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: large-secret-ref
stringData:
  vault-path: "secret/data/myapp/config"
```

**For multiple keys**: Split into separate secrets:
```bash
# Instead of one large secret:
# - config.json (500KB)
# - data.bin (600KB)

# Create two secrets:
# - myapp-config (config.json)
# - myapp-data (data.bin)
```

---

## Permission Errors

### "Forbidden: User cannot list SealedSecrets"

**Full Error**:
```
Failed to load sealed secrets: Forbidden (403)
User 'alice' cannot list resource 'sealedsecrets' in API group 'bitnami.com'
```

**Cause**: Missing RBAC permissions

**Diagnosis**:
```bash
# Check your permissions
kubectl auth can-i list sealedsecrets.bitnami.com
kubectl auth can-i list sealedsecrets.bitnami.com --all-namespaces
```

**Solution**:

Apply this ClusterRole (requires cluster-admin):
```yaml
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: sealed-secrets-viewer
rules:
- apiGroups: ["bitnami.com"]
  resources: ["sealedsecrets"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["namespaces"]
  verbs: ["list"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: alice-sealed-secrets-viewer
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: sealed-secrets-viewer
subjects:
- kind: User
  name: alice
  apiGroup: rbac.authorization.k8s.io
```

Apply:
```bash
kubectl apply -f sealed-secrets-viewer-rbac.yaml
```

See [RBAC Permissions Guide](../user-guide/rbac-permissions.md) for detailed examples.

---

### "Cannot download certificate: Service access denied"

**Full Error**:
```
Failed to fetch certificate: Forbidden (403)
User cannot access service/proxy 'sealed-secrets-controller'
```

**Cause**: Missing service access permission

**Solution**:
```yaml
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: sealed-secrets-cert-downloader
rules:
- apiGroups: [""]
  resources: ["services"]
  verbs: ["get"]
  resourceNames: ["sealed-secrets-controller"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: alice-cert-downloader
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: sealed-secrets-cert-downloader
subjects:
- kind: User
  name: alice
  apiGroup: rbac.authorization.k8s.io
```

---

## Validation Errors

### "Invalid name format"

**Full Error**:
```
Validation failed: Name must be a valid DNS-1123 subdomain (lowercase alphanumeric, '-', '.', max 253 chars)
```

**Cause**: Secret name doesn't follow Kubernetes naming rules

**Invalid Names**:
- `My_Secret` (uppercase, underscore)
- `secret@prod` (special characters)
- `Secret-Name` (uppercase)
- `-secret` (starts with hyphen)

**Valid Names**:
- `my-secret`
- `prod.secret`
- `secret-123`
- `my-app-secret`

**Rules**:
- Only lowercase letters, numbers, hyphens, dots
- Start and end with alphanumeric
- Max 253 characters
- Must match: `[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*`

---

### "Empty secret value"

**Full Error**:
```
Validation failed: Secret value cannot be empty
```

**Cause**: Trying to create a secret with empty value

**Solution**:
Either provide a value or use a placeholder:
```yaml
# If you need a placeholder for later update:
stringData:
  password: "changeme"
```

Note: Kubernetes allows empty values, but it's usually not intentional.

---

### "Invalid namespace"

**Full Error**:
```
Validation failed: Namespace does not exist or is invalid
```

**Cause**: Target namespace doesn't exist

**Diagnosis**:
```bash
# List all namespaces
kubectl get namespaces

# Check specific namespace
kubectl get namespace production
```

**Solution**:
Create the namespace first:
```bash
kubectl create namespace production
```

Or use an existing namespace:
```bash
kubectl get namespaces
```

---

## Browser-Specific Errors

### "localStorage not available"

**Full Error**:
```
Failed to save settings: localStorage is not available
```

**Cause**: Browser privacy settings blocking localStorage

**Solution**:

**Safari**:
1. Preferences → Privacy
2. Uncheck "Prevent cross-site tracking"
3. Reload Headlamp

**Chrome**:
1. Settings → Privacy and security
2. Cookies and other site data
3. Select "Allow all cookies"
4. Reload Headlamp

**Firefox**:
1. Preferences → Privacy & Security
2. Enhanced Tracking Protection → Standard
3. Reload Headlamp

---

### "Certificate validation failed"

**Full Error** (Browser Console):
```
Certificate validation failed: unable to verify the first certificate
```

**Cause**: Self-signed Kubernetes API certificate

**Solution**:

This is expected with many Kubernetes clusters. The plugin handles this internally.

If you see this in browser console but plugin works, you can ignore it.

If plugin doesn't work:
1. Use `kubectl proxy` for local development
2. Configure Headlamp to trust cluster certificate

---

## Network Errors

### "Connection timeout"

**Full Error**:
```
Failed to fetch certificate: Connection timeout after 30000ms
```

**Cause**: Network connectivity issues

**Diagnosis**:
```bash
# Test cluster connectivity
kubectl cluster-info

# Test service connectivity
kubectl get svc -n kube-system sealed-secrets-controller

# Port-forward and test manually
kubectl port-forward -n kube-system service/sealed-secrets-controller 8080:8080
curl http://localhost:8080/v1/cert.pem
```

**Solutions**:

**VPN Issues**: If using VPN, ensure it's connected
**Proxy**: Configure proxy in Headlamp settings
**Firewall**: Check firewall allows Kubernetes API access

---

### "CORS error"

**Full Error** (Browser Console):
```
Access to fetch at 'https://kubernetes.default.svc' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Cause**: Browser security blocking cross-origin requests

**Solution**:

This should not happen in production. If you see this during development:

1. Use Headlamp's built-in proxy (recommended)
2. Or configure Kubernetes API server with CORS headers (not recommended)

---

## Getting More Help

If your error isn't listed:

1. **Search GitHub Issues**: [https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/issues](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/issues)

2. **Check Controller Logs**:
   ```bash
   kubectl logs -n kube-system -l name=sealed-secrets-controller --tail=100
   ```

3. **Enable Debug Logging** (browser console):
   ```javascript
   localStorage.setItem('debug', 'headlamp-sealed-secrets:*')
   ```
   Then reload Headlamp.

4. **Create New Issue**: [https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/issues/new](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/issues/new)

Include:
- Full error message
- Plugin version
- Headlamp version
- Kubernetes version
- Controller version
- Steps to reproduce

## See Also

- [Controller Issues](controller-issues.md) - Controller-specific problems
- [Encryption Failures](encryption-failures.md) - Debugging encryption
- [Permission Errors](permission-errors.md) - RBAC troubleshooting
- [User Guide](../user-guide/) - Feature documentation
