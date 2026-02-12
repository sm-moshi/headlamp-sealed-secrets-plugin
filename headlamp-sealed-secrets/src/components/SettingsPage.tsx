/**
 * Settings Page
 *
 * Configuration page for the Sealed Secrets plugin
 */

import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import React from 'react';
import { getPluginConfig, savePluginConfig } from '../lib/controller';
import { PluginConfig } from '../types';

/**
 * Settings page component
 */
export function SettingsPage() {
  const [config, setConfig] = React.useState<PluginConfig>(getPluginConfig());
  const { enqueueSnackbar } = useSnackbar();

  const handleSave = () => {
    savePluginConfig(config);
    enqueueSnackbar('Settings saved successfully', { variant: 'success' });
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
    <SectionBox
      title="Sealed Secrets Plugin Settings"
    >
      <Box p={3}>
        <Typography variant="body1" paragraph>
          Configure the connection to your Sealed Secrets controller. These settings are stored in
          your browser's local storage.
        </Typography>

        <TextField
          fullWidth
          label="Controller Name"
          value={config.controllerName}
          onChange={e => setConfig({ ...config, controllerName: e.target.value })}
          margin="normal"
          helperText="Name of the sealed-secrets-controller deployment/service"
        />

        <TextField
          fullWidth
          label="Controller Namespace"
          value={config.controllerNamespace}
          onChange={e => setConfig({ ...config, controllerNamespace: e.target.value })}
          margin="normal"
          helperText="Namespace where the controller is installed"
        />

        <TextField
          fullWidth
          label="Controller Port"
          type="number"
          value={config.controllerPort}
          onChange={e => setConfig({ ...config, controllerPort: parseInt(e.target.value, 10) })}
          margin="normal"
          helperText="HTTP port of the controller service"
        />

        <Box mt={3} display="flex" gap={2}>
          <Button variant="contained" onClick={handleSave}>
            Save Settings
          </Button>
          <Button variant="outlined" onClick={handleReset}>
            Reset to Defaults
          </Button>
        </Box>

        <Box mt={4} p={2} bgcolor="info.light" borderRadius={1}>
          <Typography variant="h6" gutterBottom>
            Default Values
          </Typography>
          <Typography variant="body2">
            <strong>Controller Name:</strong> sealed-secrets-controller
            <br />
            <strong>Controller Namespace:</strong> kube-system
            <br />
            <strong>Controller Port:</strong> 8080
          </Typography>
        </Box>
      </Box>
    </SectionBox>
  );
}
