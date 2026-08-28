import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link as RouterLink } from 'react-router';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useCoachSignup } from '../../hooks/useCoachSignup';
import { useAuth } from '../../context/auth/useAuth';
import { ROUTES } from '../../constants/routes';
import { gradients, glassAzulSx, surface } from '../../theme/tokens';
import { overlayWhite } from '../../theme/overlays';

const TAMANHO_MINIMO_DA_SENHA = 12;

/** Nome do parâmetro do link do convite: `/#/cadastro?convite=<token>`. */
const PARAM_CONVITE = 'convite';

/**
 * Lê o token do fragmento (`#/cadastro?convite=<token>`). Direto do `location.hash`, e não do
 * router: a leitura acontece uma vez, no primeiro render, e a remoção logo abaixo também não passa
 * pelo router — `replaceState` limpa a URL sem disparar navegação.
 */
function lerTokenDoFragmento(): string | null {
  const query = window.location.hash.split('?')[1];
  if (!query) {
    return null;
  }
  return new URLSearchParams(query).get(PARAM_CONVITE)?.trim() || null;
}

/** Tira o token da barra de endereço e do histórico. O router não é envolvido de propósito. */
function removerTokenDoFragmento(): void {
  const [caminho, query] = window.location.hash.split('?');
  if (!query) {
    return;
  }
  const params = new URLSearchParams(query);
  params.delete(PARAM_CONVITE);
  const resto = params.toString();
  window.history.replaceState(window.history.state, '', resto ? `${caminho}?${resto}` : caminho);
}

