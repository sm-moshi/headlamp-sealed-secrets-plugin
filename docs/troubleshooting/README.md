# Troubleshooting Guide

Common issues and solutions for the Headlamp Sealed Secrets plugin.

## Quick Links

- **[Common Errors](common-errors.md)** - Frequent error messages and fixes
- **[Controller Issues](controller-issues.md)** - Connection and deployment problems
- **[Encryption Failures](encryption-failures.md)** - Debugging encryption errors
- **[Permission Errors](permission-errors.md)** - RBAC troubleshooting

## Quick Diagnosis

### Plugin Not Visible in Headlamp

**Symptoms**: "Sealed Secrets" not showing in sidebar

**Quick Checks**:
```bash
# 1. Check plugin directory exists
ls -la ~/Library/Application\ Support/Headlamp/plugins/headlamp-sealed-secrets/

# 2. Check plugin files are present
ls ~/Library/Application\ Support/Headlamp/plugins/headlamp-sealed-secrets/dist/

# 3. Check Headlamp version
headlamp --version  # Should be v0.13.0+
```

**Solution**: See [Installation Guide](../getting-started/installation.md)

---

### Controller Not Found

**Symptoms**: "Failed to fetch controller certificate" or health status shows unhealthy

**Quick Checks**:
```bash
# Check controller is running
kubectl get pods -n kube-system -l name=sealed-secrets-controller

# Check service exists
kubectl get svc -n kube-system sealed-secrets-controller
```

**Solution**: See [Controller Issues](controller-issues.md)

---

### Permission Denied

**Symptoms**: "Forbidden" errors, missing buttons in UI

**Quick Checks**:
```bash
# Test your permissions
kubectl auth can-i list sealedsecrets.bitnami.com
kubectl auth can-i create sealedsecrets.bitnami.com
kubectl auth can-i get secrets
```

**Solution**: See [Permission Errors](permission-errors.md)

---

### Encryption Fails

**Symptoms**: "Encryption failed" when creating sealed secrets

**Quick Checks**:
```bash
# Check certificate is valid
kubectl get secret -n kube-system sealed-secrets-key -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -dates
```

**Solution**: See [Encryption Failures](encryption-failures.md)

---

## Getting Help

If you can't find a solution:

1. **Check the logs**:
   ```bash
   # Headlamp logs (depends on installation method)
   # For desktop app:
   tail -f ~/Library/Logs/Headlamp/main.log

   # Controller logs
   kubectl logs -n kube-system -l name=sealed-secrets-controller
   ```

2. **Enable browser console**:
   - View → Toggle Developer Tools
   - Look for errors in Console tab

3. **Search GitHub Issues**:
   - [Open Issues](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/issues)
   - [Closed Issues](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/issues?q=is%3Aissue+is%3Aclosed)

4. **Ask for Help**:
   - [GitHub Discussions](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/discussions)
   - [Create New Issue](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/issues/new)

## Reporting Bugs

When reporting an issue, include:

- **Plugin version**: Check Settings page or `package.json`
- **Headlamp version**: `headlamp --version`
- **Kubernetes version**: `kubectl version --short`
- **Controller version**: `kubectl get deployment -n kube-system sealed-secrets-controller -o jsonpath='{.spec.template.spec.containers[0].image}'`
- **Error messages**: Full error text from UI or console
- **Browser console logs**: Copy from Developer Tools
- **Steps to reproduce**: What you did before the error

## Common Patterns

### Error Message Format

Plugin errors typically follow this format:

```
[Context]: Specific error message
```

Examples:
- `Failed to fetch certificate: Network error`
- `Validation failed: Name must be a valid DNS-1123 subdomain`
- `Encryption failed: Invalid public key`

### Health Check Failures

The plugin checks controller health every 30 seconds. If health checks fail:

1. **Transient failures**: Wait 1-2 minutes for retry
2. **Persistent failures**: Check controller status
3. **Network issues**: Verify cluster connectivity

### RBAC Failures

Missing permissions hide UI elements:

| Permission Missing | UI Impact |
|-------------------|-----------|
| `list sealedsecrets` | No sealed secrets shown |
| `create sealedsecrets` | "Create" button hidden |
| `delete sealedsecrets` | "Delete" button disabled |
| `get secrets` | "Decrypt" button hidden |

## Next Steps

- **[Common Errors](common-errors.md)** - Start with most frequent issues
- **[User Guide](../user-guide/)** - Review feature documentation
- **[GitHub Issues](https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/issues)** - Search existing issues
