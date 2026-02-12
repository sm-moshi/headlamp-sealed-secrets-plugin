# Headlamp Sealed Secrets Plugin

A comprehensive [Headlamp](https://headlamp.dev) plugin for managing [Bitnami Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) in Kubernetes clusters.

## Features

### 🔐 Client-Side Encryption
- Encrypt secrets entirely in your browser using the controller's public key
- Never send plaintext values over the network
- Support for all three scoping modes: strict, namespace-wide, and cluster-wide

### 📋 Resource Management
- **List View**: Browse all SealedSecrets across namespaces with filtering
- **Detail View**: Inspect encrypted data, templates, and resulting Secrets
- **Create**: Easy-to-use dialog for creating new SealedSecrets
- **Decrypt**: View decrypted values (requires RBAC permissions to read Secrets)
- **Re-encrypt**: Rotate SealedSecrets with the current active key

### 🔑 Key Management
- View all sealing key pairs (active and compromised)
- Download the public certificate for use with `kubeseal` CLI
- Monitor certificate validity periods

### 🔗 Integration
- Seamlessly integrates with Headlamp's Secret detail view
- Shows parent SealedSecret info on Secret pages
- Follows Headlamp's design patterns and UI components

## Installation

### Prerequisites

1. **Headlamp** installed and running (v0.13.0 or later)
2. **Sealed Secrets controller** installed on your Kubernetes cluster:
   ```bash
   kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml
   ```

### Install the Plugin

#### Option 1: From NPM (when published)
```bash
npm install -g headlamp-sealed-secrets
```

#### Option 2: Build from Source
```bash
git clone https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin
cd headlamp-sealed-secrets
npm install
npm run build
```

Then copy the `dist` folder to Headlamp's plugins directory:
- **Linux**: `~/.config/Headlamp/plugins/headlamp-sealed-secrets/`
- **macOS**: `~/Library/Application Support/Headlamp/plugins/headlamp-sealed-secrets/`
- **Windows**: `%APPDATA%\Headlamp\plugins\headlamp-sealed-secrets\`

#### Option 3: Development Mode
```bash
npm start
```
This starts a development server with hot reload. Point Headlamp to the plugin directory.

## Usage

### Creating a SealedSecret

1. Navigate to **Sealed Secrets** > **All Sealed Secrets** in the sidebar
2. Click **Create Sealed Secret**
3. Fill in:
   - Secret name
   - Namespace
   - Scope (strict/namespace-wide/cluster-wide)
   - Key-value pairs (values are masked by default)
4. Click **Create**

The plugin will:
- Fetch the controller's public certificate
- Encrypt all values client-side in your browser
- Apply the SealedSecret to the cluster
- The controller will create the corresponding Kubernetes Secret

### Viewing SealedSecrets

The list view shows:
- Name and namespace
- Number of encrypted keys
- Encryption scope
- Sync status (whether the Secret was successfully created)
- Age

Click on any SealedSecret to view details including:
- Encrypted data
- Template metadata
- Resulting Secret (with link to Secret detail view)
- Status conditions

### Decrypting Values

On the detail view, click **Decrypt** next to any encrypted key to view its plaintext value.

**Requirements:**
- The SealedSecret must be synced (controller has created the Secret)
- You must have RBAC permissions to read Secrets in that namespace

**Security:** The decrypted value auto-hides after 30 seconds.

### Managing Sealing Keys

Navigate to **Sealed Secrets** > **Sealing Keys** to:
- View all sealing key pairs
- See which key is active
- Check certificate validity periods
- Download the public certificate

### Settings

Navigate to **Sealed Secrets** > **Settings** to configure:
- Controller name (default: `sealed-secrets-controller`)
- Controller namespace (default: `kube-system`)
- Controller port (default: `8080`)

Settings are stored in your browser's local storage.

## Architecture

### Client-Side Encryption

The plugin implements the same encryption algorithm as `kubeseal`:

1. Fetch the controller's public certificate via Kubernetes API proxy
2. Parse the RSA public key from the PEM certificate
3. For each secret value:
   - Generate a random AES-256-GCM session key
   - Encrypt the value with the session key
   - Encrypt the session key with RSA-OAEP (SHA-256)
   - Construct the sealed-secrets payload format
   - Base64-encode the result

**Security note:** All encryption happens in the browser. Plaintext values never leave your machine.

### Components

```
src/
├── index.tsx                    # Plugin registration
├── types.ts                     # TypeScript interfaces
├── components/
│   ├── SealedSecretList.tsx     # List view
│   ├── SealedSecretDetail.tsx   # Detail view
│   ├── EncryptDialog.tsx        # Create dialog
│   ├── DecryptDialog.tsx        # Decrypt modal
│   ├── SealingKeysView.tsx      # Key management
│   ├── SettingsPage.tsx         # Configuration
│   └── SecretDetailsSection.tsx # Secret integration
└── lib/
    ├── SealedSecretCRD.ts       # CRD class
    ├── crypto.ts                # Encryption logic
    └── controller.ts            # Controller API
```

### Dependencies

- **node-forge**: RSA and AES cryptography
- **@kinvolk/headlamp-plugin**: Headlamp plugin SDK
- **React**, **Material-UI**: Provided by Headlamp at runtime

## Development

```bash
# Install dependencies
npm install

# Type check
npm run tsc

# Lint
npm run lint

# Format code
npm run format

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Troubleshooting

### "SealedSecrets CRD not found"
The Sealed Secrets controller is not installed on your cluster. Install it:
```bash
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml
```

### "Failed to fetch certificate"
Check:
- Controller is running: `kubectl get pods -n kube-system -l name=sealed-secrets-controller`
- Settings match your controller deployment (name, namespace, port)
- You have network connectivity to the cluster

### "Secret not found" when decrypting
The SealedSecret hasn't been processed yet, or you don't have RBAC permissions to read Secrets. Check:
- SealedSecret status shows "Synced"
- Controller logs: `kubectl logs -n kube-system -l name=sealed-secrets-controller`
- Your RBAC permissions: `kubectl auth can-i get secrets -n <namespace>`

### Re-encrypt fails
The controller's `/v1/rotate` endpoint may not be exposed. This is typically only needed when rotating keys.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run `npm run lint` and `npm run tsc`
5. Submit a pull request

## License

Apache License 2.0 - See LICENSE file for details.

## Related Projects

- [Headlamp](https://headlamp.dev) - The Kubernetes UI
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) - The Sealed Secrets controller
- [kubeseal](https://github.com/bitnami-labs/sealed-secrets#kubeseal) - The CLI tool for Sealed Secrets

## Credits

Built with ❤️ for the Kubernetes community.

- Uses the [Headlamp Plugin SDK](https://headlamp.dev/docs/latest/development/plugins/)
- Follows patterns from official Headlamp plugins (Flux, cert-manager)
- Encryption algorithm compatible with [kubeseal](https://github.com/bitnami-labs/sealed-secrets)
