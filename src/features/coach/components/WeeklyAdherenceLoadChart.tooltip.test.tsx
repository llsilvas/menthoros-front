import { cloneElement, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { WeeklyAdherenceLoadChart } from './WeeklyAdherenceLoadChart';
import type { WeeklyDiagnosisPoint } from '../types/CoachInbox';

/*
 * Os dois painéis são sincronizados por `syncId`: ao passar o mouse, os dois ativam o tooltip.
 * Se ambos tiverem conteúdo, o coach vê a mesma semana descrita duas vezes. O recharts não
 * desenha tooltip em jsdom (container sem tamanho), então o teste dá tamanho fixo ao gráfico e
 * inspeciona o `content` passado a cada `<Tooltip>`.
 */
const conteudos: unknown[] = [];
vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal<typeof import('recharts')>();
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: ReactElement<{ width?: number; height?: number }> }) =>
      cloneElement(children, { width: 600, height: 140 }),
    Tooltip: (props: { content?: ReactNode }) => {
      conteudos.push(props.content);
      return null;
    },
  };
});

const SEMANA: WeeklyDiagnosisPoint = {
  weekStart: '2026-09-21',
  label: '21/09',
  tss: 120,
  activeDays: 3,
  planned: 4,
  completed: 3,
  adherence: 75,
  noData: false,
  current: false,
};

const comConteudo = () => conteudos.filter((c) => isValidElement(c) && (c.type as { name?: string }).name === 'WeekTooltip');

describe('WeeklyAdherenceLoadChart — tooltip', () => {
  beforeEach(() => {
    conteudos.length = 0;
  });

  it('com os dois painéis, só um descreve a semana', () => {
    render(<WeeklyAdherenceLoadChart weeks={[SEMANA]} gaps={[]} adherenceAvailable pmcAvailable />);
    expect(conteudos).toHaveLength(2);
    expect(comConteudo()).toHaveLength(1);
  });

  it('com a adesão indisponível, o painel de carga descreve a semana', () => {
    render(<WeeklyAdherenceLoadChart weeks={[SEMANA]} gaps={[]} adherenceAvailable={false} pmcAvailable />);
    expect(comConteudo()).toHaveLength(1);
  });
});
