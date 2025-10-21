import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Paper,
  IconButton
} from '@mui/material';
import {
  DataGrid,
  GridActionsCellItem
} from '@mui/x-data-grid';
import type { GridColDef, GridRowParams } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonthTwoTone as CalendarIcon
} from '@mui/icons-material';
import { useCrud } from '../../hooks/features/useCrud';
import AtletaDialog from '../../components/features/atleta/AtletaDialog';
import type { Atleta, CreateAtleta, UpdateAtleta } from '../../types/Atleta';
import PlanosDialog from '../../components/features/planos/planosDialog';
import { usePlanoSemanal } from '../../hooks/usePlanoSemanal';

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
      field: 'idade',
      headerName: 'Idade',
      width: 80,
      type: 'number'
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
      valueFormatter: (value) => value ? 'Sim' : 'Não'
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Ações',
      width: 100,
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Editar"
          onClick={() => handleOpenDialog(params.row as Atleta)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Excluir"
          onClick={() => handleDelete(params.row.id)}
        />
      ]
    }, 
    {
      field: 'planos', 
      headerName: 'Planos',
      width: 100, 
      renderCell: (params) => (
        <IconButton onClick={() => handleViewPlanos(params.row.id)}>
          <CalendarIcon />
        </IconButton>
      )
    }
  ];

  return (
    <Box sx={{ height: '100%', p: 3, display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1">
              Atletas
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
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
        <Box sx={{ flex: 1, p: 2 }}>
          <DataGrid
            rows={atletas}
            columns={columns}
            loading={loading}
            pageSizeOptions={[5, 10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 }
              }
            }}
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-root': {
                border: 'none'
              },
              '& .MuiDataGrid-main': {
                borderRadius: 1
              }
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