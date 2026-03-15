#!/bin/bash
#
# Install Headlamp Sealed Secrets Plugin
#
# This script builds and installs the plugin to your local Headlamp installation.
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Headlamp Sealed Secrets Plugin Installer${NC}"
echo "=========================================="
echo

# Detect OS and set plugin directory
if [[ "$OSTYPE" == "darwin"* ]]; then
    PLUGIN_DIR="$HOME/Library/Application Support/Headlamp/plugins/headlamp-sealed-secrets"
    echo -e "${YELLOW}Detected: macOS${NC}"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLUGIN_DIR="$HOME/.config/Headlamp/plugins/headlamp-sealed-secrets"
    echo -e "${YELLOW}Detected: Linux${NC}"
else
    echo -e "${RED}Unsupported OS: $OSTYPE${NC}"
    echo "For Windows, please see HEADLAMP_INSTALLATION.md"
    exit 1
fi

echo "Plugin will be installed to: $PLUGIN_DIR"
echo

# Check if node/npm are available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    echo "Please install Node.js and npm first"
    exit 1
fi

# Navigate to plugin directory
cd "$(dirname "$0")"

echo -e "${GREEN}Step 1: Installing dependencies...${NC}"
npm install

echo
echo -e "${GREEN}Step 2: Building plugin...${NC}"
npm run build

echo
echo -e "${GREEN}Step 3: Creating plugin directory...${NC}"
mkdir -p "$PLUGIN_DIR"

echo
echo -e "${GREEN}Step 4: Copying plugin files...${NC}"
cp -v dist/main.js "$PLUGIN_DIR/"
cp -v package.json "$PLUGIN_DIR/"
cp -v README.md "$PLUGIN_DIR/" 2>/dev/null || true
cp -v LICENSE "$PLUGIN_DIR/" 2>/dev/null || true

echo
echo -e "${GREEN}✓ Installation complete!${NC}"
echo
echo "Plugin installed to: $PLUGIN_DIR"
echo
echo "Next steps:"
echo "1. Restart Headlamp desktop application"
echo "2. Open Headlamp and connect to your cluster"
echo "3. Look for 'Sealed Secrets' in the sidebar"
echo
echo "To verify sealed-secrets controller is installed:"
echo "  kubectl get pods -n kube-system -l name=sealed-secrets-controller"
echo
echo "To install sealed-secrets controller (if not present):"
echo "  kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/${SEALED_SECRETS_VERSION:-v0.24.0}/controller.yaml"
echo
