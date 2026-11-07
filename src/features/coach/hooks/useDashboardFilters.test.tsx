import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useDashboardFilters } from './useDashboardFilters';

function comRota(entrada: string) {
  return ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={[entrada]}>{children}</MemoryRouter>;
}

describe('useDashboardFilters — visão "Em atenção"', () => {
  it('lê ?status=attention da URL, não manda status à API e preserva a página', () => {
    const fetchDashboard = vi.fn();
    const { result } = renderHook(() => useDashboardFilters({ fetchDashboard }), { wrapper: comRota('/coach/inbox?status=attention&page=2') });

    expect(result.current.dashboardStatus).toBe('attention');
    expect(result.current.dashboardPage).toBe(2);
    expect(fetchDashboard).toHaveBeenLastCalledWith(expect.objectContaining({ status: undefined, page: 2 }));
  });

  it('entrar em "Em atenção" preserva a página', () => {
    const { result } = renderHook(() => useDashboardFilters({ fetchDashboard: vi.fn() }), { wrapper: comRota('/coach/inbox?page=2') });
    act(() => result.current.handleDashboardStatusChange({ target: { value: 'attention' } }));
    expect(result.current.dashboardStatus).toBe('attention');
    expect(result.current.dashboardPage).toBe(2);
  });

  it('voltar a "Todos" devolve a página anterior', () => {
    const { result } = renderHook(() => useDashboardFilters({ fetchDashboard: vi.fn() }), { wrapper: comRota('/coach/inbox?status=attention&page=2') });
    act(() => result.current.handleDashboardStatusChange({ target: { value: 'all' } }));
    expect(result.current.dashboardStatus).toBe('all');
    expect(result.current.dashboardPage).toBe(2);
  });

  it('trocar para um status do roster zera a página', () => {
    const fetchDashboard = vi.fn();
    const { result } = renderHook(() => useDashboardFilters({ fetchDashboard }), { wrapper: comRota('/coach/inbox?page=2') });
    act(() => result.current.handleDashboardStatusChange({ target: { value: 'paused' } }));
    expect(result.current.dashboardStatus).toBe('paused');
    expect(result.current.dashboardPage).toBe(0);
    expect(fetchDashboard).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'paused', page: 0 }));
  });

  it('sair de "Em atenção" para um status do roster zera a página', () => {
    const { result } = renderHook(() => useDashboardFilters({ fetchDashboard: vi.fn() }), { wrapper: comRota('/coach/inbox?status=attention&page=2') });
    act(() => result.current.handleDashboardStatusChange({ target: { value: 'paused' } }));
    expect(result.current.dashboardStatus).toBe('paused');
    expect(result.current.dashboardPage).toBe(0);
  });

  it('busca: a URL só sobrescreve o texto digitado em mudança externa', () => {
    const { result } = renderHook(() => useDashboardFilters({ fetchDashboard: vi.fn() }), { wrapper: comRota('/coach/inbox?q=ana') });
    expect(result.current.search).toBe('ana');
    act(() => result.current.handleSearchChange({ target: { value: 'anab' } }));
    expect(result.current.search).toBe('anab');
  });

  it('resetFilters volta a "Todos"', () => {
    const { result } = renderHook(() => useDashboardFilters({ fetchDashboard: vi.fn() }), { wrapper: comRota('/coach/inbox?status=attention') });
    act(() => result.current.resetFilters());
    expect(result.current.dashboardStatus).toBe('all');
  });
});
