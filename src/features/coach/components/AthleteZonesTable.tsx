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
  /** Referência para a idade do teste de limiar; injetável para teste. */
  hoje?: Date;
  defaultExpanded?: boolean;
}

const DIAS_LIMIAR_DESATUALIZADO = 90;
const MS_POR_DIA = 86_400_000;

// Escala genérica de percepção de esforço por zona — referência, não medida do atleta.
const RPE_TIPICO: Record<number, string> = { 1: '2–3', 2: '3–4', 3: '5–6', 4: '7', 5: '8–9', 6: '9–10' };
const USO_TIPICO: Record<number, string> = {
  1: 'rodagem leve',
  2: 'base e longão',
  3: 'ritmo moderado',
  4: 'contínuo de limiar',
  5: 'tiros de 3–5 min',
  6: 'tiros curtos',
};

const formatarData = (iso: string): string => iso.split('-').reverse().join('/');

function diasDesde(iso: string, hoje: Date): number {
  return Math.floor((hoje.getTime() - new Date(`${iso}T12:00:00`).getTime()) / MS_POR_DIA);
}

/** Idade do teste mais antigo entre os informados; `null` se nenhum teste tem data. */
function idadeDoLimiar(zones: AthleteTrainingZonesDto, hoje: Date): number | null {
  const datas = [zones.ancoras.dataUltimoTestePace, zones.ancoras.dataUltimoTesteFc].filter(
    (d): d is string => Boolean(d),
  );
  return datas.length ? Math.max(...datas.map((d) => diasDesde(d, hoje))) : null;
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
        {zona.pace ? formatPaceRange(zona.pace.minSegKm, zona.pace.maxSegKm) : '—'}
      </TableCell>
      <TableCell sx={celula}>
        {zona.fc ? `${zona.fc.min}–${zona.fc.max} bpm` : <span style={{ color: text.secondary }}>— (usar pace)</span>}
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
  const { ancoras, ajusteFadiga, disponibilidade } = zones;
  const idade = idadeDoLimiar(zones, hoje);
  const desatualizado = idade !== null && idade > DIAS_LIMIAR_DESATUALIZADO;

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 1.25 }}>
        {ancoras.paceLimiarMinKm !== undefined && (
          <Typography sx={{ fontSize: '0.75rem', color: text.secondary }}>
            Limiar de pace {formatPace(Math.round(ancoras.paceLimiarMinKm * 60))}/km
            {ancoras.dataUltimoTestePace ? ` (teste de ${formatarData(ancoras.dataUltimoTestePace)})` : ''}
          </Typography>
        )}
        <Typography sx={{ fontSize: '0.75rem', color: text.secondary }}>
          Limiar de FC {ancoras.fcLimiar} bpm
          {ancoras.dataUltimoTesteFc ? ` (teste de ${formatarData(ancoras.dataUltimoTesteFc)})` : ''}
        </Typography>
        {ancoras.fcLimiarEstimada && <Chip size="small" variant="outlined" label="estimada" sx={{ color: text.secondary }} />}
        {idade !== null && (
          <Chip size="small" variant="outlined" label={`limiar há ${idade} dias`} sx={{ color: text.secondary }} />
        )}
        {ajusteFadiga.segundosPorKm > 0 && (
          <Tooltip title="Informativo: as faixas da tabela são as base. Ajuste o pace à mão se quiser.">
            <Chip size="small" variant="outlined" label={`hoje +${ajusteFadiga.segundosPorKm} s/km (fadiga)`} sx={{ color: text.secondary }} />
          </Tooltip>
        )}
      </Box>

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
            <TableCell sx={cabecalho}>Pace</TableCell>
            <TableCell sx={cabecalho}>FC</TableCell>
            <TableCell sx={cabecalho}>RPE típico</TableCell>
            <TableCell sx={cabecalho}>Uso típico</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {zones.zonas.map((z) => (
            <ZonaRow key={z.numero} zona={z} />
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export function AthleteZonesTable({ zones, loading, error, hoje = new Date(), defaultExpanded = false }: AthleteZonesTableProps) {
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
        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Zonas do atleta</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Corpo zones={zones} hoje={hoje} />
      </AccordionDetails>
    </Accordion>
  );
}
