import { useState, useEffect, useCallback } from 'react';
import { Box, Button, Tabs, Tab, Typography, Link } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { primary, surface, semantic, content } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { ConfidenceBar } from '../../../shared/components/ConfidenceBar';
import { SuggestionTypeBadge } from '../../../shared/components/SuggestionTypeBadge';
import type { SuggestionType } from '../../../shared/components/SuggestionTypeBadge';
import { CoachAthleteAvatar } from '../components/CoachAthleteAvatar';

// ── Mock data ─────────────────────────────────────────────────────────────────

type SuggestionStatus = 'pending' | 'approved' | 'rejected';

interface MockSuggestion {
  id: string;
  athleteId: string;
  athleteName: string;
  type: SuggestionType;
  confidence: number;
  status: SuggestionStatus;
  summary: string;
  reasoning: string;
  createdAt: string;
}

const MOCK_SUGGESTIONS: MockSuggestion[] = [
  {
    id: '1',
    athleteId: 'a1',
    athleteName: 'Carlos Mendes',
    type: 'plan_adjust',
    confidence: 87,
    status: 'pending',
    summary: 'Reduzir volume semanal em 15% — sinais de fadiga acumulada',
    reasoning:
      'CTL de 82 com TSB em -18 há 3 semanas consecutivas. Padrão histórico indica risco de overreaching.',
    createdAt: '2026-06-01',
  },
  {
    id: '2',
    athleteId: 'a2',
    athleteName: 'Ana Lima',
    type: 'recovery',
    confidence: 72,
    status: 'pending',
    summary: 'Inserir semana de recuperação antes do longão de domingo',
    reasoning:
      'Atleta reportou 6/10 de percepção de esforço em treino Z2. Histórico de lesão no tendão de aquiles.',
    createdAt: '2026-06-01',
  },
  {
    id: '3',
    athleteId: 'a3',
    athleteName: 'Rafael Costa',
    type: 'new_plan',
    confidence: 91,
    status: 'approved',
    summary: 'Plano de 12 semanas para São Paulo City Marathon',
    reasoning:
      'Base aeróbica sólida (CTL 68). Objetivo de sub-4h realista com 14 semanas disponíveis.',
    createdAt: '2026-05-30',
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type FilterOption = 'all' | SuggestionStatus;

interface FilterChip {
  value: FilterOption;
  label: string;
}

const FILTER_CHIPS: FilterChip[] = [
  { value: 'all',      label: 'Todas'     },
  { value: 'pending',  label: 'Pendentes' },
  { value: 'approved', label: 'Aprovadas' },
  { value: 'rejected', label: 'Rejeitadas'},
];

// ── Sub-components ────────────────────────────────────────────────────────────

interface FilterColumnProps {
  activeFilter: FilterOption;
  onFilterChange: (f: FilterOption) => void;
}

function FilterColumn({ activeFilter, onFilterChange }: FilterColumnProps) {
  return (
    <Box
      sx={{
        width: 80,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        py: 2,
        px: 0.5,
        borderRight: `1px solid ${content.divider}`,
      }}
    >
      {FILTER_CHIPS.map((chip) => {
        const isActive = activeFilter === chip.value;
        return (
          <Box
            key={chip.value}
            component="button"
            onClick={() => onFilterChange(chip.value)}
            sx={{
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              textAlign:       'center',
              border:          'none',
              borderRadius:    '6px',
              cursor:          'pointer',
              px:              0.75,
              py:              0.75,
              fontSize:        '0.7rem',
              fontWeight:      500,
              lineHeight:      1.3,
              transition:      'background-color 0.15s ease, color 0.15s ease',
              backgroundColor: isActive ? primary[500] : surface[700],
              color:           isActive ? surface[900] : surface[400],
              '&:hover': {
                backgroundColor: isActive ? primary[400] : surface[600],
              },
            }}
          >
            {chip.label}
          </Box>
        );
      })}
    </Box>
  );
}

interface SuggestionCardProps {
  suggestion: MockSuggestion;
  isSelected: boolean;
  onClick: () => void;
}

function SuggestionCard({ suggestion, isSelected, onClick }: SuggestionCardProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display:         'flex',
        flexDirection:   'column',
        gap:             1,
        px:              1.5,
        py:              1.25,
        cursor:          'pointer',
        borderRadius:    '8px',
        border:          `1px solid ${isSelected ? primary[500] : content.cardBorder}`,
        backgroundColor: isSelected
          ? `${primary[500]}0D`  // 5% opacity
          : elevation.card,
        transition: 'border-color 0.15s ease, background-color 0.15s ease',
        '&:hover': {
          borderColor:     primary[500],
          backgroundColor: `${primary[500]}0D`,
        },
      }}
    >
      {/* Row 1: Avatar + name + type badge */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CoachAthleteAvatar
          athlete={{ id: suggestion.athleteId, name: suggestion.athleteName }}
          size="sm"
          status="none"
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize:     '0.8rem',
              fontWeight:   600,
              color:        surface[50],
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
              lineHeight:   1.3,
            }}
          >
            {suggestion.athleteName}
          </Typography>
          <Box sx={{ mt: 0.25 }}>
            <SuggestionTypeBadge type={suggestion.type} size="sm" />
          </Box>
        </Box>
      </Box>

      {/* Row 2: Confidence bar (compact) */}
      <ConfidenceBar
        value={suggestion.confidence}
        size="sm"
        showLabel={false}
        showPercentage={true}
      />

      {/* Row 3: Summary truncated */}
      <Typography
        sx={{
          fontSize:         '0.75rem',
          color:            surface[400],
          display:          '-webkit-box',
          WebkitLineClamp:  2,
          WebkitBoxOrient:  'vertical',
          overflow:         'hidden',
          lineHeight:       1.4,
        }}
      >
        {suggestion.summary}
      </Typography>
    </Box>
  );
}

