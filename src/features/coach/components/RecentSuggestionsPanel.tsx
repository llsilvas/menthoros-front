import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { SugestaoService } from '../../../api/services/SugestaoService';
import type { SugestaoCoachOutputDto } from '../../../types/SugestaoCoach';
import type { SugestaoRecenteDto } from '../../../types/AtletaPerfilCoach';
import { categorical, content, semantic, surface } from '../../../theme/tokens';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { GHOST_BTN_SX } from '../../../shared/components/actionButtonSx';

interface RecentSuggestionsPanelProps {
  sugestoes: SugestaoRecenteDto[];
  onVerTodas?: () => void;
}

const TIPO_LABELS: Record<string, string> = {
  NOVO_PLANO: 'Novo plano',
  AJUSTE_PLANO: 'Ajuste de plano',
  LONG_RUN: 'Longão',
  DESCANSO: 'Descanso',
  SIMULADO: 'Simulado',
  RECOVERY: 'Recuperação',
  PLAN_ADJUST: 'Ajuste de plano',
  NEW_PLAN: 'Novo plano',
};

const TIPO_COLORS: Record<string, string> = {
  NOVO_PLANO: categorical.cat1,
  AJUSTE_PLANO: categorical.cat3,
  LONG_RUN: categorical.cat7,
  DESCANSO: categorical.cat8,
  SIMULADO: categorical.cat6,
  RECOVERY: categorical.cat6,
  PLAN_ADJUST: categorical.cat3,
  NEW_PLAN: categorical.cat1,
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  PENDENTE: 'Pendente',
  ACEITA: 'Aprovada',
  REJEITADA: 'Rejeitada',
  EXPIRADA: 'Expirada',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: semantic.warning[400],
  APPROVED: semantic.success[500],
  REJECTED: semantic.danger[500],
  PENDENTE: semantic.warning[400],
  ACEITA: semantic.success[500],
  REJEITADA: semantic.danger[500],
  EXPIRADA: categorical.cat8,
};

const CONFIDENCE_LABELS: Record<string, string> = {
  HIGH: 'Alta',
  MEDIUM: 'Média',
  LOW: 'Baixa',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  HIGH: semantic.success[500],
  MEDIUM: semantic.warning[500],
  LOW: semantic.danger[500],
};

function formatDateTime(dateIso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateIso));
}

function formatSummaryType(tipo: string): string {
  return TIPO_LABELS[tipo] ?? tipo.replace(/_/g, ' ');
}

