import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, MenuItem, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { GHOST_BTN_SX, PRIMARY_BTN_SX } from '../../../shared/components/actionButtonSx';
import { activeTheme } from '../../../theme/activeTheme';
import { content, text } from '../../../theme/tokens';
import type { AthleteTrainingZonesDto, FonteLimiar, ModoZonas } from '../../../types/AthleteTrainingZones';
import { buildZonePreviewFromZones, parsePace } from '../adapters/zoneAnchors';
import { comFaixasDoLimiar, previaManual, type ErrosManuais, type LinhaManual } from '../adapters/manualZones';
import { fieldSx } from './etapas/etapasStyles';
import { useAthleteZoneAnchorsEditor, type EixoZona } from '../hooks/useAthleteZoneAnchorsEditor';

const AVISO_ALCANCE =
  'Os próximos planos usam estes valores. Treinos já criados com alvo em bpm ou ritmo fixo não mudam.';

const AVISO_FC_MAXIMA = 'Treinos com alvo em bpm acima da FC máxima informada deixam de ser enviados ao relógio.';

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
const NOTA_SX = { fontSize: '0.75rem', color: text.secondary } as const;
const GRUPO_SX = { display: 'grid', gap: 1.5, m: 0, p: 2, border: `1px solid ${content.divider}`, borderRadius: 2, minWidth: 0 } as const;
const LEGENDA_SX = { px: 0.75, fontSize: '0.8125rem', fontWeight: 600, color: text.primary } as const;
const zoneColor = (n: number): string => activeTheme.zones[`Z${n}` as keyof typeof activeTheme.zones].color;

const NOME_EIXO: Record<EixoZona, string> = { fc: 'FC', pace: 'ritmo' };
const NOMES_ZONAS = ['Recuperação', 'Aeróbico', 'Tempo', 'Limiar', 'VO2max', 'Sprint'];
const MODOS: { modo: ModoZonas; titulo: string; descricao: string }[] = [
  { modo: 'LIMIAR', titulo: 'Calcular pelo limiar', descricao: 'Informe o limiar e o sistema gera as zonas.' },
  { modo: 'MANUAL', titulo: 'Informar manualmente', descricao: 'Digite as faixas de cada zona (ex.: vindas do laboratório).' },
];

type Confirmacao = { tipo: 'recalcular' | 'voltar'; eixo: EixoZona } | null;

interface TabelaManualProps {
  eixo: EixoZona;
  linhas: LinhaManual[];
  erros: ErrosManuais;
  /** Limiar digitado (bpm ou s/km), base da coluna Referência. */
  limiar: number | null;
  onChange: (indice: number, campo: keyof LinhaManual, valor: string) => void;
}

