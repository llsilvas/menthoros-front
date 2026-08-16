import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { useAssessoriaSettings } from '../../../hooks/useAssessoriaSettings';
import { useCoachOnboarding } from '../../../hooks/useCoachOnboarding';
import { ROUTES } from '../../../constants/routes';
import { text } from '../../../theme/tokens';

const TITULOS = ['Sua assessoria', 'Tudo pronto'];

export interface CoachWelcomeWizardProps {
  /** Chamado após a conclusão ser registrada no servidor — o layout revalida o `me` e libera. */
  onConcluido: () => Promise<void> | void;
}

/**
 * Wizard de boas-vindas, bloqueante, exibido uma única vez ao dono da assessoria.
 *
 * <p>Só o dono chega aqui: a etapa de assessoria escreve via `PATCH /assessorias/me`, que exige a
 * role `PROPRIETARIO`. Técnico convidado nasce com o onboarding concluído e vai direto ao
 * dashboard — decisão de produto, não limitação técnica.
 *
 * <p><b>Não cadastra atleta.</b> A versão anterior pedia nome, e-mail, objetivo e dias do primeiro
 * atleta aqui dentro. São dados de <i>outra pessoa</i>, pedidos no primeiro minuto de uso, quando o
 * coach ainda está aprendendo a interface e pode nem tê-los à mão — e o cadastro errado feito nesse
 * estado vira um registro difícil de remover. O wizard confirma o que é do próprio coach e aponta o
 * caminho; o cadastro acontece na tela de Atletas, que tem o formulário completo, validação e o
 * convite de acesso.
 *
 * <p>Não fecha por Escape nem por clique fora: é um gate, e sair dele por acidente devolveria o
 * coach a um dashboard vazio sem explicação. A saída deliberada é "Pular por agora".
 */
export function CoachWelcomeWizard({ onConcluido }: CoachWelcomeWizardProps) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const [etapa, setEtapa] = useState(0);
  const {
    assessoria, carregar, salvarNome,
    salvando: salvandoAssessoria,
    erro: erroAssessoria,
    conflito: conflitoAssessoria,
  } = useAssessoriaSettings();
  const { salvando: salvandoOnboarding, erro, concluir } = useCoachOnboarding();

  const [nomeAssessoria, setNomeAssessoria] = useState('');

  const salvando = salvandoAssessoria || salvandoOnboarding;

  useEffect(() => {
    void carregar();
  }, [carregar]);

  /**
   * `destino` é opcional de propósito: a conclusão precisa ser registrada no servidor **antes** de
   * navegar. O gate do layout só abre quando o `me` volta com o onboarding concluído — navegar
   * primeiro traria o wizard de volta por cima da tela de destino.
   */
  const finalizar = async (destino?: string) => {
    if (!(await concluir())) return;
    await onConcluido();
    if (destino) navigate(destino);
  };

  const avancarAssessoria = async () => {
    const limpo = nomeAssessoria.trim();
    // Pular é permitido: o nome já existe desde o cadastro, e obrigar a reescrevê-lo aqui só
    // adicionaria atrito a quem quer chegar logo ao produto.
    if (assessoria && limpo.length > 0 && limpo !== assessoria.nome) {
      if (!(await salvarNome(limpo, assessoria.version))) return;
    }
    setEtapa(1);
  };

  const acoes = (
    <>
      <Button onClick={() => void finalizar()} disabled={salvando} color="inherit">
        Pular por agora
      </Button>
      <Box sx={{ flex: 1 }} />
      {etapa > 0 && (
        <Button onClick={() => setEtapa(etapa - 1)} disabled={salvando}>Voltar</Button>
      )}
      {etapa === 0 && (
        <Button variant="contained" onClick={() => void avancarAssessoria()} disabled={salvando}>
          Continuar
        </Button>
      )}
      {etapa === 1 && (
        <>
          <Button onClick={() => void finalizar()} disabled={salvando}>Fazer depois</Button>
          <Button
            variant="contained"
            onClick={() => void finalizar(ROUTES.COACH_ATHLETES)}
            disabled={salvando}
          >
            Cadastrar meu primeiro atleta
          </Button>
        </>
      )}
    </>
  );

  return (
    // `CoachDialog` é o shell padrão dos dialogs do coach — mesma superfície dark-first, mesma
    // tipografia. Montar um `Dialog` cru aqui faria dois gates seguidos (consentimento e wizard)
    // parecerem vir de produtos diferentes. `showClose={false}` + `onClose` no-op é exatamente o
    // que o `CoachConsentDialog` faz para ser bloqueante.
    <CoachDialog
      open
      onClose={() => { /* bloqueante: a saída é "Pular por agora" */ }}
      showClose={false}
      title="Bem-vindo à Menthoros"
      subtitle="Dois passos rápidos para começar. Você pode pular e fazer depois."
      maxWidth="sm"
      actions={acoes}
    >
      <>
        <Stepper
          activeStep={etapa}
          orientation={mobile ? 'vertical' : 'horizontal'}
          sx={{ mb: 3 }}
        >
          {TITULOS.map((titulo) => (
            <Step key={titulo}><StepLabel>{titulo}</StepLabel></Step>
          ))}
        </Stepper>

        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

        {conflitoAssessoria && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            action={<Button size="small" onClick={() => void carregar()}>Recarregar</Button>}
          >
            A assessoria foi alterada em outra sessão. Recarregue para ver o estado atual.
          </Alert>
        )}

        {erroAssessoria && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={<Button size="small" onClick={() => void carregar()}>Tentar de novo</Button>}
          >
            Não foi possível carregar os dados da assessoria.
          </Alert>
        )}

        {etapa === 0 && (
          <Stack spacing={2}>
            <Typography variant="body2" sx={{ color: text.secondary }}>
              Confirme o nome da sua assessoria. Você pode ajustar isso depois em Configurações.
            </Typography>
            {assessoria == null && erroAssessoria == null ? (
              <CircularProgress size={24} aria-label="Carregando assessoria" />
            ) : assessoria == null ? null : (
              <TextField
                label="Nome da assessoria"
                defaultValue={assessoria.nome}
                onChange={(e) => setNomeAssessoria(e.target.value)}
                fullWidth
                size="small"
                disabled={salvando}
              />
            )}
          </Stack>
        )}

        {etapa === 1 && (
          <Stack spacing={2}>
            <Typography variant="h6">Tudo pronto</Typography>
            <Typography variant="body2" sx={{ color: text.secondary }}>
              O próximo passo é cadastrar seus atletas. Na tela de Atletas você informa os dados,
              envia o convite de acesso e a plataforma começa a montar os planos.
            </Typography>
            <Typography variant="body2" sx={{ color: text.secondary }}>
              Sem pressa: dá para fazer isso quando estiver com os dados em mãos.
            </Typography>
          </Stack>
        )}
      </>
    </CoachDialog>
  );
}

export default CoachWelcomeWizard;
