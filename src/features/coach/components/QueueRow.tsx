import { memo } from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import { content, primary, semantic, surface } from '../../../theme/tokens';
import { activeTheme } from '../../../theme/activeTheme';
import type { CoachAthleteRow } from '../types/CoachInbox';
import type { AttentionInfo, LinhaContexto } from '../adapters/coachInboxAdapters';
import { CoachAthleteAvatar } from './CoachAthleteAvatar';
import { corDaAderencia, formatPercent } from './coachInboxHelpers';

interface QueueRowProps {
  athlete: CoachAthleteRow;
  /** A única linha abaixo do nome: motivo e recência do sinal, ou pausado, ou fase e último treino. */
  contexto: LinhaContexto;
  selected: boolean;
  onClick: () => void;
  /** Sinal ativo do atleta, quando existe. Ausente = atleta sem nada pendente. */
  attention?: AttentionInfo | null;
}

const COR_DO_TOM = {
  danger: semantic.danger[500],
  warning: semantic.warning[500],
  neutral: surface[400],
} as const;

/**
 * Linha de um atleta na coluna da lista: ~46px, para caber sete em 625px de janela.
 *
 * Saíram o chip de status, a barra de aderência e o bloco "Próximo" (inbox-lista-triagem): a
 * crítica de 2026-11-07 mediu "Alerta" duas vezes por card e a aderência três, com 2,5 atletas
 * visíveis num notebook. A severidade fica na moldura e na cor do contexto; a aderência é um
 * número mono à direita.
 */
export const QueueRow = memo(function QueueRow({ athlete, contexto, selected, onClick, attention }: QueueRowProps) {
  const corDoSinal = attention ? COR_DO_TOM[contexto.tom] : null;
  return (
    <ButtonBase
      onClick={onClick}
      aria-current={selected ? 'true' : undefined}
      sx={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.25,
        py: 0.875,
        borderRadius: 1.5,
        // O sinal domina a moldura: quem precisa de ação se destaca antes de qualquer leitura.
        border: `1px solid ${selected ? primary[500] : corDoSinal ? `${corDoSinal}66` : content.cardBorder}`,
        backgroundColor: selected ? `${primary[500]}14` : corDoSinal ? `${corDoSinal}0F` : `${surface[0]}06`,
        transition: 'background-color 150ms ease, border-color 150ms ease',
        '&:hover': { backgroundColor: selected ? `${primary[500]}1A` : `${surface[0]}10`, borderColor: primary[500] },
      }}
    >
      <CoachAthleteAvatar
        athlete={{ id: athlete.id, name: athlete.name }}
        size="xs"
        status={athlete.segment === 'drop' ? 'alert' : athlete.segment === 'attention' ? 'warning' : 'synced'}
      />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: surface[50], lineHeight: 1.15 }} noWrap>
          {athlete.name}
        </Typography>
        <Typography
          data-testid="queue-row-motivo"
          sx={{ fontSize: '0.6875rem', lineHeight: 1.3, color: COR_DO_TOM[contexto.tom], fontWeight: contexto.tom === 'neutral' ? 400 : 600 }}
          noWrap
        >
          {contexto.texto}
        </Typography>
      </Box>
      <Typography
        data-testid="queue-row-aderencia"
        aria-label={athlete.adherenceAvailable ? `Aderência ${formatPercent(athlete.adherence)}` : 'Aderência sem dado'}
        sx={{
          flex: 'none',
          fontFamily: activeTheme.font.mono,
          fontSize: '0.75rem',
          fontWeight: 600,
          color: athlete.adherenceAvailable ? corDaAderencia(athlete.adherence) : surface[500],
        }}
      >
        {athlete.adherenceAvailable ? formatPercent(athlete.adherence) : '—'}
      </Typography>
    </ButtonBase>
  );
});

export default QueueRow;
