import { Box } from '@mui/material';
import type { CSSProperties } from 'react';
import { activeTheme } from '../../../../theme/activeTheme';
import { layoutBlocks, heightOf } from '../geometry';
import { xAxisTicks, zoneBands } from '../axis';
import type { ProfileBlock, WorkoutProfile } from '../types';
import type { ProfileVariant } from '../useResolvedVariant';
import { usePlotWidth } from '../usePlotWidth';

const { workoutZone, workoutProfileFill: fill, workoutProfileChrome: chrome, workoutProfileType: type, workoutProfileSpace: space } = activeTheme;

interface ProfilePlotProps {
  profile: WorkoutProfile;
  variant: ProfileVariant;
  activeBlockId: string | null;
  onActivate: (id: string | null) => void;
  onSelect?: (block: ProfileBlock) => void;
}

export function ProfilePlot({ profile, variant, activeBlockId, onActivate, onSelect }: ProfilePlotProps) {
  const plotHeight = space.plotHeight[variant];
  // A geometria é calculada contra a largura MEDIDA do plot. Com uma largura
  // fixa, a soma das larguras não bate com o container: os blocos do fim vazam
  // e são cortados pelo `overflow: hidden`, e o eixo de tempo mente em silêncio.
  const { ref: plotRef, width: plotWidth } = usePlotWidth();
  const { blocks, overflowCompressed } = layoutBlocks(profile.blocks, plotWidth);
  const ticks = variant === 'sparkline' ? [] : xAxisTicks(profile.metrics.totalDurationSec);
  const bands = variant === 'full' ? zoneBands(profile.scale) : [];
  const grupos = variant === 'sparkline' ? [] : gruposDeRepeticao(profile.blocks);

  return (
    <Box>
      {grupos.length > 0 && (
        <Box
          data-testid="bracket-lane"
          // Deslocada pela goteira do eixo Y, senão o bracket fica fora de
          // registro com os blocos que ele agrupa — as pernas cairiam ao lado
          // da série, e não sobre ela.
          sx={{
            position: 'relative',
            height: `${space.bracketLane[variant]}px`,
            mb: `${space.bracketToPlot}px`,
            ml: variant === 'full' ? `${space.yAxisWidth.full}px` : 0,
          }}
        >
          {grupos.map((g) => {
            const de = blocks[g.primeiroIndice];
            const ate = blocks[g.ultimoIndice];
            const largura = de && ate ? ate.x + ate.width - de.x : 0;
            return (
              <Box
                key={g.groupId}
                data-testid="repeat-bracket"
                sx={{
                  position: 'absolute',
                  left:  `${de?.x ?? 0}px`,
                  width: `${largura}px`,
                  height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderTop: largura >= 48 ? `${chrome.bracketWidthPx}px solid ${chrome.bracketColor}` : 'none',
                  borderLeft: largura >= 48 ? `${chrome.bracketWidthPx}px solid ${chrome.bracketColor}` : 'none',
                  borderRight: largura >= 48 ? `${chrome.bracketWidthPx}px solid ${chrome.bracketColor}` : 'none',
                  color: chrome.axisLabelColor,
                  fontFamily: type.bracketLabel.family,
                  fontSize: type.bracketLabel.size,
                  fontWeight: type.bracketLabel.weight,
                }}
              >
                {g.total}×
              </Box>
            );
          })}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
        {variant === 'full' && (
          <Box
            data-testid="zone-axis"
            sx={{ width: `${space.yAxisWidth.full}px`, height: `${plotHeight}px`, position: 'relative', flexShrink: 0 }}
          >
            {bands.map((b) => (
              <Box
                key={b.zone}
                sx={{
                  position: 'absolute',
                  bottom: `${b.center * 100}%`,
                  transform: 'translateY(50%)',
                  color: chrome.zoneLabelColor,
                  fontFamily: type.zoneAxis.family,
                  fontSize: type.zoneAxis.size,
                  fontWeight: type.zoneAxis.weight,
                  letterSpacing: type.zoneAxis.tracking,
                }}
              >
                {b.zone}
              </Box>
            ))}
          </Box>
        )}

        <Box
          ref={plotRef}
          data-testid="workout-plot"
          role="presentation"
          sx={{
            position: 'relative',
            flex: 1,
            height: `${plotHeight}px`,
            bgcolor: chrome.plotBg,
            // A altura do plot é a única fonte de verdade da geometria: nada
            // pode transbordar, e é por isso que o hover não escala nada.
            overflow: 'hidden',
            borderBottom: `${chrome.baselineWidthPx}px solid ${chrome.baselineColor}`,
          }}
          onMouseLeave={() => onActivate(null)}
        >
          {bands.map((b) => (
            <Box
              key={`grid-${b.zone}`}
              aria-hidden
              sx={{
                position: 'absolute', left: 0, right: 0,
                bottom: `${b.to * 100}%`,
                height: `${chrome.gridlineWidthPx}px`,
                bgcolor: chrome.gridlineColor,
              }}
            />
          ))}

          {profile.blocks.map((bloco, i) => {
            const geo = blocks[i];
            const altura = heightOf(bloco.intensityNormalized, plotHeight);
            const ativo = activeBlockId === null || activeBlockId === bloco.id;
            const desconhecido = bloco.confidence === 'unknown';
            const rotulo = rotuloDoBloco(bloco, geo.width, variant);
            // Rampa vira trapézio: aquecimento e desaquecimento são trajetórias,
            // e a FORMA é o que comunica o papel estrutural agora que a cor
            // pertence à zona. O bloco ocupa a altura do pico e recorta o resto.
            const recorte = bloco.ramp ? recorteDaRampa(bloco.ramp) : undefined;

            return (
              <Box
                key={bloco.id}
                data-testid="workout-block"
                data-block-id={bloco.id}
                data-zone={bloco.zone}
                data-kind={bloco.kind}
                data-confidence={bloco.confidence}
                data-ramp={bloco.ramp ? (bloco.ramp.toNormalized > bloco.ramp.fromNormalized ? 'up' : 'down') : undefined}
                onMouseEnter={() => onActivate(bloco.id)}
                onClick={onSelect ? () => onSelect(bloco) : undefined}
                // AC-1: a cor da zona entra como custom property INLINE. Via
                // `sx` ela viraria classe Emotion, e o Vitest roda com
                // `css: false` — a asserção passaria com trainingStage ainda
                // pintando o bloco, que é o defeito que o critério pega.
                style={{ '--zone-color': workoutZone[bloco.zone] } as CSSProperties}
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left:   `${geo.x}px`,
                  width:  `${geo.width}px`,
                  height: `${bloco.ramp ? heightOf(Math.max(bloco.ramp.fromNormalized, bloco.ramp.toNormalized), plotHeight) : altura}px`,
                  boxSizing: 'border-box',
                  clipPath: recorte,
                  background: desconhecido
                    ? `${fill.unknownFill}`
                    : `linear-gradient(180deg, var(--zone-color) 0%, color-mix(in srgb, var(--zone-color) ${fill.gradientBottomAlpha * 100}%, transparent) 100%)`,
                  backgroundImage: desconhecido ? fill.unknownHatch : undefined,
                  borderTop: `${fill.capHeightPx}px solid ${desconhecido ? chrome.axisTickColor : 'var(--zone-color)'}`,
                  outline: `${fill.outlineWidthPx}px solid ${desconhecido ? chrome.axisTickColor : 'var(--zone-color)'}`,
                  outlineOffset: `-${fill.outlineWidthPx}px`,
                  borderRadius: `${fill.radiusTopPx}px ${fill.radiusTopPx}px ${fill.radiusBottomPx}px ${fill.radiusBottomPx}px`,
                  borderRight: `${fill.separatorWidthPx}px solid ${fill.separatorColor}`,
                  // Só a opacidade muda no hover. Nenhuma transformação: a
                  // comparação de altura entre blocos precisa continuar válida
                  // enquanto o treinador passa o mouse.
                  opacity: ativo ? 1 : fill.inactiveAlpha,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  '@media (prefers-reduced-motion: no-preference)': {
                    transition: 'opacity 0.12s ease',
                  },
                  // Contraste alto: o gradiente vira fill sólido e o contorno
                  // dobra. A base a 55% é decorativa e some primeiro.
                  '@media (prefers-contrast: more)': {
                    background: desconhecido ? undefined : 'var(--zone-color)',
                    outlineWidth: `${fill.outlineWidthPx * 2}px`,
                  },
                }}
              >
                {rotulo && (
                  <Box
                    component="span"
                    data-testid="block-label"
                    sx={{
                      mt: '4px',
                      px: '2px',
                      color: activeTheme.surface[900],
                      fontFamily: type.blockLabel.family,
                      fontSize: type.blockLabel.size,
                      fontWeight: type.blockLabel.weight,
                      letterSpacing: type.blockLabel.tracking,
                      // Sem reticências: um rótulo cortado custa o mesmo pixel
                      // do ícone e informa menos — "AQUEC…" é ambíguo entre
                      // aquecimento e desaquecimento (AC-7).
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    }}
                  >
                    {rotulo}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {ticks.length > 0 && (
        <Box
          data-testid="x-axis"
          sx={{ position: 'relative', height: '14px', mt: `${space.plotToXAxis}px`, ml: variant === 'full' ? `${space.yAxisWidth.full}px` : 0 }}
        >
          {ticksVisiveis(ticks, variant).map((t) => (
            <Box
              key={`${t.label}-${t.ratio}`}
              component="span"
              data-testid="x-tick"
              sx={{
                position: 'absolute',
                left: `${t.ratio * 100}%`,
                transform: t.ratio === 1 ? 'translateX(-100%)' : t.ratio === 0 ? 'none' : 'translateX(-50%)',
                color: chrome.axisLabelColor,
                fontFamily: type.axisTick.family,
                fontSize: type.axisTick.size,
                letterSpacing: type.axisTick.tracking,
              }}
            >
              {t.isTotal && overflowCompressed ? `≈${t.label}` : t.label}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

/** Na variante compacta o eixo fica em três marcas: começo, meio e total. */
function ticksVisiveis(ticks: ReturnType<typeof xAxisTicks>, variant: ProfileVariant) {
  if (variant !== 'compact' || ticks.length <= 3) return ticks;
  return [ticks[0], ticks[Math.floor(ticks.length / 2)], ticks[ticks.length - 1]];
}

/**
 * O trapézio da rampa. O bloco é desenhado com a altura do pico e recortado nos
 * dois cantos superiores, de modo que a borda de cima acompanhe a trajetória —
 * subindo no aquecimento, descendo no desaquecimento.
 */
function recorteDaRampa(ramp: { fromNormalized: number; toNormalized: number }): string {
  const pico = Math.max(ramp.fromNormalized, ramp.toNormalized);
  if (pico <= 0) return 'none';

  // Frações da altura do bloco (que já é a do pico), medidas do topo para baixo.
  const quedaEsquerda = (1 - ramp.fromNormalized / pico) * 100;
  const quedaDireita  = (1 - ramp.toNormalized / pico) * 100;

  return `polygon(0% ${quedaEsquerda}%, 100% ${quedaDireita}%, 100% 100%, 0% 100%)`;
}

interface GrupoRepeticao {
  groupId: string;
  total: number;
  primeiroIndice: number;
  ultimoIndice: number;
}

function gruposDeRepeticao(blocos: ProfileBlock[]): GrupoRepeticao[] {
  const grupos = new Map<string, GrupoRepeticao>();
  blocos.forEach((b, i) => {
    if (!b.repeat) return;
    const existente = grupos.get(b.repeat.groupId);
    if (existente) existente.ultimoIndice = i;
    else grupos.set(b.repeat.groupId, { groupId: b.repeat.groupId, total: b.repeat.total, primeiroIndice: i, ultimoIndice: i });
  });
  return [...grupos.values()];
}

/**
 * Cadeia de fallback do rótulo (§4.7). A escolha real depende de **medir texto**
 * e por isso é verificada no Playwright; aqui aplica-se a regra sobre a largura
 * calculada, e a proibição de reticências vale sempre.
 */
function rotuloDoBloco(bloco: ProfileBlock, largura: number, variant: ProfileVariant): string | null {
  if (variant === 'sparkline') return null;
  // Dentro de uma série, só a primeira repetição fala: repetir "TRAB / REC"
  // cinco vezes é ruído, e o bracket já disse que se repete.
  if (bloco.repeat && bloco.repeat.index !== 1) return null;
  if (variant === 'compact') return null;

  const aproximado = (texto: string) => texto.length * 6;
  if (largura >= 44 && aproximado(bloco.label) + 12 <= largura) return bloco.label;
  if (bloco.shortLabel && aproximado(bloco.shortLabel) + 8 <= largura) return bloco.shortLabel;
  return null;
}
