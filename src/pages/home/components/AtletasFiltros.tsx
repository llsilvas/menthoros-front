import { Box, Paper, Stack, TextField, Chip } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { glassAzulSx, transitions } from '../../../theme/tokens';

type NivelExperienciaKey = 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO';
type AtletaStatus = 'EM_DIA' | 'ATENCAO' | 'SEM_ROTINA';

interface AtletasFiltrosProps {
  busca: string;
  status: AtletaStatus | 'TODOS';
  nivel: NivelExperienciaKey | 'TODOS';
  onBuscaChange: (v: string) => void;
  onStatusChange: (v: AtletaStatus | 'TODOS') => void;
  onNivelChange: (v: NivelExperienciaKey | 'TODOS') => void;
  totalFiltrado: number;
  totalGeral: number;
}

const statusOptions: (AtletaStatus | 'TODOS')[] = ['TODOS', 'EM_DIA', 'ATENCAO', 'SEM_ROTINA'];
const statusLabels: Record<AtletaStatus | 'TODOS', string> = {
  TODOS: 'Todos',
  EM_DIA: 'Em Dia',
  ATENCAO: 'Atenção',
  SEM_ROTINA: 'Sem Rotina',
};

const nivelOptions: (NivelExperienciaKey | 'TODOS')[] = ['TODOS', 'INICIANTE', 'INTERMEDIARIO', 'AVANCADO'];
const nivelLabels: Record<NivelExperienciaKey | 'TODOS', string> = {
  TODOS: 'Todos',
  INICIANTE: 'Iniciante',
  INTERMEDIARIO: 'Intermediário',
  AVANCADO: 'Avançado',
};

export default function AtletasFiltros({
  busca,
  status,
  nivel,
  onBuscaChange,
  onStatusChange,
  onNivelChange,
  totalFiltrado,
  totalGeral,
}: AtletasFiltrosProps) {
  return (
    <Paper
      sx={{
        p: 2.5,
        transition: transitions.default,
        ...glassAzulSx,
        mb: 2,
      }}
    >
      <Stack spacing={2.5}>
        <TextField
          placeholder="Buscar por nome..."
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: '#b1e92d', opacity: 0.7 }} />,
          }}
          InputLabelProps={{
            style: { color: 'rgba(255, 255, 255, 0.7)' },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: '#ffffff',
              '& fieldset': {
                borderColor: 'rgba(177, 233, 45, 0.3)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(177, 233, 45, 0.5)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#b1e92d',
              },
            },
            '& .MuiOutlinedInput-input::placeholder': {
              color: 'rgba(255, 255, 255, 0.5)',
              opacity: 1,
            },
          }}
        />

        <Box>
          <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {statusOptions.map((s) => (
              <Chip
                key={s}
                label={statusLabels[s]}
                onClick={() => onStatusChange(s)}
                size="small"
                sx={{
                  bgcolor: status === s ? '#b1e92d' : 'rgba(177, 233, 45, 0.15)',
                  color: status === s ? '#0e3147' : '#b1e92d',
                  fontWeight: status === s ? 700 : 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: transitions.default,
                  border: status === s ? '1px solid #b1e92d' : '1px solid rgba(177, 233, 45, 0.3)',
                  '&:hover': {
                    bgcolor: status === s ? '#b1e92d' : 'rgba(177, 233, 45, 0.25)',
                  },
                }}
              />
            ))}
          </Box>
        </Box>

        <Box>
          <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {nivelOptions.map((n) => (
              <Chip
                key={n}
                label={nivelLabels[n]}
                onClick={() => onNivelChange(n)}
                size="small"
                sx={{
                  bgcolor: nivel === n ? '#b1e92d' : 'rgba(177, 233, 45, 0.15)',
                  color: nivel === n ? '#0e3147' : '#b1e92d',
                  fontWeight: nivel === n ? 700 : 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: transitions.default,
                  border: nivel === n ? '1px solid #b1e92d' : '1px solid rgba(177, 233, 45, 0.3)',
                  '&:hover': {
                    bgcolor: nivel === n ? '#b1e92d' : 'rgba(177, 233, 45, 0.25)',
                  },
                }}
              />
            ))}
          </Box>
        </Box>

        {totalFiltrado < totalGeral && (
          <Box sx={{ textAlign: 'right', pt: 0.5 }}>
            Mostrando {totalFiltrado} de {totalGeral} atletas
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
