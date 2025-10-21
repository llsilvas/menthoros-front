import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '@mui/material/styles';

export default function ThemeSwitcher() {
  const theme = useTheme();
  const [mode, setMode] = React.useState<'light' | 'dark'>(
    theme.palette.mode || 'light'
  );

  const toggleColorMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    // TODO: Implement actual theme switching with context
    // For now, this is just a placeholder
  };

  return (
    <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
      <IconButton onClick={toggleColorMode} size="small" sx={{ color: 'white' }}>
        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
}
