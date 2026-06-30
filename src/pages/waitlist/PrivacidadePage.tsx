import { Link as RouterLink } from 'react-router';
import { Box, Button, Link, Paper, Stack, Typography } from '@mui/material';
import { gradients, glassAzulSx, surface } from '../../theme/tokens';
import { overlayWhite } from '../../theme/overlays';

// E-mail de contato/encarregado (LGPD). Confirmar/substituir antes do go-live.
const CONTATO_EMAIL = 'contato@menthoros.com';
const ATUALIZADA_EM = '30 de junho de 2026';

interface Secao {
  titulo: string;
  paragrafos?: string[];
  itens?: string[];
}

const SECOES: Secao[] = [
  {
    titulo: '1. Quem trata os seus dados',
    paragrafos: [
      `O Menthoros é o controlador dos dados pessoais coletados nesta lista de espera. Para qualquer questão sobre privacidade ou exercício de direitos, fale conosco em ${CONTATO_EMAIL}.`,
    ],
  },
  {
    titulo: '2. Quais dados coletamos',
    paragrafos: ['Ao entrar na lista de espera, coletamos apenas o que você informa no formulário:'],
    itens: [
      'Nome',
      'E-mail',
      'Telefone / WhatsApp (opcional)',
      'Perfil (treinador ou atleta)',
      'Faixa de atletas que você acompanha (apenas para treinadores)',
    ],
  },
  {
    titulo: '3. Para que usamos os seus dados',
    paragrafos: ['Usamos os dados exclusivamente para:'],
    itens: [
      'Entrar em contato sobre o acesso ao beta do Menthoros',
      'Enviar comunicações sobre o lançamento e a turma fundadora',
      'Priorizar e organizar os convites de teste por perfil',
    ],
  },
  {
    titulo: '4. Base legal (LGPD)',
    paragrafos: [
      'O tratamento é feito com base no seu consentimento (Art. 7º, I, da Lei nº 13.709/2018 — LGPD), manifestado ao marcar o aceite no formulário, e no legítimo interesse de manter contato com pessoas que demonstraram interesse no produto.',
    ],
  },
  {
    titulo: '5. Compartilhamento',
    paragrafos: [
      'Não vendemos nem compartilhamos os seus dados com terceiros para fins de marketing. Os dados podem ser processados por provedores de infraestrutura (hospedagem e banco de dados) estritamente para operar o serviço, sob obrigações de confidencialidade.',
    ],
  },
  {
    titulo: '6. Por quanto tempo guardamos',
    paragrafos: [
      'Mantemos os seus dados enquanto durar o seu interesse no beta. Você pode solicitar a remoção a qualquer momento, e eliminamos os dados quando deixam de ser necessários para a finalidade acima.',
    ],
  },
  {
    titulo: '7. Os seus direitos',
    paragrafos: [
      'Nos termos do Art. 18 da LGPD, você pode, a qualquer momento, solicitar: confirmação e acesso aos seus dados; correção de dados incompletos ou desatualizados; anonimização ou eliminação; portabilidade; informação sobre compartilhamentos; e a revogação do consentimento.',
      `Para exercer qualquer desses direitos, escreva para ${CONTATO_EMAIL}.`,
    ],
  },
  {
    titulo: '8. Segurança',
    paragrafos: [
      'Adotamos medidas técnicas e organizacionais razoáveis para proteger os seus dados contra acesso não autorizado, perda ou divulgação indevida.',
    ],
  },
  {
    titulo: '9. Cookies',
    paragrafos: [
      'A página de lista de espera não utiliza cookies de rastreamento nem armazena seus dados no seu navegador.',
    ],
  },
  {
    titulo: '10. Alterações desta política',
    paragrafos: [
      'Podemos atualizar esta política à medida que o produto evolui. A data de atualização abaixo indica a versão vigente.',
    ],
  },
];

export default function PrivacidadePage() {
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
      <Paper elevation={0} sx={{ width: '100%', maxWidth: 760, my: { xs: 2, sm: 5 }, p: { xs: 3, sm: 5 }, borderRadius: 2, ...glassAzulSx }}>
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: surface[0] }}>
            Política de Privacidade
          </Typography>
          <Typography variant="body2" sx={{ color: overlayWhite[50] }}>
            Última atualização: {ATUALIZADA_EM}
          </Typography>
        </Stack>

        <Typography variant="body2" sx={{ color: overlayWhite[70], mb: 3 }}>
          Esta política explica como tratamos os dados informados na lista de espera do Menthoros, em
          conformidade com a Lei Geral de Proteção de Dados (LGPD).
        </Typography>

        <Stack spacing={3}>
          {SECOES.map((secao) => (
            <Box key={secao.titulo}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: surface[0], mb: 1 }}>
                {secao.titulo}
              </Typography>
              {secao.paragrafos?.map((p, i) => (
                <Typography key={i} variant="body2" sx={{ color: overlayWhite[70], mb: 1 }}>
                  {p}
                </Typography>
              ))}
              {secao.itens && (
                <Box component="ul" sx={{ m: 0, pl: 3, color: overlayWhite[70] }}>
                  {secao.itens.map((item) => (
                    <Typography component="li" key={item} variant="body2" sx={{ mb: 0.5 }}>
                      {item}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Stack>

        <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" sx={{ color: overlayWhite[70] }}>
            Dúvidas? Fale conosco em{' '}
            <Link href={`mailto:${CONTATO_EMAIL}`} underline="always">
              {CONTATO_EMAIL}
            </Link>
            .
          </Typography>
          <Button component={RouterLink} to="/waitlist" variant="text" sx={{ mt: 2 }}>
            Voltar à lista de espera
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
