/**
 * Settings Page
 *
 * Configuration page for the Sealed Secrets plugin
 */

import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Alert, Box, Button, Divider, TextField, Typography } from '@mui/material';
import React from 'react';
import { getPluginConfig, savePluginConfig } from '../lib/controller';
import { PluginConfig } from '../types';
import { ControllerStatus } from './ControllerStatus';
import { VersionWarning } from './VersionWarning';

interface PluginSettingsProps {
  data?: { [key: string]: string | number | boolean };
  onDataChange?: (data: { [key: string]: string | number | boolean }) => void;
}

/**
 * Settings page component
 *
 * NOTE: Do NOT use useSnackbar() here — registerPluginSettings renders this
 * component outside the notistack SnackbarProvider, causing React error #310.
 * Use local state for save feedback instead.
 */
export function SettingsPage(props: PluginSettingsProps) {
  const { data, onDataChange } = props;
  const storedConfig = getPluginConfig();
  const [config, setConfig] = React.useState<PluginConfig>({
    controllerName: (data?.controllerName as string) ?? storedConfig.controllerName,
    controllerNamespace: (data?.controllerNamespace as string) ?? storedConfig.controllerNamespace,
    controllerPort: (data?.controllerPort as number) ?? storedConfig.controllerPort,
  });
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saved'>('idle');

  const handleSave = () => {
    savePluginConfig(config);
    onDataChange?.(config as unknown as { [key: string]: string | number | boolean });
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handleReset = () => {
    const defaultConfig: PluginConfig = {
      controllerName: 'sealed-secrets-controller',
      controllerNamespace: 'kube-system',
      controllerPort: 8080,
    };
    setConfig(defaultConfig);
  };

  return (
    <SectionBox title="Sealed Secrets Plugin Settings">
      <Box p={3}>
        <Typography variant="body1" paragraph id="settings-description">
          Configure the connection to your Sealed Secrets controller. These settings are stored in
          your browser's local storage.
        </Typography>

        {/* API Version Detection */}
        <VersionWarning autoDetect showDetails />

        {/* Controller Health Status */}
        <Box
          mb={3}
          p={2}
          bgcolor="background.paper"
          borderRadius={1}
          border={1}
          borderColor="divider"
          role="status"
          aria-live="polite"
        >
          <Typography variant="subtitle2" gutterBottom id="controller-status-label">
            Controller Status
          </Typography>
          <ControllerStatus autoRefresh showDetails />
        </Box>

        <Divider sx={{ mb: 3 }} role="separator" />

        <form aria-labelledby="settings-form-title">
          <Typography variant="h6" id="settings-form-title" sx={{ mb: 2 }} className="sr-only">
            Controller Configuration
          </Typography>

          <TextField
            fullWidth
            label="Controller Name"
            value={config.controllerName}
            onChange={e => {
              const newConfig = { ...config, controllerName: e.target.value };
              setConfig(newConfig);
              onDataChange?.(newConfig as unknown as { [key: string]: string | number | boolean });
            }}
            margin="normal"
            helperText="Name of the sealed-secrets-controller deployment/service"
            inputProps={{
              'aria-label': 'Controller name',
              'aria-describedby': 'controller-name-help',
            }}
            FormHelperTextProps={{
              id: 'controller-name-help',
            }}
          />

          <TextField
            fullWidth
            label="Controller Namespace"
            value={config.controllerNamespace}
            onChange={e => {
              const newConfig = { ...config, controllerNamespace: e.target.value };
              setConfig(newConfig);
              onDataChange?.(newConfig as unknown as { [key: string]: string | number | boolean });
            }}
            margin="normal"
            helperText="Namespace where the controller is installed"
            inputProps={{
              'aria-label': 'Controller namespace',
              'aria-describedby': 'controller-namespace-help',
            }}
            FormHelperTextProps={{
              id: 'controller-namespace-help',
            }}
          />

          <TextField
            fullWidth
            label="Controller Port"
            type="number"
            value={config.controllerPort}
            onChange={e => {
              const newConfig = { ...config, controllerPort: parseInt(e.target.value, 10) };
              setConfig(newConfig);
              onDataChange?.(newConfig as unknown as { [key: string]: string | number | boolean });
            }}
            margin="normal"
            helperText="HTTP port of the controller service"
            inputProps={{
              'aria-label': 'Controller port',
              'aria-describedby': 'controller-port-help',
              min: 1,
              max: 65535,
            }}
            FormHelperTextProps={{
              id: 'controller-port-help',
            }}
          />

          <Box mt={3} display="flex" gap={2} alignItems="center" role="group" aria-label="Settings actions">
            <Button
              variant="contained"
              onClick={handleSave}
              aria-label="Save configuration settings"
            >
              Save Settings
            </Button>
            <Button
              variant="outlined"
              onClick={handleReset}
              aria-label="Reset settings to default values"
            >
              Reset to Defaults
            </Button>
            {saveStatus === 'saved' && (
              <Alert severity="success" sx={{ py: 0 }}>
                Settings saved successfully
              </Alert>
            )}
          </Box>
        </form>

        <Box mt={4} p={2} bgcolor="info.light" borderRadius={1} role="note">
          <Typography variant="h6" gutterBottom>
            Default Values
          </Typography>
          <Typography variant="body2" component="dl">
            <dt style={{ display: 'inline', fontWeight: 'bold' }}>Controller Name:</dt>{' '}
            <dd style={{ display: 'inline', margin: 0 }}>sealed-secrets-controller</dd>
            <br />
            <dt style={{ display: 'inline', fontWeight: 'bold' }}>Controller Namespace:</dt>{' '}
            <dd style={{ display: 'inline', margin: 0 }}>kube-system</dd>
            <br />
            <dt style={{ display: 'inline', fontWeight: 'bold' }}>Controller Port:</dt>{' '}
            <dd style={{ display: 'inline', margin: 0 }}>8080</dd>
          </Typography>
        </Box>
      </Box>
    </SectionBox>
  );
}
