import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  TextField,
  Typography,
} from '@mui/material';
import { primary, surface, content, semantic } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

/** Mapeia 1:1 para `CheckinProntidaoInputDto` do backend — evita confundir nomes na tradução. */
export interface QuickCheckInData {
  qualidadeSono: number; // 1–10
  humor: number; // 1–10
  doresMusculares: number; // 0–10
  nivelEnergia: number; // 1–10
  estresse: number; // 0–10
  observacoes?: string;
}

export interface QuickCheckInModalProps {
  open: boolean;
  onClose: () => void;
  /** Se rejeitar, o modal permanece aberto com os dados preenchidos — não reseta nem fecha sozinho. */
  onSubmit: (data: QuickCheckInData) => Promise<void>;
  /** Pré-preenche o modal com o check-in de hoje, quando já existe (edição, não recomeça do zero). */
  initialData?: QuickCheckInData;
  /** Mensagem de erro da última tentativa de submit (o caller decide o texto e quando limpar). */
  error?: string;
  /** Desabilita o botão "Registrar" e mostra "Registrando..." enquanto a submissão está em voo. */
  submitting?: boolean;
}

const DEFAULT_DATA: QuickCheckInData = {
  qualidadeSono: 5,
  humor: 5,
  doresMusculares: 5,
  nivelEnergia: 5,
  estresse: 5,
  observacoes: '',
};

const sliderSx = {
  color: primary[500],
  '& .MuiSlider-mark': { bgcolor: surface[600] },
  '& .MuiSlider-markActive': { bgcolor: primary[500] },
};

interface RatingSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

function RatingSlider({ label, value, min, max, onChange }: RatingSliderProps) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ color: surface[50], fontSize: '0.9rem', fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography sx={{ color: primary[500], fontSize: '0.85rem', fontWeight: 700 }}>
          {value}/{max}
        </Typography>
      </Box>
      <Slider
        aria-label={label}
        value={value}
        min={min}
        max={max}
        step={1}
        marks
        onChange={(_event, v) => onChange(v as number)}
        sx={sliderSx}
      />
    </Box>
  );
}

export function QuickCheckInModal({
  open, onClose, onSubmit, initialData, error, submitting,
}: QuickCheckInModalProps) {
  const [data, setData] = useState<QuickCheckInData>(initialData ?? DEFAULT_DATA);

  const handleSubmit = async () => {
    try {
      await onSubmit({ ...data, observacoes: data.observacoes?.trim() || undefined });
      handleReset();
    } catch {
      // Falha: mantém os campos preenchidos e o modal aberto — o alerta de erro (prop `error`)
      // e o retry ficam a cargo do caller, que já sabe por que a submissão falhou.
    }
  };

  const handleSkip = () => {
    handleReset();
    onClose();
  };

  function handleReset() {
    setData(initialData ?? DEFAULT_DATA);
  }

  function setField<K extends keyof QuickCheckInData>(field: K, value: QuickCheckInData[K]) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: elevation.card,
            border: `1px solid ${content.cardBorder}`,
            borderRadius: 2,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          color: surface[50],
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: '1.15rem',
          pb: 0.5,
        }}
      >
        Como você está hoje?
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && (
            <Alert severity="error" sx={{ bgcolor: `${semantic.danger[500]}26`, color: semantic.danger[500] }}>
              {error}
            </Alert>
          )}
          <RatingSlider label="Qualidade do sono" value={data.qualidadeSono} min={1} max={10}
            onChange={(v) => setField('qualidadeSono', v)} />
          <RatingSlider label="Humor" value={data.humor} min={1} max={10}
            onChange={(v) => setField('humor', v)} />
          <RatingSlider label="Dores musculares" value={data.doresMusculares} min={0} max={10}
            onChange={(v) => setField('doresMusculares', v)} />
          <RatingSlider label="Nível de energia" value={data.nivelEnergia} min={1} max={10}
            onChange={(v) => setField('nivelEnergia', v)} />
          <RatingSlider label="Estresse" value={data.estresse} min={0} max={10}
            onChange={(v) => setField('estresse', v)} />

          <TextField
            label="Algo a registrar? (opcional)"
            multiline
            rows={2}
            value={data.observacoes ?? ''}
            onChange={(e) => setField('observacoes', e.target.value)}
            fullWidth
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: surface[50],
                bgcolor: content.inputBg,
                '& fieldset': {
                  borderColor: content.inputBorder,
                },
                '&:hover fieldset': {
                  borderColor: content.inputBorderFocus,
                },
                '&.Mui-focused fieldset': {
                  borderColor: primary[500],
                },
              },
              '& .MuiInputLabel-root': {
                color: surface[400],
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: primary[500],
              },
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          gap: 1,
          borderTop: `1px solid ${content.divider}`,
        }}
      >
        <Button
          onClick={handleSkip}
          variant="text"
          sx={{
            color: surface[400],
            '&:hover': {
              color: surface[50],
              bgcolor: content.cardBg,
            },
          }}
        >
          Pular
        </Button>

        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          sx={{
            bgcolor: primary[500],
            color: elevation.base,
            fontWeight: 700,
            '&:hover': {
              bgcolor: primary[400],
            },
          }}
        >
          {submitting ? 'Registrando...' : 'Registrar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default QuickCheckInModal;
