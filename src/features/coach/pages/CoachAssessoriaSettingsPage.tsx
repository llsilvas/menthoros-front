import { useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Link,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { OpenAPI } from '../../../api/core/OpenAPI';
import { ROUTES } from '../../../constants/routes';
import { useAssessoriaSettings } from '../../../hooks/useAssessoriaSettings';
import {
  LOGO_EXTENSOES_ACEITAS,
  LOGO_TAMANHO_MAXIMO_BYTES,
  LOGO_TIPOS_ACEITOS,
} from '../../../types/AssessoriaSettings';
import { SectionCard } from '../components/SectionCard';
import { content, text } from '../../../theme/tokens';

const NOME_MAXIMO = 200;

/**
 * Configuração da assessoria: nome e logo, com plano e uso em modo leitura.
 *
 * Separada de `CoachSettingsPage` (perfil pessoal e privacidade) porque o público é outro: aquela
 * é do usuário, esta é da organização — e só o dono edita.
 *
 * **Sem cores.** A identidade visual da assessoria não é editável nesta entrega e o tema segue
 * estático; um seletor aqui prometeria algo que o shell não cumpre.
 */
export function CoachAssessoriaSettingsPage() {
  const {
    assessoria,
    carregando,
    erro,
    salvando,
    conflito,
    carregar,
    salvarNome,
    enviarLogo,
    removerLogo,
  } = useAssessoriaSettings();

  const [nome, setNome] = useState('');
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const inputArquivo = useRef<HTMLInputElement>(null);
  /** Momento em que a página abriu — insumo da métrica "publicar em menos de 3 minutos". */
  const abertaEm = useRef(Date.now());

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // Só sincroniza o campo com o servidor enquanto não há rascunho: sobrescrever o que o coach
  // está digitando a cada recarga seria pior que mostrar um valor levemente desatualizado.
  useEffect(() => {
    if (assessoria && nome === '') {
      setNome(assessoria.nome);
    }
  }, [assessoria, nome]);

  const sujo = assessoria != null && nome.trim() !== assessoria.nome;

  // Avisa antes de fechar a aba com alteração pendente. Navegação interna é coberta pelo aviso
  // visível no rodapé do formulário — o bloqueio de rota do react-router exigiria data router
  // em toda a árvore, o que esta página não controla.
  useEffect(() => {
    if (!sujo) return;
    const aoSair = (evento: BeforeUnloadEvent) => evento.preventDefault();
    window.addEventListener('beforeunload', aoSair);
    return () => window.removeEventListener('beforeunload', aoSair);
  }, [sujo]);

  const registrarDuracao = useCallback((acao: string) => {
    const segundos = Math.round((Date.now() - abertaEm.current) / 1000);
    // Sem canal de analytics no front ainda; o console mantém a métrica auferível em piloto.
    console.info('[assessoria-settings] %s concluído em %ds', acao, segundos);
  }, []);

  const aoSalvarNome = async () => {
    if (!assessoria) return;
    const limpo = nome.trim();
    if (limpo.length === 0) {
      setErroLocal('Informe o nome da assessoria.');
      return;
    }
    if (limpo.length > NOME_MAXIMO) {
      setErroLocal(`O nome deve ter no máximo ${NOME_MAXIMO} caracteres.`);
      return;
    }

    setErroLocal(null);
    if (await salvarNome(limpo, assessoria.version)) {
      setAviso('Nome atualizado.');
      registrarDuracao('nome');
    }
  };

  const aoEscolherArquivo = async (arquivo: File | undefined) => {
    if (!arquivo || !assessoria) return;

    // Barra localmente o que o servidor recusaria: subir 5 MB para receber 422 gasta a espera
    // do coach sem necessidade.
    if (!LOGO_TIPOS_ACEITOS.includes(arquivo.type as (typeof LOGO_TIPOS_ACEITOS)[number])) {
      setErroLocal('A logo precisa ser PNG ou JPEG.');
      return;
    }
    if (arquivo.size > LOGO_TAMANHO_MAXIMO_BYTES) {
      setErroLocal('A logo precisa ter no máximo 2 MB.');
      return;
    }

    setErroLocal(null);
    if (await enviarLogo(arquivo, assessoria.version)) {
      setAviso('Logo atualizada.');
      registrarDuracao('logo');
    }
  };

  const aoRemoverLogo = async () => {
    if (!assessoria) return;
    setErroLocal(null);
    if (await removerLogo(assessoria.version)) {
      setAviso('Logo removida.');
    }
  };

  if (carregando && !assessoria) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress aria-label="Carregando configuração da assessoria" />
      </Box>
    );
  }

  if (erro && !assessoria) {
    return (
      <Stack spacing={2} sx={{ maxWidth: 720 }}>
        <Alert
          severity="error"
          action={<Button onClick={() => void carregar()}>Tentar de novo</Button>}
        >
          Não foi possível carregar a configuração da assessoria.
        </Alert>
      </Stack>
    );
  }

  if (!assessoria) return null;

  const logoSrc = assessoria.temLogo && assessoria.logoUrl
    ? `${OpenAPI.BASE}${assessoria.logoUrl}?v=${assessoria.version}`
    : undefined;

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 720 }}>
      <Box>
        <Link
          component={RouterLink}
          to={ROUTES.COACH_SETTINGS}
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem' }}
        >
          <ArrowBackIcon fontSize="inherit" /> Configurações
        </Link>
        <Typography variant="h5" sx={{ mt: 0.5 }}>Assessoria</Typography>
      </Box>

      {conflito && (
        <Alert
          severity="warning"
          action={<Button onClick={() => void carregar()}>Recarregar</Button>}
        >
          Alguém alterou a assessoria enquanto esta página estava aberta. Recarregue para ver o
          estado atual — o que você digitou continua aqui.
        </Alert>
      )}

      {erroLocal && <Alert severity="error">{erroLocal}</Alert>}
      {erro && assessoria && <Alert severity="error">Não foi possível salvar. Tente de novo.</Alert>}

      <SectionCard title="Identidade">
        <Stack spacing={2} sx={{ p: 2 }}>
          <TextField
            label="Nome da assessoria"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            inputProps={{ maxLength: NOME_MAXIMO }}
            fullWidth
            size="small"
            disabled={salvando}
          />

          <Box>
            <Typography variant="body2" sx={{ color: text.secondary, mb: 1 }}>
              Logo — PNG ou JPEG, até 2 MB
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={logoSrc}
                variant="rounded"
                sx={{ width: 64, height: 64, bgcolor: content.divider }}
                alt={assessoria.temLogo ? `Logo de ${assessoria.nome}` : ''}
              >
                {iniciais(assessoria.nome)}
              </Avatar>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={salvando}
                  onClick={() => inputArquivo.current?.click()}
                >
                  {assessoria.temLogo ? 'Trocar logo' : 'Enviar logo'}
                </Button>
                {assessoria.temLogo && (
                  <Button
                    size="small"
                    color="inherit"
                    disabled={salvando}
                    onClick={() => void aoRemoverLogo()}
                  >
                    Remover
                  </Button>
                )}
              </Stack>
              <input
                ref={inputArquivo}
                type="file"
                accept={LOGO_EXTENSOES_ACEITAS}
                hidden
                aria-label="Selecionar imagem da logo"
                onChange={(e) => {
                  void aoEscolherArquivo(e.target.files?.[0]);
                  // Permite reenviar o mesmo arquivo depois de um erro.
                  e.target.value = '';
                }}
              />
            </Stack>
            {salvando && <LinearProgress sx={{ mt: 1.5 }} />}
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="contained"
              size="small"
              disabled={!sujo || salvando}
              onClick={() => void aoSalvarNome()}
            >
              Salvar
            </Button>
            {sujo && (
              <Typography variant="caption" sx={{ color: text.secondary }}>
                Há alterações não salvas.
              </Typography>
            )}
          </Stack>
        </Stack>
      </SectionCard>

      <SectionCard title="Plano">
        <Stack spacing={1} sx={{ p: 2 }}>
          <Linha rotulo="Plano" valor={assessoria.plano} />
          <Linha
            rotulo="Atletas"
            valor={formatarUso(assessoria.uso.atletas, assessoria.uso.maxAtletas)}
          />
          <Linha
            rotulo="Técnicos"
            valor={formatarUso(assessoria.uso.tecnicos, assessoria.uso.maxTecnicos)}
          />
          <Typography variant="caption" sx={{ color: text.secondary, pt: 0.5 }}>
            Plano e limites são alterados pelo suporte.
          </Typography>
        </Stack>
      </SectionCard>

      <Snackbar
        open={aviso != null}
        autoHideDuration={6000}
        onClose={() => setAviso(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setAviso(null)}>
          {aviso}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="body2" sx={{ color: text.secondary }}>{rotulo}</Typography>
      <Typography variant="body2">{valor}</Typography>
    </Stack>
  );
}

function formatarUso(atual: number, maximo: number | null): string {
  return maximo == null ? String(atual) : `${atual} de ${maximo}`;
}

function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('');
}

export default CoachAssessoriaSettingsPage;
