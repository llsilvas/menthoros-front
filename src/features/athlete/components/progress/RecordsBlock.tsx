import { Box, Typography } from '@mui/material';
import { Flag as ProvaIcon } from '@mui/icons-material';
import { primary, surface, semantic } from '../../../../theme/tokens';
import { elevation } from '../../../../shared/design-tokens';
import { radius } from '../../../../shared/design-tokens/density';
import type { RecordsReading } from '../../adapters/buildProgressReadings';
import { ProgressBlockCard } from './ProgressBlockCard';

export interface RecordsBlockProps {
  reading: RecordsReading;
  /** `false` enquanto as provas carregam ou falharam — não sugerir "sem meta" sem saber. */
  provaConhecida: boolean;
}

/** Bloco 4: recordes com "novo" e a próxima prova. */
export function RecordsBlock({ reading, provaConhecida }: RecordsBlockProps) {
  const { rows, proximaProva } = reading;
  return (
    <ProgressBlockCard pergunta="O que já quebrei?" testId="progress-records">
      {rows.length === 0 ? (
        <Typography variant="body2" sx={{ color: surface[400] }}>Ainda sem recordes — eles aparecem aqui quando o primeiro cair.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map((pr, i) => (
            <Box key={pr.distancia} data-testid="progress-record-row" data-new={pr.novo ? 'true' : undefined} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderBottom: i < rows.length - 1 ? `1px solid ${surface[700]}` : 'none' }}>
              <Typography variant="body1" sx={{ width: 56, fontWeight: 600 }}>{pr.distancia}</Typography>
              <Typography variant="body1" sx={{ flex: 1, fontFamily: (t) => t.typography.h6.fontFamily, fontWeight: 700, color: pr.novo ? primary[500] : surface[50], fontVariantNumeric: 'tabular-nums' }}>{pr.tempoFormatado}</Typography>
              <Typography variant="caption" sx={{ color: surface[500] }}>{pr.dataFormatada}</Typography>
              {pr.novo && <Typography variant="caption" sx={{ color: semantic.success[500], fontWeight: 600 }}>novo</Typography>}
            </Box>
          ))}
        </Box>
      )}
      <Box data-testid="progress-next-race" sx={{ display: 'flex', alignItems: 'center', gap: 1.25, bgcolor: elevation.panel, borderRadius: radius.md, p: 1.5 }}>
        <ProvaIcon sx={{ color: proximaProva ? primary[500] : surface[600], fontSize: 18 }} />
        <Typography variant="body2">
          {proximaProva
            ? (proximaProva.diasFaltando != null
                ? <><Box component="span" sx={{ color: surface[400] }}>Próxima: </Box><Box component="strong" sx={{ fontWeight: 600 }}>{proximaProva.nomeProva}</Box><Box component="span" sx={{ color: surface[400] }}> em {proximaProva.diasFaltando} {proximaProva.diasFaltando === 1 ? 'dia' : 'dias'}</Box></>
                : <>Sua próxima meta: {proximaProva.nomeProva}</>)
            : provaConhecida
              ? <Box component="span" sx={{ color: surface[400] }}>Sem próxima meta — peça ao seu coach para cadastrar sua próxima prova.</Box>
              : <Box component="span" sx={{ color: surface[500] }}>Próxima prova indisponível no momento.</Box>}
        </Typography>
      </Box>
    </ProgressBlockCard>
  );
}
