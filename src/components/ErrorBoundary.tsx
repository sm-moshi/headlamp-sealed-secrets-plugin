/**
 * Error Boundary Components
 *
 * Provides graceful error handling for crypto and API operations
 */

import { Icon } from '@iconify/react';
import { Alert, Box, Button, Typography } from '@mui/material';
import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * Base error boundary component
 */
abstract class BaseErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    console.error('Error type:', typeof error);
    console.error('Error keys:', Object.keys(error));
    console.error('Error message:', error.message);
    console.error('Error toString:', String(error));
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  abstract renderError(): ReactNode;

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return this.renderError();
    }

    return this.props.children;
  }
}

/**
 * Error boundary for API operations
 *
 * Catches errors during Kubernetes API calls and provides
 * guidance for troubleshooting connectivity issues.
 */
export class ApiErrorBoundary extends BaseErrorBoundary {
  renderError() {
    return (
      <Box p={3}>
        <Alert
          severity="error"
          icon={<Icon icon="mdi:alert-circle-outline" />}
          action={
            <Button color="inherit" size="small" onClick={this.handleReset}>
              Retry
            </Button>
          }
        >
          <Typography variant="h6" gutterBottom>
            API Communication Error
          </Typography>
          <Typography variant="body2" paragraph>
            Failed to communicate with the Kubernetes API or Sealed Secrets controller.
          </Typography>
          <Typography variant="body2" paragraph>
            Please verify:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Kubernetes cluster is accessible</li>
            <li>Sealed Secrets controller is running</li>
            <li>Controller configuration is correct (name, namespace, port)</li>
            <li>Network connectivity to the cluster</li>
          </ul>
          {this.state.error && (
            <Typography
              variant="body2"
              sx={{ mt: 2, fontFamily: 'monospace', fontSize: '0.875rem' }}
            >
              {(() => {
                try {
                  const msg = this.state.error.message || this.state.error.toString();
                  return `Error: ${String(msg)}`;
                } catch (e) {
                  return 'Error: [Unable to display error message]';
                }
              })()}
            </Typography>
          )}
        </Alert>
      </Box>
    );
  }
}

/**
 * Generic error boundary for general component errors
 *
 * Provides a fallback UI when components encounter unexpected errors.
 */
export class GenericErrorBoundary extends BaseErrorBoundary {
  renderError() {
    return (
      <Box p={3}>
        <Alert
          severity="error"
          icon={<Icon icon="mdi:alert-circle-outline" />}
          action={
            <Button color="inherit" size="small" onClick={this.handleReset}>
              Reload
            </Button>
          }
        >
          <Typography variant="h6" gutterBottom>
            Something Went Wrong
          </Typography>
          <Typography variant="body2" paragraph>
            An unexpected error occurred. Please try reloading the page or contact your
            administrator if the problem persists.
          </Typography>
          {this.state.error && (
            <Typography
              variant="body2"
              sx={{ mt: 2, fontFamily: 'monospace', fontSize: '0.875rem' }}
            >
              {(() => {
                try {
                  const msg = this.state.error.message || this.state.error.toString();
                  return `Error: ${String(msg)}`;
                } catch (e) {
                  return 'Error: [Unable to display error message]';
                }
              })()}
            </Typography>
          )}
        </Alert>
      </Box>
    );
  }
}
