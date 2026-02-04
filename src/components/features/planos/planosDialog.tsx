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
    Stack
} from '@mui/material';
import {
    Add as AddIcon,
    Flag as FlagIcon,
    Assignment as AssignmentIcon,
    DirectionsRun as RunIcon,
} from '@mui/icons-material';
import { usePlanoSemanal } from '../../../hooks/usePlanoSemanal';
import {
    formatarPeriodoSemana,
    calcularProgressoVolume,
    obterStatusColor,
    obterStatusLabel
} from '../../../types/PlanoSemanal';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';
import TreinoRealizadoDialog from '../TreinoRealizadoDialog';
import DetalheTreinoDialog from './DetalheTreinoDialog';
import TreinoCard from './TreinoCard';
import { getSafeValue, getSafeNumber } from '../../../utils/safeValues';

interface PlanosDialogProps {
    open: boolean;
    onClose: () => void;
    atletaNome: string;
    atletaId: string;
}



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
        clearPlanos
    } = usePlanoSemanal();

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

    const handleGerarPlano = async () => {
        if(!atletaId) {
            console.error('ID do atleta não fornecido');
            return;
        }

        try {
            await gerarPlanoSemanal(atletaId);
            // Após gerar, recarrega a lista automaticamente
        } catch (err) {
            console.error('Erro ao gerar plano semanal:', err);
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

    const handleSuccess = async () => {
        // Recarregar os dados do plano
        if (atletaId) {
            console.log('Recarregando planos após marcar como realizado...');
            await fetchPlanosPorAtleta(atletaId);
            console.log('Planos recarregados:', planos);
        }
    };

    return (
        <>
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant='h6' component="h1">
                    Planos Semanais de {atletaNome}
                </Typography>
                <Button
                    variant='contained'
                    color='primary'
                    startIcon={<AddIcon />}
                    onClick={handleGerarPlano}
                    disabled={loading}
                >
                    {loading ? 'Gerando...' : 'Gerar Plano'}
                </Button>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
                {loading && (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="300px">
                        <CircularProgress size={60} />
                        <Typography sx={{ mt: 2 }} color="text.secondary">
                            Carregando planos semanais...
                        </Typography>
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error.message}
                    </Alert>
                )}

                {!loading && !error && planos.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
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
                    <Stack spacing={3}>
                        {planos.map((plano, index) => {
                            const volumeRealizado = getSafeNumber(plano.volumeRealizadoKm);
                            const volumePlanejado = getSafeNumber(plano.volumePlanejadoKm);
                            const status = getSafeValue(plano.status);

                            const progresso = calcularProgressoVolume(volumeRealizado, volumePlanejado);
                            const statusColor = obterStatusColor(status as any);

                            return (
                                <Card key={plano.id || index} elevation={3} sx={{ overflow: 'visible' }}>
                                    <CardContent sx={{ p: 3 }}>
                                        {/* Header com período e status */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6" component="h3">
                                                {formatarPeriodoSemana(getSafeValue(plano.semanaInicio) as string, getSafeValue(plano.semanaFim) as string)}
                                            </Typography>
                                            <Chip
                                                label={obterStatusLabel(status as any)}
                                                sx={{
                                                    bgcolor: statusColor,
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                        </Box>

                                        {/* Volumes */}
                                        <Grid container spacing={3} sx={{ mb: 3 }}>
                                            <Grid>
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                                                        {volumePlanejado}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Volume Planejado (km)
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid>
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                                                        {volumeRealizado}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Volume Realizado (km)
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid>
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                                                        {getSafeNumber(plano.volumeAlvoKm)}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Volume Alvo (km)
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>

                                        {/* Barra de progresso */}
                                        <Box sx={{ mb: 3 }}>
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
                                                    bgcolor: 'grey.200',
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
                                                        {plano.treinosPlanejados.map((treino, treinoIndex) => (
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
                                                <Box>
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
            <DialogActions>
                <Button onClick={onClose} color="primary">
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
