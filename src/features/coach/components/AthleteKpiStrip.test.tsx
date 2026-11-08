import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { AthleteKpiStrip } from './AthleteKpiStrip';
import { AthleteNextRace } from './AthleteNextRace';
import type { AthleteKpi } from '../adapters/athleteKpiAdapters';

const KPIS: AthleteKpi[] = [
  { key: 'adherence', label: 'Aderência', qualifier: '4 sem', value: '31%', detail: '5 de 16 treinos planejados', tone: 'warning', badge: null },
  { key: 'acwr', label: 'ACWR', qualifier: null, value: '1,97', detail: 'Base crônica incompleta: 60 dias sem treinos registrados', tone: 'neutral', badge: 'Baixa confiança' },
];

describe('AthleteKpiStrip', () => {
  it('mostra rótulo e valor; a base do número fica no title e no leitor de tela, não na tela', () => {
    render(<AthleteKpiStrip kpis={KPIS} />);
    const celula = screen.getByTestId('kpi-adherence');
    expect(within(celula).getByText('Aderência')).toBeInTheDocument();
    expect(within(celula).getByText('31%')).toBeInTheDocument();
    expect(celula).toHaveAttribute('title', '5 de 16 treinos planejados');
    const oculto = within(celula).getByText('5 de 16 treinos planejados');
    // `visuallyHidden` do MUI: fora do fluxo e recortado, mas presente para o leitor de tela.
    expect(getComputedStyle(oculto).position).toBe('absolute');
    expect(getComputedStyle(oculto).width).toBe('1px');
    // O E2E "nenhum texto abaixo de 11px" conta texto recortado: tamanho explícito.
    expect(getComputedStyle(oculto).fontSize).toBe('0.6875rem');
  });

  it('a faixa tem testid para medir a altura', () => {
    render(<AthleteKpiStrip kpis={KPIS} />);
    expect(screen.getByTestId('inbox-kpi-faixa')).toBeInTheDocument();
  });

  it('célula sem dado: só "—", sem title e sem texto oculto', () => {
    render(<AthleteKpiStrip kpis={[{ key: 'form', label: 'Forma', qualifier: 'TSB', value: '—', detail: '', tone: 'neutral', badge: null }]} />);
    const celula = screen.getByTestId('kpi-form');
    expect(celula).toHaveTextContent(/^Forma · TSB—$/);
    expect(celula).not.toHaveAttribute('title');
  });

  /** O tom não pode viver só na cor (toneMarker): warning tem ícone com rótulo acessível. */
  it('tom de atenção tem marcador acessível; neutro não', () => {
    render(<AthleteKpiStrip kpis={KPIS} />);
    expect(within(screen.getByTestId('kpi-adherence')).getByTitle('Atenção')).toBeInTheDocument();
    expect(within(screen.getByTestId('kpi-acwr')).queryByTitle(/atenção|adequado|crítico/i)).not.toBeInTheDocument();
  });

  it('ACWR de baixa confiança mostra o selo; o motivo vai para o title', () => {
    render(<AthleteKpiStrip kpis={KPIS} />);
    const celula = screen.getByTestId('kpi-acwr');
    expect(within(celula).getByText('Baixa confiança')).toBeInTheDocument();
    expect(celula).toHaveAttribute('title', expect.stringMatching(/60 dias sem treinos registrados/));
  });
});

describe('AthleteNextRace', () => {
  it('prova alvo com nome e contagem', () => {
    render(<AthleteNextRace race={{ label: 'Prova alvo', name: 'Mizuno Athenas Run Longer 2026', when: '18 out · em 20 dias', isTarget: true }} />);
    expect(screen.getByText('Prova alvo')).toBeInTheDocument();
    expect(screen.getByText('18 out · em 20 dias')).toBeInTheDocument();
  });

  it('sem prova', () => {
    render(<AthleteNextRace race={null} />);
    expect(screen.getByText('Sem prova cadastrada')).toBeInTheDocument();
  });
});

describe('AthleteKpiStrip — modo denso', () => {
  it('rótulo e valor dividem a mesma linha; o selo fica ao lado do valor', () => {
    render(<AthleteKpiStrip kpis={KPIS} />);
    const celula = screen.getByTestId('kpi-acwr');
    expect(getComputedStyle(celula).flexDirection).not.toBe('column');
    const valor = within(celula).getByText('1,97');
    expect(valor.parentElement).toContainElement(within(celula).getByText('Baixa confiança'));
  });
});