function TabelaManual({ eixo, linhas, erros, limiar, onChange }: TabelaManualProps) {
  const { barra, referencias } = previaManual(linhas, eixo, limiar);
  const celula = { color: text.primary, borderColor: content.divider, verticalAlign: 'top' } as const;
  const cabecalho = { color: text.secondary, borderColor: content.divider } as const;
  const input = { ...FIELD, '& .MuiInputBase-root': { minHeight: 44 }, '& input': { fontVariantNumeric: 'tabular-nums' }, minWidth: 0 } as const;
  return (
    <Box data-testid="faixas-manuais">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: text.secondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Faixas por zona (editável)
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: text.secondary }}>{eixo === 'fc' ? 'bpm' : 'm:ss /km'}</Typography>
      </Box>
      <Box aria-hidden sx={{ display: 'flex', gap: '2px', height: 10, borderRadius: 1, overflow: 'hidden', mb: 1 }}>
        {barra.map((b) => (
          <Box key={b.numero} data-testid="faixa-barra" sx={{ flex: `${b.peso} 1 0`, bgcolor: zoneColor(b.numero) }} />
        ))}
      </Box>
      <Table size="small" aria-label="Faixas por zona">
        <TableHead>
          <TableRow>
            <TableCell sx={cabecalho}>Zona</TableCell>
            <TableCell sx={cabecalho}>Referência</TableCell>
            <TableCell sx={cabecalho}>{eixo === 'fc' ? 'De' : 'De (mais rápido)'}</TableCell>
            <TableCell sx={cabecalho}>{eixo === 'fc' ? 'Até' : 'Até (mais lento)'}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {linhas.map((l, i) => {
            const erro = erros[i];
            const idErro = `erro-${eixo}-z${i + 1}`;
            const campo = (lado: keyof LinhaManual, rotulo: string) => (
              <TextField
                size="small"
                value={l[lado]}
                onChange={(e) => onChange(i, lado, e.target.value)}
                error={Boolean(erro)}
                slotProps={{
                  htmlInput: {
                    'aria-label': `Z${i + 1} ${rotulo}`,
                    'aria-invalid': Boolean(erro),
                    'aria-describedby': erro ? idErro : undefined,
                    inputMode: eixo === 'fc' ? 'numeric' : 'text',
                  },
                }}
                sx={input}
              />
            );
            return (
              <TableRow key={i}>
                <TableCell component="th" scope="row" sx={celula}>
                  {`Z${i + 1} ${NOMES_ZONAS[i]}`}
                  {erro && (
                    <Typography id={idErro} sx={{ fontSize: '0.75rem', color: 'error.main', mt: 0.5 }}>
                      {erro}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ ...cabecalho, fontVariantNumeric: 'tabular-nums' }}>{referencias[i]}</TableCell>
                <TableCell sx={celula}>{campo('de', 'De')}</TableCell>
                <TableCell sx={celula}>{campo('ate', 'Até')}</TableCell>
              </TableRow>
            );
          })}
          {eixo === 'fc' && (
            <TableRow>
              <TableCell component="th" scope="row" sx={celula}>{`Z6 ${NOMES_ZONAS[5]}`}</TableCell>
              <TableCell sx={cabecalho}>—</TableCell>
              <TableCell colSpan={2} sx={cabecalho}>— usar ritmo (FC não estabiliza)</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
}

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
  const { linhas, barra } = buildZonePreviewFromZones(zonas, eixo);
  const celula = { color: text.primary, borderColor: content.divider } as const;
  const cabecalho = { color: text.secondary, borderColor: content.divider } as const;
  const numero = { ...celula, fontVariantNumeric: 'tabular-nums' } as const;
  return (
    <Box data-testid="previa-zonas">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: text.secondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Prévia das zonas
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: text.secondary }}>{eixo === 'fc' ? 'bpm' : 'min/km'}</Typography>
      </Box>
      <Box aria-hidden sx={{ display: 'flex', gap: '2px', height: 10, borderRadius: 1, overflow: 'hidden', mb: 1 }}>
        {barra.map((b) => (
          <Box key={b.numero} sx={{ flex: `${b.peso} 1 0`, bgcolor: zoneColor(b.numero) }} />
        ))}
      </Box>
      <Table size="small" aria-label="Prévia das zonas">
        <TableHead>
          <TableRow>
            <TableCell sx={cabecalho}>Zona</TableCell>
            <TableCell sx={cabecalho}>Referência</TableCell>
            <TableCell sx={cabecalho}>De</TableCell>
            <TableCell sx={cabecalho}>Até</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {linhas.map((z) => (
            <TableRow key={z.numero}>
              <TableCell component="th" scope="row" sx={celula}>{`Z${z.numero} ${z.nome}`}</TableCell>
              <TableCell sx={{ ...cabecalho, fontVariantNumeric: 'tabular-nums' }}>{z.referencia}</TableCell>
              {z.semFc ? (
                <TableCell colSpan={2} sx={cabecalho}>
                  — usar ritmo (FC não estabiliza)
                </TableCell>
              ) : (
                <>
                  <TableCell sx={numero}>{z.de}</TableCell>
                  <TableCell sx={numero}>{z.ate}</TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

function Conteudo({ onClose, atletaId, nomeAtleta, zonas, abaInicial = 'fc', onSalvo }: Omit<AthleteZonesDialogProps, 'open'>) {
  const [eixo, setEixo] = useState<EixoZona>(abaInicial);
  const [confirmacao, setConfirmacao] = useState<Confirmacao>(null);
  const ed = useAthleteZoneAnchorsEditor(atletaId, zonas, eixo);
  const manual = ed.modos[eixo] === 'MANUAL';

  const escolherModo = (modo: ModoZonas | null) => {
    if (!modo || modo === ed.modos[eixo]) return;
    // Voltar ao limiar um eixo gravado em manual apaga as faixas ao salvar (Q1): confirma antes.
    if (modo === 'LIMIAR' && ed.manualGravado[eixo] === 'MANUAL') setConfirmacao({ tipo: 'voltar', eixo });
    else ed.setModo(eixo, modo);
  };
  const confirmar = () => {
    if (!confirmacao) return;
    if (confirmacao.tipo === 'voltar') ed.setModo(confirmacao.eixo, 'LIMIAR');
    else ed.recalcular(confirmacao.eixo);
    setConfirmacao(null);
  };
  const badge = (e: EixoZona) => (
    // aria-hidden: o nome da aba fica estável; o modo é anunciado no grupo "Como definir as zonas".
    <Typography component="span" aria-hidden data-testid={`modo-${e}`} sx={{ ml: 1, fontSize: '0.6875rem', color: text.secondary }}>
      {ed.modos[e] === 'MANUAL' ? 'Manual' : 'Pelo limiar'}
    </Typography>
  );
  const recalcularDisponivel = ed.recalcularDisponivel(eixo);
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

  // A máxima real (informada agora ou já gravada) vira o teto do push ao relógio.
  const temMaximaReal = ed.fc.maxima.trim() !== '' || (zonas != null && !zonas.fcMaxima.estimada);
  const aviso = temMaximaReal ? `${AVISO_ALCANCE} ${AVISO_FC_MAXIMA}` : AVISO_ALCANCE;

  const maximaEstimada = zonas?.fcMaxima.estimada ? `estimada: ${zonas.fcMaxima.bpm}` : undefined;

  return (
    <CoachDialog
      open
      onClose={ed.saving ? () => undefined : onClose}
      maxWidth="md"
      title={primeiroNome ? `Zonas de ${primeiroNome}` : 'Zonas do atleta'}
      subtitle="Cadastre as zonas de FC e de ritmo. Elas aparecem no card Zonas do Atleta e alimentam os treinos enviados ao relógio."
      disableClose={ed.saving}
      actionsHint={aviso}
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
        <Tab value="fc" label={<span>Zonas de FC{badge('fc')}</span>} id="tab-zonas-fc" aria-controls="painel-zonas-fc" />
        <Tab value="pace" label={<span>Zonas de Ritmo{badge('pace')}</span>} id="tab-zonas-pace" aria-controls="painel-zonas-pace" />
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
        sx={{ display: 'grid', gap: 3 }}
      >
        <Box>
          <Typography sx={{ ...NOTA_SX, mb: 0.75 }}>Como definir as zonas</Typography>
          <ToggleButtonGroup
            exclusive
            fullWidth
            value={ed.modos[eixo]}
            onChange={(_, m: ModoZonas | null) => escolherModo(m)}
            aria-label="Como definir as zonas"
            sx={{ gap: 1, '& .MuiToggleButton-root': { border: `1px solid ${content.divider}`, borderRadius: '8px !important' } }}
          >
            {MODOS.map((m) => (
              <ToggleButton key={m.modo} value={m.modo} sx={{ display: 'grid', justifyItems: 'start', textAlign: 'left', textTransform: 'none', minHeight: 44, color: text.secondary }}>
                <Typography component="span" sx={{ fontSize: '0.875rem', fontWeight: 600, color: text.primary }}>{m.titulo}</Typography>
                <Typography component="span" sx={NOTA_SX}>{m.descricao}</Typography>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {eixo === 'fc' ? (
          <Box component="fieldset" sx={{ ...GRUPO_SX, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
            <Box component="legend" sx={LEGENDA_SX}>Âncoras de FC</Box>
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
            <Typography sx={{ ...NOTA_SX, gridColumn: '1 / -1' }}>
              Valores em bpm. Zonas pelo modelo LTHR (Friel). Z6 não tem faixa de FC: em esforço curto a FC não estabiliza.
            </Typography>
          </Box>
        ) : (
          <Box component="fieldset" sx={{ ...GRUPO_SX, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
            <Box component="legend" sx={LEGENDA_SX}>Âncora de ritmo</Box>
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
            <Typography sx={{ ...NOTA_SX, gridColumn: '1 / -1' }}>Formato m:ss. Zona mais rápida = pace menor.</Typography>
          </Box>
        )}

        {ed.limiarMudouComManual(eixo) && (
          <Alert severity="info">
            As faixas manuais de {NOME_EIXO[eixo]} continuam valendo: o novo limiar não muda as faixas. Use
            “Recalcular a partir do limiar” para gerá-las de novo.
          </Alert>
        )}

        <Box>
          {manual ? (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <TabelaManual
                eixo={eixo}
                linhas={ed.linhas[eixo]}
                erros={ed.errosManuais[eixo]}
                limiar={eixo === 'fc' ? (/^\d+$/.test(ed.fc.limiar.trim()) ? Number(ed.fc.limiar) : null) : parsePace(ed.pace.limiar)}
                onChange={(i, campo, valor) => ed.setLinha(eixo, i, campo, valor)}
              />
              {eixo === 'fc' && ed.fcManualAcimaDaMaxima != null && (
                <Alert severity="warning">
                  Faixas acima da FC máxima ({ed.fcManualAcimaDaMaxima} bpm) não são enviadas ao relógio.
                </Alert>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  sx={{ ...GHOST_BTN_SX, minHeight: 44 }}
                  disabled={!recalcularDisponivel}
                  onClick={() => setConfirmacao({ tipo: 'recalcular', eixo })}
                >
                  Recalcular a partir do limiar
                </Button>
                {!recalcularDisponivel && (
                  <Typography sx={NOTA_SX}>
                    {ed.previaPendente ? 'Calculando a prévia…' : eixo === 'pace' ? 'Sem pace de limiar' : 'Sem limiar de FC'}
                  </Typography>
                )}
              </Box>
            </Box>
          ) : ed.previa ? (
            <Previa zonas={comFaixasDoLimiar(ed.previa)} eixo={eixo} />
          ) : ed.erroPrevia ? (
            <Alert severity="warning">{ed.erroPrevia}</Alert>
          ) : (
            <Typography sx={{ fontSize: '0.8125rem', color: text.secondary }}>
              Preencha o limiar para ver as zonas.
            </Typography>
          )}
        </Box>
      </Box>

      <ConfirmDialog
        open={confirmacao != null}
        title={confirmacao?.tipo === 'voltar' ? 'Voltar ao cálculo pelo limiar?' : 'Recalcular a partir do limiar?'}
        message={
          confirmacao?.tipo === 'voltar'
            ? `As faixas manuais de ${NOME_EIXO[confirmacao.eixo]} serão apagadas ao salvar.`
            : 'As faixas editadas serão substituídas pelas calculadas a partir do limiar.'
        }
        confirmLabel={confirmacao?.tipo === 'voltar' ? 'Voltar ao limiar' : 'Recalcular'}
        severity={confirmacao?.tipo === 'voltar' ? 'danger' : 'default'}
        onClose={() => setConfirmacao(null)}
        onConfirm={confirmar}
      />
    </CoachDialog>
  );
}

/** Monta o conteúdo só com o diálogo aberto: o editor não simula nem guarda rascunho fechado. */
export function AthleteZonesDialog({ open, ...resto }: AthleteZonesDialogProps) {
  return open ? <Conteudo {...resto} /> : null;
}
