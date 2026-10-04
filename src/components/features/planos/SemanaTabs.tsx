import { Box, Tab, Tabs, Typography } from '@mui/material';
import type { PlanoSemanal, PlanoStatus } from '../../../types/PlanoSemanal';
import { obterStatusColor, obterStatusLabel } from '../../../types/PlanoSemanal';
import { getSafeValue } from '../../../utils/safeValues';
import { content, surface } from '../../../theme/tokens';
import { formatarPeriodoCurto, planoKey } from './planoSemanaUtils';

interface SemanaTabsProps {
    planos: PlanoSemanal[];
    /** `planoKey` do plano selecionado. */
    value: string;
    onChange: (key: string) => void;
}

/**
 * Seletor de semanas: um plano por vez em vez da pilha de cards. O dialog crescia com cada semana
 * gerada, e o plano que importa (o ativo) ficava à mercê da ordem da lista.
 */
export function SemanaTabs({ planos, value, onChange }: SemanaTabsProps) {
    return (
        <Box sx={{ px: { xs: 1, md: 1.5 }, borderBottom: `1px solid ${content.divider}` }}>
            <Tabs
                value={value}
                onChange={(_, key: string) => onChange(key)}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="Semanas planejadas"
                sx={{
                    minHeight: 48,
                    '& .MuiTab-root': {
                        minHeight: 48,
                        px: 1.5,
                        textTransform: 'none',
                        alignItems: 'flex-start',
                        color: surface[400],
                    },
                    // Navegação interna, não ação primária — neutro de alto contraste (padrão do inbox).
                    '& .Mui-selected': { color: `${surface[50]} !important` },
                    '& .MuiTabs-indicator': { backgroundColor: surface[50] },
                }}
            >
                {planos.map((plano, index) => {
                    const status = getSafeValue(plano.status) as PlanoStatus;
                    const cor = obterStatusColor(status);
                    return (
                        <Tab
                            key={planoKey(plano, index)}
                            value={planoKey(plano, index)}
                            label={
                                <Box sx={{ textAlign: 'left' }}>
                                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'inherit', fontVariantNumeric: 'tabular-nums' }}>
                                        {formatarPeriodoCurto(
                                            getSafeValue(plano.semanaInicio) as string,
                                            getSafeValue(plano.semanaFim) as string,
                                        )}
                                    </Typography>
                                    <Typography
                                        sx={{ fontSize: '0.6875rem', fontWeight: 700, color: status === 'PLANEJADO' ? surface[300] : cor, display: 'flex', alignItems: 'center', gap: 0.5 }}
                                    >
                                        <Box component="span" aria-hidden sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cor }} />
                                        {obterStatusLabel(status)}
                                    </Typography>
                                </Box>
                            }
                        />
                    );
                })}
            </Tabs>
        </Box>
    );
}
