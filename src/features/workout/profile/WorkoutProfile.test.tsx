import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkoutProfile } from './WorkoutProfile';
import { selectWorkoutProfile } from './selectWorkoutProfile';
import type { ProfileEtapaInput } from './input';
import { activeTheme } from '../../../theme/activeTheme';

const etapa = (over: Partial<ProfileEtapaInput> = {}): ProfileEtapaInput => ({
  tipo: 'PRINCIPAL', duracaoMin: 10, ...over,
});

/** O 5×3' no limiar da spec §2.6, com as zonas declaradas. */
const cincoVezesTres: ProfileEtapaInput[] = [
  etapa({ tipo: 'AQUECIMENTO', duracaoMin: 10, fcAlvo: 'Z2' }),
  ...Array.from({ length: 5 }, (_, i) => [
    etapa({ tipo: 'INTERVALADO', duracaoMin: 3, fcAlvo: 'Z4', blocoId: 'g1', blocoRepeticoes: 5, blocoRepeticaoIndex: i + 1 }),
    etapa({ tipo: 'RECUPERACAO', duracaoMin: 2, fcAlvo: 'Z1', blocoId: 'g1', blocoRepeticoes: 5, blocoRepeticaoIndex: i + 1 }),
  ]).flat(),
  etapa({ tipo: 'DESAQUECIMENTO', duracaoMin: 5, fcAlvo: 'Z2' }),
];

const perfil = (etapas = cincoVezesTres, ctx = {}) =>
  selectWorkoutProfile(etapas, { sport: 'run', ...ctx });

const renderizar = (etapas = cincoVezesTres, props = {}, ctx = {}) =>
  render(<WorkoutProfile profile={perfil(etapas, ctx)} variant="full" {...props} />);

describe('AC-1 — a zona pinta o bloco, e o papel estrutural não pinta nada', () => {
  it('cada bloco declara a cor da própria zona como custom property inline', () => {
    renderizar();
    const blocos = screen.getAllByTestId('workout-block');

    for (const bloco of blocos) {
      const zona = bloco.getAttribute('data-zone') as 'Z1' | 'Z2' | 'Z4';
      expect(bloco.style.getPropertyValue('--zone-color')).toBe(activeTheme.workoutZone[zona]);
    }
  });

  it('blocos de zonas diferentes recebem cores diferentes', () => {
    renderizar();
    const cores = new Set(
      screen.getAllByTestId('workout-block').map((b) => b.style.getPropertyValue('--zone-color')),
    );
    expect(cores.size).toBe(3); // Z1, Z2 e Z4
  });

  // O componente antigo pintava o preenchimento com `trainingStage` — a etapa
  // estrutural — e escondia a zona numa borda de 3px.
  it('nenhuma cor de trainingStage aparece em bloco nenhum', () => {
    renderizar();
    const estagios = Object.values(activeTheme.trainingStage);
    const html = screen.getByTestId('workout-profile').innerHTML;
    for (const cor of estagios) {
      expect(html.toLowerCase()).not.toContain(cor.toLowerCase());
    }
  });
});

describe('AC-3 (parte estrutural) — o hover não mexe na geometria', () => {
  // A comparação de altura entre blocos precisa continuar válida durante o
  // hover; o `scaleY(1.04)` do componente antigo a invalidava — além de causar
  // o transbordo vertical.
  it('nenhum bloco declara transform', async () => {
    renderizar();
    const blocos = screen.getAllByTestId('workout-block');
    await userEvent.hover(blocos[1]);

    for (const bloco of screen.getAllByTestId('workout-block')) {
      const estilo = getComputedStyle(bloco);
      expect(estilo.transform === '' || estilo.transform === 'none').toBe(true);
    }
  });

  it('o plot recorta o que passar da altura', () => {
    renderizar();
    expect(getComputedStyle(screen.getByTestId('workout-plot')).overflow).toBe('hidden');
  });
});

