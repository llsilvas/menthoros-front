import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, MenuItem, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography } from '@mui/material';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { GHOST_BTN_SX, PRIMARY_BTN_SX } from '../../../shared/components/actionButtonSx';
import { activeTheme } from '../../../theme/activeTheme';
import { content, text } from '../../../theme/tokens';
import type { AthleteTrainingZonesDto, FonteLimiar } from '../../../types/AthleteTrainingZones';
import { formatPaceRange } from '../adapters/intensityFormat';
import { fieldSx } from './etapas/etapasStyles';
import { useAthleteZoneAnchorsEditor, type EixoZona } from '../hooks/useAthleteZoneAnchorsEditor';

const AVISO_ALCANCE =
  'Os próximos planos usam estes valores. Treinos já criados com alvo em bpm ou ritmo fixo não mudam.';

const ORIGENS: Record<FonteLimiar, string> = {
  TESTE_CAMPO: 'Teste de campo',
  PROVA: 'Prova recente',
  LABORATORIO: 'Laboratório',
  RELOGIO_PLATAFORMA: 'Relógio/plataforma',
};
const ORIGENS_FC: FonteLimiar[] = ['TESTE_CAMPO', 'PROVA', 'LABORATORIO', 'RELOGIO_PLATAFORMA'];
// Laboratório de pace é raro: o enum aceita, a UI não oferece (design D5).
const ORIGENS_PACE: FonteLimiar[] = ['TESTE_CAMPO', 'PROVA', 'RELOGIO_PLATAFORMA'];

const FIELD = fieldSx(activeTheme.primary[500]);
const zoneColor = (n: number): string => activeTheme.zones[`Z${n}` as keyof typeof activeTheme.zones].color;

export interface AthleteZonesDialogProps {
  open: boolean;
  onClose: () => void;
  atletaId: string;
  nomeAtleta?: string;
  /** Zonas vigentes (preenchem o formulário). */
  zonas: AthleteTrainingZonesDto | null;
  abaInicial?: EixoZona;
  /** Chamado após salvar com sucesso, antes de fechar (ex.: confirmação ao treinador). */
  onSalvo?: () => void;
}

