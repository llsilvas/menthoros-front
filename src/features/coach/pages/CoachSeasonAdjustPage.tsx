import { useState } from 'react';
import { Alert, Box, Button, Skeleton, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { SectionCard } from '../components/SectionCard';
import { SeasonAdjustTable } from '../components/SeasonAdjustTable';
import { useSeasonAdjustment } from '../hooks/useSeasonAdjustment';
import { surface } from '../../../theme/tokens';

const ACTION_BTN_SX = { minHeight: 40, textTransform: 'none' } as const;
const LIST_SX = { m: 0, pl: 2.5, display: 'grid', gap: 0.5 } as const;
const ITEM_SX = { fontSize: '0.8125rem', color: surface[100] } as const;
/** Tamanho de `version_reason` no backend. */
const REASON_MAX = 255;

/**
 * Ajuste da temporada aprovada (add-season-plan-adjust-v2): o treinador edita as semanas futuras do
 * rascunho, aprova a nova versão com motivo ou descarta. Volta para a aba Temporada do atleta no inbox.
 */
export default function CoachSeasonAdjustPage() {
  const { atletaId, seasonPlanId } = useParams();
  const navigate = useNavigate();
  const ajuste = useSeasonAdjustment(atletaId, seasonPlanId);
  const [reason, setReason] = useState('');
  const [confirmar, setConfirmar] = useState<'approve' | 'discard' | null>(null);

  const voltar = () => navigate('/coach/inbox', { state: { atletaId, tab: 'season' } });

  if (ajuste.loading && !ajuste.plan) {
    return (
      <Box data-testid="season-adjust-loading" role="status" aria-label="Carregando ajuste" sx={{ p: 2 }}>
        <Skeleton variant="rounded" height={64} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" height={240} />
      </Box>
    );
  }

  if (ajuste.loadError || !ajuste.plan) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" action={<Button size="small" onClick={() => void ajuste.reload()} sx={ACTION_BTN_SX}>Tentar de novo</Button>}>
          {ajuste.loadError?.message ?? 'Ajuste não encontrado'}
        </Alert>
        <Button onClick={voltar} sx={{ ...ACTION_BTN_SX, mt: 1 }}>Voltar para a temporada</Button>
      </Box>
    );
  }

  const plan = ajuste.plan;
  const versao = plan.version ?? 2;
  const emAjuste = plan.seasonStatus === 'PROPOSED';

  const aprovar = async () => {
    if (await ajuste.approve(reason)) voltar();
  };
  const descartar = async () => {
    if (await ajuste.discard()) voltar();
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, display: 'grid', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" component="h1">Ajuste da temporada</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: surface[300] }}>{`${plan.provaNome} · versão ${versao}`}</Typography>
        </Box>
        <Button onClick={voltar} sx={ACTION_BTN_SX}>Voltar para a temporada</Button>
      </Box>

      {emAjuste ? (
        <Alert severity="info">
          Semanas concluídas, em andamento e a da prova ficam como estão. As mudanças só valem depois de aprovar
          a nova versão; até lá a versão {versao - 1} continua guiando os planos semanais.
        </Alert>
      ) : (
        <Alert severity="warning">Este ajuste já foi aprovado ou descartado e não pode mais ser editado.</Alert>
      )}
      {ajuste.saveError ? <Alert severity="error">{ajuste.saveError.message}</Alert> : null}

      <SectionCard title="Semanas">
        <SeasonAdjustTable
          weeks={emAjuste ? plan.weeks : plan.weeks.map((w) => ({ ...w, locked: true }))}
          savingWeek={ajuste.savingWeek}
          onSaveWeek={ajuste.saveWeek}
        />
      </SectionCard>

      <SectionCard title="Validações">
        {plan.validations.length ? (
          <Box component="ul" aria-label="Validações" sx={LIST_SX}>
            {plan.validations.map((v) => (
              <Box component="li" key={`${v.rule}-${v.weekIndex}`} sx={ITEM_SX}>{`Semana ${v.weekIndex}: ${v.message}`}</Box>
            ))}
          </Box>
        ) : (
          <Typography sx={{ fontSize: '0.8125rem', color: surface[300] }}>Ajuste dentro dos limites.</Typography>
        )}
      </SectionCard>

      {emAjuste ? (
        <SectionCard title="Aprovar nova versão">
          {ajuste.discardError ? <Alert severity="error" sx={{ mb: 1 }}>{ajuste.discardError.message}</Alert> : null}
          <TextField
            label="Motivo do ajuste"
            required
            fullWidth
            multiline
            minRows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            inputProps={{ maxLength: REASON_MAX }}
            helperText={`O motivo fica registrado na nova versão · ${reason.length}/${REASON_MAX}`}
          />
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <Button variant="contained" sx={ACTION_BTN_SX} disabled={!reason.trim() || ajuste.approving}
              onClick={() => setConfirmar('approve')}>
              Aprovar nova versão
            </Button>
            <Button color="error" sx={ACTION_BTN_SX} disabled={ajuste.discarding} onClick={() => setConfirmar('discard')}>
              Descartar ajuste
            </Button>
          </Box>
        </SectionCard>
      ) : null}

      <ConfirmDialog
        open={confirmar === 'approve'}
        title="Aprovar nova versão?"
        message={`A versão ${versao - 1} será arquivada e a versão ${versao} passa a guiar os planos semanais. O atleta passa a ver a nova versão.`}
        confirmLabel="Aprovar"
        loading={ajuste.approving}
        errorMessage={ajuste.approveError?.message ?? null}
        onClose={() => setConfirmar(null)}
        onConfirm={aprovar}
      />
      <ConfirmDialog
        open={confirmar === 'discard'}
        title="Descartar ajuste?"
        message={`As mudanças deste ajuste serão descartadas. A versão ${versao - 1} continua valendo.`}
        confirmLabel="Descartar"
        severity="danger"
        loading={ajuste.discarding}
        errorMessage={ajuste.discardError?.message ?? null}
        onClose={() => setConfirmar(null)}
        onConfirm={descartar}
      />
    </Box>
  );
}
