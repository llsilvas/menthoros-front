// ─────────────────────────────────────────────────────────────────────────────
// theme.premium.ts — Premium v2.0 token tree (single source of truth)
//
// Árvore canônica de cor da paleta Premium v2.0. Resolve os dois débitos do
// sistema atual: colisão semântica (categorias apontando para tokens semantic)
// e lime sem disciplina (#D4FF3A vazando para estado/banda).
//
// Princípios:
//   - Estados ancoram em `semantic`; categorias ancoram em `categorical` dedicado.
//   - Lime (`primary`, suavizado para #BDDE5A) só em brand/primary-action.

// `overlays` é folha (não importa nada) — a dependência não fecha ciclo. Os
// grupos do WorkoutProfile consomem overlay em vez de repetir rgba() literal.
import { overlayWhite } from './overlays';
//   - Heat ramp Z1–Z5 preservado; apenas Z2 muda (lime → green #34D399).
//
// Esta é a camada de tokens (theme/**): hex raw é legítimo aqui. Componentes
// nunca referenciam hex — apenas estes tokens.
// ─────────────────────────────────────────────────────────────────────────────

// ── Primary (marca / primary-action) — lime suavizado ────────────────────────
export const primary = {
  50:  '#F6FAE8',
  100: '#EDF6D1',
  200: '#DFEFB0',
  300: '#D2E98F',
  400: '#C7E373',
  500: '#BDDE5A', // brand canônico v2.0 — lime suavizado
  600: '#94B144',
  700: '#748E32',
  800: '#536A20',
  900: '#2A3D0A', // âncora escura (inalterada)
  contrastText: '#0A1628', // navy sobre superfície lime
} as const;

// ── Surface — navy canvas + ramp neutro para bordas/superfícies secundárias ───
export const surface = {
  0:   '#FFFFFF',
  50:  '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#1E293B',
  900: '#0A1628', // navy canônico — canvas base
} as const;

// ── SurfaceShift — elevação por shift de cor (panel < card < raised) ──────────
export const surfaceShift = {
  panel:  '#0E1B30', // side panels, column headers
  card:   '#131F35', // cards, table rows
  raised: '#1A2940', // modais, dropdowns (novo nível)
} as const;

// ── Text — hierarquia explícita ──────────────────────────────────────────────
export const text = {
  primary:   '#F8FAFC', // off-white
  secondary: '#94A3B8', // clareado p/ legibilidade (era #64748B)
  muted:     '#64748B', // muted explícito
  onAccent:  '#0A1628', // navy sobre lime/accents
} as const;

// ── Semantic (âncoras estáveis — inalteradas) ────────────────────────────────
// Interno ao arquivo: ancora `categorical`/`readiness`/`zone`. NÃO exportado —
// o `semantic` canônico (escalonado) vive em `tokens.ts`; expor este (flat)
// criaria colisão de nome com forma incompatível (`semantic.warning[500]`).
const semantic = {
  danger:  '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  info:    '#3B82F6', // exclusivamente informativo; nunca em brand/hero
} as const;

// ── Categorical — hues dedicados (não colidem com semantic) ───────────────────
// `injuryResponse` é intencionalmente o vermelho de perigo (lesão = alerta).
export const categorical = {
  slate:          '#8694A8',
  teal:           '#2BB6A3',
  cyan:           '#22D3EE', // reservado — distinto de teal e de info(blue)
  violet:         '#B670F8', // clareado de #A855F7 (task 2.8): contraste texto <4.5:1 contra elevation.raised
  magenta:        '#E364A6', // clareado de #E0529C (task 2.8): idem — mesma matiz, só luminosidade
  coral:          '#F2845C',
  gold:           '#E8C547',
  sage:           '#7FB894',
  injuryResponse: semantic.danger, // exceção declarada: lesão = perigo
} as const;

// ── Readiness (collision fix + lime discipline) ──────────────────────────────
// Backend é dono das bandas; a UI só pinta a banda já resolvida.
export const readiness = {
  critical: semantic.danger,  // #EF4444
  caution:  semantic.warning, // #F59E0B
  good:     '#2DD4BF',        // teal — tira lime da prontidão
  optimal:  semantic.success, // #10B981
} as const;

// ── TrainingType — categórico dedicado (sai de semantic) ─────────────────────
export const trainingType = {
  FACIL:        categorical.slate,
  LONGO:        categorical.teal,
  TEMPO:        categorical.coral,
  INTERVALADO:  categorical.magenta,
  REGENERATIVO: categorical.sage,
  FARTLEK:      categorical.violet,
  CONTINUO:     categorical.gold,
  // lime da marca (não categorical): é o dia mais importante da semana, e a
  // agenda já usa lime para "hoje" — prova-no-plano-semanal, design.md D7.
  PROVA:        primary[500],
} as const;

