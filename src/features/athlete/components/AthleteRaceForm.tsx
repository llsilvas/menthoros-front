import { useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, FormControlLabel, Switch, TextField, Typography } from '@mui/material';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { primary, semantic, surface } from '../../../theme/tokens';
import type { CreateProvaAtleta, DistanciaProva } from '../../../types/Prova';
import { avaliarPreparacao, rotuloDistancia } from '../../../utils/racePreparation';
import { OnboardingChipGroup } from './OnboardingChipGroup';
import { OnboardingSectionLabel } from './OnboardingSectionLabel';
import { onboardingInputSx } from './onboardingFormStyles';
import { TERRENO_LABELS, tipoProvaDerivado, type Terreno } from '../adapters/raceAdapters';

const DISTANCIAS: readonly DistanciaProva[] = ['KM_5', 'KM_10', 'KM_21', 'KM_42', 'CUSTOMIZADA'];
const DISTANCIA_CHIP_LABELS: Record<DistanciaProva, string> = {
  KM_5: '5 km', KM_10: '10 km', KM_21: '21 km', KM_42: '42 km', CUSTOMIZADA: 'Outra',
};
const TERRENOS: readonly Terreno[] = ['RUA', 'TRAIL'];

export interface AthleteRaceFormValues {
  nomeProva: string;
  dataProva: string;
  distancia: DistanciaProva | undefined;
  distanciaKm: string;
  terreno: Terreno;
  tempoObjetivo: string;
  provaAlvo: boolean;
}

export interface AthleteRaceFormProps {
  initial?: Partial<AthleteRaceFormValues>;
  /** Nome da prova-alvo atual (outra prova) — mostra o aviso de troca ao marcar o switch. */
  existingTargetName?: string | null;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (input: CreateProvaAtleta) => void;
  onCancel: () => void;
  hoje?: Date;
}

const VAZIO: AthleteRaceFormValues = {
  nomeProva: '', dataProva: '', distancia: undefined, distanciaKm: '', terreno: 'RUA', tempoObjetivo: '', provaAlvo: false,
};

/**
 * Formulário de prova do atleta. A mensagem da regra de preparação é recalculada a cada mudança
 * de data/distância com a mesma tabela do backend (feedback imediato); o valor gravado vem do
 * backend. Copy conforme o canvas "Provas do Atleta".
 */
