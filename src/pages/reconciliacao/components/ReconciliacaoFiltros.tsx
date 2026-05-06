import {
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Autocomplete,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { subDays, format } from 'date-fns';
import { AtletasService } from '../../../api/services/AtletasService';
import type { Atleta } from '../../../types/Atleta';

interface ReconciliacaoFiltrosProps {
  atletaId: string | null;
  onAtletaChange: (atletaId: string | null) => void;
  statuses: string[];
  onStatusesChange: (statuses: string[]) => void;
  dataInicio: string;
  onDataInicioChange: (data: string) => void;
  dataFim: string;
  onDataFimChange: (data: string) => void;
  loading?: boolean;
}

const statusOptions = [
  { value: 'AMBIGUO', label: 'Ambíguo' },
  { value: 'NAO_PLANEJADO', label: 'Não planejado' },
];

export function ReconciliacaoFiltros({
  atletaId,
  onAtletaChange,
  statuses,
  onStatusesChange,
  dataInicio,
  onDataInicioChange,
  dataFim,
  onDataFimChange,
  loading = false,
}: ReconciliacaoFiltrosProps) {
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [atletasLoading, setAtletasLoading] = useState(false);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  useEffect(() => {
    const loadAtletas = async () => {
      setAtletasLoading(true);
      try {
        const data = await AtletasService.listarAtletas();
        setAtletas(data);
      } catch (error) {
        console.error('Erro ao carregar atletas:', error);
      } finally {
        setAtletasLoading(false);
      }
    };

    loadAtletas();
  }, []);

  const handleHistoricoToggle = (checked: boolean) => {
    setMostrarHistorico(checked);
    if (checked) {
      // Últimas 2 semanas: hoje - 14 dias
      const dataInicioHistorico = format(subDays(new Date(), 14), 'yyyy-MM-dd');
      const dataFimAtual = format(new Date(), 'yyyy-MM-dd');
      onDataInicioChange(dataInicioHistorico);
      onDataFimChange(dataFimAtual);
    } else {
      onDataInicioChange('');
      onDataFimChange('');
    }
  };

  const selectedAtleta = atletaId ? atletas.find((a) => a.id === atletaId) : null;

  return (
    <Stack spacing={1.5} sx={{ mb: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
        <Autocomplete
          options={atletas}
          getOptionLabel={(option) => option.nome}
          value={selectedAtleta || null}
          onChange={(_, value) => onAtletaChange(value?.id ?? null)}
          loading={atletasLoading}
          disabled={loading}
          sx={{ minWidth: { xs: '100%', sm: 200 } }}
          renderInput={(params) => <TextField {...params} label="Atleta" />}
        />

        <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }} disabled={loading}>
          <InputLabel>Status</InputLabel>
          <Select
            multiple
            value={statuses}
            onChange={(e) => {
              const value = e.target.value;
              onStatusesChange(typeof value === 'string' ? value.split(',') : value);
            }}
            label="Status"
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          type="date"
          label="De"
          value={dataInicio}
          onChange={(e) => onDataInicioChange(e.target.value)}
          disabled={loading || mostrarHistorico}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: { xs: '100%', sm: 120 } }}
        />

        <TextField
          type="date"
          label="Até"
          value={dataFim}
          onChange={(e) => onDataFimChange(e.target.value)}
          disabled={loading || mostrarHistorico}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: { xs: '100%', sm: 120 } }}
        />

        <Button
          variant="outlined"
          onClick={() => {
            onAtletaChange(null);
            onStatusesChange(['AMBIGUO', 'NAO_PLANEJADO']);
            onDataInicioChange('');
            onDataFimChange('');
            setMostrarHistorico(false);
          }}
          disabled={loading}
          sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
        >
          Limpar
        </Button>
      </Stack>

      <FormControlLabel
        control={
          <Checkbox
            checked={mostrarHistorico}
            onChange={(e) => handleHistoricoToggle(e.target.checked)}
            disabled={loading}
          />
        }
        label="📋 Mostrar histórico (últimas 2 semanas)"
      />
    </Stack>
  );
}
