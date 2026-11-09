import { Box, FormControlLabel, Switch, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import type { ShareFormat, ShareModel } from '../../types/ShareCard';

const MODEL_LABEL: Record<ShareModel, string> = {
  plano: 'Plano × realizado',
  parciais: 'Parciais',
  semana: 'Semana',
  rota: 'Rota',
  stickers: 'Foto',
};

const FORMAT_LABEL: Record<ShareFormat, string> = {
  story: 'Story 9:16',
  feed: 'Feed 4:5',
  quadrado: 'Quadrado',
};

const groupSx = { flexWrap: 'wrap', gap: 1, '& .MuiToggleButton-root': { minHeight: 44, px: 2, borderRadius: '999px !important', border: '1px solid', textTransform: 'none' } } as const;

export interface ShareModelPickerProps {
  models: ShareModel[];
  value: ShareModel;
  onChange: (m: ShareModel) => void;
}

export function ShareModelPicker({ models, value, onChange }: ShareModelPickerProps) {
  return (
    <Box>
      <Typography id="share-model-label" variant="overline" color="text.secondary">Modelo</Typography>
      <ToggleButtonGroup
        role="radiogroup"
        aria-labelledby="share-model-label"
        exclusive
        value={value}
        onChange={(_, v: ShareModel | null) => v && onChange(v)}
        sx={groupSx}
      >
        {models.map((m) => (
          <ToggleButton key={m} value={m} role="radio" aria-checked={m === value}>
            {MODEL_LABEL[m]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}

export interface ShareFormatPickerProps {
  value: ShareFormat;
  onChange: (f: ShareFormat) => void;
}

export function ShareFormatPicker({ value, onChange }: ShareFormatPickerProps) {
  const formats = Object.keys(FORMAT_LABEL) as ShareFormat[];
  return (
    <Box>
      <Typography id="share-format-label" variant="overline" color="text.secondary">Formato</Typography>
      <ToggleButtonGroup
        role="radiogroup"
        aria-labelledby="share-format-label"
        exclusive
        value={value}
        onChange={(_, v: ShareFormat | null) => v && onChange(v)}
        sx={groupSx}
      >
        {formats.map((f) => (
          <ToggleButton key={f} value={f} role="radio" aria-checked={f === value}>
            {FORMAT_LABEL[f]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}

export interface ShareOptionSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Chave com rótulo (o `<label>` do FormControlLabel só contém texto — regra do CLAUDE.md). */
export function ShareOptionSwitch({ label, checked, onChange }: ShareOptionSwitchProps) {
  return (
    <FormControlLabel
      sx={{ minHeight: 44, ml: 0, justifyContent: 'space-between', width: '100%' }}
      labelPlacement="start"
      label={label}
      control={<Switch checked={checked} onChange={(e) => onChange(e.target.checked)} inputProps={{ role: 'switch' }} />}
    />
  );
}
