import { Box, Typography } from '@mui/material';
import type { PlanoSemanalDto } from '../../../types/PlanoReview';
import { primary, surface } from '../../../theme/tokens';
import { semantic } from '../../../shared/design-tokens';

interface PlanoPendenteItemProps {
    plano: PlanoSemanalDto;
    selecionado: boolean;
    onSelect: () => void;
}

function formatarSemana(inicio: string, fim: string): { mes: string; periodo: string } {
    const di = new Date(`${inicio}T00:00:00`);
    const df = new Date(`${fim}T00:00:00`);
    const mes = di.toLocaleDateString('pt-BR', { month: 'long' })
        .replace('.', '').toUpperCase();
    const periodo = `${di.getDate()} – ${df.getDate()}`;
    return { mes, periodo };
}

export function PlanoPendenteItem({ plano, selecionado, onSelect }: PlanoPendenteItemProps) {
    const sessoes = plano.treinosPlanejados?.length ?? 0;
    const { mes, periodo } = formatarSemana(plano.semanaInicio, plano.semanaFim);
    const volumeKm = (() => {
        const soma = (plano.treinosPlanejados ?? []).reduce((s, t) => s + (t.distanciaKm ?? 0), 0);
        return soma > 0 ? parseFloat(soma.toFixed(1)) : plano.volumePlanejadoKm;
    })();
    const accentColor = selecionado ? primary[500] : semantic.warning[400];

    return (
        <Box
            role="button"
            aria-pressed={selecionado}
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect();
                }
            }}
            sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'stretch',
                cursor: 'pointer',
                borderRadius: '6px',
                overflow: 'hidden',
                border: `1px solid ${selecionado ? `${primary[500]}50` : `${surface[0]}14`}`,
                bgcolor: selecionado ? `${primary[500]}0D` : `${surface[0]}08`,
                transition: 'all 0.15s ease',
                '&:hover': {
                    bgcolor: selecionado ? `${primary[500]}14` : `${surface[0]}12`,
                    border: `1px solid ${selecionado ? `${primary[500]}70` : `${surface[0]}26`}`,
                },
                '&:focus-visible': {
                    outline: `2px solid ${primary[500]}`,
                    outlineOffset: '1px',
                },
            }}
        >
            {/* Accent bar */}
            <Box sx={{ width: 3, flexShrink: 0, bgcolor: accentColor, borderRadius: '3px 0 0 3px' }} />

            {/* Content */}
            <Box sx={{ flex: 1, px: 1.5, py: 1.25, minWidth: 0 }}>
                {/* Header row */}
                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 0.75 }}>
                    
                    <Typography
                        sx={{
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            fontSize: '0.65rem',
                            color: surface[400],
                            letterSpacing: '0.04em',
                        }}
                    >
                        {periodo}
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: accentColor,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                        }}
                    >
                        {mes}
                    </Typography>
                </Box>

                {/* Nome do atleta */}
                <Typography
                    sx={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: selecionado ? surface[50] : surface[200],
                        lineHeight: 1.3,
                        mb: 1,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {plano.atletaNome ?? '—'}
                </Typography>

                {/* Footer stats */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.4 }}>
                        <Typography
                            sx={{
                                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                color: selecionado ? primary[400] : surface[200],
                                lineHeight: 1,
                            }}
                        >
                            {volumeKm}
                        </Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: surface[500], fontWeight: 500 }}>
                            km
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            width: 1,
                            height: 10,
                            bgcolor: `${surface[0]}1A`,
                        }}
                    />

                    <Typography sx={{ fontSize: '0.68rem', color: surface[500] }}>
                        {sessoes} {sessoes === 1 ? 'sessão' : 'sessões'}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
