import { Box, Button, Typography } from '@mui/material';
import {
  CheckCircleOutline as DoneIcon,
  RemoveCircleOutline as SkippedIcon,
  ChevronRight as ChevronIcon,
  ExpandMore as ExpandIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { alpha } from '@mui/material/styles';
import { primary, surface, semantic } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import type { AgendaDay } from '../adapters/buildWeekAgenda';
import { formatKm } from '../../../utils/formatKm';

export interface WeekAgendaRowProps {
  dia: AgendaDay;
  expanded: boolean;
  /** Linha sem etapas: expande/colapsa. */
  onToggle: (iso: string) => void;
  /** Linha com etapas: abre o detalhe (drawer). */
  onOpenDetail: (dia: AgendaDay) => void;
  onRegister: () => void;
}

function metaLinha(dia: AgendaDay): string {
  const w = dia.workout;
  if (!w) return '';
  const partes: string[] = [];
  if (w.durationMin) partes.push(`${w.durationMin} min`);
  if (w.distanceKm != null) partes.push(`${w.distanceEstimated ? '~' : ''}${formatKm(w.distanceKm)} km`);
  if (w.zoneLabel) partes.push(w.zoneLabel);
  return partes.join(' · ');
}

/** "N km · Prova · meta hh:mm:ss" — meta só quando o treino tem duração (design.md D7). */
function metaLinhaProva(dia: AgendaDay): string {
  const w = dia.workout;
  if (!w) return '';
  const partes: string[] = [];
  if (w.distanceKm != null) partes.push(`${formatKm(w.distanceKm)} km`);
  partes.push('Prova');
  if (w.duracaoMinRaw) partes.push(`meta ${w.duracaoMinRaw}`);
  return partes.join(' · ');
}

/** Bandeira no lugar do dot de tipo — só a prova ganha esse indicador (design.md D7). */
function FlagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={primary[500]}
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0 }}>
      <path d="M5 3v18" />
      <path d="M5 4h11l-2.5 4L16 12H5" />
    </svg>
  );
}

function StatusIcon({ status }: { status: AgendaDay['status'] }) {
  if (status === 'concluido') return <DoneIcon sx={{ fontSize: 20, color: semantic.success[500] }} />;
  if (status === 'pulado') return <SkippedIcon sx={{ fontSize: 20, color: surface[600] }} />;
  return <ChevronIcon sx={{ fontSize: 20, color: surface[600] }} />;
}

/** Uma linha da agenda (design D1/D4): estado por ícone, sem borda lateral; hoje com anel lime. */
export function WeekAgendaRow({ dia, expanded, onToggle, onOpenDetail, onRegister }: WeekAgendaRowProps) {
  const hoje = dia.isToday;
  const w = dia.workout;
  const isProva = w?.treino.tipoTreino === 'PROVA';
  // Concluído com realizado abre o detalhe mesmo sem etapas — é lá que a análise mora (QA/Codex).
  const abreDetalhe = (w?.temEtapas ?? false) || (dia.status === 'concluido' && Boolean(w?.treinoRealizadoId));
  const clicavel = w !== null;

  const handleClick = () => {
    if (!w) return;
    if (abreDetalhe) onOpenDetail(dia);
    else onToggle(dia.iso);
  };

  return (
    <Box
      data-testid="week-agenda-row"
      data-status={dia.status}
      data-today={hoje ? 'true' : undefined}
      data-prova={isProva ? 'true' : undefined}
      sx={{
        borderBottom: `1px solid ${surface[700]}`,
        bgcolor: isProva ? alpha(primary[500], 0.10) : hoje ? alpha(primary[500], 0.06) : 'transparent',
        boxShadow: isProva
          ? `inset 0 0 0 1px ${alpha(primary[500], 0.45)}`
          : hoje ? `inset 0 0 0 1px ${alpha(primary[500], 0.35)}` : 'none',
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Box
        component={clicavel ? 'button' : 'div'}
        type={clicavel ? 'button' : undefined}
        aria-expanded={clicavel && !abreDetalhe ? expanded : undefined}
        aria-haspopup={clicavel && abreDetalhe ? 'dialog' : undefined}
        aria-label={w ? `${format(dia.date, 'EEEE d', { locale: ptBR })}, ${isProva ? (w.description || w.title) : w.title}` : undefined}
        onClick={clicavel ? handleClick : undefined}
        sx={{
          width: '100%', textAlign: 'left', border: 'none', background: 'none', p: 0,
          cursor: clicavel ? 'pointer' : 'default', font: 'inherit', color: 'inherit',
          fontFamily: (t) => t.typography.fontFamily,
          display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, minHeight: w ? 64 : 56,
          '&:focus-visible': { outline: `2px solid ${primary[500]}`, outlineOffset: -2 },
        }}
      >
        <Box sx={{ width: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <Typography variant="caption" sx={{ color: hoje ? primary[500] : surface[500], fontWeight: hoje ? 600 : 400, textTransform: 'uppercase' }}>
            {hoje ? 'hoje' : format(dia.date, 'EEE', { locale: ptBR }).replace('.', '')}
          </Typography>
          {hoje ? (
            <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: primary[500], color: elevation.base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 700, fontFamily: (t) => t.typography.h6.fontFamily }}>{format(dia.date, 'd')}</Typography>
            </Box>
          ) : (
            <Typography variant="h6" sx={{ color: surface[300] }}>{format(dia.date, 'd')}</Typography>
          )}
        </Box>

        {w ? (
          isProva ? <FlagIcon /> : <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: w.color, flexShrink: 0 }} />
        ) : (
          <Box sx={{ width: 8, height: 2, borderRadius: 1, bgcolor: surface[600], flexShrink: 0 }} />
        )}

        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {w ? (
            <>
              <Typography variant={hoje ? 'subtitle1' : 'body1'} sx={{ fontWeight: 600 }}>
                {isProva ? (w.description || w.title) : w.title}
              </Typography>
              {isProva
                ? metaLinhaProva(dia) && <Typography variant="body2" sx={{ color: surface[400] }}>{metaLinhaProva(dia)}</Typography>
                : metaLinha(dia) && <Typography variant="body2" sx={{ color: surface[400] }}>{metaLinha(dia)}</Typography>}
              {w.analiseDisponivel && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: primary[500] }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
                  </svg>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'inherit' }}>
                    Análise pronta
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <Typography variant="body1" sx={{ color: surface[400] }}>Descanso</Typography>
          )}
        </Box>

        {w && (abreDetalhe || !expanded ? <StatusIcon status={dia.status} /> : <ExpandIcon sx={{ fontSize: 20, color: surface[500], transform: 'rotate(180deg)' }} />)}
      </Box>

      {w && expanded && !abreDetalhe && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, px: 2, pb: 2, pl: `${16 + 36 + 12 + 8 + 12}px` }}>
          {w.description && <Typography variant="body2" sx={{ color: surface[300] }}>{w.description}</Typography>}
          {hoje && (
            <Button variant="contained" onClick={onRegister} sx={{ bgcolor: primary[500], color: elevation.base, minHeight: 44, fontWeight: 700, alignSelf: 'flex-start', '&:hover': { bgcolor: primary[400] } }}>
              Registrar treino
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}

export default WeekAgendaRow;
