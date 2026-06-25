import { Alert, Box, Button, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import type { SugestaoCoachOutputDto } from '../../../types/SugestaoCoach';
import { content } from '../../../theme/tokens';
import { categorical, semantic, surface } from '../../../theme/tokens';

interface DashboardSuggestionsPanelProps {
  sugestoes: SugestaoCoachOutputDto[];
  loading?: boolean;
  error?: Error | null;
  onVerTodas?: () => void;
}

const TIPO_LABELS: Record<SugestaoCoachOutputDto['tipo'], string> = {
  PLAN_ADJUST: 'Ajuste de plano',
  RECOVERY: 'Recuperação',
  NEW_PLAN: 'Novo plano',
};

const TIPO_COLORS: Record<SugestaoCoachOutputDto['tipo'], string> = {
  PLAN_ADJUST: categorical.cat3,
  RECOVERY: categorical.cat6,
  NEW_PLAN: categorical.cat1,
};

const CONFIDENCE_LABELS: Record<SugestaoCoachOutputDto['confidence'], string> = {
  HIGH: 'Alta confiança',
  MEDIUM: 'Confiança média',
  LOW: 'Baixa confiança',
};

const CONFIDENCE_COLORS: Record<SugestaoCoachOutputDto['confidence'], string> = {
  HIGH: semantic.success[500],
  MEDIUM: semantic.warning[500],
  LOW: semantic.danger[500],
};

function formatCreatedAt(createdAt: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt));
}

export function DashboardSuggestionsPanel({
  sugestoes,
  loading = false,
  error = null,
  onVerTodas,
}: DashboardSuggestionsPanelProps) {
  return (
    <Box
      sx={{
        mt: 1.5,
        p: 1.25,
        borderRadius: 2,
        border: `1px solid ${content.cardBorder}`,
        backgroundColor: `${surface[0]}05`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
        <Box>
          <Typography sx={{ fontSize: '0.68rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Sugestões da IA
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', color: surface[300] }}>
            Prioridades pendentes para revisão rápida
          </Typography>
        </Box>
        <Button size="small" sx={{ textTransform: 'none', color: surface[400] }} onClick={onVerTodas}>
          Ver fila
        </Button>
      </Box>

      {error ? (
        <Alert
          severity="warning"
          sx={{
            mb: 1.5,
            py: 0.5,
            bgcolor: `${semantic.warning[500]}10`,
            border: `1px solid ${semantic.warning[500]}33`,
            color: surface[50],
            '& .MuiAlert-icon': { color: semantic.warning[500] },
          }}
        >
          Não foi possível carregar as sugestões da IA.
        </Alert>
      ) : null}

      {loading ? <LinearProgress sx={{ mb: 1.5 }} /> : null}

      {!loading && sugestoes.length === 0 ? (
        <Box sx={{ py: 1.25, textAlign: 'center' }}>
          <Typography sx={{ color: surface[400], fontSize: '0.82rem' }}>
            Nenhuma sugestão pendente no momento.
          </Typography>
        </Box>
      ) : null}

      {!loading && sugestoes.length > 0 ? (
        <Stack spacing={1}>
          {sugestoes.slice(0, 3).map((sugestao) => (
            <Box
              key={sugestao.id}
              sx={{
                p: 1.1,
                borderRadius: 1.5,
                border: `1px solid ${content.cardBorder}`,
                backgroundColor: `${surface[0]}08`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.78rem', color: surface[400], mb: 0.25 }}>
                    {sugestao.athleteName}
                  </Typography>
                  <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: surface[50], lineHeight: 1.25 }}>
                    {sugestao.summary}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={sugestao.confidence}
                  sx={{
                    bgcolor: `${CONFIDENCE_COLORS[sugestao.confidence]}14`,
                    color: CONFIDENCE_COLORS[sugestao.confidence],
                    border: `1px solid ${CONFIDENCE_COLORS[sugestao.confidence]}44`,
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    height: 20,
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                <Chip
                  label={TIPO_LABELS[sugestao.tipo]}
                  size="small"
                  sx={{
                    backgroundColor: `${TIPO_COLORS[sugestao.tipo]}22`,
                    color: TIPO_COLORS[sugestao.tipo],
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    height: 20,
                  }}
                />
                <Chip
                  label={CONFIDENCE_LABELS[sugestao.confidence]}
                  size="small"
                  sx={{
                    backgroundColor: `${CONFIDENCE_COLORS[sugestao.confidence]}18`,
                    color: CONFIDENCE_COLORS[sugestao.confidence],
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    height: 20,
                  }}
                />
                <Typography sx={{ alignSelf: 'center', fontSize: '0.72rem', color: surface[500] }}>
                  Criada em {formatCreatedAt(sugestao.createdAt)}
                </Typography>
              </Box>

              {sugestao.reasoning?.rationale ? (
                <Typography sx={{ mt: 0.9, fontSize: '0.78rem', color: surface[300], lineHeight: 1.5 }}>
                  {sugestao.reasoning.rationale}
                </Typography>
              ) : null}
            </Box>
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}
