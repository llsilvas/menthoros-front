import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createHashRouter, RouterProvider } from 'react-router';
import type { ReactElement } from 'react';
import { StrongerBlock } from './StrongerBlock';
import { ZonesBlock } from './ZonesBlock';
import { AdherenceBlock } from './AdherenceBlock';
import { RecordsBlock } from './RecordsBlock';

vi.mock('../PMCChart', () => ({ PMCChart: () => <div data-testid="pmc-chart-mock">pmc</div> }));

function renderComRouter(el: ReactElement) {
  const router = createHashRouter([{ path: '/', element: el }, { path: '/athlete/coach', element: <div>coach</div> }]);
  return render(<RouterProvider router={router} />);
}

describe('StrongerBlock', () => {
  const base = { ctlHoje: 48, forma: { label: 'Forma ideal', tone: 'success' as const }, sparkline: [42, 44, 46, 48] };

  it('descreve a variação com o número — nunca "Sim"/"Não" — e tem "Falar com o coach"', () => {
    renderComRouter(<StrongerBlock reading={{ ...base, delta: 6, tendencia: 'subiu' }} pmcData={[]} />);
    expect(screen.getByTestId('progress-stronger-reading')).toHaveTextContent('Sua carga subiu +6');
    expect(screen.queryByText(/^(Sim|Não)$/)).toBeNull();
    expect(screen.getByText('Forma ideal')).toBeInTheDocument();
    expect(screen.getByTestId('progress-sparkline')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /falar com o coach/i })).toHaveAttribute('href', '#/athlete/coach');
  });

  it('estável, caiu e "ainda cedo" sem delta', () => {
    const { unmount } = renderComRouter(<StrongerBlock reading={{ ...base, delta: -1, tendencia: 'estavel' }} pmcData={[]} />);
    expect(screen.getByTestId('progress-stronger-reading')).toHaveTextContent('ficou estável');
    unmount();
    const r2 = renderComRouter(<StrongerBlock reading={{ ...base, delta: -4, tendencia: 'caiu' }} pmcData={[]} />);
    expect(screen.getByTestId('progress-stronger-reading')).toHaveTextContent('Sua carga caiu −4');
    r2.unmount();
    renderComRouter(<StrongerBlock reading={{ ...base, delta: null, tendencia: null }} pmcData={[]} />);
    expect(screen.getByTestId('progress-stronger-reading')).toHaveTextContent('Ainda cedo para comparar');
  });

  it('"Ver o gráfico completo" expande o PMCChart inline (não some para drawer)', async () => {
    renderComRouter(<StrongerBlock reading={{ ...base, delta: 6, tendencia: 'subiu' }} pmcData={[]} />);
    expect(screen.queryByTestId('progress-pmc-expanded')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /ver o gráfico completo/i }));
    expect(await screen.findByTestId('pmc-chart-mock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fechar o gráfico/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: /falar com o coach/i })).toBeInTheDocument();
  });
});

describe('ZonesBlock', () => {
  it('cinco barras somando 100 e a dominante em palavras, sem alvo', () => {
    renderComRouter(<ZonesBlock reading={{ percentuais: { z1: 12, z2: 62, z3: 10, z4: 13, z5: 3 }, dominante: 'z2', totalSegundos: 1000 }} periodLabel="90 dias" />);
    const rows = screen.getAllByTestId('progress-zone-row');
    expect(rows).toHaveLength(5);
    expect(rows.reduce((t, r) => t + Number(r.dataset.pct), 0)).toBe(100);
    expect(screen.getByText(/Z2 — 62%/)).toBeInTheDocument();
    expect(screen.queryByText(/alvo/i)).toBeNull();
  });
});

describe('AdherenceBlock', () => {
  it('N de M, percentual, quatro barras com corrente e "sem plano"', () => {
    renderComRouter(<AdherenceBlock reading={{ realizado: 5, planejado: 7, percentual: 71, semanas: [
      { semanaInicio: '2026-08-03', planejado: 0, realizado: 0, semPlano: true, corrente: false },
      { semanaInicio: '2026-08-10', planejado: 4, realizado: 3, semPlano: false, corrente: false },
      { semanaInicio: '2026-08-17', planejado: 0, realizado: 0, semPlano: true, corrente: false },
      { semanaInicio: '2026-08-24', planejado: 3, realizado: 2, semPlano: false, corrente: true },
    ] }} />);
    expect(screen.getByTestId('progress-adherence-count')).toHaveTextContent('5 de 7');
    expect(screen.getByText(/treinos feitos · 71%/)).toBeInTheDocument();
    const bars = screen.getAllByTestId('progress-week-bar');
    expect(bars).toHaveLength(4);
    expect(bars.filter((b) => b.dataset.noPlan === 'true')).toHaveLength(2);
    expect(bars[3].dataset.current).toBe('true');
    expect(within(bars[3]).getByText(/2\/3 · esta/)).toBeInTheDocument();
    // Sem veredito: a pergunta é a única ocorrência de "cumprindo"; nenhuma frase avalia o atleta.
    expect(screen.queryByText(/falhando|abaixo do planejado|muito bem|mal/i)).toBeNull();
  });
});

describe('RecordsBlock', () => {
  it('recorde novo marcado, data formatada, próxima prova', () => {
    renderComRouter(<RecordsBlock provaConhecida reading={{ rows: [
      { distancia: '5 km', tempoFormatado: '00:24:31', dataIso: '2026-08-10', dataFormatada: '10 de ago', novo: true },
      { distancia: '10 km', tempoFormatado: '00:52:08', dataIso: '2026-05-03', dataFormatada: '3 de mai', novo: false },
    ], proximaProva: { nomeProva: 'Meia de Floripa', diasFaltando: 39 } }} />);
    const rows = screen.getAllByTestId('progress-record-row');
    expect(rows[0].dataset.new).toBe('true');
    expect(within(rows[0]).getByText('novo')).toBeInTheDocument();
    expect(screen.getByText('10 de ago')).toBeInTheDocument();
    expect(screen.getByTestId('progress-next-race')).toHaveTextContent(/Meia de Floripa em 39 dias/);
  });

  it('sem recordes e prova desconhecida: estados honestos', () => {
    renderComRouter(<RecordsBlock provaConhecida={false} reading={{ rows: [], proximaProva: null }} />);
    expect(screen.getByText(/ainda sem recordes/i)).toBeInTheDocument();
    expect(screen.getByText(/próxima prova indisponível/i)).toBeInTheDocument();
    expect(screen.queryByText(/peça ao seu coach/i)).toBeNull();
  });
});
