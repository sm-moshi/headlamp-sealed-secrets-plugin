/**
 * Notification System
 *
 * Drop-in replacement for notistack's useSnackbar.
 * Uses MUI Snackbar + Alert to avoid external dependency issues
 * in the Headlamp plugin sandbox.
 */

import { Alert, AlertColor, Snackbar } from '@mui/material';
import React from 'react';

interface Notification {
  key: number;
  message: string;
  variant: AlertColor;
}

interface NotificationContextValue {
  enqueueSnackbar: (message: string, options?: { variant?: string }) => void;
}

const NotificationContext = React.createContext<NotificationContextValue | null>(null);

/**
 * Provides notification capability to child components.
 * Wrap your route components with this provider.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const enqueueSnackbar = React.useCallback(
    (message: string, options?: { variant?: string }) => {
      const variant = (options?.variant as AlertColor) || 'info';
      setNotifications(prev => [...prev, { key: Date.now(), message, variant }]);
    },
    []
  );

  const handleClose = React.useCallback((key: number) => {
    setNotifications(prev => prev.filter(n => n.key !== key));
  }, []);

  const value = React.useMemo(() => ({ enqueueSnackbar }), [enqueueSnackbar]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {notifications.map((n, index) => (
        <Snackbar
          key={n.key}
          open
          autoHideDuration={5000}
          onClose={() => handleClose(n.key)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ bottom: { xs: `${(index * 60) + 24}px !important` } }}
        >
          <Alert
            onClose={() => handleClose(n.key)}
            severity={n.variant}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {n.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to show notifications. Must be used within NotificationProvider.
 * API-compatible with notistack's useSnackbar.
 */
export function useNotification() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    // Fallback for components rendered outside provider (e.g. registerPluginSettings)
    return {
      enqueueSnackbar: (message: string, options?: { variant?: string }) => {
        console.log(`[sealed-secrets] ${options?.variant || 'info'}: ${message}`);
      },
    };
  }
  return context;
}