export function RecentSuggestionsPanel({ sugestoes, onVerTodas }: RecentSuggestionsPanelProps) {
  const [detailsById, setDetailsById] = useState<Record<string, SugestaoCoachOutputDto>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selected, setSelected] = useState<SugestaoCoachOutputDto | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      if (sugestoes.length === 0) {
        setDetailsById({});
        setSelected(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const entries = await Promise.all(
          sugestoes.map(async (sugestao) => [sugestao.id, await SugestaoService.detalhe(sugestao.id)] as const),
        );

        if (cancelled) return;

        setDetailsById(Object.fromEntries(entries));
        setSelected((current) => (current ? Object.fromEntries(entries)[current.id] ?? current : null));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error('Erro ao carregar detalhes das sugestões'));
        setDetailsById({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDetails();

    return () => {
      cancelled = true;
    };
  }, [sugestoes]);

  const rows = useMemo(
    () =>
      sugestoes.map((sugestao) => {
        const detail = detailsById[sugestao.id];
        return {
          id: sugestao.id,
          tipo: sugestao.tipo,
          status: sugestao.status,
          confidence: detail?.confidence,
          summary: detail?.summary,
          createdAt: detail?.createdAt ?? sugestao.criadoEm,
          reasoning: detail?.reasoning,
        };
      }),
    [detailsById, sugestoes],
  );

  const openSuggestion = async (id: string) => {
    const existing = detailsById[id];
    if (existing) {
      setSelected(existing);
      return;
    }

    try {
      const detail = await SugestaoService.detalhe(id);
      setDetailsById((current) => ({ ...current, [id]: detail }));
      setSelected(detail);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar o detalhe da sugestão'));
    }
  };

  if (sugestoes.length === 0) {
    return (
      <Box sx={{ py: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Nenhuma sugestão recente
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
        <Typography sx={{ fontSize: '0.68rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Lista resumida
        </Typography>
        <Button
          size="small"
          variant="text"
          sx={{ fontSize: '0.75rem', minWidth: 0, px: 1 }}
          onClick={onVerTodas}
        >
          Ver todas
        </Button>
      </Box>

      {error ? (
        <Alert
          severity="warning"
          sx={{
            mb: 1.25,
            py: 0.5,
            bgcolor: `${semantic.warning[500]}10`,
            border: `1px solid ${semantic.warning[500]}33`,
            color: surface[50],
            '& .MuiAlert-icon': { color: semantic.warning[500] },
          }}
        >
          Não foi possível carregar o resumo completo das sugestões.
        </Alert>
      ) : null}

      {loading ? <LinearProgress sx={{ mb: 1.25 }} /> : null}

      <Box
        sx={{
          minWidth: 640,
          display: 'grid',
          gridTemplateColumns: { xs: '1.15fr 0.75fr 0.75fr 0.75fr auto', lg: '1.2fr 0.75fr 0.75fr 0.75fr auto' },
          gap: 0.75,
          px: 0.35,
          py: 0.6,
          color: surface[400],
          fontSize: '0.66rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        <Box>Resumo</Box>
        <Box>Tipo</Box>
        <Box>Status</Box>
        <Box>Confiança</Box>
        <Box />
      </Box>

      <Stack spacing={0.65} sx={{ minWidth: 640, overflowX: 'auto', pb: 0.4 }}>
        {rows.map((row) => {
          const tipoColor = TIPO_COLORS[row.tipo] ?? categorical.cat1;
          const statusColor = STATUS_COLORS[row.status] ?? semantic.warning[400];
          const confidenceColor = row.confidence ? CONFIDENCE_COLORS[row.confidence] ?? semantic.warning[500] : semantic.warning[500];

          return (
            <Box
              key={row.id}
              sx={{
                minWidth: 640,
                p: 0.85,
                borderRadius: 1.5,
                border: `1px solid ${content.cardBorder}`,
                backgroundColor: `${surface[0]}06`,
                display: 'grid',
                gridTemplateColumns: { xs: '1.15fr 0.75fr 0.75fr 0.75fr auto', lg: '1.2fr 0.75fr 0.75fr 0.75fr auto' },
                gap: 0.75,
                alignItems: 'center',
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: surface[50], lineHeight: 1.2 }} noWrap>
                  {row.summary ?? 'Resumo indisponível'}
                </Typography>
                <Typography sx={{ mt: 0.2, fontSize: '0.68rem', color: surface[400] }}>
                  {formatDateTime(row.createdAt)}
                </Typography>
              </Box>

              <Chip
                label={formatSummaryType(row.tipo)}
                size="small"
                sx={{
                  backgroundColor: `${tipoColor}22`,
                  color: tipoColor,
                  fontWeight: 700,
                  fontSize: '0.63rem',
                  height: 18,
                  width: 'fit-content',
                }}
              />

              <Chip
                label={STATUS_LABELS[row.status] ?? row.status}
                size="small"
                sx={{
                  backgroundColor: `${statusColor}22`,
                  color: statusColor,
                  fontWeight: 700,
                  fontSize: '0.63rem',
                  height: 18,
                  width: 'fit-content',
                }}
              />

              <Chip
                label={row.confidence ? CONFIDENCE_LABELS[row.confidence] ?? row.confidence : '...'}
                size="small"
                sx={{
                  backgroundColor: `${confidenceColor}18`,
                  color: confidenceColor,
                  fontWeight: 700,
                  fontSize: '0.63rem',
                  height: 18,
                  width: 'fit-content',
                }}
              />

              <Button
                size="small"
                variant="text"
                sx={{ fontSize: '0.72rem', minWidth: 0, px: 0.75, justifySelf: 'end' }}
                onClick={() => {
                  void openSuggestion(row.id);
                }}
              >
                Ver
              </Button>
            </Box>
          );
        })}
      </Stack>

      <CoachDialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        maxWidth="md"
        chip={
          <Typography sx={{ fontSize: '0.72rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Sugestão completa
          </Typography>
        }
        title={selected?.summary ?? ''}
        actions={
          <Button onClick={() => setSelected(null)} sx={GHOST_BTN_SX}>
            Fechar
          </Button>
        }
      >
          {selected ? (
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                <Chip label={selected.tipo} size="small" />
                <Chip label={selected.status} size="small" />
                <Chip label={selected.confidence} size="small" />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.68rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Atleta
                  </Typography>
                  <Typography sx={{ color: surface[50], fontWeight: 700 }}>
                    {selected.athleteName}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.68rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Criada em
                  </Typography>
                  <Typography sx={{ color: surface[50], fontWeight: 700 }}>
                    {formatDateTime(selected.createdAt)}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.68rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Expira em
                  </Typography>
                  <Typography sx={{ color: surface[50], fontWeight: 700 }}>
                    {selected.expiresAt ? formatDateTime(selected.expiresAt) : 'Sem expiração'}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography sx={{ fontSize: '0.68rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
                  Resumo
                </Typography>
                <Typography sx={{ color: surface[50], lineHeight: 1.6 }}>
                  {selected.summary}
                </Typography>
              </Box>

              {selected.reasoning ? (
                <Box>
                  <Typography sx={{ fontSize: '0.68rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
                    Justificativa
                  </Typography>
                  <Typography sx={{ color: surface[100], lineHeight: 1.6 }}>
                    {selected.reasoning.rationale}
                  </Typography>
                  {selected.reasoning.sourceRules?.length > 0 ? (
                    <Typography sx={{ mt: 0.75, color: surface[400], fontSize: '0.84rem' }}>
                      Regras: {selected.reasoning.sourceRules.join(', ')}
                    </Typography>
                  ) : null}
                </Box>
              ) : null}
            </Stack>
          ) : null}
      </CoachDialog>
    </>
  );
}
