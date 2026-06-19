import { Box, Typography } from '@mui/material';
import type { PlanoSemanalDto } from '../../../types/PlanoReview';
import { content, primary, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

interface PlanoPendenteItemProps {
    plano: PlanoSemanalDto;
    selecionado: boolean;
    onSelect: () => void;
}

function formatarData(iso: string): string {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
    });
}

export function PlanoPendenteItem({ plano, selecionado, onSelect }: PlanoPendenteItemProps) {
    const sessoes = plano.treinosPlanejados?.length ?? 0;
    const periodo = `${formatarData(plano.semanaInicio)} – ${formatarData(plano.semanaFim)}`;

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
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                px: 1.5,
                py: 1.25,
                cursor: 'pointer',
                borderRadius: '8px',
                border: `1px solid ${selecionado ? primary[500] : content.cardBorder}`,
                backgroundColor: selecionado ? `${primary[500]}0D` : elevation.card,
                transition: 'border-color 0.15s ease, background-color 0.15s ease',
                '&:hover': {
                    borderColor: primary[500],
                    backgroundColor: `${primary[500]}0D`,
                },
                '&:focus-visible': {
                    outline: `2px solid ${primary[500]}`,
                    outlineOffset: 2,
                },
            }}
        >
            <Typography
                sx={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: surface[50],
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {plano.objetivoSemanal ?? 'Plano semanal'}
            </Typography>

            <Typography sx={{ fontSize: '0.75rem', color: surface[300] }}>
                {periodo}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5, mt: 0.25 }}>
                <Typography sx={{ fontSize: '0.7rem', color: surface[500] }}>
                    {sessoes} {sessoes === 1 ? 'sessão' : 'sessões'}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: surface[500] }}>
                    {plano.volumePlanejadoKm} km
                </Typography>
            </Box>
        </Box>
    );
}
