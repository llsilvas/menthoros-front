import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    Chip,
} from '@mui/material';
import {
    Add as AddIcon,
    Close as CloseIcon,
    EditOutlined as EditIcon,
    DeleteOutline as DeleteIcon,
    EmojiEvents as EmojiEventsIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useProvas } from '../../../hooks/useProvas';
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
}

const ProvasDialog: React.FC<ProvasDialogProps> = ({ open, onClose, atletaId, atletaNome }) => {
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
                            bgcolor: PROVA_STATUS_COLORS[key] ?? '#757575',
                            color: 'white',
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
            width: 90,
            getActions: (params: GridRowParams) => [
                <GridActionsCellItem
                    key="edit"
                    icon={<EditIcon />}
                    label="Editar"
                    onClick={() => handleOpenForm(params.row as Prova)}
                />,
                <GridActionsCellItem
                    key="delete"
                    icon={<DeleteIcon />}
                    label="Excluir"
                    onClick={() => handleDelete(params.row.id, params.row.nomeProva)}
                />,
            ],
        },
    ];

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
                                label={`${provas.length} prova(s)`}
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.12)',
                                    color: '#e8eaed',
                                    fontWeight: 700,
                                    border: '1px solid rgba(255,255,255,0.12)',
                                }}
                            />
                        </Box>
                        <Typography
                            variant="h6"
                            sx={{
                                fontFamily: 'Syne, sans-serif',
                                fontWeight: 800,
                                lineHeight: 1.15,
                                pr: 2,
                            }}
                        >
                            Provas de {atletaNome}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.75, color: 'rgba(232, 234, 237, 0.72)', maxWidth: 720 }}>
                            Visualize provas cadastradas, status e contagem regressiva no mesmo padrão dos dialogs de atleta e planos.
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenForm()}
                        disabled={loading}
                        size="small"
                        sx={{
                            mr: 2,
                            bgcolor: '#b3ff00',
                            color: '#082130',
                            fontWeight: 700,
                            '&:hover': {
                                bgcolor: '#c8ff4d',
                            },
                        }}
                    >
                        Nova Prova
                    </Button>

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

                    <Box sx={{ p: { xs: 2, md: 3 } }}>
                        <Box
                            sx={{
                                borderRadius: 1,
                                border: '1px solid rgba(255,255,255,0.7)',
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.94) 100%)',
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
                                        '--DataGrid-containerBackground': 'rgba(255, 255, 255, 0.55)',
                                        '& .MuiDataGrid-columnHeaders': {
                                            minHeight: 44,
                                            borderRadius: 1,
                                            bgcolor: alpha('#0e3147', 0.04),
                                        },
                                        '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600 },
                                        '& .MuiDataGrid-cell': { py: 0.5 },
                                        '& .MuiDataGrid-main': { borderRadius: 1 },
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="caption" sx={{ color: '#6b7a8d' }}>
                            Padrão visual alinhado à jornada de atletas, planos e treino.
                        </Typography>
                    </Box>
                    <Button onClick={onClose} color="primary" size="small" variant="contained">
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>

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
