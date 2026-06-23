import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import {
  People as PeopleIcon,
  LocalHospital as LocalHospitalIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAtletas } from '../../hooks/useAtletas';
import type { Atleta } from '../../types/Atleta';
import { primary, surface } from '../../theme/tokens';
import { elevation } from '../../shared/design-tokens';
import StatCard from './components/StatCard';
import AtletaStatusRow from './components/AtletaStatusRow';
import StravaStatusWidget from './components/StravaStatusWidget';
import ProvasProximasWidget from './components/ProvasProximasWidget';
import AtletasFiltros from './components/AtletasFiltros';
import GraficoAdesaoWidget from './components/GraficoAdesaoWidget';

type NivelExperienciaKey = 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO';

const nivelLabels: Record<NivelExperienciaKey, string> = {
  INICIANTE: 'Iniciante',
  INTERMEDIARIO: 'Intermediário',
  AVANCADO: 'Avançado',
};

const getExperienceKey = (nivel: Atleta['nivelExperiencia']): NivelExperienciaKey => {
  if (typeof nivel === 'string' && nivel in nivelLabels) {
    return nivel as NivelExperienciaKey;
  }
  if (typeof nivel === 'object' && nivel && 'value' in nivel) {
    const value = (nivel as Record<string, unknown>).value;
    if (typeof value === 'string' && value in nivelLabels) {
      return value as NivelExperienciaKey;
    }
  }
  return 'INICIANTE';
};

const calcularStatus = (atleta: Atleta): 'EM_DIA' | 'ATENCAO' | 'SEM_ROTINA' => {
  if (atleta.temLesao) return 'ATENCAO';
  if (!atleta.diasDisponiveis || atleta.diasDisponiveis.length === 0) return 'SEM_ROTINA';
  return 'EM_DIA';
};

