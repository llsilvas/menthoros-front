import { useEffect, useMemo, type ReactNode } from 'react';
import { Alert, Box, Button, Skeleton, Typography } from '@mui/material';
import { surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { radius } from '../../../shared/design-tokens/density';
import { useAthletePmc } from '../../../hooks/useAthletePmc';
import { useAthleteZones } from '../../../hooks/useAthleteZones';
import { useAthleteRecordes } from '../../../hooks/useAthleteRecordes';
import { useAthleteAderencia } from '../../../hooks/useAthleteAderencia';
import { useAthleteProvas } from '../../../hooks/useAthleteProvas';
import { useAggregatedFetchErrors } from '../hooks/useAggregatedFetchErrors';
import { buildPmcDataPoints } from '../adapters/pmcAdapter';
import {
  ADERENCIA_SEMANAS, buildStrongerReading, buildZonesReading, buildAdherenceReading, buildRecordsReading,
} from '../adapters/buildProgressReadings';
import { ProgressBlockCard } from '../components/progress/ProgressBlockCard';
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

interface BlockStateProps {
  pergunta: string;
  testId: string;
  error: Error | null;
  errorMessage: string;
  onRetry: () => void;
  loading: boolean;
  /** Vazio de verdade (não só "ainda carregando"): mostra a pergunta com a mensagem honesta e a saída para o coach. */
  empty: boolean;
  emptyMessage: string;
  children: ReactNode;
}

/**
 * Molde de estado de cada bloco (D4): erro > carregando > vazio > conteúdo. O vazio também é um
 * `ProgressBlockCard` — "Falar com o coach" existe em todo bloco, inclusive sem dados (D1).
 */
function BlockState({ pergunta, testId, error, errorMessage, onRetry, loading, empty, emptyMessage, children }: BlockStateProps) {
  if (error) return <BlockError message={errorMessage} onRetry={onRetry} />;
  if (loading) return <BlockSkeleton />;
  if (empty) {
    return (
      <ProgressBlockCard pergunta={pergunta} testId={testId}>
        <Typography variant="body2" sx={{ color: surface[400] }}>{emptyMessage}</Typography>
      </ProgressBlockCard>
    );
  }
  return <>{children}</>;
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

  const refetchAderencia = () => fetchAderencia(ADERENCIA_SEMANAS);
  // Provas entra no retry consolidado (senão "tentar novamente" deixaria a próxima prova quebrada),
  // mas não conta para "tudo falhou": ela só complementa o bloco 4.
  const erros = useAggregatedFetchErrors([
    { label: 'condicionamento', error: pmcError, refetch: fetchPmc },
    { label: 'zonas', error: zonesError, refetch: fetchZones },
    { label: 'aderência', error: aderenciaError, refetch: refetchAderencia },
    { label: 'recordes', error: recordesError, refetch: fetchRecordes },
    { label: 'próxima prova', error: provasError, refetch: fetchProvas },
  ]);
  const tudoFalhou = [pmcError, zonesError, aderenciaError, recordesError].every((e) => e !== null);

  const stronger = useMemo(() => buildStrongerReading(pmc), [pmc]);
  const pmcData = useMemo(() => buildPmcDataPoints(pmc), [pmc]);
  const zonesReading = useMemo(() => buildZonesReading(zones), [zones]);
  const adherence = useMemo(() => buildAdherenceReading(aderencia), [aderencia]);
  const records = useMemo(() => buildRecordsReading(recordes, provasLoading || provasError ? [] : provas), [recordes, provas, provasLoading, provasError]);

  return (
    <Box sx={{ minHeight: '100%', bgcolor: elevation.base, p: 2, pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Typography variant="h3">Progresso</Typography>
        <Typography variant="body2" sx={{ color: surface[400] }}>Quatro perguntas sobre o seu treino</Typography>
      </Box>

      {tudoFalhou ? (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={erros.retryAll}>Tentar novamente</Button>}>
          Não foi possível carregar seu progresso.
        </Alert>
      ) : (
        <>
          <BlockState pergunta="Estou ficando mais forte?" testId="progress-stronger"
            error={pmcError} errorMessage="Não foi possível carregar seu histórico de forma." onRetry={fetchPmc}
            loading={pmcLoading && pmc.length === 0} empty={!stronger}
            emptyMessage="Ainda não há histórico de forma suficiente — ele começa a aparecer com os primeiros treinos registrados.">
            {stronger && <StrongerBlock reading={stronger} pmcData={pmcData} />}
          </BlockState>

          <BlockState pergunta="Estou treinando nas zonas certas?" testId="progress-zones"
            error={zonesError} errorMessage="Não foi possível carregar sua distribuição de zonas." onRetry={fetchZones}
            loading={zonesLoading && !zones} empty={!zonesReading}
            emptyMessage="Ainda não há dados de zona de FC suficientes.">
            {zonesReading && <ZonesBlock reading={zonesReading} periodLabel={ZONAS_PERIOD_LABEL} />}
          </BlockState>

          <BlockState pergunta="Estou cumprindo o plano?" testId="progress-adherence"
            error={aderenciaError} errorMessage="Não foi possível carregar sua aderência ao plano." onRetry={refetchAderencia}
            loading={aderenciaLoading && aderencia.length === 0} empty={!adherence}
            emptyMessage="Sem plano aprovado nas últimas semanas — a aderência aparece quando houver.">
            {adherence && <AdherenceBlock reading={adherence} />}
          </BlockState>

          {/* O bloco 4 nunca é "vazio" aqui: sem recordes ele mesmo diz "Ainda sem recordes" e ainda mostra a próxima prova. */}
          <BlockState pergunta="O que já quebrei?" testId="progress-records"
            error={recordesError} errorMessage="Não foi possível carregar seus recordes." onRetry={fetchRecordes}
            loading={recordesLoading && recordes.length === 0} empty={false} emptyMessage="">
            <RecordsBlock reading={records} provaConhecida={!provasLoading && !provasError} />
          </BlockState>
          {provasError && <BlockError message="Não foi possível carregar sua próxima prova." onRetry={fetchProvas} />}
        </>
      )}
    </Box>
  );
}