/** Espelha o `@Pattern` do backend: minúsculas, números e hífen simples, nunca nas bordas. */
const FORMATO_DO_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Deriva um slug a partir do nome da assessoria, como sugestão editável. */
function sugerirSlug(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

/**
 * Auto-cadastro público de assessoria — e aceite do convite de assessoria fundadora.
 *
 * <p>Modo convite: com `?convite=<token>` no fragmento, a página consulta o convite, pré-preenche e
 * bloqueia nome e e-mail, e envia o token junto com o cadastro. O token vive só no fragmento (que o
 * browser não envia ao servidor nem no `Referer`) e na memória da página: ele é lido no primeiro
 * render e removido da URL em seguida, para não ficar no histórico. Nunca vai para storage.</p>
 *
 * <p>Não há checkbox de aceite, e a ausência é deliberada: o aceite auditável e versionado pertence
 * à change `add-coach-lgpd-consent` e acontece na primeira sessão autenticada. Aqui ficam apenas
 * links informativos — duplicar o consentimento criaria um segundo registro, não auditável,
 * competindo com o que vale juridicamente.</p>
 */
export default function CadastroPage() {
  const { status, error, resultado, convite, cadastrar, reiniciarTentativa, consultarConvite } =
    useCoachSignup();
  const { login } = useAuth();
  // Lido uma vez, no primeiro render. Depois disso a URL não o carrega mais.
  const [inviteToken] = useState<string | null>(lerTokenDoFragmento);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nomeAssessoria, setNomeAssessoria] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEditado, setSlugEditado] = useState(false);
  const [website, setWebsite] = useState('');

  const sucessoRef = useRef<HTMLElement>(null);
  const submitting = status === 'submitting';
  const porConvite = inviteToken !== null;
  // No convite, nome e e-mail vêm do próprio convite e ficam bloqueados: o backend exige o e-mail
  // convidado. Derivados, não copiados para o estado — não há segundo render nem chance de edição.
  const nomeFinal = porConvite ? (convite.dados?.nome ?? '') : nome;
  const emailFinal = porConvite ? (convite.dados?.email ?? '') : email;

  // Tira o token da URL (histórico, barra de endereço, captura de tela) e consulta o convite.
  useEffect(() => {
    if (!porConvite) {
      return;
    }
    removerTokenDoFragmento();
    void consultarConvite(inviteToken);
    // Só no mount: o token é fixo para a vida da página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move o foco para a confirmação: sem isso, quem usa leitor de tela não percebe a mudança.
  useEffect(() => {
    if (status === 'success') {
      sucessoRef.current?.focus();
    }
  }, [status]);

  /** Toda edição descarta a chave de idempotência: a intenção deixou de ser a mesma. */
  const aoEditar = <T,>(set: (v: T) => void) => (valor: T) => {
    if (status === 'error') {
      reiniciarTentativa();
    }
    set(valor);
  };

  const aoMudarNomeAssessoria = (valor: string) => {
    aoEditar(setNomeAssessoria)(valor);
    if (!slugEditado) {
      setSlug(sugerirSlug(valor));
    }
  };

  const slugInvalido = slug.length > 0 && !FORMATO_DO_SLUG.test(slug);
  const senhaCurta = senha.length > 0 && senha.length < TAMANHO_MINIMO_DA_SENHA;
  const podeEnviar =
    !submitting && nomeFinal && emailFinal && senha && !senhaCurta && nomeAssessoria && slug && !slugInvalido;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!podeEnviar) {
      return;
    }
    void cadastrar({
      nome: nomeFinal,
      email: emailFinal,
      senha,
      nomeAssessoria,
      slug,
      website: website || undefined,
      inviteToken: inviteToken ?? undefined,
    });
  };

  const conteudo = () => {
    if (porConvite && convite.status !== 'valido') {
      return convite.status === 'invalido' ? (
        <ConviteInvalido />
      ) : (
        <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
          <CircularProgress size={28} />
          <Typography variant="body2" sx={{ color: overlayWhite[70] }}>
            Conferindo seu convite…
          </Typography>
        </Stack>
      );
    }

    if (status === 'fechado') {
      return <CadastroPorConvite />;
    }

    if (status === 'success' && resultado) {
      return (
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Typography
            ref={sucessoRef}
            tabIndex={-1}
            variant="h5"
            sx={{ fontWeight: 700, color: surface[0], outline: 'none' }}
          >
            Assessoria criada!
          </Typography>
          <Typography variant="body2" sx={{ color: overlayWhite[70] }}>
            {resultado.proximoPasso}
          </Typography>
          {!porConvite && (
            <Typography variant="body2" sx={{ color: overlayWhite[70] }}>
              Enviamos para <strong>{resultado.email}</strong>.
            </Typography>
          )}
          {/*
            O login só começa por ação do usuário. No cadastro público, redirecionar sozinho levaria
            a uma tela de verificação pendente que ele ainda não tem como resolver — o e-mail acabou
            de sair. No convite não há verificação, mas a decisão continua dele.
          */}
          <Button variant="contained" onClick={() => void login()} sx={{ mt: 1 }}>
            Ir para o login
          </Button>
        </Stack>
      );
    }

    return (
      <Stack spacing={2.5} component="form" onSubmit={handleSubmit} noValidate>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: surface[0], mb: 0.5 }}>
            {porConvite ? 'Bem-vinda à turma fundadora' : 'Crie sua assessoria'}
          </Typography>
          <Typography variant="body2" sx={{ color: overlayWhite[70] }}>
            {porConvite
              ? 'Escolha o nome da sua assessoria e uma senha. Leva menos de dois minutos.'
              : 'Comece a usar o Menthoros com seus atletas.'}
          </Typography>
        </Box>

        {status === 'error' && error && (
          <Alert severity="error" role="alert">
            {error}
          </Alert>
        )}

        <TextField
          label="Seu nome"
          value={nomeFinal}
          onChange={(e) => aoEditar(setNome)(e.target.value)}
          required
          disabled={submitting || porConvite}
          fullWidth
          inputProps={{ maxLength: 120 }}
        />

        <TextField
          label="Seu e-mail"
          type="email"
          value={emailFinal}
          onChange={(e) => aoEditar(setEmail)(e.target.value)}
          required
          disabled={submitting || porConvite}
          fullWidth
          inputProps={{ maxLength: 100 }}
          helperText={porConvite ? 'O mesmo e-mail que recebeu o convite.' : undefined}
        />

        <TextField
          label="Senha"
          type="password"
          value={senha}
          onChange={(e) => aoEditar(setSenha)(e.target.value)}
          required
          disabled={submitting}
          fullWidth
          error={senhaCurta}
          helperText={
            senhaCurta
              ? `Use ao menos ${TAMANHO_MINIMO_DA_SENHA} caracteres.`
              : `Ao menos ${TAMANHO_MINIMO_DA_SENHA} caracteres.`
          }
          inputProps={{ maxLength: 128, minLength: TAMANHO_MINIMO_DA_SENHA }}
          autoComplete="new-password"
        />

        <TextField
          label="Nome da assessoria"
          value={nomeAssessoria}
          onChange={(e) => aoMudarNomeAssessoria(e.target.value)}
          required
          disabled={submitting}
          fullWidth
          inputProps={{ maxLength: 200 }}
        />

        <TextField
          label="Identificador"
          value={slug}
          onChange={(e) => {
            setSlugEditado(true);
            aoEditar(setSlug)(e.target.value);
          }}
          required
          disabled={submitting}
          fullWidth
          error={slugInvalido}
          helperText={
            slugInvalido
              ? 'Use apenas letras minúsculas, números e hífens entre eles.'
              : 'Como sua assessoria aparece no endereço. Ex.: corridasserra'
          }
          inputProps={{ maxLength: 100 }}
        />

        {/* Honeypot anti-spam: oculto e fora da ordem de tabulação. */}
        <Box
          component="input"
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite((e.target as HTMLInputElement).value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          sx={{
            position: 'absolute',
            width: 1,
            height: 1,
            p: 0,
            m: '-1px',
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        />

        {/*
          Links informativos, NÃO aceite. O consentimento versionado é coletado depois do login,
          pela change add-coach-lgpd-consent.
        */}
        <Typography variant="body2" sx={{ color: overlayWhite[70] }}>
          Ao criar sua assessoria, você poderá consultar nossos{' '}
          <Link component={RouterLink} to="/termos" underline="always">
            Termos de Uso
          </Link>{' '}
          e a{' '}
          <Link component={RouterLink} to="/privacidade" underline="always">
            Política de Privacidade
          </Link>
          .
        </Typography>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={!podeEnviar}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {submitting ? 'Criando…' : 'Criar assessoria'}
        </Button>

        <Button component={RouterLink} to={ROUTES.LOGIN} variant="text" size="small">
          Já tenho conta
        </Button>
      </Stack>
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: gradients.background,
      }}
    >
      <Paper
        elevation={0}
        sx={{ width: '100%', maxWidth: 480, p: { xs: 3, sm: 4 }, borderRadius: 2, ...glassAzulSx }}
      >
        {conteudo()}
      </Paper>
    </Box>
  );
}