interface ReviewPanelProps {
  suggestion: MockSuggestion;
  onApprove: () => void;
  onReject: () => void;
}

function ReviewPanel({ suggestion, onApprove, onReject }: ReviewPanelProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box
      sx={{
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        minWidth:      0,
        overflow:      'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px:             2.5,
          py:             2,
          borderBottom:   `1px solid ${content.divider}`,
          display:        'flex',
          alignItems:     'flex-start',
          gap:            1.5,
          flexShrink:     0,
        }}
      >
        <CoachAthleteAvatar
          athlete={{ id: suggestion.athleteId, name: suggestion.athleteName }}
          size="md"
          status="none"
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography
              sx={{
                fontSize:   '1.05rem',
                fontWeight: 700,
                color:      surface[50],
                fontFamily: 'Syne, sans-serif',
              }}
            >
              {suggestion.athleteName}
            </Typography>
            <SuggestionTypeBadge type={suggestion.type} size="md" />
          </Box>
          <Box sx={{ mt: 0.5 }}>
            <ConfidenceBar
              value={suggestion.confidence}
              size="sm"
              showLabel={true}
              showPercentage={true}
            />
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: `1px solid ${content.divider}`, flexShrink: 0 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v: number) => setActiveTab(v)}
          sx={{
            minHeight: 40,
            px: 2,
            '& .MuiTab-root': {
              minHeight:   40,
              fontSize:    '0.8rem',
              fontWeight:  500,
              color:       surface[400],
              textTransform: 'none',
              px: 1.5,
              py: 0,
            },
            '& .Mui-selected': { color: primary[500] },
            '& .MuiTabs-indicator': { backgroundColor: primary[500] },
          }}
        >
          <Tab label="Detalhes" />
          <Tab label="Raciocínio da IA" />
        </Tabs>
      </Box>

      {/* Tab content */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 2 }}>
        {activeTab === 0 && (
          <Box
            sx={{
              p:               2,
              borderRadius:    '8px',
              border:          `1px solid ${content.cardBorder}`,
              backgroundColor: elevation.card,
            }}
          >
            <Typography
              sx={{
                fontSize:   '0.7rem',
                fontWeight: 600,
                color:      surface[500],
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                mb:         1,
              }}
            >
              Resumo da sugestão
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: surface[100], lineHeight: 1.6 }}>
              {suggestion.summary}
            </Typography>
            <Typography
              sx={{
                mt:       1.5,
                fontSize: '0.75rem',
                color:    surface[500],
              }}
            >
              Criado em {suggestion.createdAt}
            </Typography>
          </Box>
        )}

        {activeTab === 1 && (
          <Box
            sx={{
              p:               2,
              borderRadius:    '8px',
              border:          `1px solid ${content.cardBorder}`,
              backgroundColor: elevation.card,
            }}
          >
            <Typography
              sx={{
                fontSize:   '0.7rem',
                fontWeight: 600,
                color:      surface[500],
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                mb:         1,
              }}
            >
              Raciocínio da IA
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: surface[100], lineHeight: 1.7 }}>
              {suggestion.reasoning}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Action footer */}
      <Box
        sx={{
          px:           2.5,
          py:           2,
          borderTop:    `1px solid ${content.divider}`,
          display:      'flex',
          gap:          1.5,
          flexShrink:   0,
          flexWrap:     'wrap',
        }}
      >
        <Button
          variant="contained"
          onClick={onApprove}
          disabled={suggestion.status === 'approved'}
          sx={{
            bgcolor:     semantic.success[500],
            color:       surface[900],
            fontWeight:  600,
            fontSize:    '0.8rem',
            textTransform: 'none',
            px:          2.5,
            '&:hover':   { bgcolor: semantic.success[700] },
            '&.Mui-disabled': { bgcolor: surface[700], color: surface[500] },
          }}
        >
          Aprovar
        </Button>

        <Button
          variant="outlined"
          sx={{
            borderColor:   semantic.warning[500],
            color:         semantic.warning[500],
            fontWeight:    600,
            fontSize:      '0.8rem',
            textTransform: 'none',
            px:            2.5,
            '&:hover': {
              borderColor:     semantic.warning[400],
              backgroundColor: `${semantic.warning[500]}14`,
            },
          }}
        >
          Modificar
        </Button>

        <Button
          variant="outlined"
          onClick={onReject}
          disabled={suggestion.status === 'rejected'}
          sx={{
            borderColor:   semantic.danger[500],
            color:         semantic.danger[500],
            fontWeight:    600,
            fontSize:      '0.8rem',
            textTransform: 'none',
            px:            2.5,
            '&:hover': {
              borderColor:     semantic.danger[300],
              backgroundColor: `${semantic.danger[500]}14`,
            },
            '&.Mui-disabled': {
              borderColor: surface[700],
              color:       surface[500],
            },
          }}
        >
          Rejeitar
        </Button>
      </Box>
    </Box>
  );
}

