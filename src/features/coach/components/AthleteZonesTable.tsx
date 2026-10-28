import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { formatPace, formatPaceRange } from '../adapters/intensityFormat';
import { activeTheme } from '../../../theme/activeTheme';
import { content, semantic, text } from '../../../theme/tokens';
import type { AthleteTrainingZoneDto, AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';

interface AthleteZonesTableProps {
  zones: AthleteTrainingZonesDto | null;
  loading: boolean;
  error: Error | null;
  /** Nome completo do atleta; o título usa o primeiro nome. */
  nomeAtleta?: string;
  /** Referência para a idade do teste de limiar; injetável para teste. */
  hoje?: Date;
  defaultExpanded?: boolean;
}

const DIAS_LIMIAR_DESATUALIZADO = 90;
const MS_POR_DIA = 86_400_000;

// Escala genérica de percepção de esforço por zona — referência, não medida do atleta.
const RPE_TIPICO: Record<number, string> = { 1: '1–2', 2: '3–4', 3: '5–6', 4: '7', 5: '8–9', 6: '9–10' };
const USO_TIPICO: Record<number, string> = {
  1: 'Rodagem leve, trote',
  2: 'Base, longão',
  3: 'Ritmo moderado',
  4: 'Contínuo de limiar',
  5: 'Tiros de 3 a 5 min',
  6: 'Tiros curtos',
};

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
/** "2026-09-12" → "12 set". */
const formatarDiaMes = (iso: string): string => {
  const [, mes, dia] = iso.split('-');
  return `${Number(dia)} ${MESES[Number(mes) - 1]}`;
};

const primeiroNome = (nome: string | undefined): string | null => nome?.trim().split(/\s+/)[0] || null;

function diasDesde(iso: string, hoje: Date): number {
  return Math.floor((hoje.getTime() - new Date(`${iso}T12:00:00`).getTime()) / MS_POR_DIA);
}

/** Teste de limiar mais antigo entre os informados; `null` se nenhum tem data. */
function limiarMaisAntigo(zones: AthleteTrainingZonesDto, hoje: Date): { dias: number; data: string } | null {
  const datas = [zones.ancoras.dataUltimoTestePace, zones.ancoras.dataUltimoTesteFc].filter(
    (d): d is string => Boolean(d),
  );
  if (!datas.length) return null;
  const maisAntiga = datas.reduce((a, b) => (a < b ? a : b));
  return { dias: diasDesde(maisAntiga, hoje), data: maisAntiga };
}

/** Os dois chips do cabeçalho — ficam visíveis com a tabela recolhida. */
function ChipsDoCabecalho({ zones, hoje }: { zones: AthleteTrainingZonesDto; hoje: Date }) {
  const limiar = limiarMaisAntigo(zones, hoje);
  const fadiga = zones.ajusteFadiga.segundosPorKm;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
      {fadiga > 0 && (
        <Tooltip title="Informativo: as faixas da tabela são as base. Ajuste o pace à mão se quiser.">
          <Chip size="small" variant="outlined" label={`Ajuste por fadiga +${fadiga} s/km`} sx={{ color: text.secondary }} />
        </Tooltip>
      )}
      {limiar && (
        <Chip
          size="small"
          variant="outlined"
          label={`Limiar medido em ${formatarDiaMes(limiar.data)} · ${limiar.dias} dias`}
          sx={{ color: text.secondary }}
        />
      )}
    </Box>
  );
}

const zoneColor = (numero: number): string =>
  activeTheme.zones[`Z${numero}` as keyof typeof activeTheme.zones].color;

const celula = { color: text.primary, borderColor: content.divider, fontSize: '0.8125rem', py: 0.75 } as const;
const cabecalho = { color: text.secondary, borderColor: content.divider, fontSize: '0.6875rem', py: 0.5 } as const;

