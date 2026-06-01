import { Box, Paper, Stack, TextField, Chip } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { glassAzulSx, transitions, primary } from '../../../theme/tokens';

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
            startAdornment: <SearchIcon sx={{ mr: 1, color: primary[500], opacity: 0.7 }} />,
          }}
          InputLabelProps={{
            style: { color: 'rgba(255, 255, 255, 0.7)' },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: '#ffffff',
              '& fieldset': {
                borderColor: `${primary[500]}4D`,
              },
              '&:hover fieldset': {
                borderColor: `${primary[500]}80`,
              },
              '&.Mui-focused fieldset': {
                borderColor: primary[500],
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
                  bgcolor: status === s ? primary[500] : `${primary[500]}26`,
                  color: status === s ? '#0e3147' : primary[500],
                  fontWeight: status === s ? 700 : 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: transitions.default,
                  border: status === s ? `1px solid ${primary[500]}` : `1px solid ${primary[500]}4D`,
                  '&:hover': {
                    bgcolor: status === s ? primary[500] : `${primary[500]}40`,
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
                  bgcolor: nivel === n ? primary[500] : `${primary[500]}26`,
                  color: nivel === n ? '#0e3147' : primary[500],
                  fontWeight: nivel === n ? 700 : 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: transitions.default,
                  border: nivel === n ? `1px solid ${primary[500]}` : `1px solid ${primary[500]}4D`,
                  '&:hover': {
                    bgcolor: nivel === n ? primary[500] : `${primary[500]}40`,
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
