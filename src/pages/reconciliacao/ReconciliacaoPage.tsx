import {
  Box,
  Container,
  Stack,
  Typography,
  Alert,
  LinearProgress,
  Pagination,
  Paper,
} from '@mui/material';
import { useReconciliacao } from '../../hooks/useReconciliacao';
import { ReconciliacaoFiltros } from './components/ReconciliacaoFiltros';
import { AtividadePendenteCard } from './components/AtividadePendenteCard';
import { glass } from '../../theme/tokens';

export default function ReconciliacaoPage() {
  const {
    atletaId,
    setAtletaId,
    filtros,
    updateFiltros,
    page,
    setPage,
    activities,
    totalPages,
    loading,
    error,
    toggleExpanded,
    getCandidatos,
    executarAcao,
  } = useReconciliacao();

  const hasActivities = activities.length > 0;

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Paper
        sx={{
          p: 3,
          backgroundColor: glass.background,
          backdropFilter: glass.backdropFilter,
          border: `1px solid ${glass.border}`,
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Revisão de Atividades
        </Typography>

        <ReconciliacaoFiltros
          atletaId={atletaId}
          onAtletaChange={setAtletaId}
          statuses={filtros.statuses}
          onStatusesChange={(statuses) => updateFiltros({ statuses })}
          dataInicio={filtros.dataInicio}
          onDataInicioChange={(data) => updateFiltros({ dataInicio: data })}
          dataFim={filtros.dataFim}
          onDataFimChange={(data) => updateFiltros({ dataFim: data })}
          loading={loading}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {!loading && !hasActivities && !atletaId && (
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
            Selecione um atleta para começar a revisar atividades
          </Typography>
        )}

        {!loading && !hasActivities && atletaId && (
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
            Nenhuma atividade pendente encontrada
          </Typography>
        )}

        {hasActivities && (
          <Stack spacing={1.5}>
            {activities.map((activity) => {
              const candidatos = getCandidatos(activity.id);
              return (
                <AtividadePendenteCard
                  key={activity.id}
                  activity={activity}
                  candidatos={candidatos}
                  onToggleExpanded={toggleExpanded}
                  onExecutarAcao={executarAcao}
                  disabled={loading}
                />
              );
            })}

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page + 1}
                  onChange={(_, p) => setPage(p - 1)}
                  disabled={loading}
                />
              </Box>
            )}
          </Stack>
        )}
      </Paper>
    </Container>
  );
}