/** Token inexistente, expirado, invalidado ou já usado — o backend não distingue, e a tela também não. */
function ConviteInvalido() {
  return (
    <Stack spacing={2} alignItems="center" textAlign="center">
      <Typography variant="h5" sx={{ fontWeight: 700, color: surface[0] }}>
        Convite inválido ou expirado
      </Typography>
      <Typography variant="body2" sx={{ color: overlayWhite[70] }}>
        Este link não vale mais. Se você recebeu um convite, peça um novo — ou entre na lista de
        espera.
      </Typography>
      <Button component={RouterLink} to={ROUTES.WAITLIST} variant="contained" sx={{ mt: 1 }}>
        Entrar na lista de espera
      </Button>
      <Button component={RouterLink} to={ROUTES.LOGIN} variant="text" size="small">
        Já tenho conta
      </Button>
    </Stack>
  );
}

/** O auto-cadastro público está desligado: a porta de entrada é o convite. */
function CadastroPorConvite() {
  return (
    <Stack spacing={2} alignItems="center" textAlign="center">
      <Typography variant="h5" sx={{ fontWeight: 700, color: surface[0] }}>
        O cadastro é por convite
      </Typography>
      <Typography variant="body2" sx={{ color: overlayWhite[70] }}>
        Estamos abrindo o Menthoros para uma turma fundadora de assessorias. Entre na lista de
        espera e avisamos quando for a sua vez.
      </Typography>
      <Button component={RouterLink} to={ROUTES.WAITLIST} variant="contained" sx={{ mt: 1 }}>
        Entrar na lista de espera
      </Button>
      <Button component={RouterLink} to={ROUTES.LOGIN} variant="text" size="small">
        Já tenho conta
      </Button>
    </Stack>
  );
}
