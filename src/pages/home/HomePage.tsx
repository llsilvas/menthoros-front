import { useEffect, useMemo } from 'react';
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
import { gradients } from '../../theme/tokens';
import StatCard from './components/StatCard';
import AtletaStatusRow from './components/AtletaStatusRow';
import StravaStatusWidget from './components/StravaStatusWidget';
import ProvasProximasWidget from './components/ProvasProximasWidget';

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
  const { atletas, loading, error, fetchAtletas } = useAtletas();

  useEffect(() => {
    fetchAtletas();
  }, [fetchAtletas]);

  const kpis = useMemo(() => {
    if (!atletas || atletas.length === 0) {
      return {
        total: 0,
        comLesao: 0,
        iniciantes: 0,
        semRotina: 0,
      };
    }

    const comLesao = atletas.filter((a) => a.temLesao).length;
    const iniciantes = atletas.filter(
      (a) => getExperienceKey(a.nivelExperiencia) === 'INICIANTE'
    ).length;
    const semRotina = atletas.filter(
      (a) => !a.diasDisponiveis || a.diasDisponiveis.length === 0
    ).length;

    return {
      total: atletas.length,
      comLesao,
      iniciantes,
      semRotina,
    };
  }, [atletas]);

  const atletasAtencao = useMemo(() => {
    return atletas.filter((a) => calcularStatus(a) !== 'EM_DIA');
  }, [atletas]);

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
        background: gradients.background,
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2.5,
          borderRadius: 1,
          background: 'linear-gradient(135deg, #082130 0%, #0e3147 55%, #133c56 100%)',
          color: 'white',
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

      {loading ? (
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
              icon={<PeopleIcon />}
              label="Total de Atletas"
              value={kpis.total}
              color="#b1e92d"
            />
            <StatCard
              icon={<LocalHospitalIcon />}
              label="Com Lesão"
              value={kpis.comLesao}
              color="#b1e92d"
            />
            <StatCard
              icon={<TrendingUpIcon />}
              label="Iniciantes"
              value={kpis.iniciantes}
              color="#b1e92d"
            />
            <StatCard
              icon={<WarningIcon />}
              label="Sem Rotina"
              value={kpis.semRotina}
              color="#b1e92d"
            />
          </Box>

          <Box sx={{ px: 3 }}>
            <ProvasProximasWidget atletas={atletas} />
          </Box>

          <Box sx={{ px: 3 }}>
            <StravaStatusWidget atletas={atletas} />
          </Box>

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
                <WarningIcon sx={{ fontSize: 20, color: '#f39c12' }} />
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
              sx={{
                fontWeight: 700,
                color: '#ffffff',
                mb: 1.5,
                fontSize: '1rem',
              }}
            >
              Todos os Atletas ({atletas.length})
            </Typography>
            <Stack spacing={1} sx={{ maxWidth: 1000 }}>
              {atletas.map((atleta) => (
                <AtletaStatusRow key={atleta.id} atleta={atleta} />
              ))}
            </Stack>
          </Box>
        </>
      )}

      {!loading && atletas.length === 0 && !error && (
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