// ── TrainingStage — categórico dedicado (sai do lime e de semantic) ──────────
export const trainingStage = {
  aquecimento:    categorical.gold,
  principal:      categorical.teal, // tira lime da etapa
  esforco:        categorical.coral,
  recuperacao:    categorical.sage,
  desaquecimento: categorical.cyan,  // frescor pós-esforço — contraponto térmico ao gold do aquecimento
} as const;

// ── Zone — heat ramp preservado; só Z2 muda (lime → green) ───────────────────
export const zone = {
  Z1: '#C8CDD4',        // frio/cinza
  Z2: '#34D399',        // green (única mudança intencional; era lime)
  Z3: semantic.info,    // #3B82F6
  Z4: semantic.warning, // #F59E0B
  Z5: semantic.danger,  // #EF4444
} as const;

// Rótulos das cinco zonas. Vivem aqui, e não em `activeTheme`, porque dois
// grupos de cor os consomem (`zones` e `workoutZone`) — declarar em cada um
// criaria duas listas que divergem no dia em que alguém renomear uma zona.
export const zoneLabel = {
  Z1: 'Recuperação', Z2: 'Base', Z3: 'Tempo', Z4: 'Limiar', Z5: 'VO₂ Máx',
} as const;

// ── WorkoutZone — rampa do perfil de treino (frio → quente) ──────────────────
// Grupo NOVO, não substitui `zone`. Existe porque `zone` é não-monotônico —
// cinza na base e azul no meio — e no perfil de treino a cor precisa reforçar a
// altura, não contradizê-la: "mais alto e mais quente = mais forte" só lê bem se
// o matiz caminhar numa direção só (AC-9).
//
// `zone` fica intocado de propósito: é consumido por outros gráficos que não
// estão sendo redesenhados, e trocar a paleta deles sem verificação seria mudar
// a leitura de telas que ninguém revisou. A migração é change própria.
export const workoutZone = {
  Z1: '#38BDF8', // sky    — base aeróbica / recuperação
  Z2: '#34D399', // green  — mantém o hex de `zone.Z2`
  Z3: '#FACC15', // yellow
  Z4: '#F97316', // orange
  Z5: '#EF4444', // red    — mantém o hex de `zone.Z5`
} as const;

export const workoutZoneLabel = zoneLabel;

// ── Font — famílias tokenizadas ──────────────────────────────────────────────
// `Space Grotesk` e `JetBrains Mono` já vinham carregadas no `index.html`, mas
// não eram token: os componentes escreviam `fontFamily: 'monospace'` cru, que
// resolve para a mono do sistema — a fonte carregada nunca aparecia na tela.
export const font = {
  display: '"Space Grotesk", "Syne", "Inter", sans-serif',
  text:    '"Inter", system-ui, sans-serif',
  mono:    '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
} as const;

// ── WorkoutProfile — geometria e preenchimento do bloco ──────────────────────
export const workoutProfileFill = {
  /** Gradiente vertical do topo (100%) à base (55%): o olho sobe com a intensidade. */
  gradientTopAlpha:    1.00,
  gradientBottomAlpha: 0.55,
  /** Banda sólida no topo — é ELA que carrega o contraste de 3:1, não o gradiente. */
  capHeightPx:  2,
  capAlpha:     1.00,
  /** Contorno de 1px a 100% — segundo portador de contraste (WCAG 1.4.11). */
  outlineAlpha:   1.00,
  outlineWidthPx: 1,
  /** Rampas (aquecimento/desaquecimento): mesma cor da zona, atenuada. */
  rampAlpha: 0.70,
  /** Bloco não-focado quando há um bloco ativo. */
  inactiveAlpha: 0.55,
  /** Sem prescrição confiável: hachura sobre neutro — o sinal de "não sei". */
  unknownFill:  surface[600],
  unknownHatch: 'repeating-linear-gradient(45deg, transparent 0 3px, rgba(255,255,255,.10) 3px 6px)',
  radiusTopPx:      2,
  radiusBottomPx:   0,
  separatorWidthPx: 1,
  /** O separador é o próprio fundo desenhado sobre a borda — não é um gap. */
  separatorColor: surfaceShift.panel,
} as const;

// ── WorkoutProfile — grade, eixos e cromo do plot ────────────────────────────
export const workoutProfileChrome = {
  plotBg:            surfaceShift.panel,
  gridlineColor:     overlayWhite[8],
  gridlineWidthPx:   1,
  baselineColor:     overlayWhite[15],
  baselineWidthPx:   1,
  axisTickColor:     overlayWhite[12],
  axisLabelColor:    surface[500],
  zoneLabelColor:    surface[500],
  bracketColor:      overlayWhite[25],
  bracketWidthPx:    1,
  bracketTickPx:     4,
  tooltipBg:         surfaceShift.raised,
  tooltipBorder:     overlayWhite[15],
  focusRingColor:    primary[500],
  focusRingWidthPx:  2,
  focusRingOffsetPx: 2,
} as const;

