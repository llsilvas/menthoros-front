import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { SugestaoService } from '../../../api/services/SugestaoService';
import type { SugestaoCoachOutputDto } from '../../../types/SugestaoCoach';
import type { SugestaoRecenteDto } from '../../../types/AtletaPerfilCoach';
import { categorical, content, semantic, surface } from '../../../theme/tokens';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { DANGER_BTN_SX, GHOST_BTN_SX, SUCCESS_BTN_SX } from '../../../shared/components/actionButtonSx';
import { useSugestaoDecisao } from '../hooks/useSugestaoDecisao';
import { wordDiff, type DiffToken } from '../adapters/wordDiff';

interface RecentSuggestionsPanelProps {
  sugestoes: SugestaoRecenteDto[];
  onVerTodas?: () => void;
  /** Chamado após aprovar/rejeitar com sucesso, para o pai recarregar a lista (ex.: `fetchProfile`). */
  onDecisao?: () => void;
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

// ── Modal de rejeição (motivo opcional, add-coach-suggestion-decision-audit) ─────────────────

const SUMMARY_MAX_LENGTH = 500;

function DiffText({ tokens, hide }: { tokens: DiffToken[]; hide: DiffToken['type'] }) {
  return (
    <>
      {tokens
        .filter((t) => t.type !== hide)
        .map((t, i) => (
          <Box
            key={i}
            component="span"
            sx={
              t.type === 'removed'
                ? { color: semantic.danger[300], textDecoration: 'line-through' }
                : t.type === 'added'
                  ? { color: semantic.success[500], fontWeight: 700 }
                  : undefined
            }
          >
            {t.text}{' '}
          </Box>
        ))}
    </>
  );
}

/** Original da IA × texto atual do coach; sem destaque palavra-a-palavra quando o diff passa do teto. */
function DeltaSugestao({ original, atual }: { original: string; atual: string }) {
  const tokens = wordDiff(original, atual);
  return (
    <Stack spacing={1}>
      <Box>
        <Typography sx={{ fontSize: '0.68rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
          Sugestão original da IA
        </Typography>
        <Typography sx={{ color: surface[100], lineHeight: 1.6 }}>
          {tokens ? <DiffText tokens={tokens} hide="added" /> : original}
        </Typography>
      </Box>
      <Box>
        <Typography sx={{ fontSize: '0.68rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
          Editado por você
        </Typography>
        <Typography sx={{ color: surface[50], lineHeight: 1.6 }}>
          {tokens ? <DiffText tokens={tokens} hide="removed" /> : atual}
        </Typography>
      </Box>
    </Stack>
  );
}

interface RejeitarSugestaoModalProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (motivo: string | undefined) => void;
}

function RejeitarSugestaoModal({ open, loading, onClose, onConfirm }: RejeitarSugestaoModalProps) {
  const [motivo, setMotivo] = useState('');

  const handleConfirmar = () => {
    const trimmed = motivo.trim();
    onConfirm(trimmed.length > 0 ? trimmed : undefined);
    setMotivo('');
  };

  const handleClose = () => {
    if (loading) return;
    setMotivo('');
    onClose();
  };

  return (
    <CoachDialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      disableClose={loading}
      title="Rejeitar sugestão"
      actions={
        <>
          <Button variant="text" onClick={handleClose} disabled={loading} sx={GHOST_BTN_SX}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleConfirmar} disabled={loading} sx={DANGER_BTN_SX}>
            Confirmar rejeição
          </Button>
        </>
      }
    >
      <Typography sx={{ fontSize: '0.8rem', color: surface[400], mb: 1.5 }}>
        Motivo da rejeição (opcional) — ajuda a saber se a IA errou na redação ou no mérito.
      </Typography>
      <TextField
        autoFocus
        fullWidth
        multiline
        rows={3}
        label="Motivo"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        disabled={loading}
        inputProps={{ maxLength: 500 }}
        helperText={`${motivo.length}/500`}
        sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }}
      />
    </CoachDialog>
  );
}

export function RecentSuggestionsPanel({ sugestoes, onVerTodas, onDecisao }: RecentSuggestionsPanelProps) {
  const [detailsById, setDetailsById] = useState<Record<string, SugestaoCoachOutputDto>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selected, setSelected] = useState<SugestaoCoachOutputDto | null>(null);
  const [confirmRejeitarAberto, setConfirmRejeitarAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [draft, setDraft] = useState('');
  const { decidir, editar, deciding, decisionMessage, resetDecisionMessage } = useSugestaoDecisao(onDecisao);

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
    resetDecisionMessage();
    setConfirmRejeitarAberto(false);
    setEditando(false);
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

  const aplicarResultado = (id: string, detail: SugestaoCoachOutputDto) => {
    setDetailsById((current) => ({ ...current, [id]: detail }));
    setSelected(detail);
  };

  const fecharDialog = () => {
    setSelected(null);
    setEditando(false);
  };

  const iniciarEdicao = () => {
    if (!selected) return;
    resetDecisionMessage();
    setDraft(selected.summary);
    setEditando(true);
  };

  const salvarEdicao = () => {
    if (!selected) return;
    const lida = selected.versao;
    void editar(selected.id, draft.trim(), lida, (detail) => {
      aplicarResultado(selected.id, detail);
      // versao mudou = salvou, ou outra sessão alterou (o texto atual já foi recarregado); igual = falha, mantém o rascunho.
      if (detail.versao !== lida) setEditando(false);
    });
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
        onClose={fecharDialog}
        maxWidth="md"
        chip={
          <Typography sx={{ fontSize: '0.72rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Sugestão completa
          </Typography>
        }
        title={selected?.summary ?? ''}
        actions={
          <>
            <Button onClick={fecharDialog} sx={GHOST_BTN_SX}>
              Fechar
            </Button>
            {selected && selected.status === 'PENDING' ? (
              <>
                <Button onClick={iniciarEdicao} disabled={deciding || editando} sx={GHOST_BTN_SX}>
                  Editar
                </Button>
                <Button
                  onClick={() => setConfirmRejeitarAberto(true)}
                  disabled={deciding}
                  sx={DANGER_BTN_SX}
                >
                  Rejeitar
                </Button>
                <Button
                  onClick={() => {
                    void decidir(selected.id, 'aprovar', (detail) => aplicarResultado(selected.id, detail), undefined, selected.versao);
                  }}
                  disabled={deciding}
                  sx={SUCCESS_BTN_SX}
                >
                  Aprovar
                </Button>
              </>
            ) : null}
          </>
        }
      >
          {selected ? (
            <Stack spacing={1.5}>
              {decisionMessage ? (
                <Alert severity={decisionMessage.severity}>{decisionMessage.text}</Alert>
              ) : null}

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                <Chip label={formatSummaryType(selected.tipo)} size="small" />
                <Chip label={STATUS_LABELS[selected.status] ?? selected.status} size="small" />
                <Chip label={CONFIDENCE_LABELS[selected.confidence] ?? selected.confidence} size="small" />
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
                {editando ? (
                  <Stack spacing={1}>
                    <TextField
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      multiline
                      minRows={2}
                      fullWidth
                      slotProps={{ htmlInput: { maxLength: SUMMARY_MAX_LENGTH, 'aria-label': 'Texto da sugestão' } }}
                      helperText={`${draft.length}/${SUMMARY_MAX_LENGTH}`}
                    />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button onClick={() => setEditando(false)} disabled={deciding} sx={GHOST_BTN_SX}>
                        Cancelar
                      </Button>
                      <Button onClick={salvarEdicao} disabled={deciding || draft.trim() === ''} sx={SUCCESS_BTN_SX}>
                        Salvar
                      </Button>
                    </Box>
                  </Stack>
                ) : selected.editadoPeloCoach && selected.summaryOriginal ? (
                  <DeltaSugestao original={selected.summaryOriginal} atual={selected.summary} />
                ) : (
                  <Typography sx={{ color: surface[50], lineHeight: 1.6 }}>
                    {selected.summary}
                  </Typography>
                )}
              </Box>

              {selected.reasoning ? (
                <Box>
                  <Typography sx={{ fontSize: '0.68rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
                    Justificativa
                  </Typography>
                  <Typography sx={{ color: surface[100], lineHeight: 1.6 }}>
                    {selected.reasoning.rationale}
                  </Typography>
                </Box>
              ) : null}

              {selected.status !== 'PENDING' && selected.reviewedBy ? (
                <Box>
                  <Typography sx={{ fontSize: '0.68rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Decidido por
                  </Typography>
                  <Typography sx={{ color: surface[50], fontWeight: 700 }}>
                    {selected.reviewedBy}
                  </Typography>
                </Box>
              ) : null}

              {selected.status === 'REJECTED' && selected.rejectionReason ? (
                <Box>
                  <Typography sx={{ fontSize: '0.68rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
                    Motivo da rejeição
                  </Typography>
                  <Typography sx={{ color: surface[100], lineHeight: 1.6 }}>
                    {selected.rejectionReason}
                  </Typography>
                </Box>
              ) : null}
            </Stack>
          ) : null}
      </CoachDialog>

      <RejeitarSugestaoModal
        open={confirmRejeitarAberto}
        loading={deciding}
        onClose={() => setConfirmRejeitarAberto(false)}
        onConfirm={(motivo) => {
          if (!selected) return;
          setConfirmRejeitarAberto(false);
          void decidir(selected.id, 'rejeitar', (detail) => aplicarResultado(selected.id, detail), motivo, selected.versao);
        }}
      />
    </>
  );
}
