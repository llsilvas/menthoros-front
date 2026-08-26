import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIntervalsIcuConnection } from '../../../hooks/features/useIntervalsIcuConnection';
import { useIntervalsIcuCallbackResult } from '../../../hooks/features/useIntervalsIcuCallbackResult';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { primary, surface, semantic } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

function formatDataHora(iso: string | undefined): string | null {
  if (!iso) return null;
  try {
    return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return null;
  }
}

export function IntervalsIcuConnectionCard() {
  const { status, loading, error, connect, disconnect, refresh } = useIntervalsIcuConnection();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const resultadoCallback = useIntervalsIcuCallbackResult();

  const conectado = status?.conectado ?? false;

  // Voltando do consentimento, o status em memória é o de antes de sair da página. Sem este
  // refresh o atleta autorizaria com sucesso e continuaria vendo o botão "Conectar".
  useEffect(() => {
    if (resultadoCallback === 'success') {
      void refresh();
    }
  }, [resultadoCallback, refresh]);

  const handleConnect = async () => {
    await connect();
  };

  const handleDisconnect = async () => {
    await disconnect();
    setConfirmOpen(false);
  };

  return (
    <Box
      sx={{
        bgcolor: elevation.card,
        borderRadius: 1,
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinkIcon sx={{ color: primary[500], fontSize: 20 }} />
        <Typography variant="h6" sx={{ color: surface[50] }}>
          Conexões — intervals.icu
        </Typography>
      </Box>

      {resultadoCallback === 'success' && (
        <Alert severity="success" sx={{ bgcolor: `${semantic.success[500]}1A`, color: surface[100] }}>
          Conta do intervals.icu conectada.
        </Alert>
      )}

      {/* O backend não diz por que falhou, de propósito: a mensagem viajaria na URL, visível na
          barra do browser e no histórico. A orientação aqui é a ação, não o diagnóstico. */}
      {resultadoCallback === 'error' && (
        <Alert severity="error" sx={{ bgcolor: `${semantic.danger[500]}1A`, color: surface[100] }}>
          Não foi possível concluir a conexão. Tente novamente — se o problema persistir, verifique
          se você autorizou o acesso no intervals.icu.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ bgcolor: `${semantic.danger[500]}1A`, color: surface[100] }}>
          {error}
        </Alert>
      )}

      {conectado ? (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography sx={{ color: surface[200], fontSize: '0.9rem' }}>
              Conta conectada: <strong>{status?.externalAthleteId}</strong>
            </Typography>
            {formatDataHora(status?.conectadoEm) && (
              <Typography sx={{ color: surface[400], fontSize: '0.85rem' }}>
                Conectado desde {formatDataHora(status?.conectadoEm)}
              </Typography>
            )}
            {formatDataHora(status?.ultimoPush) && (
              <Typography sx={{ color: surface[400], fontSize: '0.85rem' }}>
                Último push: {formatDataHora(status?.ultimoPush)}
              </Typography>
            )}
          </Box>

          {status?.ultimoErro && (
            <Alert severity="warning" sx={{ bgcolor: `${semantic.warning[500]}1A`, color: surface[100] }}>
              {status.ultimoErro} — reconecte sua conta do intervals.icu.
            </Alert>
          )}

          <Box>
            <Button
              variant="outlined"
              size="small"
              disabled={loading}
              onClick={() => setConfirmOpen(true)}
              sx={{ color: semantic.danger[500], borderColor: semantic.danger[500] }}
            >
              Desconectar
            </Button>
          </Box>

          <ConfirmDialog
            open={confirmOpen}
            title="Desconectar intervals.icu"
            message="Tem certeza que deseja desconectar sua conta intervals.icu? O Menthoros deixa de publicar treinos no seu calendário e o acesso é revogado no intervals.icu."
            confirmLabel="Confirmar"
            severity="danger"
            loading={loading}
            onClose={() => setConfirmOpen(false)}
            onConfirm={handleDisconnect}
          />
        </>
      ) : (
        <>
          <Typography sx={{ color: surface[400], fontSize: '0.85rem' }}>
            Conecte sua conta do intervals.icu para receber os treinos planejados no relógio e
            trazer de volta o que você executou. A autorização é feita no site do intervals.icu, e
            você pode revogá-la quando quiser.
          </Typography>

          <Box>
            <Button
              variant="contained"
              disabled={loading}
              onClick={handleConnect}
              sx={{ bgcolor: primary[500], color: elevation.base, fontWeight: 700, '&:hover': { bgcolor: primary[400] } }}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: elevation.base }} />
              ) : (
                'Conectar com intervals.icu'
              )}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}

export default IntervalsIcuConnectionCard;