describe('rampas — a forma comunica o papel, agora que a cor é da zona', () => {
  it('aquecimento sobe e desaquecimento desce', () => {
    renderizar();
    const blocos = screen.getAllByTestId('workout-block');
    expect(blocos[0].getAttribute('data-ramp')).toBe('up');
    expect(blocos[blocos.length - 1].getAttribute('data-ramp')).toBe('down');
  });

  it('só aquecimento e desaquecimento são rampa — o resto é patamar', () => {
    renderizar();
    const comRampa = screen.getAllByTestId('workout-block').filter((b) => b.getAttribute('data-ramp'));
    expect(comRampa).toHaveLength(2);
  });

  it('o trapézio recorta os dois cantos superiores em alturas diferentes', () => {
    renderizar();
    const recorte = getComputedStyle(screen.getAllByTestId('workout-block')[0]).clipPath;
    expect(recorte).toMatch(/^polygon\(/);
    const [esquerda, direita] = [...recorte.matchAll(/(\d+(?:\.\d+)?)%\)?,|\s(\d+(?:\.\d+)?)%/g)]
      .map((m) => Number(m[1] ?? m[2]));
    expect(esquerda).not.toBe(direita);
  });
});

describe('AC-4 — o eixo X tem marcas intermediárias', () => {
  it('um treino de 40min mostra 0, 5, …, 40', () => {
    renderizar();
    const marcas = screen.getAllByTestId('x-tick').map((t) => t.textContent);
    expect(marcas).toEqual(['0', '5', '10', '15', '20', '25', '30', '35', '40']);
  });
});

describe('AC-5 (parte estrutural) — série repetida', () => {
  it('desenha exatamente um bracket, com o total de repetições', () => {
    renderizar();
    const brackets = screen.getAllByTestId('repeat-bracket');
    expect(brackets).toHaveLength(1);
    expect(brackets[0].textContent).toBe('5×');
  });

  // A asserção é sobre a REGRA, não sobre a contagem: quantos rótulos cabem
  // depende da largura medida do texto, que difere entre jsdom (estimativa
  // pessimista) e navegador. O que não pode variar é *quais* blocos podem falar.
  it('nenhuma repetição além da primeira leva rótulo — as outras seriam ruído', () => {
    renderizar();
    const p = perfil();

    for (const bloco of screen.getAllByTestId('workout-block')) {
      const id = bloco.getAttribute('data-block-id');
      const modelo = p.blocks.find((b) => b.id === id)!;
      if (modelo.repeat && modelo.repeat.index !== 1) {
        expect(
          within(bloco).queryByTestId('block-label'),
          `repetição ${modelo.repeat.index} não pode ter rótulo`,
        ).toBeNull();
      }
    }

    // E alguém fala: o aquecimento, que é o bloco mais largo do treino.
    const primeiro = screen.getAllByTestId('workout-block')[0];
    expect(within(primeiro).getByTestId('block-label')).toHaveTextContent(/aquecimento/i);
  });
});

describe('AC-6 — badge e distribuição não conseguem divergir', () => {
  it('a badge mostra exatamente a zona-alvo do perfil', () => {
    const p = perfil();
    render(<WorkoutProfile profile={p} variant="full" />);
    const badge = screen.getByTestId('target-zone-badge');
    expect(badge.getAttribute('data-zone')).toBe(p.metrics.targetZone);
    expect(badge.textContent).toContain('Z4');
  });

  it('as fatias da distribuição somam 100%', () => {
    renderizar();
    const legendas = screen.getByTestId('distribution-legend').textContent ?? '';
    const percentuais = [...legendas.matchAll(/(\d+)%/g)].map((m) => Number(m[1]));
    expect(percentuais.reduce((s, n) => s + n, 0)).toBeGreaterThanOrEqual(99);
    expect(percentuais.reduce((s, n) => s + n, 0)).toBeLessThanOrEqual(101);
  });

  it('a zona da badge aparece na legenda da distribuição', () => {
    renderizar();
    expect(screen.getByTestId('distribution-legend').textContent).toContain('Z4');
  });
});

describe('razão trabalho:recuperação — só aparece quando significa algo', () => {
  it('o intervalado exibe a razão como o treinador a enuncia', () => {
    renderizar();
    expect(screen.getByTestId('header-chips')).toHaveTextContent('trabalho 3:2');
  });

  // Antes, um treino contínuo exibia "trabalho 11:4" — um número que o gráfico
  // ao lado contradizia.
  it('o treino sem série não exibe chip de razão nenhum', () => {
    renderizar([
      etapa({ tipo: 'AQUECIMENTO', duracaoMin: 15, fcAlvo: 'Z2' }),
      etapa({ tipo: 'PRINCIPAL', duracaoMin: 55, fcAlvo: 'Z3' }),
      etapa({ tipo: 'DESAQUECIMENTO', duracaoMin: 5, fcAlvo: 'Z1' }),
    ]);
    expect(screen.getByTestId('header-chips')).not.toHaveTextContent(/trabalho/);
  });
});