function Previa({ zonas, eixo }: { zonas: AthleteTrainingZonesDto; eixo: EixoZona }) {
  const faixa = (z: AthleteTrainingZonesDto['zonas'][number]): string => {
    if (eixo === 'fc') return z.fc ? `${z.fc.min} – ${z.fc.max} bpm` : '—';
    return z.pace ? `${formatPaceRange(z.pace.minSegKm, z.pace.maxSegKm).replace('–', ' – ')} /km` : '—';
  };
  return (
    <Box data-testid="previa-zonas">
      <Box aria-hidden sx={{ display: 'flex', height: 10, borderRadius: 1, overflow: 'hidden', mb: 1 }}>
        {zonas.zonas.map((z) => (
          <Box key={z.numero} sx={{ flex: 1, bgcolor: zoneColor(z.numero) }} />
        ))}
      </Box>
      <Table size="small" aria-label="Prévia das zonas">
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: text.secondary, borderColor: content.divider }}>Zona</TableCell>
            <TableCell sx={{ color: text.secondary, borderColor: content.divider }}>
              {eixo === 'fc' ? 'FC' : 'Ritmo'}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {zonas.zonas.map((z) => (
            <TableRow key={z.numero}>
              <TableCell sx={{ color: text.primary, borderColor: content.divider }}>{`Z${z.numero} ${z.nome}`}</TableCell>
              <TableCell sx={{ color: text.primary, borderColor: content.divider }}>{faixa(z)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

function Conteudo({ onClose, atletaId, nomeAtleta, zonas, abaInicial = 'fc', onSalvo }: Omit<AthleteZonesDialogProps, 'open'>) {
  const [eixo, setEixo] = useState<EixoZona>(abaInicial);
  const ed = useAthleteZoneAnchorsEditor(atletaId, zonas, eixo);
  const primeiroNome = nomeAtleta?.trim().split(/\s+/)[0];

  const salvar = async () => {
    if (await ed.salvar()) {
      onSalvo?.();
      onClose();
    }
  };

  const origem = (valor: FonteLimiar | '', opcoes: FonteLimiar[], onChange: (v: FonteLimiar | '') => void) => (
    <TextField select size="small" label="Origem" value={valor} onChange={(e) => onChange(e.target.value as FonteLimiar | '')} sx={FIELD}>
      <MenuItem value="">Não informar</MenuItem>
      {opcoes.map((o) => (
        <MenuItem key={o} value={o}>
          {ORIGENS[o]}
        </MenuItem>
      ))}
    </TextField>
  );

  const maximaEstimada = zonas?.fcMaxima.estimada ? `estimada: ${zonas.fcMaxima.bpm}` : undefined;

  return (
    <CoachDialog
      open
      onClose={ed.saving ? () => undefined : onClose}
      maxWidth="md"
      title={primeiroNome ? `Zonas de ${primeiroNome}` : 'Zonas do atleta'}
      subtitle="Cadastre o limiar e veja as zonas que ele gera."
      disableClose={ed.saving}
      actionsHint={AVISO_ALCANCE}
      actions={
        <>
          <Button sx={{ ...GHOST_BTN_SX, minHeight: 44 }} onClick={onClose} disabled={ed.saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            sx={{ ...PRIMARY_BTN_SX, minHeight: 44 }}
            onClick={() => void salvar()}
            disabled={!ed.podeSalvar}
            startIcon={ed.saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Salvar zonas
          </Button>
        </>
      }
    >
      <Tabs value={eixo} onChange={(_, v: EixoZona) => setEixo(v)} aria-label="Eixo das zonas" sx={{ mb: 2 }}>
        <Tab value="fc" label="Zonas de FC" id="tab-zonas-fc" aria-controls="painel-zonas-fc" />
        <Tab value="pace" label="Zonas de Ritmo" id="tab-zonas-pace" aria-controls="painel-zonas-pace" />
      </Tabs>

      {ed.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {ed.error}
        </Alert>
      )}

      <Box
        role="tabpanel"
        id={`painel-zonas-${eixo}`}
        aria-labelledby={`tab-zonas-${eixo}`}
        sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1.2fr' } }}
      >
        {eixo === 'fc' ? (
          <Box sx={{ display: 'grid', gap: 2, alignContent: 'start' }}>
            <TextField
              size="small"
              label="FC de limiar (bpm)"
              value={ed.fc.limiar}
              onChange={(e) => ed.setFc((f) => ({ ...f, limiar: e.target.value }))}
              onBlur={() => ed.tocar('fc.limiar')}
              error={Boolean(ed.errosFc.limiar)}
              helperText={ed.errosFc.limiar}
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              sx={FIELD}
            />
            <TextField
              size="small"
              label="FC máxima (bpm)"
              value={ed.fc.maxima}
              onChange={(e) => ed.setFc((f) => ({ ...f, maxima: e.target.value }))}
              onBlur={() => ed.tocar('fc.maxima')}
              error={Boolean(ed.errosFc.maxima)}
              helperText={ed.errosFc.maxima ?? (maximaEstimada ? `Vazio mantém a vigente (${maximaEstimada})` : undefined)}
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              sx={FIELD}
            />
            <TextField
              size="small"
              type="date"
              label="Data do teste"
              value={ed.fc.dataTeste}
              onChange={(e) => ed.setFc((f) => ({ ...f, dataTeste: e.target.value }))}
              onBlur={() => ed.tocar('fc.dataTeste')}
              error={Boolean(ed.errosFc.dataTeste)}
              helperText={ed.errosFc.dataTeste}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={FIELD}
            />
            {origem(ed.fc.origem, ORIGENS_FC, (v) => ed.setFc((f) => ({ ...f, origem: v })))}
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gap: 2, alignContent: 'start' }}>
            <TextField
              size="small"
              label="Ritmo de limiar (m:ss /km)"
              placeholder="4:50"
              value={ed.pace.limiar}
              onChange={(e) => ed.setPace((p) => ({ ...p, limiar: e.target.value }))}
              onBlur={() => ed.tocar('pace.limiarSegKm')}
              error={Boolean(ed.errosPace.limiarSegKm)}
              helperText={ed.errosPace.limiarSegKm}
              sx={FIELD}
            />
            <TextField
              size="small"
              type="date"
              label="Data do teste"
              value={ed.pace.dataTeste}
              onChange={(e) => ed.setPace((p) => ({ ...p, dataTeste: e.target.value }))}
              onBlur={() => ed.tocar('pace.dataTeste')}
              error={Boolean(ed.errosPace.dataTeste)}
              helperText={ed.errosPace.dataTeste}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={FIELD}
            />
            {origem(ed.pace.origem, ORIGENS_PACE, (v) => ed.setPace((p) => ({ ...p, origem: v })))}
          </Box>
        )}

        <Box>
          {ed.previa ? (
            <Previa zonas={ed.previa} eixo={eixo} />
          ) : ed.erroPrevia ? (
            <Alert severity="warning">{ed.erroPrevia}</Alert>
          ) : (
            <Typography sx={{ fontSize: '0.8125rem', color: text.secondary }}>
              Preencha o limiar para ver as zonas.
            </Typography>
          )}
        </Box>
      </Box>
    </CoachDialog>
  );
}

/** Monta o conteúdo só com o diálogo aberto: o editor não simula nem guarda rascunho fechado. */
export function AthleteZonesDialog({ open, ...resto }: AthleteZonesDialogProps) {
  return open ? <Conteudo {...resto} /> : null;
}
