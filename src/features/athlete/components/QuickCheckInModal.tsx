import { useState } from 'react';
import {
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
import { primary, surface, content } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

export interface QuickCheckInData {
  mood: number;
  energyLevel: number;
  notes?: string;
}

export interface QuickCheckInModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: QuickCheckInData) => void;
}

const MOOD_EMOJIS: Record<number, string> = {
  1: '😞',
  2: '😐',
  3: '🙂',
  4: '😊',
  5: '🚀',
};

const MOOD_LABELS: Record<number, string> = {
  1: 'Ruim',
  2: 'Regular',
  3: 'Bom',
  4: 'Muito bom',
  5: 'Excelente',
};

export function QuickCheckInModal({ open, onClose, onSubmit }: QuickCheckInModalProps) {
  const [mood, setMood] = useState<number>(3);
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = () => {
    onSubmit({
      mood,
      energyLevel,
      notes: notes.trim() || undefined,
    });
    handleReset();
  };

  const handleSkip = () => {
    handleReset();
    onClose();
  };

  function handleReset() {
    setMood(3);
    setEnergyLevel(5);
    setNotes('');
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

          {/* Humor */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography
                sx={{ color: surface[50], fontSize: '0.9rem', fontWeight: 600 }}
              >
                Humor
              </Typography>
              <Typography
                sx={{ color: primary[500], fontSize: '0.85rem', fontWeight: 700 }}
              >
                {MOOD_LABELS[mood]}
              </Typography>
            </Box>

            <Slider
              value={mood}
              min={1}
              max={5}
              step={1}
              marks
              onChange={(_event, value) => setMood(value as number)}
              sx={{
                color: primary[500],
                '& .MuiSlider-mark': {
                  bgcolor: surface[600],
                },
                '& .MuiSlider-markActive': {
                  bgcolor: primary[500],
                },
              }}
            />

            {/* Emojis abaixo do slider */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 0.5,
                px: 0.5,
              }}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <Typography
                  key={value}
                  sx={{
                    fontSize: mood === value ? '1.4rem' : '1.1rem',
                    cursor: 'pointer',
                    transition: 'font-size 0.15s ease',
                    userSelect: 'none',
                  }}
                  onClick={() => setMood(value)}
                >
                  {MOOD_EMOJIS[value]}
                </Typography>
              ))}
            </Box>
          </Box>

          {/* Nível de energia */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography
                sx={{ color: surface[50], fontSize: '0.9rem', fontWeight: 600 }}
              >
                Nível de energia
              </Typography>
              <Typography
                sx={{ color: primary[500], fontSize: '0.85rem', fontWeight: 700 }}
              >
                {energyLevel}/10
              </Typography>
            </Box>

            <Slider
              value={energyLevel}
              min={1}
              max={10}
              step={1}
              marks
              onChange={(_event, value) => setEnergyLevel(value as number)}
              sx={{
                color: primary[500],
                '& .MuiSlider-mark': {
                  bgcolor: surface[600],
                },
                '& .MuiSlider-markActive': {
                  bgcolor: primary[500],
                },
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography sx={{ color: surface[400], fontSize: '0.75rem' }}>Sem energia</Typography>
              <Typography sx={{ color: surface[400], fontSize: '0.75rem' }}>Máxima</Typography>
            </Box>
          </Box>

          {/* Notas opcionais */}
          <TextField
            label="Algo a registrar? (opcional)"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
          sx={{
            bgcolor: primary[500],
            color: elevation.base,
            fontWeight: 700,
            '&:hover': {
              bgcolor: primary[400],
            },
          }}
        >
          Registrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default QuickCheckInModal;
