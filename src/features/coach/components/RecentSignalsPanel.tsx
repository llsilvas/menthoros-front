import { Box, Chip, List, ListItem, ListItemText, Typography } from '@mui/material';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { SinalRecenteDto } from '../../../types/AtletaPerfilCoach';
import { semantic } from '../../../theme/tokens';

interface RecentSignalsPanelProps {
    sinais: SinalRecenteDto[];
}

const SEV_COLORS: Record<string, string> = {
    CRITICA:  semantic.danger[500],
    ALTA:     semantic.warning[400],
    MEDIA:    semantic.warning[300],
    BAIXA:    semantic.success[500],
};

export function RecentSignalsPanel({ sinais }: RecentSignalsPanelProps) {
    if (sinais.length === 0) {
        return (
            <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Nenhum sinal recente
                </Typography>
            </Box>
        );
    }

    return (
        <List disablePadding>
            {sinais.map((s, i) => {
                const sevColor = SEV_COLORS[s.severidade] ?? semantic.warning[400];
                const ago = formatDistanceToNow(parseISO(s.geradoEm), { addSuffix: true, locale: ptBR });
                return (
                    <ListItem
                        key={s.geradoEm}
                        disableGutters
                        divider={i < sinais.length - 1}
                        sx={{ py: 1, alignItems: 'flex-start', gap: 1 }}
                    >
                        <Chip
                            label={s.severidade}
                            size="small"
                            sx={{
                                mt: 0.25,
                                backgroundColor: `${sevColor}22`,
                                color: sevColor,
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                height: 20,
                                flexShrink: 0,
                            }}
                        />
                        <ListItemText
                            primary={s.motivo.replace(/_/g, ' ')}
                            secondary={
                                <Box component="span" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <span>{s.acaoSugerida}</span>
                                    {s.sugestaoId && (
                                        <Chip
                                            label="Sugestão"
                                            size="small"
                                            sx={{ height: 16, fontSize: '0.6rem' }}
                                        />
                                    )}
                                </Box>
                            }
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                        />
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ flexShrink: 0, mt: 0.25 }}
                            noWrap
                        >
                            {ago}
                        </Typography>
                    </ListItem>
                );
            })}
        </List>
    );
}