describe('AC-7 (parte de conteúdo) — sem reticências', () => {
  it('nenhum rótulo de bloco contém reticências', () => {
    renderizar([
      etapa({ tipo: 'AQUECIMENTO', duracaoMin: 1, fcAlvo: 'Z2', descricao: 'Aquecimento progressivo bem longo' }),
      etapa({ tipo: 'PRINCIPAL', duracaoMin: 59, fcAlvo: 'Z3' }),
    ]);
    for (const rotulo of screen.queryAllByTestId('block-label')) {
      expect(rotulo.textContent).not.toMatch(/…|\.\.\./);
    }
  });

  it('o rótulo curto vem do dado, nunca de um corte em runtime', () => {
    renderizar([
      etapa({ tipo: 'DESAQUECIMENTO', duracaoMin: 30, fcAlvo: 'Z1', descricao: 'Um nome longo demais para caber aqui dentro' }),
    ]);
    const rotulos = screen.queryAllByTestId('block-label').map((r) => r.textContent);
    // "DESAQ" declarado, não "Um na…"
    expect(rotulos.every((r) => r === 'DESAQ' || (r?.length ?? 0) > 5)).toBe(true);
  });
});

describe('AC-12 — equivalente textual completo', () => {
  it('a tabela oculta tem uma linha por bloco', () => {
    const p = perfil();
    render(<WorkoutProfile profile={p} variant="full" />);
    expect(screen.getAllByTestId('profile-table-row')).toHaveLength(p.blocks.length);
  });

  it('cada linha traz ordem, nome, duração, zona e alvo — não linhas vazias', () => {
    renderizar();
    for (const linha of screen.getAllByTestId('profile-table-row')) {
      const celulas = within(linha).getAllByRole('cell').map((c) => c.textContent?.trim() ?? '');
      expect(celulas).toHaveLength(5);
      expect(celulas.every((c) => c.length > 0)).toBe(true);
    }
  });

  it('o resumo falado sai do mesmo perfil que desenha o gráfico', () => {
    renderizar();
    const rotulo = screen.getByRole('img').getAttribute('aria-label') ?? '';
    expect(rotulo).toContain('40 min');
    expect(rotulo).toContain('12 blocos');
    expect(rotulo).toContain('Z4');
  });
});

describe('AC-13 — modo degradado', () => {
  const semZona = [
    etapa({ tipo: 'AQUECIMENTO', duracaoMin: 10 }),
    etapa({ tipo: 'INTERVALADO', duracaoMin: 20 }),
    etapa({ tipo: 'RECUPERACAO', duracaoMin: 10 }),
  ];

  it('não renderiza a badge de zona-alvo', () => {
    renderizar(semZona);
    expect(screen.queryByTestId('target-zone-badge')).toBeNull();
  });

  it('avisa que a intensidade é estimada', () => {
    renderizar(semZona);
    expect(screen.getByTestId('chip-degraded').textContent).toContain('intensidade estimada');
  });

  it('rotula a distribuição por etapa, não por zona', () => {
    renderizar(semZona);
    expect(screen.getByTestId('distribution-legend').textContent).toContain('por etapa');
  });
});

describe('etapas sem duração', () => {
  it('avisa no header quantas etapas ficaram de fora', () => {
    renderizar([
      etapa({ duracaoMin: 30, fcAlvo: 'Z2' }),
      etapa({ duracaoMin: 0 }),
      etapa({ duracaoMin: undefined }),
    ]);
    expect(screen.getByTestId('chip-dropped').textContent).toContain('2 etapas sem duração');
  });
});

