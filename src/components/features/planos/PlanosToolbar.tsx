import { Box, Button, CircularProgress, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import { Add as AddIcon, DeleteOutline as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import type { MetodoGeracaoPlano } from '../../../types/PlanoSemanal';
import { ACTION_BTN_SX, GHOST_BTN_SX, PRIMARY_BTN_SX } from '../../../shared/components/actionButtonSx';
import { content, semantic, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

interface PlanosToolbarProps {
    modoGeracao: MetodoGeracaoPlano;
    onModoChange: (modo: MetodoGeracaoPlano) => void;
    loading: boolean;
    gerando: boolean;
    temPlanoAtivo: boolean;
    podeExcluir: boolean;
    onRecalcular: () => void;
    onExcluir: () => void;
    onGerar: () => void;
}

/**
 * Barra de ações do dialog de planos. As ações saíram do cabeçalho: lá disputavam espaço com o
 * título e o botão de fechar, e quatro botões de peso parecido escondiam qual era o principal.
 * Aqui só "Gerar plano" é preenchido (lime = CTA primário); o resto é neutro ou discreto.
 */
export function PlanosToolbar({
    modoGeracao,
    onModoChange,
    loading,
    gerando,
    temPlanoAtivo,
    podeExcluir,
    onRecalcular,
    onExcluir,
    onGerar,
}: PlanosToolbarProps) {
    const gerarDesabilitado = loading || gerando || temPlanoAtivo;

    return (
        <Box
            sx={{
                px: { xs: 2, md: 2.5 },
                py: 1.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
                bgcolor: elevation.panel,
                borderBottom: `1px solid ${content.divider}`,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                <Typography
                    id="planos-modo-geracao"
                    sx={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: surface[400] }}
                >
                    Gerar para
                </Typography>
                <ToggleButtonGroup
                    value={modoGeracao}
                    exclusive
                    size="small"
                    aria-labelledby="planos-modo-geracao"
                    onChange={(_, value: MetodoGeracaoPlano | null) => {
                        if (value) onModoChange(value);
                    }}
                    disabled={loading || temPlanoAtivo}
                    sx={{
                        '& .MuiToggleButton-root': {
                            ...ACTION_BTN_SX,
                            px: 1.5,
                            minHeight: 32,
                            color: surface[400],
                            borderColor: content.cardBorder,
                        },
                        // Seleção neutra: o lime fica reservado ao CTA primário.
                        '& .MuiToggleButton-root.Mui-selected': {
                            color: surface[50],
                            bgcolor: content.cardBgHover,
                            '&:hover': { bgcolor: content.cardBgHover },
                        },
                    }}
                >
                    <ToggleButton value="PROXIMA_SEMANA">Próxima semana</ToggleButton>
                    <ToggleButton value="SEMANA_ATUAL">Semana atual</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                <Button
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={onRecalcular}
                    disabled={loading}
                    sx={{ ...GHOST_BTN_SX, ...ACTION_BTN_SX }}
                >
                    Recalcular métricas
                </Button>
                <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={onExcluir}
                    disabled={loading || !podeExcluir}
                    sx={{
                        ...ACTION_BTN_SX,
                        color: semantic.danger[300],
                        '&:hover': { bgcolor: `${semantic.danger[700]}2E` },
                    }}
                >
                    Excluir plano
                </Button>
                <Tooltip
                    title={temPlanoAtivo ? 'Já existe um plano ativo. Encerre a semana para gerar o próximo.' : ''}
                    disableHoverListener={!temPlanoAtivo}
                >
                    {/* span: botão desabilitado não dispara eventos, e o Tooltip precisa de um filho que dispare. */}
                    <span>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={gerando ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                            onClick={onGerar}
                            disabled={gerarDesabilitado}
                            sx={{ ...PRIMARY_BTN_SX, ...ACTION_BTN_SX, ml: 0.5 }}
                        >
                            {gerando ? 'Gerando…' : 'Gerar plano'}
                        </Button>
                    </span>
                </Tooltip>
            </Box>
        </Box>
    );
}