export function AthleteRaceForm({
  initial, existingTargetName = null, submitting, submitLabel, onSubmit, onCancel, hoje = new Date(),
}: AthleteRaceFormProps) {
  const [values, setValues] = useState<AthleteRaceFormValues>({ ...VAZIO, ...initial });
  const patch = (p: Partial<AthleteRaceFormValues>) => setValues((v) => ({ ...v, ...p }));

  const amanha = format(addDays(hoje, 1), 'yyyy-MM-dd');
  const km = values.distanciaKm === '' ? undefined : Number(values.distanciaKm);
  const kmValido = values.distancia !== 'CUSTOMIZADA' || (km != null && km > 0);
  const dataValida = values.dataProva !== '' && values.dataProva >= amanha;
  const valido = values.nomeProva.trim() !== '' && dataValida && values.distancia != null && kmValido;

  const avaliacao = useMemo(() => {
    if (!dataValida || !values.distancia || !kmValido) return null;
    return avaliarPreparacao(values.dataProva, values.distancia, km, hoje);
  }, [dataValida, values.dataProva, values.distancia, kmValido, km, hoje]);

  const rotulo = values.distancia ? rotuloDistancia(values.distancia, km) : '';

  function submit() {
    if (!valido || !values.distancia) return;
    onSubmit({
      nomeProva: values.nomeProva.trim(),
      dataProva: values.dataProva,
      tipoProva: tipoProvaDerivado(values.distancia, values.terreno),
      distancia: values.distancia,
      distanciaKm: values.distancia === 'CUSTOMIZADA' ? km : undefined,
      tempoObjetivo: values.tempoObjetivo || undefined,
      provaAlvo: values.provaAlvo,
    });
  }

  return (
    <Box component="form" onSubmit={(e) => { e.preventDefault(); submit(); }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <OnboardingSectionLabel>Nome da prova</OnboardingSectionLabel>
        <TextField
          label="Nome da prova"
          placeholder="Ex.: Maratona Internacional de São Paulo"
          value={values.nomeProva}
          onChange={(e) => patch({ nomeProva: e.target.value.slice(0, 200) })}
          fullWidth
          required
          sx={onboardingInputSx}
        />
      </Box>

      <Box>
        <OnboardingSectionLabel>Data</OnboardingSectionLabel>
        <TextField
          type="date"
          label="Data da prova"
          value={values.dataProva}
          onChange={(e) => patch({ dataProva: e.target.value })}
          fullWidth
          required
          slotProps={{ htmlInput: { min: amanha, 'data-testid': 'race-date' }, inputLabel: { shrink: true } }}
          error={values.dataProva !== '' && !dataValida}
          helperText={values.dataProva !== '' && !dataValida ? 'A prova precisa ser depois de hoje' : ' '}
          sx={onboardingInputSx}
        />
      </Box>

      <OnboardingChipGroup
        label="Distância"
        options={DISTANCIAS}
        labels={DISTANCIA_CHIP_LABELS}
        selected={values.distancia}
        onSelect={(d) => patch({ distancia: d })}
      />

      {values.distancia === 'CUSTOMIZADA' && (
        <TextField
          type="number"
          label="Quilometragem"
          value={values.distanciaKm}
          onChange={(e) => patch({ distanciaKm: e.target.value })}
          fullWidth
          required
          slotProps={{ htmlInput: { min: 0.1, step: 0.1, 'data-testid': 'race-km' } }}
          error={!kmValido && values.distanciaKm !== ''}
          helperText="Em km"
          sx={onboardingInputSx}
        />
      )}

      <OnboardingChipGroup
        label="Terreno"
        options={TERRENOS}
        labels={TERRENO_LABELS}
        selected={values.terreno}
        onSelect={(t) => patch({ terreno: t })}
      />

      <Box>
        <OnboardingSectionLabel>Tempo objetivo (opcional)</OnboardingSectionLabel>
        <TextField
          type="time"
          label="Meta de tempo"
          value={values.tempoObjetivo}
          onChange={(e) => patch({ tempoObjetivo: e.target.value })}
          fullWidth
          slotProps={{ htmlInput: { step: 1, 'data-testid': 'race-goal-time' }, inputLabel: { shrink: true } }}
          sx={onboardingInputSx}
        />
      </Box>

      <Box>
        <FormControlLabel
          control={<Switch checked={values.provaAlvo} onChange={(e) => patch({ provaAlvo: e.target.checked })} />}
          label="Esta é a minha prova-alvo"
          sx={{ color: surface[100] }}
        />
        {values.provaAlvo && existingTargetName && (
          <Typography variant="body2" sx={{ color: semantic.warning[500], mt: 0.5 }} data-testid="race-target-warning">
            Substitui {existingTargetName} como sua prova-alvo. Seu treinador será avisado.
          </Typography>
        )}
      </Box>

      {avaliacao && (
        <Alert
          data-testid="race-rule"
          severity={avaliacao.preparacaoCurta ? 'warning' : 'success'}
          variant="outlined"
          sx={{ borderColor: avaliacao.preparacaoCurta ? semantic.warning[500] : primary[500] }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {avaliacao.preparacaoCurta ? 'Preparação curta' : 'Dentro do recomendado'}
          </Typography>
          <Typography variant="body2">
            {avaliacao.preparacaoCurta
              ? `${rotulo} pede ${avaliacao.semanasMinimas} semanas de preparação. Faltam ${avaliacao.semanasFaltando}; ela deveria ter começado em ${format(avaliacao.inicioPreparacao, "d 'de' MMM", { locale: ptBR })}. Você pode cadastrar mesmo assim e seu treinador será avisado.`
              : `${rotulo} pede ${avaliacao.semanasMinimas} semanas de preparação. Faltam ${avaliacao.semanasFaltando}.`}
          </Typography>
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={submitting} sx={{ color: surface[300] }}>Cancelar</Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!valido || submitting}
          startIcon={submitting ? <CircularProgress size={16} sx={{ color: surface[900] }} /> : undefined}
          sx={{ bgcolor: primary[500], color: surface[900], fontWeight: 700, '&:hover': { bgcolor: primary[400] } }}
        >
          {submitLabel}
        </Button>
      </Box>
    </Box>
  );
}

export default AthleteRaceForm;
