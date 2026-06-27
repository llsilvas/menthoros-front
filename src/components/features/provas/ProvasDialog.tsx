import React, { useEffect, useState } from 'react';
import {
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    Chip,
    useMediaQuery,
} from '@mui/material';
import {
    Add as AddIcon,
    EditOutlined as EditIcon,
    DeleteOutline as DeleteIcon,
    EmojiEvents as EmojiEventsIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useProvas } from '../../../hooks/useProvas';
import { primary, surface, content } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { CoachDialog } from '../../../features/coach/components/CoachDialog';
import { PRIMARY_BTN_SX } from '../../../features/coach/components/actionButtonSx';
import ProvaFormDialog from './ProvaFormDialog';
import type { Prova, CreateProva, UpdateProva } from '../../../types/Prova';
import {
    TIPO_PROVA_LABELS,
    DISTANCIA_PROVA_LABELS,
    PROVA_STATUS_LABELS,
    PROVA_STATUS_COLORS,
    extractTipoKey,
    extractDistanciaKey,
    extractStatusKey,
} from '../../../types/Prova';

interface ProvasDialogProps {
    open: boolean;
    onClose: () => void;
    atletaId: string;
    atletaNome: string;
    onGerarProjecao?: (provaId: string) => void;
}

const ProvasDialog: React.FC<ProvasDialogProps> = ({ open, onClose, atletaId, atletaNome, onGerarProjecao }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const {
        provas,
        loading,
        error,
        fetchProvas,
        createProva,
        updateProva,
        deleteProva,
        clearProvas,
        clearError,
    } = useProvas();

    const [formOpen, setFormOpen] = useState(false);
    const [selectedProva, setSelectedProva] = useState<Prova | undefined>(undefined);

    useEffect(() => {
        if (open && atletaId) {
            fetchProvas(atletaId);
        }
        if (!open) {
            clearProvas();
        }
    }, [open, atletaId, fetchProvas, clearProvas]);

    const handleOpenForm = (prova?: Prova) => {
        setSelectedProva(prova);
        setFormOpen(true);
    };

    const handleCloseForm = () => {
        setFormOpen(false);
        setSelectedProva(undefined);
    };

    const handleSave = async (data: CreateProva | UpdateProva) => {
        if (selectedProva) {
            await updateProva(atletaId, selectedProva.id, data as UpdateProva);
        } else {
            await createProva(atletaId, data as CreateProva);
        }
        handleCloseForm();
    };

    const handleDelete = async (provaId: string, nomeProva: string) => {
        if (window.confirm(`Tem certeza que deseja excluir a prova "${nomeProva}"?`)) {
            await deleteProva(atletaId, provaId);
        }
    };

    const columns: GridColDef[] = [
        {
            field: 'nomeProva',
            headerName: 'Nome',
            flex: 1,
            minWidth: 160,
        },
        {
            field: 'dataProva',
            headerName: 'Data',
            width: 110,
        },
        {
            field: 'tipoProva',
            headerName: 'Tipo',
            width: 130,
            valueFormatter: (value: unknown) => {
                const key = extractTipoKey(value);
                return key ? (TIPO_PROVA_LABELS[key] ?? key) : '—';
            },
        },
        {
            field: 'distancia',
            headerName: 'Distância',
            width: 160,
            valueFormatter: (value: unknown) => {
                const key = extractDistanciaKey(value);
                return key ? (DISTANCIA_PROVA_LABELS[key] ?? key) : '—';
            },
        },
        {
            field: 'statusProva',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => {
                const key = extractStatusKey(params.value);
                if (!key) return <Typography variant="caption">—</Typography>;
                return (
                    <Chip
                        label={PROVA_STATUS_LABELS[key] ?? key}
                        size="small"
                        sx={{
                            bgcolor: PROVA_STATUS_COLORS[key] ?? surface[500],
                            color: surface[50],
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 22,
                        }}
                    />
                );
            },
        },
        {
            field: 'provaAlvo',
            headerName: 'Alvo',
            width: 70,
            type: 'boolean',
            renderCell: (params) => params.value
                ? <Typography variant="caption" color="warning.main" sx={{ fontWeight: 700 }}>Sim</Typography>
                : <Typography variant="caption" color="text.disabled">—</Typography>,
        },
        {
            field: 'diasFaltando',
            headerName: 'Dias',
            width: 80,
            type: 'number',
            renderCell: (params) => {
                const dias = params.value as number | undefined;
                if (dias === undefined || dias === null) return <Typography variant="caption" color="text.disabled">—</Typography>;
                if (dias < 0) return <Typography variant="caption" color="text.disabled">Passada</Typography>;
                return (
                    <Typography variant="caption" sx={{ fontWeight: 600, color: dias <= 30 ? 'error.main' : dias <= 90 ? 'warning.main' : 'text.primary' }}>
                        {dias}d
                    </Typography>
                );
            },
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Ações',
            width: 120,
            getActions: (params: GridRowParams) => {
                const prova = params.row as Prova;
                const isFutura = (prova.diasFaltando ?? -1) >= 0;
                const actions = [
                    <GridActionsCellItem
                        key="edit"
                        icon={<EditIcon />}
                        label="Editar"
                        onClick={() => handleOpenForm(prova)}
                    />,
                    <GridActionsCellItem
                        key="delete"
                        icon={<DeleteIcon />}
                        label="Excluir"
                        onClick={() => handleDelete(prova.id, prova.nomeProva)}
                    />,
                ];
                if (isFutura && onGerarProjecao) {
                    actions.unshift(
                        <GridActionsCellItem
                            key="projetar"
                            icon={<TrendingUpIcon sx={{ color: primary[500] }} />}
                            label="Projetar Tempo"
                            showInMenu={false}
                            onClick={() => onGerarProjecao(prova.id)}
                        />
                    );
                }
                return actions;
            },
        },
    ];

    const provasChip = (
        <Chip
            label={`${provas.length} prova(s)`}
            size="small"
            sx={{
                bgcolor: content.cardBgHover,
                color: surface[200],
                fontWeight: 700,
                border: `1px solid ${content.cardBorder}`,
            }}
        />
    );

    const novaProvaButton = (
        <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
            disabled={loading}
            size="small"
            sx={{
                ...PRIMARY_BTN_SX,
                width: { xs: '100%', sm: 'auto' },
                fontSize: { xs: '0.78rem', md: '0.8125rem' },
                minHeight: { xs: 38, md: 32 },
            }}
        >
            Nova Prova
        </Button>
    );

    return (
        <>
            <CoachDialog
                open={open}
                onClose={onClose}
                maxWidth="lg"
                chip={provasChip}
                title={`Provas de ${atletaNome}`}
                subtitle="Visualize provas cadastradas, status e contagem regressiva no mesmo padrão dos dialogs de atleta e planos."
                headerAction={novaProvaButton}
                contentSx={{
                    p: 0,
                    background: `radial-gradient(circle at top right, ${primary[500]}14, transparent 24%), linear-gradient(180deg, ${elevation.base} 0%, ${elevation.panel} 100%)`,
                }}
                actionsHint={
                    <Typography variant="caption" sx={{ color: surface[400] }}>
                        Padrão visual alinhado à jornada de atletas, planos e treino.
                    </Typography>
                }
                actions={
                    <Button onClick={onClose} size="small" variant="contained" fullWidth={isMobile} sx={{ ...PRIMARY_BTN_SX, fontSize: { xs: '0.8rem', md: '0.875rem' }, minHeight: { xs: 40, md: 32 } }}>
                        Fechar
                    </Button>
                }
            >
                    {error && (
                        <Alert severity="error" onClose={clearError} sx={{ m: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {loading && provas.length === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
                            <CircularProgress size={48} />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                Carregando provas...
                            </Typography>
                        </Box>
                    )}

                        <Box sx={{ p: { xs: 1.5, md: 3 } }}>
                        <Box
                            sx={{
                                borderRadius: 1,
                                border: `1px solid ${content.cardBorder}`,
                                background: elevation.card,
                                p: 2,
                                minHeight: 300,
                            }}
                        >
                            {!loading && !error && provas.length === 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
                                    <EmojiEventsIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
                                    <Typography variant="body1" color="text.secondary" gutterBottom>
                                        Nenhuma prova cadastrada
                                    </Typography>
                                    <Typography variant="body2" color="text.disabled">
                                        Clique em "Nova Prova" para adicionar.
                                    </Typography>
                                </Box>
                            ) : (
                                <DataGrid
                                    rows={provas}
                                    columns={columns}
                                    loading={loading}
                                    density="compact"
                                    rowHeight={44}
                                    hideFooterPagination
                                    hideFooter={provas.length <= 25}
                                    pageSizeOptions={[25]}
                                    disableRowSelectionOnClick
                                    sx={{
                                        border: 'none',
                                        '--DataGrid-containerBackground': 'transparent',
                                        '& .MuiDataGrid-columnHeaders': {
                                            minHeight: 44,
                                            borderRadius: 1,
                                        },
                                        '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600 },
                                        '& .MuiDataGrid-cell': { py: 0.5 },
                                        '& .MuiDataGrid-main': { borderRadius: 1 },
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
            </CoachDialog>

            <ProvaFormDialog
                open={formOpen}
                onClose={handleCloseForm}
                onSave={handleSave}
                prova={selectedProva}
            />
        </>
    );
};

export default ProvasDialog;
