# Installation Guide

Complete guide for installing the Headlamp Sealed Secrets plugin.

## Prerequisites

Before installing the plugin, ensure you have:

1. **Headlamp v0.13.0 or later**
   - Desktop app, server mode, or Kubernetes deployment

2. **Sealed Secrets Controller** installed in your cluster:
   ```bash
   kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml
   ```

3. **kubectl access** to your Kubernetes cluster with permissions for:
   - SealedSecret resources (list, get, create)
   - Service resources (get)
   - Namespace resources (list)

## Quick Install

### From GitHub Release (Recommended)

Download and extract the latest release:

**macOS:**
```bash
curl -LO https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/releases/download/v0.2.4/headlamp-sealed-secrets-0.2.4.tar.gz
tar -xzf headlamp-sealed-secrets-0.2.4.tar.gz -C ~/Library/Application\ Support/Headlamp/plugins/
```

**Linux:**
```bash
curl -LO https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/releases/download/v0.2.4/headlamp-sealed-secrets-0.2.4.tar.gz
tar -xzf headlamp-sealed-secrets-0.2.4.tar.gz -C ~/.config/Headlamp/plugins/
```

**Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/releases/download/v0.2.4/headlamp-sealed-secrets-0.2.4.tar.gz -OutFile headlamp-sealed-secrets-0.2.4.tar.gz
# Extract to %APPDATA%\Headlamp\plugins\
```

Then **restart Headlamp**.

### Using Install Script (macOS/Linux)

```bash
git clone https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin
cd headlamp-sealed-secrets-plugin
./install-plugin.sh
```

The script will:
- Install dependencies
- Build the plugin
- Copy files to the correct location
- Provide next steps

## Installation Methods

### Method 1: Local Build (Development)

For local development or testing:

1. **Clone and build**:
   ```bash
   git clone https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin
   cd headlamp-sealed-secrets-plugin/headlamp-sealed-secrets
   npm install
   npm run build
   ```

2. **Copy to plugins directory**:

   **macOS:**
   ```bash
   mkdir -p ~/Library/Application\ Support/Headlamp/plugins/headlamp-sealed-secrets
   cp dist/main.js package.json ~/Library/Application\ Support/Headlamp/plugins/headlamp-sealed-secrets/
   ```

   **Linux:**
   ```bash
   mkdir -p ~/.config/Headlamp/plugins/headlamp-sealed-secrets
   cp dist/main.js package.json ~/.config/Headlamp/plugins/headlamp-sealed-secrets/
   ```

   **Windows:**
   ```powershell
   New-Item -ItemType Directory -Force -Path $env:APPDATA\Headlamp\plugins\headlamp-sealed-secrets
   Copy-Item dist\main.js, package.json $env:APPDATA\Headlamp\plugins\headlamp-sealed-secrets\
   ```

3. **Restart Headlamp**

### Method 2: Headlamp Server Mode

For server deployments:

1. **Start Headlamp with plugins directory**:
   ```bash
   headlamp-server -plugins-dir=/var/lib/headlamp/plugins
   ```

2. **Install plugin to server**:
   ```bash
   mkdir -p /var/lib/headlamp/plugins/headlamp-sealed-secrets
   cp dist/main.js package.json /var/lib/headlamp/plugins/headlamp-sealed-secrets/
   ```

3. **Restart Headlamp server**

### Method 3: Kubernetes Deployment

For Headlamp running in Kubernetes:

1. **Create ConfigMap** with plugin files:
   ```bash
   kubectl create configmap headlamp-sealed-secrets-plugin \
     --from-file=main.js=dist/main.js \
     --from-file=package.json=package.json \
     -n headlamp
   ```

2. **Update Headlamp deployment**:
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: headlamp
     namespace: headlamp
   spec:
     template:
       spec:
         containers:
         - name: headlamp
           image: ghcr.io/headlamp-k8s/headlamp:latest
           volumeMounts:
           - name: sealed-secrets-plugin
             mountPath: /headlamp/plugins/headlamp-sealed-secrets
         volumes:
         - name: sealed-secrets-plugin
           configMap:
             name: headlamp-sealed-secrets-plugin
   ```