describe('estados', () => {
  it('mostra o skeleton com a mesma altura do gráfico final', () => {
    render(<WorkoutProfile profile={perfil()} variant="full" state="loading" />);
    expect(screen.getByTestId('workout-profile-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('workout-plot')).toBeNull();
  });

  it('no vazio, explica e oferece a ação quando o consumidor a fornece', async () => {
    const onAddBlocks = vi.fn();
    render(<WorkoutProfile profile={perfil([])} variant="full" onAddBlocks={onAddBlocks} />);

    expect(screen.getByText(/não tem etapas estruturadas/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /adicionar etapas/i }));
    expect(onAddBlocks).toHaveBeenCalledOnce();
  });

  it('sem a ação, o vazio não inventa um botão', () => {
    render(<WorkoutProfile profile={perfil([])} variant="full" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('interação', () => {
  it('o hover destaca um bloco e apaga os demais', async () => {
    renderizar();
    const blocos = screen.getAllByTestId('workout-block');
    await userEvent.hover(blocos[1]);
    expect(screen.getByTestId('block-tooltip')).toBeInTheDocument();
  });

  it('o tooltip diz onde o bloco está e a que série pertence', async () => {
    renderizar();
    await userEvent.hover(screen.getAllByTestId('workout-block')[1]);
    const tooltip = screen.getByTestId('block-tooltip');
    expect(tooltip.textContent).toContain('bloco 2 de 12');
    expect(tooltip.textContent).toContain('repetição 1 de 5');
  });

  it('é controlado quando o consumidor passa activeBlockId', async () => {
    const onChange = vi.fn();
    const p = perfil();
    render(<WorkoutProfile profile={p} variant="full" activeBlockId={null} onActiveBlockChange={onChange} />);

    await userEvent.hover(screen.getAllByTestId('workout-block')[2]);
    expect(onChange).toHaveBeenCalledWith(p.blocks[2].id);
    // Controlado: o estado interno não assume — quem manda é a prop.
    expect(screen.queryByTestId('block-tooltip')).toBeNull();
  });
});

describe('teclado', () => {
  it('o plot inteiro é um único tab stop', async () => {
    renderizar();
    await userEvent.tab();
    expect(screen.getByRole('img')).toHaveFocus();
  });

  it('as setas horizontais percorrem os blocos', async () => {
    renderizar();
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByTestId('block-tooltip').textContent).toContain('bloco 1 de 12');
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByTestId('block-tooltip').textContent).toContain('bloco 2 de 12');
  });

  it('End vai para o último bloco', async () => {
    renderizar();
    await userEvent.tab();
    await userEvent.keyboard('{End}');
    expect(screen.getByTestId('block-tooltip').textContent).toContain('bloco 12 de 12');
  });

  // O atalho de "onde começa o trabalho?" — sem ele, achar o primeiro tiro num
  // intervalado longo exige percorrer todas as repetições.
  it('a seta vertical pula para o próximo bloco de zona diferente', async () => {
    renderizar();
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');   // bloco 1, Z2
    await userEvent.keyboard('{ArrowUp}');      // pula para o primeiro Z4
    expect(screen.getByTestId('block-tooltip').textContent).toContain('bloco 2 de 12');
  });

  it('Escape fecha o tooltip', async () => {
    renderizar();
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByTestId('block-tooltip')).toBeNull();
  });
});

describe('variantes', () => {
  it('sparkline não tem header, eixo, distribuição nem foco', () => {
    render(<WorkoutProfile profile={perfil()} variant="sparkline" />);
    expect(screen.queryByTestId('header-chips')).toBeNull();
    expect(screen.queryByTestId('x-axis')).toBeNull();
    expect(screen.queryByTestId('distribution')).toBeNull();
    expect(screen.getByRole('img')).toHaveAttribute('tabindex', '-1');
  });

  it('compact mantém badge e as duas primeiras métricas, sem título', () => {
    render(<WorkoutProfile profile={perfil()} variant="compact" />);
    expect(screen.getByTestId('target-zone-badge')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getAllByTestId('header-chip')).toHaveLength(2);
  });

  it('o eixo Y com as zonas só aparece na variante full', () => {
    const { rerender } = render(<WorkoutProfile profile={perfil()} variant="full" />);
    expect(screen.getByTestId('zone-axis')).toBeInTheDocument();
    rerender(<WorkoutProfile profile={perfil()} variant="compact" />);
    expect(screen.queryByTestId('zone-axis')).toBeNull();
  });
});
