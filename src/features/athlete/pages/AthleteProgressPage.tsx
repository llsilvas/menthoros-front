import { useEffect, useMemo } from 'react';
import { Alert, Box, Button, Skeleton, Typography } from '@mui/material';
import { surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { radius } from '../../../shared/design-tokens/density';
import { useAthletePmc } from '../../../hooks/useAthletePmc';
import { useAthleteZones } from '../../../hooks/useAthleteZones';
import { useAthleteRecordes } from '../../../hooks/useAthleteRecordes';
import { useAthleteAderencia } from '../../../hooks/useAthleteAderencia';
import { useAthleteProvas } from '../../../hooks/useAthleteProvas';
import { useAthleteHomeErrors } from '../hooks/useAthleteHomeErrors';
import { buildPmcDataPoints } from '../adapters/pmcAdapter';
import {
  ADERENCIA_SEMANAS, buildStrongerReading, buildZonesReading, buildAdherenceReading, buildRecordsReading,
} from '../adapters/buildProgressReadings';
import { StrongerBlock } from '../components/progress/StrongerBlock';
import { ZonesBlock } from '../components/progress/ZonesBlock';
import { AdherenceBlock } from '../components/progress/AdherenceBlock';
import { RecordsBlock } from '../components/progress/RecordsBlock';

const ZONAS_PERIOD_LABEL = '90 dias'; // default do backend quando from/to omitidos

function BlockSkeleton() {
  return <Skeleton variant="rounded" height={180} sx={{ bgcolor: elevation.card, borderRadius: radius.lg }} />;
}

function BlockError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert severity="warning" variant="outlined" action={<Button color="inherit" size="small" onClick={onRetry}>Tentar novamente</Button>}>
      {message}
    </Alert>
  );
}

function EmptyBlock({ pergunta, message, testId }: { pergunta: string; message: string; testId: string }) {
  return (
    <Box data-testid={testId} sx={{ bgcolor: elevation.card, border: `1px solid ${surface[700]}`, borderRadius: radius.lg, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="h6">{pergunta}</Typography>
      <Typography variant="body2" sx={{ color: surface[400] }}>{message}</Typography>
    </Box>
  );
}

/**
 * Progresso em quatro perguntas, sem abas (design D1). Cada bloco carrega, falha e esvazia por
 * conta própria (D4); só quando tudo falha há um Alert consolidado. A UI descreve; o coach
 * interpreta — nenhum bloco emite veredito.
 */
export default function AthleteProgressPage() {
  const { pmc, loading: pmcLoading, error: pmcError, fetchPmc } = useAthletePmc();
  const { zones, loading: zonesLoading, error: zonesError, fetchZones } = useAthleteZones();
  const { recordes, loading: recordesLoading, error: recordesError, fetchRecordes } = useAthleteRecordes();
  const { aderencia, loading: aderenciaLoading, error: aderenciaError, fetchAderencia } = useAthleteAderencia();
  const { provas, loading: provasLoading, error: provasError, fetchProvas } = useAthleteProvas();

  useEffect(() => {
    fetchPmc();
    fetchZones();
    fetchRecordes();
    fetchAderencia(ADERENCIA_SEMANAS);
    fetchProvas();
  }, [fetchPmc, fetchZones, fetchRecordes, fetchAderencia, fetchProvas]);

  const erros = useAthleteHomeErrors([
    { label: 'condicionamento', error: pmcError, refetch: fetchPmc },
    { label: 'zonas', error: zonesError, refetch: fetchZones },
    { label: 'aderência', error: aderenciaError, refetch: () => fetchAderencia(ADERENCIA_SEMANAS) },
    { label: 'recordes', error: recordesError, refetch: fetchRecordes },
  ]);
  const tudoFalhou = erros.failed.length === 4;

  const stronger = useMemo(() => buildStrongerReading(pmc), [pmc]);
  const pmcData = useMemo(() => buildPmcDataPoints(pmc), [pmc]);
  const zonesReading = useMemo(() => buildZonesReading(zones), [zones]);
  const adherence = useMemo(() => buildAdherenceReading(aderencia), [aderencia]);
  const records = useMemo(() => buildRecordsReading(recordes, provasLoading || provasError ? [] : provas), [recordes, provas, provasLoading, provasError]);

  return (
    <Box sx={{ minHeight: '100%', bgcolor: elevation.base, p: 2, pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Typography variant="h3">Progresso</Typography>
        <Typography variant="body2" sx={{ color: surface[400] }}>Últimas 12 semanas</Typography>
      </Box>

      {tudoFalhou ? (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={erros.retryAll}>Tentar novamente</Button>}>
          Não foi possível carregar seu progresso.
        </Alert>
      ) : (
        <>
          {/* 1 · Estou ficando mais forte? */}
          {pmcError ? <BlockError message="Não foi possível carregar seu histórico de forma." onRetry={fetchPmc} />
            : pmcLoading && pmc.length === 0 ? <BlockSkeleton />
            : !stronger ? <EmptyBlock testId="progress-stronger" pergunta="Estou ficando mais forte?" message="Ainda não há histórico de forma suficiente — ele começa a aparecer com os primeiros treinos registrados." />
            : <StrongerBlock reading={stronger} pmcData={pmcData} />}

          {/* 2 · Estou treinando nas zonas certas? */}
          {zonesError ? <BlockError message="Não foi possível carregar sua distribuição de zonas." onRetry={fetchZones} />
            : zonesLoading && !zones ? <BlockSkeleton />
            : !zonesReading ? <EmptyBlock testId="progress-zones" pergunta="Estou treinando nas zonas certas?" message="Ainda não há dados de zona de FC suficientes." />
            : <ZonesBlock reading={zonesReading} periodLabel={ZONAS_PERIOD_LABEL} />}

          {/* 3 · Estou cumprindo o plano? */}
          {aderenciaError ? <BlockError message="Não foi possível carregar sua aderência ao plano." onRetry={() => fetchAderencia(ADERENCIA_SEMANAS)} />
            : aderenciaLoading && aderencia.length === 0 ? <BlockSkeleton />
            : !adherence ? <EmptyBlock testId="progress-adherence" pergunta="Estou cumprindo o plano?" message="Sem plano aprovado nas últimas semanas — a aderência aparece quando houver." />
            : <AdherenceBlock reading={adherence} />}

          {/* 4 · O que já quebrei? */}
          {recordesError ? <BlockError message="Não foi possível carregar seus recordes." onRetry={fetchRecordes} />
            : recordesLoading && recordes.length === 0 ? <BlockSkeleton />
            : <RecordsBlock reading={records} provaConhecida={!provasLoading && !provasError} />}
          {provasError && <BlockError message="Não foi possível carregar sua próxima prova." onRetry={fetchProvas} />}
        </>
      )}
    </Box>
  );
}
