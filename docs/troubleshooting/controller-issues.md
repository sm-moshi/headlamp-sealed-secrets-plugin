# Controller Issues

Troubleshooting Sealed Secrets controller problems.

## Table of Contents

- [Controller Not Found](#controller-not-found)
- [Controller Not Starting](#controller-not-starting)
- [Controller Crashing](#controller-crashing)
- [Certificate Issues](#certificate-issues)
- [Performance Issues](#performance-issues)
- [Upgrade Issues](#upgrade-issues)

---

## Controller Not Found

### Symptom

Plugin shows "Controller not found" or health status is unhealthy.

### Diagnosis

```bash
# Check if controller exists
kubectl get deployment -n kube-system sealed-secrets-controller

# Check service
kubectl get svc -n kube-system sealed-secrets-controller

# Check pods
kubectl get pods -n kube-system -l name=sealed-secrets-controller
```

### Solutions

#### Controller Not Installed

Install the controller:

```bash
# Install latest version
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Wait for deployment
kubectl wait --for=condition=available deployment/sealed-secrets-controller -n kube-system --timeout=60s

# Verify
kubectl get pods -n kube-system -l name=sealed-secrets-controller
```

#### Wrong Namespace

If controller is in different namespace:

```bash
# Find controller
kubectl get deployments --all-namespaces -l name=sealed-secrets-controller

# Update plugin settings (in Headlamp UI):
# Settings → Sealed Secrets → Controller Namespace: <your-namespace>
```

#### Custom Service Name

If service has custom name:

```bash
# Find service
kubectl get svc --all-namespaces -l name=sealed-secrets-controller

# Update plugin settings (in Headlamp UI):
# Settings → Sealed Secrets → Service Name: <your-service-name>
```

---

## Controller Not Starting

### Symptom

Controller pod shows `Pending`, `ContainerCreating`, or `ImagePullBackOff`.

### Diagnosis

```bash
# Check pod status
kubectl get pods -n kube-system -l name=sealed-secrets-controller

# Get detailed status
kubectl describe pod -n kube-system -l name=sealed-secrets-controller

# Check events
kubectl get events -n kube-system --sort-by='.lastTimestamp' | grep sealed-secrets
```

### Common Causes

#### ImagePullBackOff

**Cause**: Cannot pull container image

**Check**:
```bash
kubectl describe pod -n kube-system -l name=sealed-secrets-controller | grep -A 5 "Events:"
```

**Solutions**:

**Private registry authentication**:
```bash
# Create image pull secret
kubectl create secret docker-registry regcred \
  --docker-server=<registry> \
  --docker-username=<username> \
  --docker-password=<password> \
  -n kube-system

# Update deployment
kubectl patch deployment sealed-secrets-controller -n kube-system -p '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"regcred"}]}}}}'
```

**Network issues**: Check cluster can reach `quay.io` or your registry.

**Wrong image tag**: Verify image exists:
```bash
kubectl get deployment -n kube-system sealed-secrets-controller -o jsonpath='{.spec.template.spec.containers[0].image}'
```

#### Insufficient Resources

**Cause**: Node doesn't have enough CPU/memory

**Check**:
```bash
kubectl describe pod -n kube-system -l name=sealed-secrets-controller | grep -A 5 "FailedScheduling"
```

**Solution**: Lower resource requests or add nodes:
```bash
# Lower requests (not recommended for production)
kubectl patch deployment sealed-secrets-controller -n kube-system -p '
{
  "spec": {
    "template": {
      "spec": {
        "containers": [{
          "name": "sealed-secrets-controller",
          "resources": {
            "requests": {
              "cpu": "50m",
              "memory": "64Mi"
            }
          }
        }]
      }
    }
  }
}'
```

#### PVC Issues

**Cause**: PersistentVolumeClaim not bound (if using custom storage)

**Check**:
```bash
kubectl get pvc -n kube-system
```

**Solution**: Ensure StorageClass exists and volumes are available.

---

## Controller Crashing

### Symptom

Controller pod shows `CrashLoopBackOff` or restarts frequently.

### Diagnosis

```bash
# Check restart count
kubectl get pods -n kube-system -l name=sealed-secrets-controller

# View recent logs
kubectl logs -n kube-system -l name=sealed-secrets-controller --tail=100

# View previous crash logs
kubectl logs -n kube-system -l name=sealed-secrets-controller --previous
```

### Common Causes

#### Invalid Sealing Key

**Error in logs**:
```
Error loading sealed secrets key: invalid PEM data
```

**Solution**:
```bash
# Backup existing key (if valid)
kubectl get secret -n kube-system sealed-secrets-key -o yaml > backup.yaml

# Delete corrupted key
kubectl delete secret -n kube-system sealed-secrets-key

# Restart controller to generate new key
kubectl rollout restart deployment -n kube-system sealed-secrets-controller

# Wait for new key
kubectl wait --for=condition=ready pod -n kube-system -l name=sealed-secrets-controller --timeout=60s
```

**Warning**: This generates a new key. Existing SealedSecrets will still work but cannot be modified.

#### Certificate Conflict

**Error in logs**:
```
Multiple certificates found, unable to determine active key
```

**Solution**:
```bash
# List all sealing keys
kubectl get secrets -n kube-system -l sealedsecrets.bitnami.com/sealed-secrets-key

# Remove old keys (keep backup!)
kubectl delete secret -n kube-system <old-key-name>
```

#### Memory Issues

**Error in logs**:
```
OOMKilled
```

**Check**:
```bash
kubectl describe pod -n kube-system -l name=sealed-secrets-controller | grep -A 5 "Last State"
```

**Solution**: Increase memory limits:
```bash
kubectl patch deployment sealed-secrets-controller -n kube-system -p '
{
  "spec": {
    "template": {
      "spec": {
        "containers": [{
          "name": "sealed-secrets-controller",
          "resources": {
            "limits": {
              "memory": "512Mi"
            },
            "requests": {
              "memory": "256Mi"
            }
          }
        }]
      }
    }
  }
}'
```

#### RBAC Issues

**Error in logs**:
```
Forbidden: cannot list resource "secrets" in API group ""
```

**Check**:
```bash
kubectl get clusterrole sealed-secrets-controller
kubectl get clusterrolebinding sealed-secrets-controller
```

**Solution**: Reapply controller manifest:
```bash
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml
```

---

## Certificate Issues

### Expired Certificate

**Symptom**: "Certificate expired" error when encrypting

**Check**:
```bash
# Get certificate expiry
kubectl get secret -n kube-system sealed-secrets-key -o jsonpath='{.data.tls\.crt}' | \
  base64 -d | \
  openssl x509 -noout -enddate
```

**Solution**: Rotate keys (see [Secret Rotation Tutorial](../tutorials/secret-rotation.md))

```bash
# Generate new key (keeps old for decryption)
kubectl annotate secret -n kube-system sealed-secrets-key \
  sealedsecrets.bitnami.com/sealed-secrets-key-rotation=rotate

# Or delete and recreate
kubectl delete secret -n kube-system sealed-secrets-key
kubectl rollout restart deployment -n kube-system sealed-secrets-controller
```

### Multiple Certificates

**Symptom**: Inconsistent encryption results

**Check**:
```bash
# List all certificates
kubectl get secrets -n kube-system -l sealedsecrets.bitnami.com/sealed-secrets-key

# View details
kubectl get secrets -n kube-system -l sealedsecrets.bitnami.com/sealed-secrets-key -o yaml
```

**Solution**: Controller uses newest valid certificate. This is normal after key rotation.

To clean up old keys (after backup):
```bash
# Keep newest 2 keys, delete older ones
kubectl delete secret -n kube-system <old-key-name>
```

### Certificate Not Found

**Symptom**: "No valid certificate found"

**Check**:
```bash
kubectl get secret -n kube-system sealed-secrets-key
```

**Solution**: Restart controller to generate:
```bash
kubectl rollout restart deployment -n kube-system sealed-secrets-controller
kubectl wait --for=condition=ready pod -n kube-system -l name=sealed-secrets-controller --timeout=60s
```

---

## Performance Issues

### Slow Secret Unsealing

**Symptom**: SealedSecrets take minutes to unseal

**Diagnosis**:
```bash
# Check controller CPU/memory usage
kubectl top pod -n kube-system -l name=sealed-secrets-controller

# Check events
kubectl get events -n kube-system --sort-by='.lastTimestamp' | grep sealed-secrets
```

**Solutions**:

#### Increase Resources

```bash
kubectl patch deployment sealed-secrets-controller -n kube-system -p '
{
  "spec": {
    "template": {
      "spec": {
        "containers": [{
          "name": "sealed-secrets-controller",
          "resources": {
            "limits": {
              "cpu": "1000m",
              "memory": "512Mi"
            },
            "requests": {
              "cpu": "500m",
              "memory": "256Mi"
            }
          }
        }]
      }
    }
  }
}'
```

#### Check Pod Placement

```bash
# Get node
kubectl get pod -n kube-system -l name=sealed-secrets-controller -o wide

# Check node load
kubectl top node <node-name>
```

Consider node affinity if node is overloaded.

### Health Checks Timing Out

**Symptom**: Plugin shows controller as unhealthy despite it working

**Cause**: Slow network or overloaded controller

**Solution**: Increase health check timeout in plugin settings (Headlamp UI):
- Settings → Sealed Secrets → Health Check Timeout: 60s (default: 30s)

---

## Upgrade Issues

### Upgrade Failed

**Symptom**: Controller won't upgrade or crashes after upgrade

**Diagnosis**:
```bash
# Check deployment history
kubectl rollout history deployment -n kube-system sealed-secrets-controller

# Check current image
kubectl get deployment -n kube-system sealed-secrets-controller -o jsonpath='{.spec.template.spec.containers[0].image}'
```

**Solution**: Rollback and retry:
```bash
# Rollback to previous version
kubectl rollout undo deployment -n kube-system sealed-secrets-controller

# Wait for rollback
kubectl rollout status deployment -n kube-system sealed-secrets-controller

# Check logs
kubectl logs -n kube-system -l name=sealed-secrets-controller
```

### Version Compatibility

**Check compatibility**:

| Plugin Version | Controller Version | Compatible |
|---------------|-------------------|------------|
| v0.2.0 | v0.24.0+ | ✅ Yes |
| v0.2.0 | v0.20.0 - v0.23.x | ⚠️ Limited |
| v0.2.0 | < v0.20.0 | ❌ No |

**Upgrade controller**:
```bash
# Backup sealing keys first!
kubectl get secret -n kube-system sealed-secrets-key -o yaml > sealed-secrets-backup.yaml

# Upgrade
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Verify
kubectl rollout status deployment -n kube-system sealed-secrets-controller
```

### Lost Sealing Keys After Upgrade

**Symptom**: Existing SealedSecrets won't unseal after upgrade

**Cause**: Sealing keys deleted during upgrade

**Recovery**:

If you have backup:
```bash
# Restore keys
kubectl apply -f sealed-secrets-backup.yaml

# Restart controller
kubectl rollout restart deployment -n kube-system sealed-secrets-controller
```

If no backup, keys are **permanently lost**. You must:
1. Delete all SealedSecrets
2. Recreate them with new keys
3. See [Disaster Recovery Tutorial](../tutorials/disaster-recovery.md)

---

## Debugging Tools

### Enable Debug Logging

```bash
# Add debug flag to controller
kubectl patch deployment sealed-secrets-controller -n kube-system -p '
{
  "spec": {
    "template": {
      "spec": {
        "containers": [{
          "name": "sealed-secrets-controller",
          "args": ["--update-status", "--v=5"]
        }]
      }
    }
  }
}'

# View debug logs
kubectl logs -n kube-system -l name=sealed-secrets-controller -f
```

### Port-Forward for Testing

```bash
# Forward controller port locally
kubectl port-forward -n kube-system service/sealed-secrets-controller 8080:8080

# Test certificate endpoint
curl http://localhost:8080/v1/cert.pem

# Test health
curl http://localhost:8080/healthz
```

### Metrics

If Prometheus is installed:

```bash
# Enable metrics
kubectl patch deployment sealed-secrets-controller -n kube-system -p '
{
  "spec": {
    "template": {
      "spec": {
        "containers": [{
          "name": "sealed-secrets-controller",
          "args": ["--update-status", "--metrics-addr=:8081"]
        }]
      }
    }
  }
}'

# Access metrics
kubectl port-forward -n kube-system service/sealed-secrets-controller 8081:8081
curl http://localhost:8081/metrics
```

---

## Getting Help

If issues persist:

1. **Gather diagnostic info**:
   ```bash
   # Create diagnostic bundle
   kubectl get all -n kube-system -l name=sealed-secrets-controller -o yaml > controller-diagnostics.yaml
   kubectl logs -n kube-system -l name=sealed-secrets-controller --tail=500 > controller-logs.txt
   kubectl describe deployment -n kube-system sealed-secrets-controller > controller-describe.txt
   ```

2. **Check Sealed Secrets project**:
   - [GitHub Issues](https://github.com/bitnami-labs/sealed-secrets/issues)
   - [Documentation](https://github.com/bitnami-labs/sealed-secrets#sealed-secrets)

3. **Plugin-specific issues**:
   - [Plugin Issues](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/issues)
   - Include diagnostic bundle when reporting

## See Also

- [Common Errors](common-errors.md) - General error messages
- [Encryption Failures](encryption-failures.md) - Encryption-specific issues
- [Disaster Recovery](../tutorials/disaster-recovery.md) - Backup and restore
- [Secret Rotation](../tutorials/secret-rotation.md) - Key rotation procedures
