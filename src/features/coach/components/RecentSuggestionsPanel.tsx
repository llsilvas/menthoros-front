import { Box, Button, Chip, List, ListItem, ListItemText, Typography } from '@mui/material';
import { useNavigate } from 'react-router';
import type { SugestaoRecenteDto } from '../../../types/AtletaPerfilCoach';
import { semantic, categorical } from '../../../theme/tokens';

interface RecentSuggestionsPanelProps {
    sugestoes: SugestaoRecenteDto[];
}

const TIPO_COLORS: Record<string, string> = {
    NOVO_PLANO:        categorical.cat1,
    AJUSTE_PLANO:      categorical.cat3,
    LONG_RUN:          categorical.cat7,
    DESCANSO:          categorical.cat8,
    SIMULADO:          categorical.cat6,
};

const STATUS_COLORS: Record<string, string> = {
    PENDENTE:   semantic.warning[400],
    ACEITA:     semantic.success[500],
    REJEITADA:  semantic.danger[500],
    EXPIRADA:   '#6B7280',
};

export function RecentSuggestionsPanel({ sugestoes }: RecentSuggestionsPanelProps) {
    const navigate = useNavigate();

    if (sugestoes.length === 0) {
        return (
            <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Nenhuma sugestão recente
                </Typography>
            </Box>
        );
    }

    return (
        <List disablePadding>
            {sugestoes.map((s, i) => {
                const tipoColor  = TIPO_COLORS[s.tipo]   ?? categorical.cat1;
                const statusColor = STATUS_COLORS[s.status] ?? semantic.warning[400];
                return (
                    <ListItem
                        key={s.id}
                        disableGutters
                        divider={i < sugestoes.length - 1}
                        sx={{ py: 1, gap: 1 }}
                        secondaryAction={
                            <Button
                                size="small"
                                variant="text"
                                sx={{ fontSize: '0.75rem', minWidth: 0, px: 1 }}
                                onClick={() => navigate('/coach/inbox')}
                            >
                                Ver
                            </Button>
                        }
                    >
                        <Chip
                            label={s.tipo.replace(/_/g, ' ')}
                            size="small"
                            sx={{
                                backgroundColor: `${tipoColor}22`,
                                color: tipoColor,
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                height: 20,
                                mr: 1,
                                flexShrink: 0,
                            }}
                        />
                        <ListItemText
                            primary={
                                <Chip
                                    label={s.status}
                                    size="small"
                                    sx={{
                                        backgroundColor: `${statusColor}22`,
                                        color: statusColor,
                                        fontSize: '0.65rem',
                                        height: 18,
                                        fontWeight: 600,
                                    }}
                                />
                            }
                        />
                    </ListItem>
                );
            })}
        </List>
    );
}
