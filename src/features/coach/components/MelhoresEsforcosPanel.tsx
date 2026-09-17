import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import type { MelhorEsforcoDto } from '../../../types/AtletaPerfilCoach';

interface MelhoresEsforcosPanelProps {
    marcas: MelhorEsforcoDto[];
}

/** "1796" -> "29:56"; "3619" -> "1:00:19". */
function formatDuracao(segundos: number): string {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function MelhoresEsforcosPanel({ marcas }: MelhoresEsforcosPanelProps) {
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
                        <Typography variant="body2">{formatDuracao(m.tempoSegundos)}</Typography>
                        <Typography variant="caption" color="text.secondary">{m.paceLabel}</Typography>
                    </Box>
                </ListItem>
            ))}
        </List>
    );
}
