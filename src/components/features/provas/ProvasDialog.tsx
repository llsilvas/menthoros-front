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
    EditOutlined as EditIcon,
    DeleteOutline as DeleteIcon,
    EmojiEvents as EmojiEventsIcon,
} from '@mui/icons-material';
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
            valueFormatter: (value: any) => {
                const key = extractTipoKey(value);
                return key ? (TIPO_PROVA_LABELS[key] ?? key) : '—';
            },
        },
        {
            field: 'distancia',
            headerName: 'Distância',
            width: 160,
            valueFormatter: (value: any) => {
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
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{ px: 2, py: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            Provas de {atletaNome}
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenForm()}
                            disabled={loading}
                            size="small"
                        >
                            Nova Prova
                        </Button>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ p: 2, minHeight: 300 }}>
                    {error && (
                        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
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

                    {!loading && !error && provas.length === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
                            <EmojiEventsIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
                            <Typography variant="body1" color="text.secondary" gutterBottom>
                                Nenhuma prova cadastrada
                            </Typography>
                            <Typography variant="body2" color="text.disabled">
                                Clique em "Nova Prova" para adicionar.
                            </Typography>
                        </Box>
                    )}

                    {provas.length > 0 && (
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
                                '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600 },
                                '& .MuiDataGrid-cell': { py: 0.5 },
                            }}
                        />
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 2, pb: 2 }}>
                    <Button onClick={onClose} color="primary" size="small">
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
