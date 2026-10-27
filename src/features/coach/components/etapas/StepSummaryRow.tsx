import { ButtonBase, Box, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { activeTheme } from '../../../../theme/activeTheme';
import { content, semantic, text } from '../../../../theme/tokens';
import type { AthleteTrainingZonesDto } from '../../../../types/AthleteTrainingZones';
import { buildIntensityLineFromEtapa } from '../../adapters/buildIntensityLine';
import { avisosDaEtapa, type IntensidadeEtapa } from '../../adapters/zoneSelectorLogic';

interface StepSummaryRowProps {
    intensidade: IntensidadeEtapa;
    zones: AthleteTrainingZonesDto | null;
    tipoEtapa: string;
    tipoTreino?: string;
    onAbrir: () => void;
    /** Identifica a etapa para o leitor de tela ("Tipo da etapa 2" → etapa 2). */
    rotulo: string;
}

const MONO = activeTheme.font.mono;

/**
 * Linha-resumo da intensidade de uma etapa fora de foco: `zona · pace · FC · relógio X`, com um ícone
 * quando há aviso. Clicar abre o seletor completo. Ordem fixa pace → FC; sem lime (design D9 V3–V5).
 */
export function StepSummaryRow({ intensidade, zones, tipoEtapa, tipoTreino, onAbrir, rotulo }: StepSummaryRowProps) {
    const linha = buildIntensityLineFromEtapa(
        {
            tipoEtapa,
            fcAlvoEtapa: intensidade.fcAlvoEtapa,
            ritmoAlvo: intensidade.ritmoAlvo,
            alvoPrimario: intensidade.alvoPrimario,
        },
        zones,
    );
    const temAviso = avisosDaEtapa(intensidade, { zones, tipoEtapa, tipoTreino }).length > 0;
    const zona = intensidade.zona && intensidade.zona !== 'PERSONALIZADO' ? intensidade.zona : null;
    const relogio = intensidade.alvoPrimario === 'PACE' ? 'Pace' : intensidade.alvoPrimario === 'FC' ? 'FC' : null;

    return (
        <ButtonBase
            onClick={onAbrir}
            aria-label={`Editar intensidade — ${rotulo}`}
            sx={{
                justifyContent: 'flex-start',
                gap: 1,
                minHeight: 44,
                px: 1,
                borderRadius: '8px',
                border: `1px solid ${content.cardBorder}`,
                width: '100%',
                textAlign: 'left',
            }}
        >
            {zona && (
                <Box
                    component="span"
                    sx={{ fontFamily: MONO, fontSize: '0.6875rem', fontWeight: 700, px: 0.75, borderRadius: '4px', bgcolor: activeTheme.zones[zona].color, color: activeTheme.primary.contrastText }}
                >
                    {zona}
                </Box>
            )}
            {linha?.pace && <Typography component="span" sx={{ fontFamily: MONO, fontSize: '0.8125rem', color: text.primary }}>{linha.pace}</Typography>}
            {linha?.fc && <Typography component="span" sx={{ fontFamily: MONO, fontSize: '0.8125rem', color: text.primary }}>{linha.fc}</Typography>}
            {(!linha || linha.semMeta) && <Typography component="span" sx={{ fontSize: '0.8125rem', color: text.secondary }}>Sem meta de intensidade</Typography>}
            {relogio && !linha?.semMeta && <Typography component="span" sx={{ fontSize: '0.75rem', color: text.secondary }}>relógio {relogio}</Typography>}
            {temAviso && (
                <WarningAmberIcon
                    titleAccess="Esta etapa tem aviso"
                    sx={{ ml: 'auto', fontSize: '1rem', color: semantic.warning[500] }}
                />
            )}
        </ButtonBase>
    );
}