// ── WorkoutProfile — tipografia ──────────────────────────────────────────────
// Regra: todo número é mono, todo rótulo é texto. Números em mono alinham
// verticalmente entre blocos e entre chips, e é isso que deixa o treinador
// comparar durações sem reler — a razão é funcional, não estética.
export const workoutProfileType = {
  headerTitle:  { family: font.display, size: '0.875rem',  weight: 600, tracking: '0',       transform: 'none' },
  headerChip:   { family: font.mono,    size: '0.6875rem', weight: 500, tracking: '0.02em',  transform: 'none' },
  badge:        { family: font.mono,    size: '0.6875rem', weight: 700, tracking: '0.06em',  transform: 'uppercase' },
  blockLabel:   { family: font.text,    size: '0.625rem',  weight: 600, tracking: '0.01em',  transform: 'none' },
  axisTick:     { family: font.mono,    size: '0.625rem',  weight: 400, tracking: '0.02em',  transform: 'none' },
  zoneAxis:     { family: font.mono,    size: '0.5625rem', weight: 500, tracking: '0.04em',  transform: 'none' },
  bracketLabel: { family: font.mono,    size: '0.625rem',  weight: 700, tracking: '0.02em',  transform: 'none' },
  tooltipTitle: { family: font.text,    size: '0.8125rem', weight: 600, tracking: '0',       transform: 'none' },
  tooltipBody:  { family: font.text,    size: '0.75rem',   weight: 400, tracking: '0',       transform: 'none' },
  tooltipData:  { family: font.mono,    size: '0.75rem',   weight: 500, tracking: '0',       transform: 'none' },
} as const;

// ── WorkoutProfile — espaçamento por variante ────────────────────────────────
export const workoutProfileSpace = {
  cardPadding:   { full: 16, compact: 12, sparkline: 0 },
  headerGap:     12,
  chipGap:       8,
  plotToXAxis:   6,
  yAxisWidth:    { full: 22, compact: 0, sparkline: 0 },
  bracketToPlot: 6,
  bracketLane:   { full: 16, compact: 12, sparkline: 0 },
  plotHeight:    { full: 176, compact: 92, sparkline: 36 },
  cardRadius:    8,
} as const;

// TrainingStatus premium é montado em `activeTheme.ts` (premiumTrainingStatus,
// derivado de WORKOUT_STATUS_COLORS) — não duplicar aqui.

// ── Sidebar — lime tint de seleção (uso de lime permitido = ação) ─────────────
export const sidebar = {
  text:           text.secondary,
  textHover:      text.primary,
  selectedBg:     'rgba(189,222,90,0.15)', // lime tint = seleção/ação
  selectedBorder: primary[500],
  selectedIcon:   primary[500],
  hoverBg:        'rgba(255,255,255,0.08)',
  headerColor:    primary[500],
  divider:        'rgba(255,255,255,0.12)',
} as const;

// ── Glass — material translúcido / hairline ──────────────────────────────────
// backgroundActive/borderHover: affordances já em produção (feedback de hover/
// active), fora da tabela de 5 campos do design.md — mantidas aqui como
// extensão consistente (mesmo padrão rgba(255,255,255,X), task 3.1).
export const glass = {
  background:       'rgba(255,255,255,0.08)',
  backgroundHover:  'rgba(255,255,255,0.12)',
  backgroundActive: 'rgba(255,255,255,0.15)',
  border:           'rgba(255,255,255,0.15)',
  borderHover:      'rgba(255,255,255,0.25)',
  backdropFilter:   'blur(10px)',
  boxShadow:        '0 8px 32px rgba(0,0,0,0.40)',
} as const;

// ── Radius — dois raios e um pill ────────────────────────────────────────────
// Antes conviviam 14/16/16/16/18 fazendo o mesmo trabalho. `sharp` é controle
// (botão); `inner` é caixa dentro de painel; `outer` é card e painel; `pill` é
// chip. Cada raio tem um papel — não é escala decorativa.
//
// Com unidade, e não número puro: no `sx` do MUI um `borderRadius` numérico é
// multiplicado por `theme.shape.borderRadius` (4px), então `16` renderiza 64px.
export const radius = { sharp: '4px', inner: '12px', outer: '16px', pill: '100px' } as const;

// ── Agregado canônico ────────────────────────────────────────────────────────
export const premiumTokens = {
  primary,
  radius,
  surface,
  surfaceShift,
  text,
  semantic,
  categorical,
  readiness,
  trainingType,
  trainingStage,
  zone,
  sidebar,
  glass,
} as const;

export type PremiumTokens = typeof premiumTokens;
