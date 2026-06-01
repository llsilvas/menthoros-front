import React, { useMemo, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Stack,
} from '@mui/material';
import {
  People as PeopleIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Warning as WarningIcon,
  Speed as SpeedIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';
import {
  DataGrid,
  type GridColDef,
  type GridRowSelectionModel,
  type GridCellParams,
} from '@mui/x-data-grid';
import { primary, surface, semantic, glassSx } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { CoachAthleteAvatar } from '../components/CoachAthleteAvatar';
import { PhaseIndicator } from '../../../shared/components/PhaseIndicator';
import type { TrainingPhase } from '../../../shared/components/PhaseIndicator';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import type { StatusBadgeVariant } from '../../../shared/components/StatusBadge';
import { MetricCell } from '../../../shared/components/MetricCell';

// ── Types ─────────────────────────────────────────────────────────────────────

type Sport = 'running' | 'cycling' | 'triathlon';
type Phase = TrainingPhase;
type AthleteStatus = Extract<StatusBadgeVariant, 'active' | 'warning' | 'danger' | 'paused'>;

interface MockAthlete {
  id: string;
  name: string;
  sport: Sport;
  phase: Phase;
  ctl: number;
  atl: number;
  tsb: number;
  status: AthleteStatus;
  lastActivity: string;
  weeklyVolume: number;
}

type ViewKey = 'all' | 'at-risk' | 'taper' | 'runners';

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_ATHLETES: MockAthlete[] = [
  { id: '1', name: 'Carlos Mendes',  sport: 'running',   phase: 'BUILD',     ctl: 82,  atl: 90,  tsb: -8,  status: 'warning', lastActivity: '2026-06-01', weeklyVolume: 68  },
  { id: '2', name: 'Ana Lima',       sport: 'running',   phase: 'BASE',      ctl: 55,  atl: 48,  tsb: 7,   status: 'active',  lastActivity: '2026-06-01', weeklyVolume: 42  },
  { id: '3', name: 'Rafael Costa',   sport: 'triathlon', phase: 'TAPER',     ctl: 95,  atl: 70,  tsb: 25,  status: 'active',  lastActivity: '2026-05-31', weeklyVolume: 55  },
  { id: '4', name: 'Lucia Ferreira', sport: 'running',   phase: 'RECOVERY',  ctl: 40,  atl: 38,  tsb: 2,   status: 'paused',  lastActivity: '2026-05-28', weeklyVolume: 20  },
  { id: '5', name: 'Pedro Alves',    sport: 'cycling',   phase: 'BUILD',     ctl: 110, atl: 145, tsb: -35, status: 'danger',  lastActivity: '2026-06-01', weeklyVolume: 210 },
  { id: '6', name: 'Marina Silva',   sport: 'running',   phase: 'BASE',      ctl: 62,  atl: 55,  tsb: 7,   status: 'active',  lastActivity: '2026-05-31', weeklyVolume: 50  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<AthleteStatus, string> = {
  active:  'Ativo',
  warning: 'Atenção',
  danger:  'Alerta',
  paused:  'Pausado',
};

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function daysSince(iso: string): number {
  const then = new Date(iso + 'T00:00:00').getTime();
  const now  = new Date('2026-06-01T00:00:00').getTime();
  return Math.floor((now - then) / 86_400_000);
}

// ── View filter definitions ────────────────────────────────────────────────────

interface ViewDef {
  key: ViewKey;
  label: string;
  filter: (a: MockAthlete) => boolean;
}

const VIEWS: ViewDef[] = [
  { key: 'all',     label: 'Todos',        filter: () => true },
  { key: 'at-risk', label: 'Em risco',     filter: (a) => a.status === 'danger' || a.status === 'warning' },
  { key: 'taper',   label: 'Em taper',     filter: (a) => a.phase === 'TAPER' },
  { key: 'runners', label: 'Maratonistas', filter: (a) => a.sport === 'running' },
];

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  accentColor?: string;
}

function KpiCard({ icon, label, value, accentColor }: KpiCardProps) {
  return (
    <Box
      sx={{
        ...glassSx,
        borderRadius: 2,
        px: 2,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        flex: '1 1 0',
        minWidth: 120,
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          backgroundColor: accentColor ? `${accentColor}1A` : `${surface[0]}0F`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor ?? surface[400],
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          sx={{ fontSize: '1.25rem', fontWeight: 700, color: surface[50], lineHeight: 1.1 }}
        >
          {value}
        </Typography>
        <Typography sx={{ fontSize: '0.7rem', color: surface[400], lineHeight: 1.3 }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

// ── Bulk action bar ────────────────────────────────────────────────────────────

function BulkBar({ count }: { count: number }) {
  return (
    <Box
      sx={{
        ...glassSx,
        borderRadius: 1.5,
        px: 2,
        py: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        backgroundColor: `${primary[500]}15`,
        borderColor: `${primary[500]}33`,
      }}
    >
      <Typography sx={{ fontSize: '0.8rem', color: primary[500], fontWeight: 600 }}>
        {count} selecionado{count !== 1 ? 's' : ''}
      </Typography>
      <Button size="small" variant="outlined" color="primary" sx={{ fontSize: '0.75rem', py: 0.25, px: 1 }}>
        Mensagem
      </Button>
      <Button size="small" variant="outlined" color="primary" sx={{ fontSize: '0.75rem', py: 0.25, px: 1 }}>
        Exportar
      </Button>
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CoachAthletesPage() {
  const [searchRaw, setSearchRaw] = useState('');
  const [search, setSearch]       = useState('');
  const [activeView, setActiveView] = useState<ViewKey>('all');
  const [statusFilter, setStatusFilter] = useState<AthleteStatus | 'all'>('all');
  const [selection, setSelection]   = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });

  // Debounced search
  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchRaw(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setSearch(val), 300);
  }, []);

  // Computed rows
  const rows = useMemo(() => {
    const viewFilter = VIEWS.find((v) => v.key === activeView)?.filter ?? (() => true);
    return MOCK_ATHLETES.filter((a) => {
      if (!viewFilter(a)) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [activeView, statusFilter, search]);

  // KPIs (always over full dataset)
  const kpis = useMemo(() => ({
    total:   MOCK_ATHLETES.length,
    atRisk:  MOCK_ATHLETES.filter((a) => a.status === 'danger' || a.status === 'warning').length,
    inTaper: MOCK_ATHLETES.filter((a) => a.phase === 'TAPER').length,
    noActivity7d: MOCK_ATHLETES.filter((a) => daysSince(a.lastActivity) >= 7).length,
  }), []);

  const selectedCount = selection.type === 'include' ? selection.ids.size : 0;

  // Column definitions
  const columns: GridColDef<MockAthlete>[] = useMemo(() => [
    {
      field: 'name',
      headerName: 'Atleta',
      flex: 1.8,
      minWidth: 160,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
          <CoachAthleteAvatar athlete={{ id: row.id, name: row.name }} size="xs" status="none" />
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: surface[50] }}>
            {row.name}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'phase',
      headerName: 'Fase',
      width: 130,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <PhaseIndicator phase={row.phase} variant="pill" />
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <StatusBadge variant={row.status} label={STATUS_LABEL[row.status]} size="sm" />
        </Box>
      ),
    },
    {
      field: 'ctl',
      headerName: 'CTL',
      width: 80,
      type: 'number',
      headerAlign: 'left',
      align: 'left',
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <MetricCell value={row.ctl} size="sm" tooltip="Carga de Treino Crônica" />
        </Box>
      ),
    },
    {
      field: 'atl',
      headerName: 'ATL',
      width: 80,
      type: 'number',
      headerAlign: 'left',
      align: 'left',
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <MetricCell value={row.atl} size="sm" tooltip="Carga de Treino Aguda" />
        </Box>
      ),
    },
    {
      field: 'tsb',
      headerName: 'TSB',
      width: 80,
      type: 'number',
      headerAlign: 'left',
      align: 'left',
      cellClassName: (params: GridCellParams<MockAthlete>) =>
        params.row.tsb < -30 ? 'tsb-danger' : '',
      renderCell: ({ row }) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            color: row.tsb < -30 ? semantic.danger[500] : 'inherit',
          }}
        >
          <MetricCell value={row.tsb} size="sm" tooltip="Balanço de Estresse de Treino" />
        </Box>
      ),
    },
    {
      field: 'weeklyVolume',
      headerName: 'Vol. sem. (km)',
      width: 120,
      type: 'number',
      headerAlign: 'left',
      align: 'left',
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography sx={{ fontSize: '0.8rem', color: surface[50], fontVariantNumeric: 'tabular-nums' }}>
            {row.weeklyVolume} km
          </Typography>
        </Box>
      ),
    },
    {
      field: 'lastActivity',
      headerName: 'Última atividade',
      width: 140,
      renderCell: ({ row }) => {
        const days = daysSince(row.lastActivity);
        const color = days >= 7 ? semantic.warning[500] : surface[400];
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
            <Typography sx={{ fontSize: '0.8rem', color: surface[50] }}>
              {formatDate(row.lastActivity)}
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color }}>
              {days === 0 ? 'hoje' : `há ${days}d`}
            </Typography>
          </Box>
        );
      },
    },
  ], []);

  const statusOptions: Array<{ value: AthleteStatus | 'all'; label: string }> = [
    { value: 'all',     label: 'Todos os status' },
    { value: 'active',  label: 'Ativo'   },
    { value: 'warning', label: 'Atenção' },
    { value: 'danger',  label: 'Alerta'  },
    { value: 'paused',  label: 'Pausado' },
  ];

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 3,
        gap: 2,
        bgcolor: elevation.base,
        overflow: 'hidden',
      }}
    >
      {/* ── Page header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        {/* Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PeopleIcon sx={{ color: primary[500], fontSize: 28 }} />
          <Box>
            <Typography
              variant="h5"
              sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: surface[50], lineHeight: 1.1 }}
            >
              Atletas{' '}
              <Typography component="span" sx={{ fontWeight: 400, color: surface[500], fontSize: '1rem' }}>
                ({MOCK_ATHLETES.length})
              </Typography>
            </Typography>
            <Typography variant="body2" sx={{ color: surface[400] }}>
              Visão geral do time com métricas de carga
            </Typography>
          </Box>
        </Box>

        {/* Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Buscar atleta..."
            value={searchRaw}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: surface[500] }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 200,
              '& .MuiInputBase-input': { fontSize: '0.85rem' },
            }}
          />

          {/* Status filter */}
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AthleteStatus | 'all')}
            SelectProps={{ native: true }}
            sx={{ width: 150, '& .MuiInputBase-input': { fontSize: '0.85rem' } }}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </TextField>

          {/* Add athlete */}
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<PersonAddIcon />}
            sx={{ fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >
            Adicionar
          </Button>
        </Box>
      </Box>

      {/* ── View chips ── */}
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {VIEWS.map((view) => (
          <Chip
            key={view.key}
            label={view.label}
            size="small"
            onClick={() => setActiveView(view.key)}
            variant={activeView === view.key ? 'filled' : 'outlined'}
            sx={{
              fontSize: '0.75rem',
              fontWeight: activeView === view.key ? 600 : 400,
              borderColor: activeView === view.key ? primary[500] : `${surface[0]}33`,
              backgroundColor: activeView === view.key ? `${primary[500]}26` : 'transparent',
              color: activeView === view.key ? primary[500] : surface[400],
              '&:hover': {
                backgroundColor: activeView === view.key ? `${primary[500]}33` : `${surface[0]}0F`,
                borderColor: activeView === view.key ? primary[500] : `${surface[0]}4D`,
              },
            }}
          />
        ))}
      </Stack>

      {/* ── KPI row ── */}
      <Stack direction="row" spacing={1.5} flexWrap="wrap">
        <KpiCard
          icon={<PeopleIcon sx={{ fontSize: 18 }} />}
          label="Total atletas"
          value={kpis.total}
          accentColor={primary[500]}
        />
        <KpiCard
          icon={<WarningIcon sx={{ fontSize: 18 }} />}
          label="Em risco"
          value={kpis.atRisk}
          accentColor={semantic.danger[500]}
        />
        <KpiCard
          icon={<SpeedIcon sx={{ fontSize: 18 }} />}
          label="Em taper"
          value={kpis.inTaper}
          accentColor={semantic.success[500]}
        />
        <KpiCard
          icon={<WifiOffIcon sx={{ fontSize: 18 }} />}
          label="Sem atividade 7d"
          value={kpis.noActivity7d}
          accentColor={semantic.warning[500]}
        />
      </Stack>

      {/* ── Bulk action bar (visible when selection > 0) ── */}
      {selectedCount > 0 && <BulkBar count={selectedCount} />}

      {/* ── DataGrid ── */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          borderRadius: 2,
          overflow: 'hidden',
          border: `1px solid rgba(255,255,255,0.10)`,
          // TSB danger cell class
          '& .tsb-danger': {
            backgroundColor: `${semantic.danger[500]}1A`,
          },
        }}
      >
        <DataGrid<MockAthlete>
          rows={rows}
          columns={columns}
          checkboxSelection
          disableRowSelectionOnClick
          rowSelectionModel={selection}
          onRowSelectionModelChange={setSelection}
          rowHeight={52}
          columnHeaderHeight={44}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          localeText={{
            noRowsLabel: 'Nenhum atleta encontrado',
            footerRowSelected: (count) =>
              count === 1 ? `${count} atleta selecionado` : `${count} atletas selecionados`,
          }}
          sx={{
            border: 'none',
            height: '100%',
            fontFamily: 'inherit',
            '& .MuiDataGrid-row': {
              cursor: 'default',
            },
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
              outline: 'none',
            },
            '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
              outline: 'none',
            },
          }}
        />
      </Box>
    </Box>
  );
}
