import { useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import InstagramIcon from '@mui/icons-material/Instagram';
import logoNavbar from '../../assets/icons/menthoros_navbar.png';
import logoTransparent from '../../assets/icons/logo_transparent.png';
import imgHeroBanner from '../../assets/images/landing/hero-banner.jpeg';
import imgCoachDashboard from '../../assets/images/landing/coach-dashboard.jpeg';
import imgMetrics from '../../assets/images/landing/metrics-analysis.jpeg';
import imgQueue from '../../assets/images/landing/attention-queue.jpeg';
import imgAI from '../../assets/images/landing/ai-explainer.jpeg';
import imgRunnerBack from '../../assets/images/landing/runner-back.jpeg';
import imgRunnerUniform from '../../assets/images/landing/runner-uniform.jpeg';
import imgRunnerPortrait from '../../assets/images/landing/runner-portrait.jpeg';
import imgCoachPolo from '../../assets/images/landing/coach-polo.jpeg';
import imgTeamOffice from '../../assets/images/landing/team-office.jpeg';
import { gradients, surface } from '../../theme/tokens';
import { overlayWhite } from '../../theme/overlays';

const LIME = '#b3ff00';
const NAVY_DARK = '#082130';

const glassCard = {
  backgroundColor: 'rgba(255, 255, 255, 0.07)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.13)',
  borderRadius: '16px',
};

const sectionLabel = {
  color: LIME,
  fontFamily: 'Inter, sans-serif',
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  mb: 1.5,
};

const headingSx = {
  fontFamily: 'Syne, sans-serif',
  fontWeight: 800,
  color: surface[0],
};

const testimonials = [
  {
    quote: 'Antes eu gastava horas montando planilhas. Hoje o Menthoros faz isso em segundos. Meus atletas bateram recordes pessoais.',
    name: 'Carlos Mendes',
    role: 'Treinador Elite • São Paulo',
    avatar: imgRunnerPortrait,
  },
  {
    quote: 'A análise de TSB revolucionou a forma como administro a carga dos meus atletas. Zero overtraining, máxima performance.',
    name: 'Ana Beatriz Costa',
    role: 'Coach de Corrida • Rio de Janeiro',
    avatar: imgCoachPolo,
  },
  {
    quote: 'Interface limpa, dados precisos. Exatamente o que faltava no mercado brasileiro de corrida de rua.',
    name: 'Ricardo Santos',
    role: 'Técnico de Atletismo • Belo Horizonte',
    avatar: imgRunnerPortrait,
  },
];

const plans = [
  {
    name: 'Starter',
    price: 'Grátis',
    period: 'para sempre',
    highlight: false,
    cta: 'Começar grátis',
    features: ['Até 5 atletas', 'Planos semanais básicos', 'Perfil de atleta completo', 'Suporte por email'],
  },
  {
    name: 'Pro',
    price: 'R$ 97',
    period: 'por mês',
    highlight: true,
    cta: 'Assinar agora',
    features: ['Até 30 atletas', 'Planos com IA avançada', 'Análise de TSS e TSB', 'Gestão de provas', 'Métricas de performance', 'Suporte prioritário'],
  },
  {
    name: 'Elite Coach',
    price: 'R$ 197',
    period: 'por mês',
    highlight: false,
    cta: 'Assinar agora',
    features: ['Atletas ilimitados', 'Tudo do plano Pro', 'Relatórios personalizados', 'API de integração', 'Gerente de conta dedicado', 'Treinamento da equipe'],
  },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function LandingPage() {
  const navigate = useNavigate();
  const goToDashboard = () => navigate('/atletas');

  return (
    <Box sx={{ background: gradients.background, minHeight: '100vh', color: surface[0], fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>

      {/* ── NAVBAR ─────────────────────────────────────────────────── */}
      <Box
        component="nav"
        sx={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: { xs: 2.5, md: 6 }, py: 2,
          backgroundColor: 'rgba(8, 33, 48, 0.88)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${overlayWhite[8]}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <img
            src={logoTransparent}
            alt="Menthoros"
            style={{ height: 48, display: 'block', filter: 'drop-shadow(0 0 10px rgba(179,255,0,0.2))' }}
          />
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: { xs: '18px', md: '22px' },
              color: surface[0],
              letterSpacing: '0.5px',
              lineHeight: 1,
              '& span': { color: LIME },
            }}
          >
            MENTH<Box component="span">OROS</Box>
          </Typography>
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4, alignItems: 'center' }}>
          {[{ label: 'Funcionalidades', id: 'features' }, { label: 'Como funciona', id: 'how-it-works' }, { label: 'Preços', id: 'pricing' }].map(({ label, id }) => (
            <Typography key={id} onClick={() => scrollTo(id)}
              sx={{ fontSize: '14px', color: overlayWhite[70], cursor: 'pointer', transition: 'color 0.2s', '&:hover': { color: surface[0] } }}
            >{label}</Typography>
          ))}
          <Button onClick={goToDashboard} variant="contained" size="small"
            sx={{ backgroundColor: LIME, color: NAVY_DARK, fontWeight: 700, fontSize: '13px', borderRadius: '8px', px: 2.5, minHeight: 36, '&:hover': { backgroundColor: '#c8ff4d' }, transition: 'background-color 0.2s' }}
          >Entrar</Button>
        </Box>

        <Button onClick={goToDashboard} variant="contained" size="small"
          sx={{ display: { xs: 'flex', md: 'none' }, backgroundColor: LIME, color: NAVY_DARK, fontWeight: 700, fontSize: '13px', borderRadius: '8px', minHeight: 36, '&:hover': { backgroundColor: '#c8ff4d' } }}
        >Entrar</Button>
      </Box>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <Box
        component="section"
        sx={{
          position: 'relative',
          height: { xs: '480px', sm: '560px', md: '640px' },
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          mt: '64px', // espaço do navbar fixo
        }}
      >
        {/* Background image — sem esticar, respeitando a proporção */}
        <Box
          sx={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${imgHeroBanner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
          }}
        />

        {/* Side vignette — escurece laterais */}
        <Box sx={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(90deg,
            ${NAVY_DARK}f2 0%,
            ${NAVY_DARK}aa 16%,
            rgba(8,33,48,0.18) 38%,
            rgba(8,33,48,0.18) 62%,
            ${NAVY_DARK}aa 84%,
            ${NAVY_DARK}f2 100%
          )`,
        }} />

        {/* Top fade — funde com navbar */}
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '120px',
          background: `linear-gradient(to bottom, ${NAVY_DARK} 0%, transparent 100%)`,
        }} />

        {/* Bottom fade — funde com próxima seção */}
        <Box sx={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '160px',
          background: `linear-gradient(to top, ${NAVY_DARK} 0%, transparent 100%)`,
        }} />

        {/* Foreground content */}
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>

          {/* Badge */}
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2,
            px: 1.75, py: 0.6, borderRadius: '20px',
            backgroundColor: 'rgba(8,33,48,0.72)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(179,255,0,0.3)',
          }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: LIME, boxShadow: `0 0 5px ${LIME}` }} />
            <AutoAwesomeIcon sx={{ fontSize: 12, color: LIME }} />
            <Typography sx={{ ...sectionLabel, mb: 0, letterSpacing: '1.5px' }}>Powered by IA</Typography>
          </Box>

          <Typography
            component="h1"
            sx={{
              ...headingSx,
              fontSize: { xs: '30px', sm: '40px', md: '50px', lg: '58px' },
              lineHeight: 1.08,
              mb: 2,
              textShadow: '0 2px 20px rgba(0,0,0,0.7)',
            }}
          >
            Dados não vencem provas.{' '}
            <Box component="span" sx={{ color: LIME }}>Decisões sim.</Box>
          </Typography>

          <Typography sx={{
            fontSize: { xs: '14px', md: '16px' },
            color: 'rgba(255,255,255,0.78)',
            lineHeight: 1.7,
            mb: 3.5,
            maxWidth: '540px',
            mx: 'auto',
            textShadow: '0 1px 8px rgba(0,0,0,0.6)',
          }}>
            O copiloto técnico-operacional da assessoria de corrida: transforma dados do atleta em decisões mais
            seguras, explicáveis e escaláveis.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button onClick={goToDashboard} variant="contained" size="medium" endIcon={<ArrowForwardIcon />}
              sx={{ backgroundColor: LIME, color: NAVY_DARK, fontWeight: 700, fontSize: '14px', borderRadius: '10px', px: 3.5, py: 1.4, '&:hover': { backgroundColor: '#c8ff4d', transform: 'translateY(-1px)' }, transition: 'all 0.2s', boxShadow: `0 4px 20px rgba(179,255,0,0.35)` }}
            >Começar grátis</Button>
            <Button onClick={() => scrollTo('how-it-works')} variant="outlined" size="medium"
              sx={{ borderColor: 'rgba(255,255,255,0.35)', color: surface[0], fontSize: '14px', borderRadius: '10px', px: 3.5, py: 1.4, backdropFilter: 'blur(8px)', backgroundColor: overlayWhite[6], '&:hover': { borderColor: overlayWhite[60], backgroundColor: overlayWhite[10] }, transition: 'all 0.2s' }}
            >Ver como funciona</Button>
          </Box>

          <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.32)', mt: 2.5, fontStyle: 'italic' }}>
            Smarter Training. Better Results.
          </Typography>
        </Container>
      </Box>

      {/* ── STATS ──────────────────────────────────────────────────── */}
      <Box sx={{ borderTop: `1px solid ${overlayWhite[8]}`, borderBottom: `1px solid ${overlayWhite[8]}`, py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            {[
              { value: '500+', label: 'Atletas gerenciados' },
              { value: '10K+', label: 'Planos gerados com IA' },
              { value: '98%', label: 'Satisfação dos treinadores' },
            ].map((stat) => (
              <Grid key={stat.label} size={{ xs: 12, sm: 4 }} sx={{ textAlign: 'center' }}>
                <Typography sx={{ ...headingSx, fontSize: { xs: '48px', md: '58px' }, color: LIME, lineHeight: 1, mb: 0.75 }}>{stat.value}</Typography>
                <Typography sx={{ fontSize: '15px', color: 'rgba(255,255,255,0.55)' }}>{stat.label}</Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── TREINADOR NO CENTRO ─────────────────────────────────────── */}
      <Box component="section" sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 6, md: 10 }} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ borderRadius: '20px', overflow: 'hidden', border: `1px solid ${overlayWhite[10]}`, boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}>
                <img src={imgCoachDashboard} alt="Treinador analisando dashboard do Menthoros" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography sx={sectionLabel}>Proposta de valor</Typography>
              <Typography component="h2" sx={{ ...headingSx, fontSize: { xs: '30px', md: '42px' }, mb: 3, lineHeight: 1.15 }}>
                O treinador no centro.{' '}
                <Box component="span" sx={{ color: LIME }}>Não o atleta.</Box>
              </Typography>
              <Typography sx={{ fontSize: '16px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, mb: 3 }}>
                O Menthoros é desenhado para a rotina da assessoria. A pergunta central não é "o que mostrar para o atleta?", mas sim:
              </Typography>
              <Box sx={{ ...glassCard, p: 3, borderLeft: `3px solid ${LIME}`, borderRadius: '12px' }}>
                <Typography sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: { xs: '17px', md: '20px' }, color: surface[0], fontStyle: 'italic', lineHeight: 1.5 }}>
                  "O que o treinador precisa saber agora para decidir melhor?"
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── FEATURES ───────────────────────────────────────────────── */}
      <Box id="features" component="section" sx={{ py: { xs: 8, md: 12 }, borderTop: `1px solid ${overlayWhite[8]}` }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography sx={sectionLabel}>Funcionalidades</Typography>
            <Typography component="h2" sx={{ ...headingSx, fontSize: { xs: '32px', md: '44px' }, mb: 2 }}>Mais do que métricas</Typography>
            <Typography sx={{ fontSize: '17px', color: 'rgba(255,255,255,0.58)', maxWidth: '520px', mx: 'auto', lineHeight: 1.7 }}>
              O Menthoros interpreta os dados e entrega leitura prática — não apenas números na tela.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Feature 1 — Análise de treino */}
            {[
              { img: imgMetrics, imgAlt: 'Interpretação de métricas de treino', badge: 'Análise de Performance', title: 'Interpretação do treino, não só exibição de métricas', desc: 'Não basta mostrar pace, FC, TSS ou drift cardíaco. O Menthoros traduz esses sinais em leitura prática e recomendações acionáveis.' },
              { img: imgQueue,   imgAlt: 'Fila de atenção e priorização de atletas', badge: 'Gestão Operacional', title: 'Fila de atenção e priorização operacional', desc: 'Em vez de abrir atleta por atleta, o Menthoros aponta quem precisa de intervenção primeiro — fadiga elevada, longão ausente, queda de aderência.' },
              { img: imgAI,      imgAlt: 'IA explicável com confiança de análise', badge: 'Inteligência Artificial', title: 'Explicabilidade que fortalece confiança', desc: 'Toda boa recomendação precisa responder "por quê?". O Menthoros mostra quais dados foram considerados e qual o nível de confiança da análise.' },
            ].map((f) => (
              <Grid key={f.badge} size={{ xs: 12, md: 4 }}>
                <Box sx={{ ...glassCard, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.25s ease', '&:hover': { borderColor: 'rgba(179,255,0,0.28)', transform: 'translateY(-3px)' } }}>
                  <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                    <img src={f.img} alt={f.imgAlt} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
                    <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,33,48,0.05) 0%, rgba(8,33,48,0.72) 100%)' }} />
                  </Box>
                  <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'inline-block', px: 1.5, py: 0.5, mb: 2, borderRadius: '6px', backgroundColor: 'rgba(179,255,0,0.12)', border: '1px solid rgba(179,255,0,0.22)', alignSelf: 'flex-start' }}>
                      <Typography sx={{ fontSize: '11px', color: LIME, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>{f.badge}</Typography>
                    </Box>
                    <Typography sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '17px', color: surface[0], mb: 1.5, lineHeight: 1.3 }}>{f.title}</Typography>
                    <Typography sx={{ fontSize: '14px', color: overlayWhite[60], lineHeight: 1.7 }}>{f.desc}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}

            {/* Feature 4 — Ciclo completo */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ ...glassCard, p: { xs: 3, md: 4 }, background: `linear-gradient(135deg, rgba(179,255,0,0.08) 0%, rgba(8,33,48,0.4) 100%)`, borderColor: 'rgba(179,255,0,0.18)', transition: 'all 0.25s ease', '&:hover': { borderColor: 'rgba(179,255,0,0.35)', transform: 'translateY(-2px)' } }}>
                <Grid container spacing={4} alignItems="center">
                  <Grid size={{ xs: 12, md: 8 }}>
                    <Box sx={{ display: 'inline-block', px: 1.5, py: 0.5, mb: 2, borderRadius: '6px', backgroundColor: 'rgba(179,255,0,0.15)', border: '1px solid rgba(179,255,0,0.3)' }}>
                      <Typography sx={{ fontSize: '11px', color: LIME, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Planos de Treino</Typography>
                    </Box>
                    <Typography sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: { xs: '20px', md: '24px' }, color: surface[0], mb: 2, lineHeight: 1.3 }}>
                      Ciclo fechado: planejado → realizado → próximo ajuste
                    </Typography>
                    <Typography sx={{ fontSize: '15px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, mb: 3, maxWidth: '600px' }}>
                      O produto fecha o loop completo da assessoria. A IA gera um plano periodizado baseado no histórico e TSB do atleta, e aprende com cada treino registrado.
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {['Planejamento', 'Execução', 'Análise', 'Recomendação', 'Próximo Plano'].map((step) => (
                        <Box key={step} sx={{ px: 1.5, py: 0.5, borderRadius: '20px', border: `1px solid rgba(179,255,0,0.25)`, backgroundColor: 'rgba(179,255,0,0.07)' }}>
                          <Typography sx={{ fontSize: '13px', color: LIME, fontWeight: 500 }}>{step}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                      {[{ label: 'TSB médio', value: '+12', color: '#3498db' }, { label: 'Planos ativos', value: '3', color: LIME }, { label: 'Provas em 30d', value: '2', color: '#f39c12' }].map((m) => (
                        <Box key={m.label} sx={{ p: 2, borderRadius: '12px', backgroundColor: overlayWhite[6], border: `1px solid ${overlayWhite[10]}`, textAlign: 'center', minWidth: '90px' }}>
                          <Typography sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '28px', color: m.color, lineHeight: 1 }}>{m.value}</Typography>
                          <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', mt: 0.5 }}>{m.label}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <Box id="how-it-works" component="section" sx={{ position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `url(${imgRunnerBack})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.22)' }} />
        <Box sx={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${NAVY_DARK}e8 0%, rgba(14,49,71,0.88) 100%)` }} />

        <Box sx={{ position: 'relative', zIndex: 1, py: { xs: 10, md: 14 } }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: 10 }}>
              <Typography sx={sectionLabel}>Como funciona</Typography>
              <Typography component="h2" sx={{ ...headingSx, fontSize: { xs: '32px', md: '44px' } }}>Simples assim</Typography>
            </Box>

            <Grid container spacing={4} justifyContent="center">
              {[
                { number: '01', title: 'Cadastre seus atletas', description: 'Adicione o perfil completo: objetivos, nível de experiência, disponibilidade e histórico de lesões.' },
                { number: '02', title: 'IA cria o plano semanal', description: 'O sistema analisa os dados e gera automaticamente um plano personalizado e periodizado.' },
                { number: '03', title: 'Monitore e evolua', description: 'Registre treinos realizados, acompanhe métricas em tempo real e ajuste a carga quando necessário.' },
              ].map((step, i, arr) => (
                <Grid key={step.number} size={{ xs: 12, md: 4 }}>
                  <Box sx={{ textAlign: 'center', position: 'relative' }}>
                    {i < arr.length - 1 && (
                      <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', top: '27px', left: '62%', width: '76%', height: '1px', background: 'linear-gradient(90deg, rgba(179,255,0,0.4) 0%, rgba(179,255,0,0.04) 100%)' }} />
                    )}
                    <Box sx={{ width: 54, height: 54, borderRadius: '50%', border: `2px solid ${LIME}`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3, backgroundColor: 'rgba(179,255,0,0.1)' }}>
                      <Typography sx={{ ...headingSx, fontSize: '17px', color: LIME }}>{step.number}</Typography>
                    </Box>
                    <Typography sx={{ ...headingSx, fontSize: '20px', mb: 1.5 }}>{step.title}</Typography>
                    <Typography sx={{ fontSize: '15px', color: 'rgba(255,255,255,0.62)', lineHeight: 1.7, maxWidth: '280px', mx: 'auto' }}>{step.description}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      </Box>

      {/* ── BRAND BANNER ───────────────────────────────────────────── */}
      <Box component="section" sx={{ position: 'relative', overflow: 'hidden', height: { xs: 280, md: 380 } }}>
        <img src={imgRunnerUniform} alt="Atleta Menthoros — Smarter Training. Better Results."
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%', display: 'block' }} />
        <Box sx={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${NAVY_DARK}e0 0%, rgba(8,33,48,0.55) 50%, rgba(8,33,48,0.2) 100%)` }} />
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', px: { xs: 4, md: 10 } }}>
          <Box>
            <Typography sx={{ ...headingSx, fontSize: { xs: '28px', md: '48px' }, mb: 1, lineHeight: 1.1 }}>
              Smarter Training.
            </Typography>
            <Typography sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: { xs: '28px', md: '48px' }, color: LIME, lineHeight: 1.1 }}>
              Better Results.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── TESTIMONIALS ───────────────────────────────────────────── */}
      <Box component="section" sx={{ py: { xs: 8, md: 12 }, borderTop: `1px solid ${overlayWhite[8]}` }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography sx={sectionLabel}>Depoimentos</Typography>
            <Typography component="h2" sx={{ ...headingSx, fontSize: { xs: '32px', md: '44px' } }}>O que dizem os treinadores</Typography>
          </Box>

          <Grid container spacing={3}>
            {testimonials.map((t, i) => (
              <Grid key={i} size={{ xs: 12, md: 4 }}>
                <Box sx={{ ...glassCard, p: 3.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <FormatQuoteIcon sx={{ fontSize: 34, color: LIME, mb: 2, opacity: 0.75 }} />
                  <Typography sx={{ fontSize: '15px', color: 'rgba(255,255,255,0.78)', lineHeight: 1.78, mb: 3, fontStyle: 'italic', flex: 1 }}>
                    "{t.quote}"
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, borderTop: `1px solid ${overlayWhite[10]}`, pt: 2 }}>
                    <Avatar src={t.avatar} alt={t.name}
                      sx={{ width: 44, height: 44, border: `2px solid ${LIME}33`, objectFit: 'cover' }} />
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: surface[0], fontSize: '14px' }}>{t.name}</Typography>
                      <Typography sx={{ fontSize: '12px', color: LIME }}>{t.role}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── PRICING ────────────────────────────────────────────────── */}
      <Box id="pricing" component="section" sx={{ py: { xs: 8, md: 12 }, borderTop: `1px solid ${overlayWhite[8]}` }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography sx={sectionLabel}>Preços</Typography>
            <Typography component="h2" sx={{ ...headingSx, fontSize: { xs: '32px', md: '44px' }, mb: 2 }}>Escolha seu plano</Typography>
            <Typography sx={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)' }}>Comece grátis. Escale conforme cresce.</Typography>
          </Box>

          <Grid container spacing={3} alignItems="stretch" justifyContent="center">
            {plans.map((plan) => (
              <Grid key={plan.name} size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ ...glassCard, p: 4, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', ...(plan.highlight && { border: `2px solid ${LIME}`, backgroundColor: 'rgba(179,255,0,0.06)' }) }}>
                  {plan.highlight && (
                    <Box sx={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', backgroundColor: LIME, color: NAVY_DARK, fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', px: 2, py: 0.5, borderRadius: '20px', whiteSpace: 'nowrap' }}>
                      Mais popular
                    </Box>
                  )}
                  <Typography sx={{ ...headingSx, fontSize: '20px', mb: 1, color: plan.highlight ? LIME : surface[0] }}>{plan.name}</Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography sx={{ ...headingSx, fontSize: '38px', lineHeight: 1 }}>{plan.price}</Typography>
                    <Typography sx={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', mt: 0.5 }}>{plan.period}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, mb: 3 }}>
                    {plan.features.map((feature) => (
                      <Box key={feature} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <CheckIcon sx={{ fontSize: 16, color: LIME, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '14px', color: 'rgba(255,255,255,0.72)' }}>{feature}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Button onClick={goToDashboard} variant={plan.highlight ? 'contained' : 'outlined'} fullWidth
                    sx={plan.highlight
                      ? { backgroundColor: LIME, color: NAVY_DARK, fontWeight: 700, borderRadius: '10px', py: 1.25, '&:hover': { backgroundColor: '#c8ff4d' }, transition: 'background-color 0.2s' }
                      : { borderColor: 'rgba(255,255,255,0.22)', color: surface[0], borderRadius: '10px', py: 1.25, '&:hover': { borderColor: 'rgba(255,255,255,0.45)', backgroundColor: 'rgba(255,255,255,0.05)' }, transition: 'all 0.2s' }}
                  >{plan.cta}</Button>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── FINAL CTA ──────────────────────────────────────────────── */}
      <Box component="section" sx={{ position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `url(${imgTeamOffice})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.18)' }} />
        <Box sx={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${NAVY_DARK}d8 0%, rgba(14,49,71,0.92) 100%)` }} />

        <Box sx={{ position: 'relative', zIndex: 1, py: { xs: 10, md: 16 } }}>
          <Container maxWidth="md">
            <Box sx={{ textAlign: 'center' }}>
              <Typography component="h2" sx={{ ...headingSx, fontSize: { xs: '32px', md: '52px' }, mb: 2.5, lineHeight: 1.15 }}>
                Seus atletas merecem{' '}
                <Box component="span" sx={{ color: LIME }}>mais</Box>.
              </Typography>
              <Typography sx={{ fontSize: { xs: '15px', md: '18px' }, color: 'rgba(255,255,255,0.65)', mb: 5, lineHeight: 1.75, maxWidth: '480px', mx: 'auto' }}>
                Experimente grátis por 14 dias. Sem cartão de crédito. Cancele quando quiser.
              </Typography>
              <Button onClick={goToDashboard} variant="contained" size="large" endIcon={<ArrowForwardIcon />}
                sx={{ backgroundColor: LIME, color: NAVY_DARK, fontWeight: 700, fontSize: '16px', borderRadius: '12px', px: 5, py: 1.75, '&:hover': { backgroundColor: '#c8ff4d', transform: 'translateY(-2px)' }, transition: 'all 0.2s' }}
              >Começar agora</Button>
            </Box>
          </Container>
        </Box>
      </Box>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <Box component="footer" sx={{ borderTop: `1px solid ${overlayWhite[8]}`, py: 5 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
            <img src={logoNavbar} alt="Menthoros" style={{ height: 26, opacity: 0.6 }} />

            <Typography sx={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
              © {new Date().getFullYear()} Menthoros. Todos os direitos reservados.
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {/* Instagram */}
              <Box
                component="a"
                href="https://instagram.com/Menthoros"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.75,
                  color: 'rgba(255,255,255,0.45)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  '&:hover': { color: LIME },
                }}
              >
                <InstagramIcon sx={{ fontSize: 18 }} />
                <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>@Menthoros</Typography>
              </Box>

              <Box sx={{ width: '1px', height: 14, bgcolor: overlayWhite[12] }} />

              {['Privacidade', 'Termos', 'Contato'].map((link) => (
                <Typography key={link} sx={{ fontSize: '13px', color: 'rgba(255,255,255,0.38)', cursor: 'pointer', transition: 'color 0.2s', '&:hover': { color: 'rgba(255,255,255,0.75)' } }}>
                  {link}
                </Typography>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

    </Box>
  );
}