3. **Apply and restart**:
   ```bash
   kubectl apply -f headlamp-deployment.yaml
   kubectl rollout restart deployment/headlamp -n headlamp
   ```

## Verification

After installation, verify the plugin is working:

1. **Open Headlamp** and connect to your cluster

2. **Check sidebar** - Look for "Sealed Secrets" menu item

3. **Navigate to Sealed Secrets**:
   - You should see the SealedSecrets list view
   - Controller health status should be visible
   - "Create Sealed Secret" button should appear (if you have permissions)

4. **Check browser console** (if issues occur):
   - Open Developer Tools: View → Toggle Developer Tools
   - Look for plugin loading messages or errors

### Expected Features

After successful installation:

✅ **SealedSecrets List** - View all sealed secrets
✅ **Create Sealed Secret** - Encrypt and create secrets
✅ **Sealing Keys** - Download public certificates
✅ **Controller Health** - Monitor controller status
✅ **Settings** - Configure plugin behavior

## Troubleshooting

### Plugin Not Appearing

**Check plugin directory**:
```bash
# macOS
ls -la ~/Library/Application\ Support/Headlamp/plugins/headlamp-sealed-secrets/

# Linux
ls -la ~/.config/Headlamp/plugins/headlamp-sealed-secrets/

# Should show: main.js and package.json
```

**Verify Headlamp version**:
```bash
headlamp --version  # Should be >= v0.13.0
```

**Check browser console**:
1. Open Headlamp
2. View → Toggle Developer Tools
3. Look for errors in Console tab

### Controller Not Found

**Verify controller is running**:
```bash
kubectl get pods -n kube-system -l name=sealed-secrets-controller
# Should show: Running pod
```

**Check controller service**:
```bash
kubectl get svc -n kube-system sealed-secrets-controller
# Should exist with ClusterIP
```

**Reinstall if needed**:
```bash
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml
```

### Permission Errors

**Check RBAC permissions**:
```bash
# Can you list SealedSecrets?
kubectl get sealedsecrets --all-namespaces

# Can you get the service?
kubectl get svc -n kube-system sealed-secrets-controller
```

**Verify CRD exists**:
```bash
kubectl get crd sealedsecrets.bitnami.com
```

See [Troubleshooting Guide](../troubleshooting/README.md) for more detailed solutions.

## Updating the Plugin

To update to a newer version:

1. **Remove old version**:
   ```bash
   # macOS
   rm -rf ~/Library/Application\ Support/Headlamp/plugins/headlamp-sealed-secrets

   # Linux
   rm -rf ~/.config/Headlamp/plugins/headlamp-sealed-secrets
   ```

2. **Install new version** (follow Quick Install above)

3. **Restart Headlamp**

## Uninstallation

To completely remove the plugin:

**macOS:**
```bash
rm -rf ~/Library/Application\ Support/Headlamp/plugins/headlamp-sealed-secrets
```

**Linux:**
```bash
rm -rf ~/.config/Headlamp/plugins/headlamp-sealed-secrets
```

**Windows:**
```powershell
Remove-Item -Recurse -Force $env:APPDATA\Headlamp\plugins\headlamp-sealed-secrets
```

Then restart Headlamp.

## Next Steps

- [Quick Start Guide](quick-start.md) - Create your first sealed secret
- [User Guide](../user-guide/README.md) - Learn about all features
- [Development Guide](../development/workflow.md) - Contribute to the plugin

## Support

- **Issues**: [GitHub Issues](https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/issues)
- **Discussions**: [GitHub Discussions](https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/discussions)
- **Headlamp Docs**: [https://headlamp.dev/docs](https://headlamp.dev/docs)
- **Sealed Secrets**: [https://github.com/bitnami-labs/sealed-secrets](https://github.com/bitnami-labs/sealed-secrets)
