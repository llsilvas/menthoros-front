import { useCallback, useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import type { CoachAtletaStatus, CoachDashboardQuery } from '../../../types/Coach';

type SortKey = 'priority' | 'adherence' | 'load' | 'race';
/** `attention` é uma visão da fila (só cliente): a API não filtra por "tem sinal". */
type DashboardStatusFilter = 'all' | 'attention' | CoachAtletaStatus;

export const ROSTER_PAGE_SIZE = 10;

function parseSort(value: string | null): SortKey {
  if (value === 'adherence' || value === 'load' || value === 'race') return value;
  return 'priority';
}

function parseDashboardStatus(value: string | null): DashboardStatusFilter {
  if (value === 'active' || value === 'warning' || value === 'danger' || value === 'paused' || value === 'attention') return value;
  return 'all';
}

function parsePage(value: string | null): number {
  const page = Number.parseInt(value ?? '0', 10);
  return Number.isFinite(page) && page > 0 ? page : 0;
}

function toDashboardSort(sortBy: SortKey): NonNullable<CoachDashboardQuery['sortBy']> {
  if (sortBy === 'load') return 'volume';
  return 'priority';
}

function sortKeyLabel(sortBy: SortKey): string {
  if (sortBy === 'adherence') return 'Maior aderência';
  if (sortBy === 'load') return 'Maior carga';
  if (sortBy === 'race') return 'Próxima prova';
  return 'Prioridade alta';
}

interface UseDashboardFiltersParams {
  fetchDashboard: (query: CoachDashboardQuery) => void;
}

export type { SortKey, DashboardStatusFilter };

/**
 * Filtros, ordenação e página do roster do inbox, com a URL como fonte.
 *
 * Status, ordenação e página são lidos da URL e só mudam por ela: manter `page` também em
 * estado local, sincronizado por dois efeitos (URL → estado, estado → URL), fazia os efeitos
 * brigarem quando um handler mudava estado e URL no mesmo ato — a página oscilava 2 ↔ 0 sem
 * parar e a troca de status se perdia. Só a busca continua em estado local, por ser texto
 * digitado (debounce) que a URL recebe depois.
 */
export function useDashboardFilters({ fetchDashboard }: UseDashboardFiltersParams) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const dashboardPage = parsePage(searchParams.get('page'));
  const dashboardStatus = parseDashboardStatus(searchParams.get('status'));
  const sortBy = parseSort(searchParams.get('sortBy'));
  const debouncedSearch = useDebounce(search, 300);

  const setDashboardPage = useCallback((page: number) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (page > 0) next.set('page', String(page));
      else next.delete('page');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // busca: URL → estado (link compartilhado, voltar do navegador)
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q') ?? '';
    if (q !== search) setSearch(q);
    // Só a URL dispara: incluir `search` reescreveria o que o coach acabou de digitar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // busca: estado → URL
  useEffect(() => {
    const current = new URLSearchParams(location.search);
    const next = new URLSearchParams(location.search);
    const normalizedSearch = search.trim();
    if (normalizedSearch) next.set('q', normalizedSearch);
    else next.delete('q');
    if (next.toString() !== current.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [location.search, search, setSearchParams]);

  const buildQuery = useCallback((): CoachDashboardQuery => ({
    q: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
    status: dashboardStatus === 'all' || dashboardStatus === 'attention' ? undefined : dashboardStatus,
    sortBy: toDashboardSort(sortBy),
    page: dashboardPage,
    size: ROSTER_PAGE_SIZE,
  }), [dashboardPage, dashboardStatus, debouncedSearch, sortBy]);

  const reloadDashboard = useCallback(() => {
    void fetchDashboard(buildQuery());
  }, [buildQuery, fetchDashboard]);

  // fetch whenever filters change
  useEffect(() => {
    reloadDashboard();
  }, [reloadDashboard]);

  const handleSearchChange = useCallback((event: { target: { value: string } }) => {
    setSearch(event.target.value);
    setDashboardPage(0);
  }, [setDashboardPage]);

  const handleDashboardStatusChange = useCallback((event: { target: { value: unknown } }) => {
    const nextStatus = event.target.value as DashboardStatusFilter;
    // Entrar ou sair de "Em atenção" não mexe na página: é uma visão da fila, não do roster, e
    // voltar a "Todos" tem de devolver a página em que o coach estava.
    const trocaDeVisao = nextStatus === 'attention' || dashboardStatus === 'attention';
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextStatus !== 'all') next.set('status', nextStatus);
      else next.delete('status');
      if (!trocaDeVisao) next.delete('page');
      return next;
    }, { replace: true });
  }, [dashboardStatus, setSearchParams]);

  const handleSortChange = useCallback((event: { target: { value: unknown } }) => {
    const nextSort = event.target.value as SortKey;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextSort !== 'priority') next.set('sortBy', nextSort);
      else next.delete('sortBy');
      next.delete('page');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleRosterPageChange = useCallback((_event: unknown, nextPage: number) => {
    setDashboardPage(nextPage);
  }, [setDashboardPage]);

  const resetFilters = useCallback(() => {
    setSearch('');
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('q');
      next.delete('status');
      next.delete('sortBy');
      next.delete('page');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return {
    search,
    dashboardPage,
    setDashboardPage,
    dashboardStatus,
    sortBy,
    debouncedSearch,
    currentSortLabel: sortKeyLabel(sortBy),
    reloadDashboard,
    handleSearchChange,
    handleDashboardStatusChange,
    handleSortChange,
    handleRosterPageChange,
    resetFilters,
  };
}
