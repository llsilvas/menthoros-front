import React, { useEffect, useState } from 'react';
import {
    Button,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Chip,
    Grid,
    LinearProgress,
    Divider,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    useMediaQuery,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Flag as FlagIcon,
    Assignment as AssignmentIcon,
    DirectionsRun as RunIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { usePlanoSemanal } from '../../../hooks/usePlanoSemanal';
import { AtletasService } from '../../../api/services/AtletasService';
import { TreinoService } from '../../../api/services/TreinoService';
import {
    formatarPeriodoSemana,
    calcularProgressoVolume,
    obterStatusColor,
    obterStatusLabel
} from '../../../types/PlanoSemanal';
import type { MetodoGeracaoPlano, PlanoStatus } from '../../../types/PlanoSemanal';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';
import TreinoRealizadoDialog from './TreinoRealizadoDialog';
import DetalheTreinoDialog from './DetalheTreinoDialog';
import TreinoCard from './TreinoCard';
import { EncerrarSemanaButton } from './EncerrarSemanaButton';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { PRIMARY_BTN_SX } from '../../../shared/components/actionButtonSx';
import { getSafeValue, getSafeNumber } from '../../../utils/safeValues';
import { primary, surface, semantic, categorical, content } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

interface PlanosDialogProps {
    open: boolean;
    onClose: () => void;
    atletaNome: string;
    atletaId: string;
}

const getDiaSemanaLabel = (diaSemana: TreinoPlanejado['diaSemana']): string => {
    if (typeof diaSemana === 'string') {
        return diaSemana;
    }
    return diaSemana?.value || diaSemana?.label || '';
};

const normalizeDiaSemana = (label: string): string => (
    label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z]/g, '')
);

const dayOrder: Record<string, number> = {
    segunda: 0,
    seg: 0,
    tercafeira: 1,
    terca: 1,
    ter: 1,
    quartafeira: 2,
    quarta: 2,
    qua: 2,
    quintafeira: 3,
    quinta: 3,
    qui: 3,
    sextafeira: 4,
    sexta: 4,
    sex: 4,
    sabado: 5,
    sab: 5,
    domingo: 6,
    dom: 6,
};

const getDiaSemanaOrder = (diaSemana: TreinoPlanejado['diaSemana']): number => {
    const label = getDiaSemanaLabel(diaSemana);
    const key = normalizeDiaSemana(label);
    if (key && dayOrder[key] !== undefined) {
        return dayOrder[key];
    }
    if (typeof diaSemana === 'object' && typeof diaSemana?.order === 'number') {
        return diaSemana.order;
    }
    return Number.MAX_SAFE_INTEGER;
};

const SummaryMetric: React.FC<{
    value: number | string;
    label: string;
    accent: string;
}> = ({ value, label, accent }) => (
    <Box
        sx={{
            borderRadius: 1,
            border: `1px solid ${content.cardBorder}`,
            bgcolor: elevation.card,
            p: 1.75,
            textAlign: 'center',
            height: '100%',
        }}
    >
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: accent, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
            {value}
        </Typography>
        <Typography variant="body2" sx={{ color: surface[400], mt: 0.5 }}>
            {label}
        </Typography>
    </Box>
);


