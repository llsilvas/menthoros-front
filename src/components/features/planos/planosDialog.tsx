import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
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
    ToggleButtonGroup
} from '@mui/material';
import {
    Add as AddIcon,
    Close as CloseIcon,
    Delete as DeleteIcon,
    Flag as FlagIcon,
    Assignment as AssignmentIcon,
    DirectionsRun as RunIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { usePlanoSemanal } from '../../../hooks/usePlanoSemanal';
import { AtletasService } from '../../../api/services/AtletasService';
import {
    formatarPeriodoSemana,
    calcularProgressoVolume,
    obterStatusColor,
    obterStatusLabel
} from '../../../types/PlanoSemanal';
import type { MetodoGeracaoPlano, PlanoStatus } from '../../../types/PlanoSemanal';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';
import TreinoRealizadoDialog from '../TreinoRealizadoDialog';
import DetalheTreinoDialog from './DetalheTreinoDialog';
import TreinoCard from './TreinoCard';
import { getSafeValue, getSafeNumber } from '../../../utils/safeValues';
import { glass } from '../../../theme/tokens';

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
            border: '1px solid #d1d5db',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            p: 1.75,
            textAlign: 'center',
            height: '100%',
        }}
    >
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: accent, lineHeight: 1.1 }}>
            {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
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

    const planoAtivo = planos.find(p => p.status === 'ATIVO');
    const temPlanoAtivo = !!planoAtivo;

    return (
        <>
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            slotProps={{
                paper: {
                    sx: {
                        overflow: 'hidden',
                        borderRadius: 1,
                        backgroundColor: '#ffffff',
                    },
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    px: 3,
                    py: 2.25,
                    pr: 8,
                    color: 'white',
                    background: 'linear-gradient(135deg, #082130 0%, #0e3147 55%, #133c56 100%)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                            label={`${planos.length} plano(s)`}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.12)',
                                color: '#e8eaed',
                                fontWeight: 700,
                                border: '1px solid rgba(255,255,255,0.12)',
                            }}
                        />
                        {temPlanoAtivo && (
                            <Chip
                                label="Plano ativo"
                                size="small"
                                sx={{
                                    bgcolor: alpha('#b3ff00', 0.16),
                                    color: '#f8fafc',
                                    border: `1px solid ${alpha('#b3ff00', 0.28)}`,
                                    fontWeight: 700,
                                }}
                            />
                        )}
                    </Box>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            fontFamily: 'Syne, sans-serif',
                            fontWeight: 800,
                            lineHeight: 1.15,
                            pr: 2,
                        }}
                    >
                        Planos Semanais de {atletaNome}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            mt: 0.75,
                            color: 'rgba(232, 234, 237, 0.72)',
                            maxWidth: 760,
                        }}
                    >
                        Acompanhe volume, progresso e treinos planejados com a mesma leitura visual usada no detalhe do treino.
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end', mr: 2 }}>
                    <ToggleButtonGroup
                        value={modoGeracao}
                        exclusive
                        size="small"
                        onChange={(_, value) => { if (value) setModoGeracao(value); }}
                        disabled={loading || temPlanoAtivo}
                        sx={{
                            '& .MuiToggleButton-root': {
                                color: 'rgba(255,255,255,0.78)',
                                borderColor: 'rgba(255,255,255,0.14)',
                                bgcolor: 'rgba(255,255,255,0.04)',
                                textTransform: 'none',
                                px: 1.25,
                            },
                            '& .MuiToggleButton-root.Mui-selected': {
                                color: '#082130',
                                bgcolor: '#ffffff',
                                '&:hover': {
                                    bgcolor: '#ffffff',
                                },
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
                            color: '#ffffff',
                            borderColor: 'rgba(255,255,255,0.18)',
                            bgcolor: 'rgba(255,255,255,0.04)',
                            '&:hover': {
                                borderColor: 'rgba(255,255,255,0.26)',
                                bgcolor: 'rgba(255,255,255,0.08)',
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
                            color: '#fecaca',
                            borderColor: 'rgba(248,113,113,0.28)',
                            bgcolor: 'rgba(127,29,29,0.12)',
                            '&:hover': {
                                borderColor: 'rgba(248,113,113,0.42)',
                                bgcolor: 'rgba(127,29,29,0.18)',
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
                            bgcolor: '#b3ff00',
                            color: '#082130',
                            fontWeight: 700,
                            '&:hover': {
                                bgcolor: '#c8ff4d',
                            },
                        }}
                    >
                        {loading ? 'Gerando...' : 'Gerar Plano'}
                    </Button>
                </Box>

                <Button
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 12,
                        top: 12,
                        minWidth: 0,
                        width: 36,
                        height: 36,
                        p: 0,
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.08)',
                        bgcolor: 'rgba(255,255,255,0.06)',
                        '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.12)',
                        },
                    }}
                >
                    <CloseIcon fontSize="small" />
                </Button>
            </DialogTitle>
            <DialogContent
                sx={{
                    p: 0,
                    background:
                        'radial-gradient(circle at top right, rgba(179,233,45,0.08), transparent 24%), linear-gradient(180deg, #eef3f8 0%, #e8edf4 100%)',
                }}
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
                    <Stack spacing={2.5} sx={{ p: { xs: 2, md: 3 } }}>
                        {planos.map((plano, index) => {
                            const volumeRealizado = getSafeNumber(plano.volumeRealizadoKm);
                            const volumePlanejado = getSafeNumber(plano.volumePlanejadoKm);
                            const status = getSafeValue(plano.status) as PlanoStatus;

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
                                        borderColor: planoSemanalIdSelecionado === plano.id ? 'primary.main' : '#d1d5db',
                                        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                                        transition: 'border-color 0.15s ease, transform 0.15s ease',
                                        '&:hover': {
                                            borderColor: alpha('#1976d2', 0.5),
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
                                                        color: '#6b7a8d',
                                                        mb: 0.5,
                                                    }}
                                                >
                                                    Semana planejada
                                                </Typography>
                                                <Typography variant="h6" component="h3" sx={{ fontWeight: 700, color: '#1a2535' }}>
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

                                        {/* Volumes */}
                                        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                <SummaryMetric value={volumePlanejado} label="Volume Planejado (km)" accent="#1976d2" />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                <SummaryMetric value={volumeRealizado} label="Volume Realizado (km)" accent="#2e7d32" />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                <SummaryMetric value={getSafeNumber(plano.volumeAlvoKm)} label="Volume Alvo (km)" accent="#ed6c02" />
                                            </Grid>
                                        </Grid>

                                        {/* Barra de progresso */}
                                        <Box
                                            sx={{
                                                mb: 2.5,
                                                borderRadius: 1,
                                                border: '1px solid #d1d5db',
                                                bgcolor: '#fff',
                                                p: 1.5,
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Progresso do Volume
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {progresso}%
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.min(progresso, 100)}
                                                sx={{
                                                    height: 8,
                                                    borderRadius: 4,
                                                    bgcolor: glass.background,
                                                    '& .MuiLinearProgress-bar': {
                                                        borderRadius: 4
                                                    }
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
                                                        border: '1px solid #d1d5db',
                                                        bgcolor: '#fff',
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
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="caption" sx={{ color: '#6b7a8d' }}>
                        Visual alinhado ao detalhe do treino para manter consistência entre lista e drill-down.
                    </Typography>
                </Box>
                <Button onClick={onClose} color="primary" size="small" variant="contained">
                    Fechar
                </Button>
            </DialogActions>
        </Dialog>

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
