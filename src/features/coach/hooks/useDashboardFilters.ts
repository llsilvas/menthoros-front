import { useCallback, useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import type { CoachAtletaStatus, CoachDashboardQuery } from '../../../types/Coach';

type SortKey = 'priority' | 'adherence' | 'load' | 'race';
type DashboardStatusFilter = 'all' | CoachAtletaStatus;

export const ROSTER_PAGE_SIZE = 10;

function parseSort(value: string | null): SortKey {
  if (value === 'adherence' || value === 'load' || value === 'race') return value;
  return 'priority';
}

function parseDashboardStatus(value: string | null): DashboardStatusFilter {
  if (value === 'active' || value === 'warning' || value === 'danger' || value === 'paused') return value;
  return 'all';
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

export function useDashboardFilters({ fetchDashboard }: UseDashboardFiltersParams) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [dashboardPage, setDashboardPage] = useState(() => {
    const page = Number.parseInt(searchParams.get('page') ?? '0', 10);
    return Number.isFinite(page) && page > 0 ? page : 0;
  });

  const dashboardStatus = parseDashboardStatus(searchParams.get('status'));
  const sortBy = parseSort(searchParams.get('sortBy'));
  const debouncedSearch = useDebounce(search, 300);

  // sync inbound URL changes → local state
  useEffect(() => {
    const current = new URLSearchParams(location.search);
    const q = current.get('q') ?? '';
    const page = Number.parseInt(current.get('page') ?? '0', 10);
    if (q !== search) setSearch(q);
    if (Number.isFinite(page) && page >= 0 && page !== dashboardPage) setDashboardPage(page);
  }, [dashboardPage, location.search, search]);

  // sync local state → URL
  useEffect(() => {
    const current = new URLSearchParams(location.search);
    const next = new URLSearchParams(location.search);
    const normalizedSearch = search.trim();
    if (normalizedSearch) next.set('q', normalizedSearch);
    else next.delete('q');
    if (dashboardPage > 0) next.set('page', String(dashboardPage));
    else next.delete('page');
    if (next.toString() !== current.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [dashboardPage, location.search, search, setSearchParams]);

  const buildQuery = useCallback((): CoachDashboardQuery => ({
    q: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
    status: dashboardStatus === 'all' ? undefined : dashboardStatus,
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
  }, []);

  const handleDashboardStatusChange = useCallback((event: { target: { value: unknown } }) => {
    setDashboardPage(0);
    const nextStatus = event.target.value as DashboardStatusFilter;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextStatus !== 'all') next.set('status', nextStatus);
      else next.delete('status');
      next.delete('page');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleSortChange = useCallback((event: { target: { value: unknown } }) => {
    setDashboardPage(0);
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
  }, []);

  const resetFilters = useCallback(() => {
    setSearch('');
    setDashboardPage(0);
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