const PlanosDialog: React.FC<PlanosDialogProps> = ({
    open,
    onClose,
    atletaNome,
    atletaId
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const {
        planos,
        loading,
        error,
        fetchPlanosPorAtleta,
        gerarPlanoSemanal,
        deletePlano,
        clearPlanos
    } = usePlanoSemanal();

    const [modoGeracao, setModoGeracao] = useState<MetodoGeracaoPlano>('PROXIMA_SEMANA');

    // Estados para o modal de conclusão de treino
    const [conclusaoModalOpen, setConclusaoModalOpen] = useState(false);
    const [treinoSelecionado, setTreinoSelecionado] = useState<TreinoPlanejado | null>(null);
    const [planoSemanalIdSelecionado, setPlanoSemanalIdSelecionado] = useState<string>('');

    // Estados para o modal de detalhes do treino
    const [detalheModalOpen, setDetalheModalOpen] = useState(false);
    const [treinoDetalhe, setTreinoDetalhe] = useState<TreinoPlanejado | null>(null);

    // Carrega os planos quando o dialog abre e atletaId está disponível
    useEffect(() => {
        console.log('PlanosDialog useEffect - open:', open, 'atletaId:', atletaId);
        if (open && atletaId) {
            console.log('Carregando planos para atleta:', atletaId);
            fetchPlanosPorAtleta(atletaId);
        }
        // Limpa os planos quando o dialog fecha
        if (!open) {
            console.log('Dialog fechado, limpando planos');
            clearPlanos();
        }
    }, [open, atletaId, fetchPlanosPorAtleta, clearPlanos]);

    // Debug dos estados
    useEffect(() => {
        console.log('PlanosDialog estados - loading:', loading, 'error:', error, 'planos:', planos);
    }, [loading, error, planos]);

    // Auto-seleciona o plano ativo ao carregar
    useEffect(() => {
        if (planos.length > 0 && !planoSemanalIdSelecionado) {
            const ativo = planos.find(p => p.status === 'ATIVO');
            const primeiroId = (ativo ?? planos[0]).id ?? '';
            setPlanoSemanalIdSelecionado(primeiroId);
        }
        // `planoSemanalIdSelecionado` fica fora da lista para preservar o comportamento atual:
        // selecionar apenas na carga inicial dos planos.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planos]);

    const handleGerarPlano = async () => {
        if(!atletaId) {
            console.error('ID do atleta não fornecido');
            return;
        }

        try {
            await gerarPlanoSemanal(atletaId, modoGeracao);
            // Após gerar, recarrega a lista automaticamente
        } catch (err) {
            console.error('Erro ao gerar plano semanal:', err);
        }
    };

    const handleDeletePlano = async (planoSemanalId: string) => {
        if(!planoSemanalId) {
            console.error('ID do plano semanal não fornecido');
            return;
        }

        try {
            await deletePlano(planoSemanalId);
            // Após deletar, recarrega a lista automaticamente
        } catch (err) {
            console.error('Erro ao deletar plano semanal:', err);
        }
    };

    // Funções para o modal de conclusão
    const handleOpenConclusaoModal = (treino: TreinoPlanejado, planoSemanalId: string) => {
        setTreinoSelecionado(treino);
        setPlanoSemanalIdSelecionado(planoSemanalId);
        setConclusaoModalOpen(true);
    };

    const handleCloseConclusaoModal = () => {
        setConclusaoModalOpen(false);
        setTreinoSelecionado(null);
        setPlanoSemanalIdSelecionado('');
    };

    // Funções para o modal de detalhes
    const handleOpenDetalheModal = (treino: TreinoPlanejado) => {
        setTreinoDetalhe(treino);
        setDetalheModalOpen(true);
    };

    const handleCloseDetalheModal = () => {
        setDetalheModalOpen(false);
        setTreinoDetalhe(null);
    };

    const handleRecalcularMetricas = async () => {
        if (!atletaId) return;
        try {
            await AtletasService.recalcularMetricas(atletaId);
        } catch (err) {
            console.error('Erro ao recalcular métricas:', err);
        }
    };

    const handleSuccess = async () => {
        // Recarregar os dados do plano
        if (atletaId) {
            console.log('Recarregando planos após marcar como realizado...');
            await fetchPlanosPorAtleta(atletaId);
            console.log('Planos recarregados:', planos);
        }
    };

    const handleMarcarPerdido = async (treinoId: string) => {
        try {
            await TreinoService.marcarComoPerdido(treinoId);
            if (atletaId) {
                await fetchPlanosPorAtleta(atletaId);
            }
        } catch (err) {
            console.error('Erro ao marcar treino como perdido:', err);
        }
    };

    const planoAtivo = planos.find(p => p.status === 'ATIVO');
    const temPlanoAtivo = !!planoAtivo;

    const planosChips = (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
            <Chip
                label={`${planos.length} plano(s)`}
                size="small"
                sx={{
                    bgcolor: `${surface[0]}1F`,
                    color: surface[200],
                    fontWeight: 700,
                    border: `1px solid ${surface[0]}1F`,
                }}
            />
            {temPlanoAtivo && (
                <Chip
                    label="Plano ativo"
                    size="small"
                    sx={{
                        bgcolor: `${primary[500]}26`,
                        color: primary[500],
                        border: `1px solid ${primary[500]}4D`,
                        fontWeight: 700,
                    }}
                />
            )}
        </Box>
    );

    const planosHeaderActions = (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' }, width: { xs: '100%', md: 'auto' } }}>
                    <ToggleButtonGroup
                        value={modoGeracao}
                        exclusive
                        size="small"
                        onChange={(_, value) => { if (value) setModoGeracao(value); }}
                        disabled={loading || temPlanoAtivo}
                        sx={{
                            width: { xs: '100%', sm: 'auto' },
                            '& .MuiToggleButton-root': {
                                color: surface[200],
                                borderColor: content.cardBorder,
                                bgcolor: `${surface[0]}0A`,
                                textTransform: 'none',
                                px: 1.25,
                                fontSize: { xs: '0.75rem', md: '0.8125rem' },
                                minHeight: { xs: 38, md: 32 },
                            },
                            '& .MuiToggleButton-root.Mui-selected': {
                                color: surface[900],
                                bgcolor: primary[500],
                                '&:hover': { bgcolor: primary[400] },
                            },
                        }}
                    >
                        <ToggleButton value="PROXIMA_SEMANA">Próx. Semana</ToggleButton>
                        <ToggleButton value="SEMANA_ATUAL">Sem. Atual</ToggleButton>
                    </ToggleButtonGroup>
                    <Button
                        variant='outlined'
                        startIcon={<RefreshIcon />}
                        onClick={handleRecalcularMetricas}
                        disabled={loading}
                        size='small'
                        sx={{
                            width: { xs: '100%', sm: 'auto' },
                            color: surface[50],
                            borderColor: content.cardBorder,
                            bgcolor: `${surface[0]}0A`,
                            fontSize: { xs: '0.78rem', md: '0.8125rem' },
                            minHeight: { xs: 38, md: 32 },
                            '&:hover': {
                                borderColor: `${surface[0]}3D`,
                                bgcolor: `${surface[0]}14`,
                            },
                        }}
                    >
                        Recalcular Métricas
                    </Button>
                    <Button
                        variant='outlined'
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeletePlano(planoSemanalIdSelecionado)}
                        disabled={loading || !planoSemanalIdSelecionado}
                        size='small'
                        sx={{
                            width: { xs: '100%', sm: 'auto' },
                            color: semantic.danger[300],
                            borderColor: `${semantic.danger[500]}47`,
                            bgcolor: `${semantic.danger[700]}1F`,
                            fontSize: { xs: '0.78rem', md: '0.8125rem' },
                            minHeight: { xs: 38, md: 32 },
                            '&:hover': {
                                borderColor: `${semantic.danger[500]}6B`,
                                bgcolor: `${semantic.danger[700]}2E`,
                            },
                        }}
                    >
                        Excluir Plano
                    </Button>
                    <Button
                        variant='contained'
                        startIcon={<AddIcon />}
                        onClick={handleGerarPlano}
                        disabled={loading || temPlanoAtivo}
                        size="small"
                        sx={{
                            ...PRIMARY_BTN_SX,
                            width: { xs: '100%', sm: 'auto' },
                            fontSize: { xs: '0.78rem', md: '0.8125rem' },
                            minHeight: { xs: 38, md: 32 },
                        }}
                    >
                        {loading ? 'Gerando...' : 'Gerar Plano'}
                    </Button>
                </Box>
    );

    return (
        <>
        <CoachDialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            chip={planosChips}
            title={`Planos Semanais de ${atletaNome}`}
            subtitle="Acompanhe volume, progresso e treinos planejados com a mesma leitura visual usada no detalhe do treino."
            headerAction={planosHeaderActions}
            contentSx={{ p: 0, background: elevation.base }}
            actions={
                <Button onClick={onClose} size="small" variant="contained" fullWidth={isMobile} sx={{ ...PRIMARY_BTN_SX, fontSize: { xs: '0.8rem', md: '0.875rem' }, minHeight: { xs: 40, md: 32 } }}>
                    Fechar
                </Button>
            }
        >
                {loading && (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="320px">
                        <CircularProgress size={60} />
                        <Typography sx={{ mt: 2 }} color="text.secondary">
                            Carregando planos semanais...
                        </Typography>
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ m: 3 }}>
                        {error.message}
                    </Alert>
                )}

                {!loading && !error && planos.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                        <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Nenhum plano semanal encontrado
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Clique em "Gerar Plano" para criar um novo plano semanal para este atleta.
                        </Typography>
                    </Box>
                )}

                {!loading && !error && planos.length > 0 && (
                    <Stack spacing={2.5} sx={{ p: { xs: 1.5, md: 3 } }}>
                        {planos.map((plano, index) => {
                            const volumePlanejado = getSafeNumber(plano.volumePlanejadoKm);
                            const status = getSafeValue(plano.status) as PlanoStatus;

                            // Calcula volumeRealizado a partir dos treinos realizados
                            const volumeRealizado = (plano.treinosPlanejados || []).reduce((total, treino) => {
                                const treinoStatus = typeof treino.statusTreino === 'object'
                                    ? treino.statusTreino?.value
                                    : treino.statusTreino;
                                const isRealizado = treinoStatus === 'REALIZADO' || treino.realizado === true;
                                return total + (isRealizado ? getSafeNumber(treino.distanciaKm) : 0);
                            }, 0);

                            const progresso = calcularProgressoVolume(volumeRealizado, volumePlanejado);
                            const statusColor = obterStatusColor(status);

                            return (
                                <Card
                                    key={plano.id || index}
                                    variant="outlined"
                                    onClick={() => setPlanoSemanalIdSelecionado(plano.id || '')}
                                    sx={{
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        bgcolor: elevation.card,
                                        borderColor: planoSemanalIdSelecionado === plano.id ? primary[500] : content.cardBorder,
                                        transition: 'border-color 0.15s ease, transform 0.15s ease',
                                        '&:hover': {
                                            borderColor: `${primary[500]}80`,
                                            transform: 'translateY(-1px)',
                                        },
                                    }}
                                >
                                    <CardContent sx={{ p: 2.5 }}>
                                        {/* Header com período e status */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                                            <Box>
                                                <Typography
                                                    sx={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 800,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        color: surface[400],
                                                        mb: 0.5,
                                                    }}
                                                >
                                                    Semana planejada
                                                </Typography>
                                                <Typography variant="h6" component="h3" sx={{ fontWeight: 700, color: surface[50] }}>
                                                    {formatarPeriodoSemana(getSafeValue(plano.semanaInicio) as string, getSafeValue(plano.semanaFim) as string)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Chip
                                                    label={obterStatusLabel(status)}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: statusColor,
                                                        color: 'white',
                                                        fontWeight: 'bold'
                                                    }}
                                                />
                                            </Box>
                                        </Box>

                                        {/* Encerrar semana (ação on-demand do treinador) — não em planos já concluídos */}
                                        {plano.id && status !== 'CONCLUIDO' && (
                                            <Box sx={{ mb: 2 }}>
                                                <EncerrarSemanaButton
                                                    planoId={plano.id}
                                                    onEncerrado={() => { if (atletaId) fetchPlanosPorAtleta(atletaId); }}
                                                    onGerarProximaSemana={() => { if (atletaId) gerarPlanoSemanal(atletaId, 'PROXIMA_SEMANA'); }}
                                                />
                                            </Box>
                                        )}

                                        {/* Volumes */}
                                        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                <SummaryMetric value={volumePlanejado} label="Volume Planejado (km)" accent={categorical.cat1} />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                <SummaryMetric value={volumeRealizado} label="Volume Realizado (km)" accent={semantic.success[500]} />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                <SummaryMetric value={getSafeNumber(plano.volumeAlvoKm)} label="Volume Alvo (km)" accent={semantic.warning[500]} />
                                            </Grid>
                                        </Grid>

                                        {/* Barra de progresso */}
                                        <Box
                                            sx={{
                                                mb: 2.5,
                                                borderRadius: 1,
                                                border: `1px solid ${content.cardBorder}`,
                                                bgcolor: elevation.panel,
                                                p: 1.5,
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2" sx={{ color: surface[400] }}>
                                                    Progresso do Volume
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: surface[400] }}>
                                                    {progresso}%
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.min(progresso, 100)}
                                                sx={{
                                                    height: 8,
                                                    borderRadius: 4,
                                                    backgroundColor: surface[700],
                                                    '& .MuiLinearProgress-bar': {
                                                        borderRadius: 4,
                                                        backgroundColor: semantic.success[500],
                                                    },
                                                }}
                                            />
                                        </Box>

                                        {/* Objetivo Semanal */}
                                        {plano.objetivoSemanal && (
                                            <>
                                                <Divider sx={{ my: 2 }} />
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                    <FlagIcon color="primary" sx={{ mt: 0.5 }} />
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                                            Objetivo Semanal
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {getSafeValue(plano.objetivoSemanal)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </>
                                        )}

                                        {/* Observações */}
                                        {plano.observacoes && (
                                            <>
                                                <Divider sx={{ my: 2 }} />
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                    <AssignmentIcon color="action" sx={{ mt: 0.5 }} />
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                                            Observações
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {getSafeValue(plano.observacoes)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </>
                                        )}

                                        {/* Treinos Planejados */}
                                                {plano.treinosPlanejados && plano.treinosPlanejados.length > 0 && (
                                                    <>
                                                        <Divider sx={{ my: 2 }} />
                                                        <Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                                        <RunIcon color="primary" />
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                            Treinos da Semana ({plano.treinosPlanejados.length})
                                                        </Typography>
                                                    </Box>

                                                            <Grid container spacing={2}>
                                                        {[...plano.treinosPlanejados]
                                                            .sort((a, b) => getDiaSemanaOrder(a.diaSemana) - getDiaSemanaOrder(b.diaSemana))
                                                            .map((treino, treinoIndex) => (
                                                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={treino.id || treinoIndex}>
                                                                    <TreinoCard
                                                                        treino={treino}
                                                                        onDetalhes={() => handleOpenDetalheModal(treino)}
                                                                        onMarcarRealizado={() => handleOpenConclusaoModal(treino, plano.id || '')}
                                                                        onMarcarPerdido={treino.id ? () => handleMarcarPerdido(treino.id!) : undefined}
                                                                    />
                                                                </Grid>
                                                            ))}
                                                            </Grid>
                                                        </Box>
                                                    </>
                                                )}

                                        {/* TSB (Training Stress Balance) */}
                                        {(plano.tsbInicio !== undefined || plano.tsbFim !== undefined) && (
                                            <>
                                                <Divider sx={{ my: 2 }} />
                                                <Box
                                                    sx={{
                                                        borderRadius: 1,
                                                        border: `1px solid ${content.cardBorder}`,
                                                        bgcolor: elevation.panel,
                                                        p: 1.5,
                                                    }}
                                                >
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                        Training Stress Balance (TSB)
                                                    </Typography>
                                                    <Grid container spacing={2}>
                                                        {plano.tsbInicio !== undefined && (
                                                            <Grid>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Início: <strong>{getSafeValue(plano.tsbInicio)}</strong>
                                                                </Typography>
                                                            </Grid>
                                                        )}
                                                        {plano.tsbFim !== undefined && (
                                                            <Grid>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Fim: <strong>{getSafeValue(plano.tsbFim)}</strong>
                                                                </Typography>
                                                            </Grid>
                                                        )}
                                                    </Grid>
                                                </Box>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Stack>
                )}
        </CoachDialog>

        <TreinoRealizadoDialog
            open={conclusaoModalOpen}
            onClose={handleCloseConclusaoModal}
            treino={treinoSelecionado}
            atletaId={atletaId}
            planoSemanalId={planoSemanalIdSelecionado}
            onSuccess={handleSuccess}
        />

        <DetalheTreinoDialog
            open={detalheModalOpen}
            onClose={handleCloseDetalheModal}
            treino={treinoDetalhe}
        />
        </>
    );
};

export default PlanosDialog;
