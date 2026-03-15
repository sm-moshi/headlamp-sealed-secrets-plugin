# Quick Start Guide

Get started with the Headlamp Sealed Secrets plugin in 5 minutes.

## Prerequisites

Before you begin, ensure:

✅ Plugin is [installed](installation.md)
✅ Headlamp is connected to your cluster
✅ Sealed Secrets controller is running

## Step 1: Verify Installation

1. Open Headlamp
2. Look for **"Sealed Secrets"** in the sidebar
3. Click on it to open the plugin

You should see:
- Controller health status (green = healthy)
- List of existing SealedSecrets (if any)
- "Create Sealed Secret" button

## Step 2: Create Your First Sealed Secret

### Using the UI

1. **Click "Create Sealed Secret"**

2. **Fill in the form**:
   - **Name**: `my-first-secret`
   - **Namespace**: `default` (or your namespace)
   - **Scope**: `strict` (recommended for production)

3. **Add secret data**:
   - Click "Add Key"
   - **Key**: `password`
   - **Value**: `mysecretvalue`

4. **Click "Create"**

The plugin will:
- Fetch the public certificate from the controller
- Encrypt your value client-side
- Create the SealedSecret in your cluster

### Understanding Scopes

- **strict**: Secret can only be unsealed with same name+namespace (most secure)
- **namespace-wide**: Can be renamed within the namespace
- **cluster-wide**: Can be moved anywhere in the cluster

## Step 3: Verify the Sealed Secret

1. **Check the list** - Your new SealedSecret should appear

2. **View details** - Click on `my-first-secret` to see:
   - Metadata (name, namespace, creation time)
   - Scope information
   - Encrypted data (Base64-encoded, encrypted value)
   - Owner references

3. **Verify the plain Secret was created**:
   ```bash
   kubectl get secret my-first-secret -n default
   ```

The Sealed Secrets controller automatically creates a plain Kubernetes Secret from your SealedSecret.

## Step 4: Use the Secret

The unsealed Secret can be used like any Kubernetes secret:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-test-pod
spec:
  containers:
  - name: test-container
    image: nginx
    env:
    - name: SECRET_PASSWORD
      valueFrom:
        secretKeyRef:
          name: my-first-secret
          key: password
```

Apply it:
```bash
kubectl apply -f pod.yaml
```

Verify:
```bash
kubectl exec secret-test-pod -- env | grep SECRET_PASSWORD
# Output: SECRET_PASSWORD=mysecretvalue
```

## Step 5: Download Sealing Keys (Optional)

For CI/CD or offline encryption:

1. Navigate to **"Sealing Keys"** tab

2. You'll see all active certificates with:
   - Creation date
   - Expiry date (with warnings if expiring soon)
   - Fingerprint

3. **Download certificate**:
   - Click "Download" on the active key
   - Save as `sealed-secrets-cert.pem`

4. **Use with kubeseal CLI** (optional):
   ```bash
   echo -n mysecretvalue | kubeseal \
     --cert sealed-secrets-cert.pem \
     --scope strict \
     --name my-secret \
     --namespace default
   ```

## Common Tasks

### Create a Secret with Multiple Keys

1. Click "Create Sealed Secret"
2. Add multiple key-value pairs:
   - Key: `username`, Value: `admin`
   - Key: `password`, Value: `secret123`
   - Key: `api-key`, Value: `abc123xyz`
3. Click "Create"

### Update an Existing Secret

**Note**: You cannot edit SealedSecrets directly. To update:

1. Delete the old SealedSecret:
   ```bash
   kubectl delete sealedsecret my-first-secret -n default
   ```

2. Create a new one with updated values (using the UI)

3. The controller will recreate the plain Secret

### Delete a Sealed Secret

1. Find the secret in the list
2. Click on it to view details
3. Click "Delete" button
4. Confirm deletion

**Warning**: This also deletes the unsealed Secret!

## Troubleshooting

### "Controller not found" Error

**Check controller status**:
```bash
kubectl get pods -n kube-system -l name=sealed-secrets-controller
```

**If not running**, install it:
```bash
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml
```

### "Permission denied" Error

You need RBAC permissions for SealedSecret resources:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: sealed-secrets-user
rules:
- apiGroups: ["bitnami.com"]
  resources: ["sealedsecrets"]
  verbs: ["get", "list", "create", "delete"]
- apiGroups: [""]
  resources: ["services"]
  verbs: ["get"]
```

### Encryption Fails

1. **Check certificate is valid**:
   - Go to "Sealing Keys" tab
   - Verify certificate is not expired
   - Check for expiry warnings

2. **Verify controller connectivity**:
   ```bash
   kubectl get svc -n kube-system sealed-secrets-controller
   ```

3. **Check browser console**:
   - View → Toggle Developer Tools
   - Look for encryption errors

## Next Steps

Now that you've created your first sealed secret, explore more features:

- **[User Guide](../user-guide/README.md)** - Learn about all features
- **[Scopes Explained](../user-guide/scopes-explained.md)** - Deep dive into scope types
- **[CI/CD Integration](../tutorials/ci-cd-integration.md)** - Automate secret creation
- **[RBAC Permissions](../user-guide/rbac-permissions.md)** - Configure access control

## Best Practices

1. **Use strict scope** for production secrets
2. **Store SealedSecrets in Git** (they're safe to commit!)
3. **Don't store plain Secrets in Git**
4. **Monitor certificate expiry** (plugin warns 30 days in advance)
5. **Backup sealing keys** for disaster recovery
6. **Rotate secrets regularly** (delete and recreate)

## Need Help?

- **Documentation**: [Full docs](../README.md)
- **Troubleshooting**: [Common issues](../troubleshooting/README.md)
- **GitHub Issues**: [Report bugs](https://github.com/sm-moshi/headlamp-sealed-secrets-plugin/issues)
- **Discussions**: [Ask questions](https://github.com/sm-moshi/headlamp-sealed-secrets-plugin/discussions)
