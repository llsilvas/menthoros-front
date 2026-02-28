import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Paper
} from '@mui/material';
import {
  DataGrid,
  GridActionsCellItem
} from '@mui/x-data-grid';
import type { GridColDef, GridRowParams } from '@mui/x-data-grid';
import { GridToolbarQuickFilter } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  EditOutlined as EditIcon,
  DeleteOutline as DeleteIcon,
  EventOutlined as CalendarIcon
} from '@mui/icons-material';
import { glassSx, content } from '../../theme/tokens';
import { useCrud } from '../../hooks/features/useCrud';
import AtletaDialog from '../../components/features/atleta/AtletaDialog';
import type { Atleta, CreateAtleta, UpdateAtleta } from '../../types/Atleta';
import PlanosDialog from '../../components/features/planos/planosDialog';

const AtletasList: React.FC = () => {
  const {
    atletas,
    loading,
    error,
    selectedAtleta,
    createAtleta,
    updateAtleta,
    deleteAtleta,
    selectAtleta,
    clearError
  } = useCrud();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [planosDialogOpen, setPlanosDialogOpen] = useState(false);
  const [selectedAtletaForPlanos, setSelectedAtletaForPlanos] = useState<Atleta | null>(null);


  const handleOpenDialog = (atleta?: Atleta) => {
    selectAtleta(atleta || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    selectAtleta(null);
  };

  const handleSave = async (data: CreateAtleta | UpdateAtleta) => {
    if (selectedAtleta) {
      await updateAtleta(selectedAtleta.id, data as UpdateAtleta);
    } else {
      await createAtleta(data as CreateAtleta);
    }
    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este atleta?')) {
      await deleteAtleta(id);
    }
  };

  const handleViewPlanos = (id: string) => {
    console.log('Visualizar planos do atleta:', id);
    setSelectedAtletaForPlanos(atletas.find(a => a.id === id) || null);
    setPlanosDialogOpen(true);
  };

  const handleClosePlanosDialog = () => {
    setPlanosDialogOpen(false);
    setSelectedAtletaForPlanos(null);
  };


  const formatDiasDisponiveis = (dias: any[]) => {
    if (!Array.isArray(dias)) return '';

    const diasFormatados = {
      DOMINGO: 'Dom',
      SEGUNDA: 'Seg',
      TERCA: 'Ter',
      QUARTA: 'Qua',
      QUINTA: 'Qui',
      SEXTA: 'Sex',
      SABADO: 'Sáb'
    };

    return dias.map(dia => {
      // Se for um objeto com short property
      if (dia && typeof dia === 'object' && dia.short) {
        return dia.short;
      }
      // Se for um objeto com label property
      if (dia && typeof dia === 'object' && dia.label) {
        return dia.label.substring(0, 3);
      }
      // Se for um objeto com value property
      if (dia && typeof dia === 'object' && dia.value) {
        return diasFormatados[dia.value as keyof typeof diasFormatados] || dia.value;
      }
      // Se for string direta
      return diasFormatados[dia as keyof typeof diasFormatados] || dia;
    }).join(', ');
  };

  const columns: GridColDef[] = [
    {
      field: 'nome',
      headerName: 'Nome',
      flex: 1,
      minWidth: 150
    },
    {
      field: 'dataNascimento',
      headerName: 'Data de Nascimento',
      width: 140
    },
    {
      field: 'pesoKg',
      headerName: 'Peso (kg)',
      width: 100,
      type: 'number',
      valueFormatter: (value) => `${value} kg`
    },
    {
      field: 'alturaCm',
      headerName: 'Altura (cm)',
      width: 110,
      type: 'number',
      valueFormatter: (value) => `${value} cm`
    },
    {
      field: 'nivelExperiencia',
      headerName: 'Nível',
      width: 120,
      valueFormatter: (params: any) => {
        // Se for um objeto com label, usar o label
        if (params && typeof params === 'object' && params.label) {
          return params.label;
        }
        // Se for um objeto com value, usar o value formatado
        if (params && typeof params === 'object' && params.value) {
          const niveis = {
            INICIANTE: 'Iniciante',
            INTERMEDIARIO: 'Intermediário',
            AVANCADO: 'Avançado'
          };
          return niveis[params.value as keyof typeof niveis] || params.value;
        }
        // Se for string direta
        const niveis = {
          INICIANTE: 'Iniciante',
          INTERMEDIARIO: 'Intermediário',
          AVANCADO: 'Avançado'
        };
        return niveis[params as keyof typeof niveis] || params;
      }
    },
    {
      field: 'diasDisponiveis',
      headerName: 'Dias Disponíveis',
      width: 180,
      valueFormatter: (params: any) => formatDiasDisponiveis(params || [])
    },
    {
      field: 'temLesao',
      headerName: 'Lesão',
      width: 80,
      type: 'boolean',
      renderCell: (params) => (
        <Typography variant="caption" color={params.value ? 'error.main' : 'text.secondary'} sx={{ fontWeight: 600 }}>
          {params.value ? 'Sim' : 'Não'}
        </Typography>
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Ações',
      width: 120,
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Editar"
          onClick={() => handleOpenDialog(params.row as Atleta)}
        />,
        <GridActionsCellItem
          key="planos"
          icon={<CalendarIcon />}
          label="Planos"
          onClick={() => handleViewPlanos(params.row.id)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Excluir"
          onClick={() => handleDelete(params.row.id)}
        />
      ]
    }
  ];

  const QuickFilterToolbar = () => (
    <Box sx={{ px: 1, py: 1, display: 'flex', justifyContent: 'flex-end' }}>
      <Box sx={{ minWidth: 240, '& .MuiInputBase-root': { height: 36, fontSize: '0.875rem' } }}>
        <GridToolbarQuickFilter
          debounceMs={300}
          slotProps={{ root: { placeholder: 'Buscar atleta...' } }}
        />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column' }}>
      <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', ...glassSx, color: 'inherit' }}>
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: content.divider }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" component="h1">
              Atletas
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              size="small"
            >
              Novo Atleta
            </Button>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Box sx={{ p: 2 }}>
            <Alert
              severity="error"
              onClose={clearError}
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          </Box>
        )}

        {/* DataGrid */}
        <Box sx={{ flex: 1, p: 1.5 }}>
          <DataGrid
            rows={atletas}
            columns={columns}
            loading={loading}
            pageSizeOptions={[5, 10, 25, 50]}
            density="compact"
            rowHeight={44}
            slots={{ toolbar: QuickFilterToolbar }}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 }
              },
              columns: {
                columnVisibilityModel: {
                  dataNascimento: false,
                  pesoKg: false,
                  alturaCm: false,
                },
              },
            }}
            disableRowSelectionOnClick
            sx={{
              '--DataGrid-containerBackground': 'rgba(255, 255, 255, 0.55)',
              border: 'none',
              '& .MuiDataGrid-columnHeaders': { minHeight: 44 },
              '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600 },
              '& .MuiDataGrid-cell': { py: 0.5 },
              '& .MuiDataGrid-main': { borderRadius: 1 }
            }}
          />
        </Box>
      </Paper>

      {/* Dialog */}
      <AtletaDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSave}
        atleta={selectedAtleta || undefined}
      />
      <PlanosDialog
        open={planosDialogOpen}
        onClose={handleClosePlanosDialog}
        atletaNome={selectedAtletaForPlanos ? selectedAtletaForPlanos.nome : ''}
        atletaId={selectedAtletaForPlanos ? selectedAtletaForPlanos.id : ''}
      />  
    </Box>
  );
};

export default AtletasList;
