import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { useAssessoriaSettings } from '../../../hooks/useAssessoriaSettings';
import { useCoachOnboarding } from '../../../hooks/useCoachOnboarding';
import { DIA_SEMANA_LABELS, NIVEL_EXPERIENCIA_LABELS } from '../../../types/Atleta';
import type { diaSemana, nivelExperiencia } from '../../../types/Atleta';
import { text } from '../../../theme/tokens';

const TITULOS = ['Sua assessoria', 'Primeiro atleta', 'Convite'];
const DIAS: diaSemana[] = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];

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
 * <p>Não fecha por Escape nem por clique fora: é um gate, e sair dele por acidente devolveria o
 * coach a um dashboard vazio sem explicação. A saída deliberada é "Pular por agora".
 */
export function CoachWelcomeWizard({ onConcluido }: CoachWelcomeWizardProps) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [etapa, setEtapa] = useState(0);
  const {
    assessoria, carregar, salvarNome,
    salvando: salvandoAssessoria,
    erro: erroAssessoria,
    conflito: conflitoAssessoria,
  } = useAssessoriaSettings();
  const {
    atletaId, conviteEnviado, salvando: salvandoOnboarding, erro,
    criarAtleta, convidar, concluir,
  } = useCoachOnboarding();

  const [nomeAssessoria, setNomeAssessoria] = useState('');
  const [atleta, setAtleta] = useState({
    nome: '',
    objetivo: '',
    nivelExperiencia: 'INICIANTE' as nivelExperiencia,
    diasDisponiveis: [] as diaSemana[],
  });

  const salvando = salvandoAssessoria || salvandoOnboarding;

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const finalizar = async () => {
    if (await concluir()) {
      await onConcluido();
    }
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

  const avancarAtleta = async () => {
    if (atleta.nome.trim().length === 0) return;
    if (await criarAtleta({
      nome: atleta.nome.trim(),
      objetivo: atleta.objetivo.trim() || 'Melhorar condicionamento',
      nivelExperiencia: atleta.nivelExperiencia,
      diasDisponiveis: atleta.diasDisponiveis,
    })) {
      setEtapa(2);
    }
  };

  const alternarDia = (dia: diaSemana) => {
    setAtleta((atual) => ({
      ...atual,
      diasDisponiveis: atual.diasDisponiveis.includes(dia)
        ? atual.diasDisponiveis.filter((d) => d !== dia)
        : [...atual.diasDisponiveis, dia],
    }));
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
        <Button
          variant="contained"
          onClick={() => void avancarAtleta()}
          disabled={salvando || atleta.nome.trim().length === 0}
        >
          Cadastrar atleta
        </Button>
      )}
      {etapa === 2 && (
        <Button variant="contained" onClick={() => void finalizar()} disabled={salvando}>
          Concluir
        </Button>
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
      subtitle="Três passos rápidos para começar. Você pode pular e fazer depois."
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
            <Typography variant="body2" sx={{ color: text.secondary }}>
              Cadastre seu primeiro atleta. Só o essencial agora — o resto entra depois.
            </Typography>
            <TextField
              label="Nome do atleta"
              value={atleta.nome}
              onChange={(e) => setAtleta({ ...atleta, nome: e.target.value })}
              fullWidth size="small" disabled={salvando} required
            />
            <TextField
              label="Objetivo"
              value={atleta.objetivo}
              onChange={(e) => setAtleta({ ...atleta, objetivo: e.target.value })}
              placeholder="Ex.: correr 10 km em 50 minutos"
              fullWidth size="small" disabled={salvando}
            />
            <TextField
              select
              label="Nível de experiência"
              value={atleta.nivelExperiencia}
              onChange={(e) => setAtleta({ ...atleta, nivelExperiencia: e.target.value as nivelExperiencia })}
              fullWidth size="small" disabled={salvando}
            >
              {Object.entries(NIVEL_EXPERIENCIA_LABELS).map(([valor, rotulo]) => (
                <MenuItem key={valor} value={valor}>{rotulo}</MenuItem>
              ))}
            </TextField>
            <Box>
              <Typography variant="body2" sx={{ color: text.secondary, mb: 1 }}>
                Dias disponíveis para treinar
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {DIAS.map((dia) => (
                  <Chip
                    key={dia}
                    label={DIA_SEMANA_LABELS[dia]}
                    onClick={() => alternarDia(dia)}
                    // Chip como toggle: sem `aria-pressed` o leitor de tela não anuncia se o dia
                    // está selecionado, e o dialog é bloqueante e navegável só por teclado/AT.
                    aria-pressed={atleta.diasDisponiveis.includes(dia)}
                    color={atleta.diasDisponiveis.includes(dia) ? 'primary' : 'default'}
                    variant={atleta.diasDisponiveis.includes(dia) ? 'filled' : 'outlined'}
                    disabled={salvando}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        )}

        {etapa === 2 && (
          <Stack spacing={2}>
            <Typography variant="body2" sx={{ color: text.secondary }}>
              {atletaId
                ? 'Envie o convite de acesso para o atleta criar a conta dele.'
                : 'Nenhum atleta foi criado nesta sessão. Você pode convidar depois, na tela de Atletas.'}
            </Typography>
            {conviteEnviado && (
              <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />}>
                Convite enviado. Para reenviar, use a tela de Atletas.
              </Alert>
            )}
            <Button
              variant="outlined"
              onClick={() => void convidar()}
              // Desabilitado após o primeiro sucesso: o endpoint REENVIA a cada chamada, e um
              // segundo clique manda outro e-mail ao atleta.
              disabled={!atletaId || conviteEnviado || salvando}
            >
              Enviar convite
            </Button>
          </Stack>
        )}
      </>
    </CoachDialog>
  );
}

export default CoachWelcomeWizard;
