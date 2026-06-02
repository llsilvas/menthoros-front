import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';
import { primary, surface, semantic } from '../../theme/tokens';
import { elevation } from '../../shared/design-tokens';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 4,
          minHeight: 200,
          bgcolor: elevation.card,
          borderRadius: 1,
          border: `1px solid ${semantic.danger[500]}33`,
        }}
      >
        <ErrorIcon sx={{ fontSize: 40, color: semantic.danger[500] }} />
        <Typography sx={{ color: surface[50], fontWeight: 700, fontSize: '1rem' }}>
          Algo deu errado
        </Typography>
        <Typography sx={{ color: surface[400], fontSize: '0.85rem', textAlign: 'center', maxWidth: 320 }}>
          {this.state.error?.message ?? 'Erro inesperado ao carregar este componente.'}
        </Typography>
        <Button
          size="small"
          onClick={this.handleReset}
          sx={{ color: primary[500], borderColor: primary[500] }}
          variant="outlined"
        >
          Tentar novamente
        </Button>
      </Box>
    );
  }
}

export default ErrorBoundary;
