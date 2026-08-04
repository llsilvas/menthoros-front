import { Link as RouterLink } from 'react-router';
import { Box, Button, Link, Paper, Stack, Typography } from '@mui/material';
import { gradients, glassAzulSx, surface } from '../../theme/tokens';
import { overlayWhite } from '../../theme/overlays';
import { ROUTES } from '../../constants/routes';
import type { Bloco, Secao, Tabela } from '../waitlist/politicaPrivacidadeConteudo';

/**
 * Layout compartilhado dos documentos legais públicos (Política de Privacidade e Termos de Uso).
 *
 * Extraído de `PrivacidadePage` quando os Termos passaram a existir: os dois documentos têm a mesma
 * estrutura de dados (`Secao`/`Bloco`/`Tabela`) e o mesmo layout, e duplicar a renderização faria as
 * duas páginas divergirem visualmente com o tempo.
 */

interface DocumentoLegalProps {
  titulo: string;
  atualizadoEm: string;
  introducao: string[];
  secoes: Secao[];
  /** Quando presente, renderiza o rodapé de contato do encarregado (DPO). */
  contatoEmail?: string;
  /** Aviso opcional exibido antes do conteúdo (ex.: documento pendente de revisão jurídica). */
  aviso?: string;
}

function TabelaDocumento({ tabela }: { tabela: Tabela }) {
  const celulaSx = {
    px: 1.5,
    py: 1,
    borderBottom: `1px solid ${overlayWhite[10]}`,
    verticalAlign: 'top' as const,
    textAlign: 'left' as const,
  };

  return (
    // A rolagem horizontal fica no wrapper: em telas estreitas a tabela rola sozinha, sem empurrar
    // o layout da página.
    <Box sx={{ overflowX: 'auto', mt: 1, mb: 1 }}>
      <Box
        component="table"
        aria-label={tabela.descricao}
        sx={{ width: '100%', minWidth: 480, borderCollapse: 'collapse' }}
      >
        <Box component="thead">
          <Box component="tr">
            {tabela.colunas.map((coluna) => (
              <Typography
                component="th"
                scope="col"
                key={coluna}
                variant="caption"
                sx={{ ...celulaSx, fontWeight: 700, color: surface[0], whiteSpace: 'nowrap' }}
              >
                {coluna}
              </Typography>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {tabela.linhas.map((linha) => (
            <Box component="tr" key={linha[0]}>
              {linha.map((celula, i) => (
                <Typography
                  component="td"
                  key={tabela.colunas[i]}
                  variant="caption"
                  sx={{ ...celulaSx, color: overlayWhite[70] }}
                >
                  {celula}
                </Typography>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function BlocoDocumento({ bloco }: { bloco: Bloco }) {
  return (
    <Box>
      {bloco.subtitulo && (
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: surface[0], mt: 1, mb: 1 }}>
          {bloco.subtitulo}
        </Typography>
      )}
      {bloco.paragrafos?.map((paragrafo) => (
        <Typography key={paragrafo} variant="body2" sx={{ color: overlayWhite[70], mb: 1 }}>
          {paragrafo}
        </Typography>
      ))}
      {bloco.itens && (
        <Box component="ul" sx={{ m: 0, mb: 1, pl: 3, color: overlayWhite[70] }}>
          {bloco.itens.map((item) => (
            <Typography component="li" key={item} variant="body2" sx={{ mb: 0.5 }}>
              {item}
            </Typography>
          ))}
        </Box>
      )}
      {bloco.tabela && <TabelaDocumento tabela={bloco.tabela} />}
    </Box>
  );
}

export default function DocumentoLegal({
  titulo,
  atualizadoEm,
  introducao,
  secoes,
  contatoEmail,
  aviso,
}: DocumentoLegalProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        p: { xs: 2, sm: 4 },
        background: gradients.background,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 860,
          my: { xs: 2, sm: 5 },
          p: { xs: 3, sm: 5 },
          borderRadius: 2,
          ...glassAzulSx,
        }}
      >
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: surface[0] }}>
            {titulo}
          </Typography>
          <Typography variant="body2" sx={{ color: overlayWhite[50] }}>
            Plataforma Menthoros — Sistema Operacional de Decisão para Coaches de Endurance
          </Typography>
          <Typography variant="body2" sx={{ color: overlayWhite[50] }}>
            Última atualização: {atualizadoEm}
          </Typography>
        </Stack>

        {aviso && (
          <Typography variant="body2" sx={{ color: overlayWhite[50], mb: 3, fontStyle: 'italic' }}>
            {aviso}
          </Typography>
        )}

        <Stack spacing={1} sx={{ mb: 3 }}>
          {introducao.map((paragrafo) => (
            <Typography key={paragrafo} variant="body2" sx={{ color: overlayWhite[70] }}>
              {paragrafo}
            </Typography>
          ))}
        </Stack>

        <Stack spacing={3}>
          {secoes.map((secao) => (
            <Box key={secao.titulo}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: surface[0], mb: 1 }}>
                {secao.titulo}
              </Typography>
              {secao.blocos.map((bloco, i) => (
                <BlocoDocumento key={bloco.subtitulo ?? i} bloco={bloco} />
              ))}
            </Box>
          ))}
        </Stack>

        <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
          {contatoEmail && (
            <Typography variant="body2" sx={{ color: overlayWhite[70] }}>
              Contato do DPO:{' '}
              <Link href={`mailto:${contatoEmail}`} underline="always">
                {contatoEmail}
              </Link>{' '}
              — tempo de resposta: até 15 dias úteis.
            </Typography>
          )}
          <Button component={RouterLink} to={ROUTES.HOME} variant="text" sx={{ mt: 2 }}>
            Voltar à página principal
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
