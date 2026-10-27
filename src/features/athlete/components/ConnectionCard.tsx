import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Link, Typography } from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useConnection, type ConnectionPlataforma } from '../../../hooks/features/useConnection';
import { useConnectionCallbackResult } from '../../../hooks/features/useConnectionCallbackResult';
import { useAthleteWatchBrand } from '../hooks/useAthleteWatchBrand';
import { WatchConnectionGuide } from './WatchConnectionGuide';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Card } from '../../../shared/components/Card';
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

const POLITICA_GARMIN = 'https://www.garmin.com/privacy/connect';
const POLITICA_MENTHOROS = '/#/privacidade';

const NOME: Record<ConnectionPlataforma, string> = {
  INTERVALS_ICU: 'intervals.icu',
  GARMIN: 'Garmin',
};

function PermissaoLinha({ rotulo, concedida }: { rotulo: string; concedida: boolean | undefined }) {
  return (
    <Typography sx={{ color: surface[400], fontSize: '0.85rem' }}>
      {rotulo}: <strong>{concedida ? 'autorizado' : 'não autorizado'}</strong>
    </Typography>
  );
}

export interface ConnectionCardProps {
  plataforma: ConnectionPlataforma;
}

export function ConnectionCard({ plataforma }: ConnectionCardProps) {
  const nome = NOME[plataforma];
  const garmin = plataforma === 'GARMIN';
  const { status, loading, error, connect, disconnect, refresh } = useConnection(plataforma);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const resultadoCallback = useConnectionCallbackResult(plataforma);
  // Falha ao ler a marca não bloqueia a conexão: o guia cai no modo "informe seu relógio".
  const { marca } = useAthleteWatchBrand();

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
    <Card
      variant="solid"
      padding={2.5}
      sx={{ border: 'none', borderRadius: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinkIcon sx={{ color: primary[500], fontSize: 20 }} />
        <Typography variant="h6" sx={{ color: surface[50] }}>
          Conexões — {nome}
        </Typography>
      </Box>

      {resultadoCallback === 'success' && (
        <Alert severity="success" sx={{ bgcolor: `${semantic.success[500]}1A`, color: surface[100] }}>
          Conta do {nome} conectada.
        </Alert>
      )}

      {resultadoCallback === 'denied' && (
        <Alert severity="info" sx={{ bgcolor: `${semantic.info[500]}1A`, color: surface[100] }}>
          Você não autorizou o acesso no {nome}. Quando quiser, toque em Conectar para tentar de novo.
        </Alert>
      )}

      {/* O backend não diz por que falhou, de propósito: a mensagem viajaria na URL, visível na
          barra do browser e no histórico. A orientação aqui é a ação, não o diagnóstico. */}
      {resultadoCallback === 'error' && (
        <Alert severity="error" sx={{ bgcolor: `${semantic.danger[500]}1A`, color: surface[100] }}>
          Não foi possível concluir a conexão. Tente novamente — se o problema persistir, verifique
          se você autorizou o acesso no {nome}.
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
            {garmin && (
              <>
                <PermissaoLinha rotulo="Envio de treinos ao relógio" concedida={status?.workoutImport} />
                <PermissaoLinha rotulo="Leitura das atividades" concedida={status?.activityExport} />
              </>
            )}
            {formatDataHora(status?.ultimaSincronizacao) && (
              <Typography sx={{ color: surface[400], fontSize: '0.85rem' }}>
                Última sincronização: {formatDataHora(status?.ultimaSincronizacao)}
              </Typography>
            )}
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

          {garmin && status && (!status.workoutImport || !status.activityExport) && (
            <Alert severity="warning" sx={{ bgcolor: `${semantic.warning[500]}1A`, color: surface[100] }}>
              {!status.workoutImport
                ? 'Sem a permissão de envio de treinos, o treino planejado não chega ao seu relógio.'
                : 'Sem a permissão de leitura das atividades, seus treinos realizados não voltam ao Menthoros.'}{' '}
              Reconecte e autorize todas as permissões.
            </Alert>
          )}

          {status?.ultimoErro && (
            <Alert severity="warning" sx={{ bgcolor: `${semantic.warning[500]}1A`, color: surface[100] }}>
              {status.ultimoErro.slice(0, 200)} — reconecte sua conta do {nome}.
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
            title={`Desconectar ${nome}`}
            message={
              garmin
                ? 'Tem certeza que deseja desconectar sua conta Garmin? O Menthoros deixa de enviar treinos ao seu relógio e de ler suas atividades.'
                : 'Tem certeza que deseja desconectar sua conta intervals.icu? O Menthoros deixa de publicar treinos no seu calendário e o acesso é revogado no intervals.icu.'
            }
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
            {garmin
              ? 'Conecte sua conta Garmin para receber os treinos planejados no relógio e trazer de volta o que você executou. A autorização é feita no site da Garmin, e você pode revogá-la quando quiser.'
              : 'Conecte sua conta do intervals.icu para receber os treinos planejados no relógio e trazer de volta o que você executou. A autorização é feita no site do intervals.icu, e você pode revogá-la quando quiser.'}
          </Typography>

          {/* D10: o ato de autorizar no Garmin é o registro do consentimento; o texto vem antes do botão. */}
          {garmin && (
            <Typography sx={{ color: surface[300], fontSize: '0.8rem' }}>
              Ao conectar, seus treinos são transferidos entre o Menthoros e o Garmin (
              <Link href={POLITICA_GARMIN} target="_blank" rel="noopener noreferrer">
                política de privacidade do Garmin
              </Link>
              ) e o Menthoros usa inteligência artificial para analisá-los (
              <Link href={POLITICA_MENTHOROS} target="_blank" rel="noopener noreferrer">
                política de privacidade do Menthoros
              </Link>
              ).
            </Typography>
          )}

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
                garmin ? 'Conectar Garmin' : 'Conectar com intervals.icu'
              )}
            </Button>
          </Box>
        </>
      )}

      <WatchConnectionGuide marcaAtual={marca} conectado={conectado} />
    </Card>
  );
}

export default ConnectionCard;