export default function HomePage() {
  // Resumo do time — carrega no mount, alimenta KPIs e seção de atenção
  const { atletas: todosAtletas, loading: summaryLoading, error, fetchAtletas: fetchTodos } = useAtletas();
  // Lista filtrada — só carrega quando o usuário aplica um filtro
  const { atletas: atletasLista, loading: listaLoading, fetchAtletas } = useAtletas();

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'EM_DIA' | 'ATENCAO' | 'SEM_ROTINA' | 'TODOS'>('TODOS');
  const [filtroNivel, setFiltroNivel] = useState<'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO' | 'TODOS'>('TODOS');

  const filtroAtivo = busca.length > 0 || filtroNivel !== 'TODOS';

  // Carrega dados de resumo no mount (KPIs, atenção, próximas provas)
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Carrega a lista filtrada apenas quando há um filtro ativo
  useEffect(() => {
    if (!filtroAtivo) return;
    const timeout = setTimeout(() => {
      fetchAtletas({
        nome: busca || undefined,
        nivelExperiencia: filtroNivel !== 'TODOS' ? filtroNivel : undefined,
      });
    }, busca ? 400 : 0);
    return () => clearTimeout(timeout);
  }, [busca, filtroNivel, filtroAtivo, fetchAtletas]);

  const kpis = useMemo(() => {
    if (!todosAtletas || todosAtletas.length === 0) {
      return { total: 0, comLesao: 0, iniciantes: 0, semRotina: 0 };
    }
    return {
      total: todosAtletas.length,
      comLesao: todosAtletas.filter((a) => a.temLesao).length,
      iniciantes: todosAtletas.filter((a) => getExperienceKey(a.nivelExperiencia) === 'INICIANTE').length,
      semRotina: todosAtletas.filter((a) => !a.diasDisponiveis || a.diasDisponiveis.length === 0).length,
    };
  }, [todosAtletas]);

  const atletasAtencao = useMemo(() => {
    return todosAtletas.filter((a) => calcularStatus(a) !== 'EM_DIA');
  }, [todosAtletas]);

  // filtroStatus é campo derivado (não existe no banco), aplicado client-side sobre a lista já filtrada
  const atletasFiltrados = useMemo(() => {
    if (filtroStatus === 'TODOS') return atletasLista;
    return atletasLista.filter((a) => calcularStatus(a) === filtroStatus);
  }, [atletasLista, filtroStatus]);

  const getDataAtual = () => {
    const today = new Date();
    return today.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100%',
        height: '100%',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        background: elevation.base,
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2.5,
          borderRadius: 1,
          background: elevation.panel,
          color: surface[50],
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            lineHeight: 1.1,
            mb: 0.5,
          }}
        >
          Visão do Time
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(232, 234, 237, 0.72)',
            fontSize: '0.9rem',
          }}
        >
          {getDataAtual()}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mx: 3 }}>
          {error.message || 'Erro ao carregar atletas'}
        </Alert>
      )}

      {summaryLoading ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            minHeight: 400,
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              px: 3,
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: 1.5,
            }}
          >
            <StatCard
              icon={<PeopleIcon sx={{ color: primary[500] }} />}
              label="Total de Atletas"
              value={kpis.total}
            />
            <StatCard
              icon={<LocalHospitalIcon sx={{ color: primary[500] }} />}
              label="Com Lesão"
              value={kpis.comLesao}
            />
            <StatCard
              icon={<TrendingUpIcon sx={{ color: primary[500] }} />}
              label="Iniciantes"
              value={kpis.iniciantes}
            />
            <StatCard
              icon={<WarningIcon sx={{ color: primary[500] }} />}
              label="Sem Rotina"
              value={kpis.semRotina}
            />
          </Box>

          <Box sx={{ px: 3 }}>
            <ProvasProximasWidget />
          </Box>
          {/* Assessoria Adherence Chart */}
          <Box sx={{ px: 3 }}>
            <GraficoAdesaoWidget />
          </Box>
          <Box sx={{ px: 3 }}>
            <StravaStatusWidget />
          </Box>

          {/* Adherence and Training Summary
          {atletas.length > 0 && atletas.slice(0, 1).map((atleta) => (
            <Box key={`metrics-${atleta.id}`} sx={{ px: 3 }}>
              <Stack spacing={2}>
                <TaxaAdesaoWidget atletaId={atleta.id} atletaNome={atleta.nome} />
                <ResumoSemanalWidget atletaId={atleta.id} atletaNome={atleta.nome} />
              </Stack>
            </Box>
          ))} */}

          {atletasAtencao.length > 0 && (
            <Box sx={{ px: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#ffffff',
                  mb: 1.5,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <WarningIcon sx={{ fontSize: 20, color: '#F59E0B' }} />
                Precisam de Atenção ({atletasAtencao.length})
              </Typography>
              <Stack spacing={1} sx={{ maxWidth: 1000 }}>
                {atletasAtencao.map((atleta) => (
                  <AtletaStatusRow key={atleta.id} atleta={atleta} />
                ))}
              </Stack>
            </Box>
          )}

          <Box sx={{ px: 3 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: '#ffffff', mb: 1.5, fontSize: '1rem' }}
            >
              {filtroAtivo
                ? `Busca de Atletas (${atletasFiltrados.length})`
                : 'Busca de Atletas'}
            </Typography>
            <Box sx={{ maxWidth: 1000 }}>
              <AtletasFiltros
                busca={busca}
                status={filtroStatus}
                nivel={filtroNivel}
                onBuscaChange={setBusca}
                onStatusChange={setFiltroStatus}
                onNivelChange={setFiltroNivel}
                totalFiltrado={atletasFiltrados.length}
                totalGeral={atletasLista.length}
              />
              {!filtroAtivo ? (
                <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', pt: 2, textAlign: 'center' }}>
                  Use o filtro acima para buscar atletas
                </Typography>
              ) : listaLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : atletasFiltrados.length === 0 ? (
                <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', pt: 2, textAlign: 'center' }}>
                  Nenhum atleta encontrado para este filtro
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {atletasFiltrados.map((atleta) => (
                    <AtletaStatusRow key={atleta.id} atleta={atleta} />
                  ))}
                </Stack>
              )}
            </Box>
          </Box>
        </>
      )}

      {!summaryLoading && todosAtletas.length === 0 && !error && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            minHeight: 400,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255,255,255,0.6)',
              textAlign: 'center',
            }}
          >
            Nenhum atleta cadastrado. Comece adicionando atletas na seção de Atletas.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