function ZonaRow({ zona }: { zona: AthleteTrainingZoneDto }) {
  return (
    <TableRow>
      <TableCell sx={celula} component="th" scope="row">
        <Chip
          size="small"
          label={`Z${zona.numero}`}
          sx={{ bgcolor: zoneColor(zona.numero), color: activeTheme.primary.contrastText, fontWeight: 700, mr: 1 }}
        />
        {zona.nome}
      </TableCell>
      <TableCell sx={celula}>
        {zona.pace ? formatPaceRange(zona.pace.minSegKm, zona.pace.maxSegKm).replace('–', ' – ') : '—'}
      </TableCell>
      <TableCell sx={celula}>
        {zona.fc ? `${zona.fc.min} – ${zona.fc.max}` : <span style={{ color: text.secondary }}>— usar pace</span>}
      </TableCell>
      <TableCell sx={{ ...celula, color: text.secondary }}>
        <Tooltip title="Escala genérica, não medida do atleta">
          <span aria-label="RPE típico: escala genérica, não medida do atleta">{RPE_TIPICO[zona.numero]}</span>
        </Tooltip>
      </TableCell>
      <TableCell sx={{ ...celula, color: text.secondary }}>{USO_TIPICO[zona.numero]}</TableCell>
    </TableRow>
  );
}

function Corpo({ zones, hoje }: { zones: AthleteTrainingZonesDto; hoje: Date }) {
  const { ancoras, disponibilidade } = zones;
  const limiar = limiarMaisAntigo(zones, hoje);
  const desatualizado = limiar !== null && limiar.dias > DIAS_LIMIAR_DESATUALIZADO;

  return (
    <Box>
      {desatualizado && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
          <WarningAmberIcon sx={{ fontSize: '1rem', color: semantic.warning[500] }} aria-hidden />
          <Typography sx={{ fontSize: '0.75rem', color: text.primary }}>
            Limiar com mais de {DIAS_LIMIAR_DESATUALIZADO} dias — refaça o teste para zonas confiáveis.
          </Typography>
        </Box>
      )}

      {!disponibilidade.pace && (
        <Typography sx={{ fontSize: '0.75rem', color: text.primary, mb: 1 }}>
          Pace indisponível — cadastre o pace de limiar do atleta.
        </Typography>
      )}

      <Table size="small" aria-label="Zonas de treino do atleta">
        <TableHead>
          <TableRow>
            <TableCell sx={cabecalho}>Zona</TableCell>
            <TableCell sx={cabecalho}>Pace (min/km)</TableCell>
            <TableCell sx={cabecalho}>FC (bpm)</TableCell>
            <TableCell sx={cabecalho}>RPE (referência)</TableCell>
            <TableCell sx={cabecalho}>Uso típico</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {zones.zonas.map((z) => (
            <ZonaRow key={z.numero} zona={z} />
          ))}
        </TableBody>
      </Table>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, mt: 1.25 }}>
        <Typography sx={{ fontSize: '0.75rem', color: text.secondary }}>
          Âncoras:
          {ancoras.paceLimiarMinKm != null && ` pace de limiar ${formatPace(Math.round(ancoras.paceLimiarMinKm * 60))}/km ·`}
          {` LTHR ${ancoras.fcLimiar} bpm · modelo LTHR (Friel)`}
        </Typography>
        {ancoras.fcLimiarEstimada && <Chip size="small" variant="outlined" label="estimada" sx={{ color: text.secondary }} />}
      </Box>
    </Box>
  );
}

export function AthleteZonesTable({ zones, loading, error, nomeAtleta, hoje = new Date(), defaultExpanded = false }: AthleteZonesTableProps) {
  if (loading) {
    return <Skeleton role="status" aria-label="Carregando zonas do atleta" variant="rounded" height={44} />;
  }
  if (error) {
    return (
      <Typography role="alert" sx={{ fontSize: '0.8125rem', color: text.primary }}>
        <WarningAmberIcon sx={{ fontSize: '1rem', mr: 0.75, verticalAlign: '-0.2em', color: semantic.danger[500] }} aria-hidden />
        Não foi possível carregar as zonas do atleta.
      </Typography>
    );
  }
  if (!zones) return null;

  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      sx={{ bgcolor: content.cardBg, border: `1px solid ${content.cardBorder}`, backgroundImage: 'none', color: text.primary }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: text.secondary }} />}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 1.5, rowGap: 0.5 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {primeiroNome(nomeAtleta) ? `Zonas de ${primeiroNome(nomeAtleta)}` : 'Zonas do atleta'}
          </Typography>
          <ChipsDoCabecalho zones={zones} hoje={hoje} />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Corpo zones={zones} hoje={hoje} />
      </AccordionDetails>
    </Accordion>
  );
}
