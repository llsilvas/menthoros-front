import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import type { MelhorEsforcoDto } from '../../../types/AtletaPerfilCoach';
import { formatDuracaoEsforco } from '../../../utils/duration';

interface MelhoresEsforcosPanelProps {
    marcas: MelhorEsforcoDto[];
    /** Distingue "atleta sem PRs ainda" (true, marcas vazias) de "nunca conectou" (false). */
    integracaoConectada: boolean;
}

export function MelhoresEsforcosPanel({ marcas, integracaoConectada }: MelhoresEsforcosPanelProps) {
    if (!integracaoConectada) {
        return (
            <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Atleta ainda não conectou a conta do intervals.icu.
                </Typography>
            </Box>
        );
    }

    if (marcas.length === 0) {
        return (
            <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Nenhum esforço registrado ainda
                </Typography>
            </Box>
        );
    }

    return (
        <List disablePadding>
            {marcas.map((m, i) => (
                <ListItem
                    key={m.distanciaLabel}
                    disableGutters
                    divider={i < marcas.length - 1}
                    sx={{ py: 1 }}
                >
                    <ListItemText
                        primary={m.distanciaLabel}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    />
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'baseline' }}>
                        <Typography variant="body2">{formatDuracaoEsforco(m.tempoSegundos)}</Typography>
                        <Typography variant="caption" color="text.secondary">{m.paceLabel}</Typography>
                    </Box>
                </ListItem>
            ))}
        </List>
    );
}
