# Permission Errors

RBAC troubleshooting for Sealed Secrets operations.

## Table of Contents

- [Understanding RBAC](#understanding-rbac)
- [Common Permission Errors](#common-permission-errors)
- [Diagnosing Permission Issues](#diagnosing-permission-issues)
- [Fixing Permissions](#fixing-permissions)
- [Service Accounts](#service-accounts)
- [Namespace-Scoped vs Cluster-Wide](#namespace-scoped-vs-cluster-wide)

---

## Understanding RBAC

The plugin requires different permissions for different operations:

| Operation | Required Permissions |
|-----------|---------------------|
| **View list** | `list` sealedsecrets.bitnami.com |
| **View details** | `get` sealedsecrets.bitnami.com |
| **Create** | `create` sealedsecrets.bitnami.com |
| **Delete** | `delete` sealedsecrets.bitnami.com |
| **Download cert** | `get` services or services/proxy |
| **Decrypt** | `get` secrets |
| **List namespaces** | `list` namespaces |

### How Plugin Checks Permissions

The plugin uses Kubernetes `SelfSubjectAccessReview` API to check permissions in real-time:

```bash
# Example: Check if you can create SealedSecrets
kubectl create -f - <<EOF
apiVersion: authorization.k8s.io/v1
kind: SelfSubjectAccessReview
spec:
  resourceAttributes:
    group: bitnami.com
    resource: sealedsecrets
    verb: create
    namespace: default
EOF
```

**Plugin behavior**:
- ✅ Permission granted → Show UI element
- ❌ Permission denied → Hide/disable UI element
- ⚠️ Check fails → Assume no permission (fail-safe)

---

## Common Permission Errors

### "Cannot list SealedSecrets"

#### Symptom

Empty list or error:
```
Failed to load sealed secrets: Forbidden (403)
User 'alice' cannot list resource 'sealedsecrets' in API group 'bitnami.com'
```

#### Cause

Missing `list` permission for sealedsecrets.bitnami.com.

#### Diagnosis

```bash
# Check permission
kubectl auth can-i list sealedsecrets.bitnami.com
kubectl auth can-i list sealedsecrets.bitnami.com --all-namespaces

# Check as specific user (requires admin)
kubectl auth can-i list sealedsecrets.bitnami.com --as alice
```

#### Solution

Apply viewer role (requires cluster-admin):

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
kubectl apply -f sealed-secrets-viewer.yaml

# Verify
kubectl auth can-i list sealedsecrets.bitnami.com --as alice
# Output: yes
```

---

### "Create button not showing"

#### Symptom

"Create Sealed Secret" button missing from UI.

#### Cause

Missing `create` permission for sealedsecrets.bitnami.com.

#### Diagnosis

```bash
kubectl auth can-i create sealedsecrets.bitnami.com
kubectl auth can-i create sealedsecrets.bitnami.com -n production
```

#### Solution

Apply creator role:

```yaml
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: sealed-secrets-creator
rules:
- apiGroups: ["bitnami.com"]
  resources: ["sealedsecrets"]
  verbs: ["get", "list", "create"]
- apiGroups: [""]
  resources: ["services"]
  verbs: ["get"]
  resourceNames: ["sealed-secrets-controller"]
- apiGroups: [""]
  resources: ["namespaces"]
  verbs: ["list"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: alice-sealed-secrets-creator
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: sealed-secrets-creator
subjects:
- kind: User
  name: alice
  apiGroup: rbac.authorization.k8s.io
```

Apply:
```bash
kubectl apply -f sealed-secrets-creator.yaml
```

---

### "Cannot download certificate"

#### Symptom

Download button hidden or error:
```
Failed to fetch certificate: Forbidden (403)
User cannot access service 'sealed-secrets-controller'
```

#### Cause

Missing service access permission.

#### Diagnosis

```bash
# Check service access
kubectl auth can-i get services -n kube-system
kubectl auth can-i get services/sealed-secrets-controller -n kube-system

# Check proxy access
kubectl auth can-i get services/proxy -n kube-system
```

#### Solution

**Option 1: Direct service access** (simpler):

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

**Option 2: Proxy access** (if direct access doesn't work):

```yaml
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: sealed-secrets-proxy-access
rules:
- apiGroups: [""]
  resources: ["services/proxy"]
  verbs: ["get", "create"]
  resourceNames: ["sealed-secrets-controller"]
```

Apply:
```bash
kubectl apply -f cert-downloader.yaml
```

---

### "Decrypt button hidden"

#### Symptom

"Decrypt" button not visible on SealedSecret detail page.

#### Cause

Missing `get` permission for plain Secrets.

#### Diagnosis

```bash
kubectl auth can-i get secrets
kubectl auth can-i get secrets -n production
```

#### Security Warning

⚠️ **Granting Secret access allows viewing all unsealed secrets!**

Only grant to authorized users (security team, ops).

#### Solution

```yaml
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: sealed-secrets-decryptor
rules:
- apiGroups: ["bitnami.com"]
  resources: ["sealedsecrets"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list"]  # ⚠️ Sensitive permission
- apiGroups: [""]
  resources: ["namespaces"]
  verbs: ["list"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: security-team-decryptor
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: sealed-secrets-decryptor
subjects:
- kind: Group
  name: security-team  # Use groups, not individual users
  apiGroup: rbac.authorization.k8s.io
```

**Namespace-scoped alternative** (more secure):

```yaml
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: sealed-secrets-decryptor
  namespace: production  # Only in production namespace
rules:
- apiGroups: ["bitnami.com"]
  resources: ["sealedsecrets"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: alice-decryptor
  namespace: production
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: sealed-secrets-decryptor
subjects:
- kind: User
  name: alice
  apiGroup: rbac.authorization.k8s.io
```

---

### "Delete button disabled"

#### Symptom

"Delete" button is grayed out or hidden.

#### Cause

Missing `delete` permission for sealedsecrets.bitnami.com.

#### Diagnosis

```bash
kubectl auth can-i delete sealedsecrets.bitnami.com
kubectl auth can-i delete sealedsecrets.bitnami.com -n production
```

#### Solution

```yaml
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: sealed-secrets-admin
rules:
- apiGroups: ["bitnami.com"]
  resources: ["sealedsecrets"]
  verbs: ["get", "list", "create", "delete"]
- apiGroups: [""]
  resources: ["services"]
  verbs: ["get"]
- apiGroups: [""]
  resources: ["namespaces"]
  verbs: ["list"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: alice-sealed-secrets-admin
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: sealed-secrets-admin
subjects:
- kind: User
  name: alice
  apiGroup: rbac.authorization.k8s.io
```

---

## Diagnosing Permission Issues

### Check Your Current User

```bash
# Who am I?
kubectl auth whoami

# Or in older versions:
kubectl config view --minify -o jsonpath='{.contexts[0].context.user}'
```

### List All Your Permissions

```bash
# List all permissions
kubectl auth can-i --list

# List permissions in specific namespace
kubectl auth can-i --list -n production
```

### Check Specific Permission

```bash
# Template:
kubectl auth can-i <verb> <resource>.<apiGroup> [-n <namespace>]

# Examples:
kubectl auth can-i create sealedsecrets.bitnami.com
kubectl auth can-i get secrets -n production
kubectl auth can-i list namespaces
```

### View Your Roles

```bash
# View RoleBindings (namespace-scoped)
kubectl get rolebindings -A -o json | \
  jq -r '.items[] | select(.subjects[]?.name == "'$(kubectl auth whoami)'")'

# View ClusterRoleBindings (cluster-wide)
kubectl get clusterrolebindings -o json | \
  jq -r '.items[] | select(.subjects[]?.name == "'$(kubectl auth whoami)'")'
```

### Check As Another User (Admin Only)

```bash
# Check as specific user
kubectl auth can-i create sealedsecrets.bitnami.com --as alice

# Check as user in group
kubectl auth can-i create sealedsecrets.bitnami.com --as alice --as-group developers

# Check as service account
kubectl auth can-i create sealedsecrets.bitnami.com --as system:serviceaccount:ci-cd:github-actions
```

---

## Fixing Permissions

### General Troubleshooting Steps

1. **Identify missing permission**:
   ```bash
   kubectl auth can-i <verb> <resource>
   ```

2. **Check existing roles**:
   ```bash
   kubectl get clusterroles | grep sealed-secrets
   kubectl describe clusterrole <role-name>
   ```

3. **Apply appropriate role** (see examples above)

4. **Verify permission granted**:
   ```bash
   kubectl auth can-i <verb> <resource>
   # Should output: yes
   ```

5. **Refresh Headlamp UI** (plugin re-checks permissions)

### Using Pre-Built Roles

See [RBAC Permissions Guide](../user-guide/rbac-permissions.md) for pre-built role examples:

- **Viewer** - Read-only access
- **Creator** - Create and view
- **Admin** - Full access (including delete)
- **Auditor** - View sealed and unsealed secrets

---

## Service Accounts

### CI/CD Service Account

For automated systems (GitHub Actions, GitLab CI, etc.):

```yaml
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: sealed-secrets-ci
  namespace: ci-cd

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: sealed-secrets-ci-creator
rules:
- apiGroups: ["bitnami.com"]
  resources: ["sealedsecrets"]
  verbs: ["create", "get", "list"]
- apiGroups: [""]
  resources: ["services"]
  verbs: ["get"]
  resourceNames: ["sealed-secrets-controller"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: sealed-secrets-ci
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: sealed-secrets-ci-creator
subjects:
- kind: ServiceAccount
  name: sealed-secrets-ci
  namespace: ci-cd
```

Apply:
```bash
kubectl apply -f ci-service-account.yaml

# Get token (Kubernetes 1.24+)
kubectl create token sealed-secrets-ci -n ci-cd --duration=8760h
```

### Using Service Account in kubeseal

```bash
# Get token
TOKEN=$(kubectl create token sealed-secrets-ci -n ci-cd)

# Use with kubeseal
echo -n mysecret | kubeseal \
  --controller-namespace=kube-system \
  --token="$TOKEN" \
  --format=yaml
```

---

## Namespace-Scoped vs Cluster-Wide

### When to Use Role (Namespace-Scoped)

Use `Role` + `RoleBinding` when:
- Users should only access secrets in specific namespaces
- Following principle of least privilege
- Team-based access (dev team → dev namespace)

Example:
```yaml
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: sealed-secrets-creator
  namespace: development  # Only in development namespace
rules:
- apiGroups: ["bitnami.com"]
  resources: ["sealedsecrets"]
  verbs: ["create", "get", "list", "delete"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: dev-team-sealed-secrets
  namespace: development
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: sealed-secrets-creator
subjects:
- kind: Group
  name: developers
  apiGroup: rbac.authorization.k8s.io
```

### When to Use ClusterRole

Use `ClusterRole` + `ClusterRoleBinding` when:
- Users need access across all namespaces
- Platform/SRE team
- Shared services

Example: See [RBAC Permissions Guide](../user-guide/rbac-permissions.md)

### Combining Both

User can have:
- ClusterRole for viewing (read all namespaces)
- Role for creating (write only to specific namespace)

```yaml
# ClusterRole: View all SealedSecrets
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: alice-viewer
roleRef:
  kind: ClusterRole
  name: sealed-secrets-viewer
subjects:
- kind: User
  name: alice

# Role: Create only in development
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: alice-creator
  namespace: development
roleRef:
  kind: Role
  name: sealed-secrets-creator
subjects:
- kind: User
  name: alice
```

---

## Security Best Practices

### 1. Principle of Least Privilege

Grant minimum permissions needed:

```yaml
# ✅ Good: Specific permissions
rules:
- apiGroups: ["bitnami.com"]
  resources: ["sealedsecrets"]
  verbs: ["get", "list"]  # Only read

# ❌ Bad: Wildcard permissions
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]  # Too permissive!
```

### 2. Use Groups, Not Individual Users

```yaml
# ✅ Good: Use groups
subjects:
- kind: Group
  name: developers
  apiGroup: rbac.authorization.k8s.io

# ❌ Bad: Individual users
subjects:
- kind: User
  name: alice
- kind: User
  name: bob
# Hard to maintain as team grows
```

### 3. Separate Read and Write

```yaml
# Viewer role: Read-only
- verbs: ["get", "list"]

# Creator role: Create new
- verbs: ["create"]

# Admin role: Full access
- verbs: ["get", "list", "create", "update", "patch", "delete"]
```

### 4. Limit Secret Access

```yaml
# ✅ Good: Only SealedSecrets
rules:
- apiGroups: ["bitnami.com"]
  resources: ["sealedsecrets"]
  verbs: ["get", "list", "create"]
# Cannot view unsealed Secrets

# ❌ Risky: Include Secret access
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list"]
# Can view all unsealed secrets!
```

### 5. Audit RBAC Changes

```bash
# List all ClusterRoleBindings for SealedSecrets
kubectl get clusterrolebindings -o json | \
  jq '.items[] | select(.roleRef.name | contains("sealed-secrets"))'

# Audit who has Secret access
kubectl get clusterrolebindings -o json | \
  jq '.items[] | select(.roleRef.name | contains("admin") or contains("edit"))'
```

### 6. Regular Access Reviews

```bash
# Who can create SealedSecrets?
kubectl get rolebindings,clusterrolebindings -A -o json | \
  jq -r '.items[] | select(.roleRef.name | contains("sealed-secrets")) |
    "\(.metadata.name): \(.subjects[].name)"'

# Review quarterly and remove unnecessary permissions
```

---

## Troubleshooting Commands

```bash
# Quick permission check
kubectl auth can-i create sealedsecrets.bitnami.com && echo "✅ Can create" || echo "❌ Cannot create"

# List all sealed-secrets-related roles
kubectl get clusterroles,roles -A | grep sealed-secrets

# Describe specific role
kubectl describe clusterrole sealed-secrets-viewer

# View who has a role
kubectl get clusterrolebindings sealed-secrets-viewer -o yaml

# Check if role exists
kubectl get clusterrole sealed-secrets-creator &>/dev/null && echo "✅ Exists" || echo "❌ Not found"
```

---

## Getting Help

If permission issues persist:

1. **Verify cluster-admin access**: Some fixes require cluster-admin
   ```bash
   kubectl auth can-i '*' '*' --all-namespaces
   ```

2. **Check with cluster administrator**: They may need to apply RBAC

3. **Review Kubernetes RBAC docs**:
   - [RBAC Authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
   - [RBAC Good Practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/)

4. **Report plugin issues**:
   - [GitHub Issues](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/issues)

## See Also

- [RBAC Permissions Guide](../user-guide/rbac-permissions.md) - Complete RBAC documentation
- [Common Errors](common-errors.md) - General troubleshooting
- [Security Hardening](../deployment/security-hardening.md) - Production security