interface EmptyStateProps {
  onNavigateAthletes?: () => void;
}

function EmptyState({ onNavigateAthletes }: EmptyStateProps) {
  return (
    <Box
      sx={{
        flex:           1,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            1.5,
        px:             3,
      }}
    >
      <CheckCircleIcon sx={{ fontSize: 56, color: semantic.success[500] }} />
      <Typography
        sx={{
          fontSize:   '1.25rem',
          fontWeight: 700,
          color:      surface[50],
          fontFamily: 'Syne, sans-serif',
        }}
      >
        Tudo em dia!
      </Typography>
      <Typography sx={{ fontSize: '0.875rem', color: surface[400], textAlign: 'center' }}>
        Nenhuma validação pendente — bom trabalho.
      </Typography>
      <Link
        component="button"
        onClick={onNavigateAthletes}
        sx={{
          fontSize:  '0.875rem',
          color:     primary[500],
          cursor:    'pointer',
          textDecoration: 'underline',
          '&:hover': { color: primary[400] },
        }}
      >
        Ver atletas →
      </Link>
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CoachInboxPage() {
  const [suggestions, setSuggestions] = useState<MockSuggestion[]>(MOCK_SUGGESTIONS);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [selectedId, setSelectedId] = useState<string>(MOCK_SUGGESTIONS[0]?.id ?? '');

  // Filtered list
  const filtered = suggestions.filter((s) =>
    activeFilter === 'all' ? true : s.status === activeFilter,
  );

  // Ensure selectedId stays valid when filter changes
  useEffect(() => {
    if (filtered.length === 0) return;
    if (!filtered.find((s) => s.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((s) => s.id === selectedId) ?? null;

  // ── Local state mutations (will be replaced by API calls) ──────────────────

  const approve = useCallback((id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'approved' } : s)),
    );
  }, []);

  const reject = useCallback((id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'rejected' } : s)),
    );
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const currentIndex = filtered.findIndex((s) => s.id === selectedId);

      switch (e.key) {
        case 'j':
        case 'J': {
          const next = filtered[currentIndex + 1];
          if (next) setSelectedId(next.id);
          break;
        }
        case 'k':
        case 'K': {
          const prev = filtered[currentIndex - 1];
          if (prev) setSelectedId(prev.id);
          break;
        }
        case 'a':
        case 'A': {
          if (selectedId) approve(selectedId);
          break;
        }
        case 'r':
        case 'R': {
          if (selectedId) reject(selectedId);
          break;
        }
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedId, approve, reject]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        height:          '100%',
        display:         'flex',
        flexDirection:   'row',
        overflow:        'hidden',
        bgcolor:         elevation.base,
      }}
    >
      {/* Column 1 — Filters (~80px) */}
      <FilterColumn activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* Column 2 — Suggestion list (~360px) */}
      <Box
        sx={{
          width:       360,
          flexShrink:  0,
          display:     'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${content.divider}`,
          overflow:    'hidden',
        }}
      >
        {/* List header */}
        <Box
          sx={{
            px:           2,
            py:           1.5,
            borderBottom: `1px solid ${content.divider}`,
            flexShrink:   0,
          }}
        >
          <Typography
            sx={{
              fontSize:   '0.75rem',
              fontWeight: 600,
              color:      surface[400],
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {filtered.length} {filtered.length === 1 ? 'sugestão' : 'sugestões'}
          </Typography>
        </Box>

        {/* Scrollable card list */}
        <Box
          sx={{
            flex:       1,
            overflowY:  'auto',
            display:    'flex',
            flexDirection: 'column',
            gap:        1,
            p:          1.5,
            '&::-webkit-scrollbar':       { width: 4 },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
            '&::-webkit-scrollbar-thumb': { bgcolor: surface[700], borderRadius: 2 },
          }}
        >
          {filtered.length === 0 ? (
            <Typography
              sx={{
                fontSize:  '0.8rem',
                color:     surface[500],
                textAlign: 'center',
                mt:        4,
              }}
            >
              Nenhuma sugestão encontrada.
            </Typography>
          ) : (
            filtered.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                isSelected={s.id === selectedId}
                onClick={() => setSelectedId(s.id)}
              />
            ))
          )}
        </Box>
      </Box>

      {/* Column 3 — Review panel (flex-1) */}
      {selected ? (
        <ReviewPanel
          suggestion={selected}
          onApprove={() => approve(selected.id)}
          onReject={() => reject(selected.id)}
        />
      ) : (
        <EmptyState />
      )}
    </Box>
  );
}
