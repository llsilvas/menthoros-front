import { ButtonBase, Box, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { activeTheme } from '../../../../theme/activeTheme';
import { content, semantic, text } from '../../../../theme/tokens';
import type { AthleteTrainingZonesDto } from '../../../../types/AthleteTrainingZones';
import { buildIntensityLineFromEtapa } from '../../adapters/buildIntensityLine';
import { avisosDaEtapa, zonaPorValor, type IntensidadeEtapa } from '../../adapters/zoneSelectorLogic';

interface StepSummaryRowProps {
    intensidade: IntensidadeEtapa;
    zones: AthleteTrainingZonesDto | null;
    tipoEtapa: string;
    tipoTreino?: string;
    descricao?: string;
    onAbrir: () => void;
    /** Identifica a etapa para o leitor de tela ("Tipo da etapa 2" → etapa 2). */
    rotulo: string;
}

const MONO = activeTheme.font.mono;

const ZONA_SX = { fontFamily: MONO, fontSize: '0.6875rem', fontWeight: 700, px: 0.75, borderRadius: '4px' } as const;

/**
 * Linha-resumo da intensidade de uma etapa fora de foco: `zona · pace · FC · relógio X`, com um ícone
 * quando há aviso. Clicar abre o seletor completo. Ordem fixa pace → FC; sem lime (design D9 V3–V5).
 *
 * Zona: a escolhida no seletor aparece preenchida; faixa digitada ou da IA que só *cai* numa zona
 * (`zonaPorValor`) aparece em contorno com "≈" — senão o treinador não via zona nenhuma.
 */
export function StepSummaryRow({ intensidade, zones, tipoEtapa, tipoTreino, descricao, onAbrir, rotulo }: StepSummaryRowProps) {
    const linha = buildIntensityLineFromEtapa(
        {
            tipoEtapa,
            fcAlvoEtapa: intensidade.fcAlvoEtapa,
            ritmoAlvo: intensidade.ritmoAlvo,
            alvoPrimario: intensidade.alvoPrimario,
        },
        zones,
    );
    const temAviso = avisosDaEtapa(intensidade, { zones, tipoEtapa, tipoTreino, descricao }).length > 0;
    const zonaExata = intensidade.zona && intensidade.zona !== 'PERSONALIZADO' ? intensidade.zona : null;
    const zonaAproximada = zonaExata ? null : zonaPorValor(intensidade.fcAlvoEtapa, intensidade.ritmoAlvo, intensidade.alvoPrimario, zones);
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
                bgcolor: content.tableBgHover,
                width: '100%',
                textAlign: 'left',
                '&:hover': { borderColor: text.secondary },
            }}
        >
            {zonaExata && (
                <Box
                    component="span"
                    data-testid="zona-exata"
                    sx={{ ...ZONA_SX, bgcolor: activeTheme.zones[zonaExata].color, color: activeTheme.primary.contrastText }}
                >
                    {zonaExata}
                </Box>
            )}
            {zonaAproximada && (
                <Box
                    component="span"
                    data-testid="zona-aproximada"
                    title="Os valores caem nesta zona, sem casar a faixa inteira"
                    sx={{ ...ZONA_SX, border: `1px solid ${activeTheme.zones[zonaAproximada].color}`, color: activeTheme.zones[zonaAproximada].color }}
                >
                    {zonaAproximada} ≈
                </Box>
            )}
            {linha?.pace && <Typography component="span" sx={{ fontFamily: MONO, fontSize: '0.8125rem', color: text.primary }}>{linha.pace} /km</Typography>}
            {linha?.fc && <Typography component="span" sx={{ fontFamily: MONO, fontSize: '0.8125rem', color: text.primary }}>{linha.fc}</Typography>}
            {(!linha || linha.semMeta) && <Typography component="span" sx={{ fontSize: '0.8125rem', color: text.secondary }}>Sem meta de intensidade</Typography>}
            {relogio && !linha?.semMeta && <Typography component="span" sx={{ fontSize: '0.75rem', color: text.secondary }}>relógio {relogio}</Typography>}
            <Box component="span" sx={{ ml: 'auto', display: 'inline-flex', alignItems: 'center', gap: 0.75, color: text.secondary }}>
                {temAviso && (
                    <WarningAmberIcon
                        titleAccess="Esta etapa tem aviso"
                        sx={{ fontSize: '1rem', color: semantic.warning[500] }}
                    />
                )}
                <Typography component="span" sx={{ fontSize: '0.75rem' }}>Editar</Typography>
                <EditOutlinedIcon sx={{ fontSize: 14 }} aria-hidden />
            </Box>
        </ButtonBase>
    );
}
