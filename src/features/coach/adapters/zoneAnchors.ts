import type { AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';

// Limites = CHECKs de V6 no backend (ck_atleta_fc_limiar, ck_atleta_fc_maxima, ck_atleta_pace_limiar).
// A autoridade é o backend; aqui é só dica antes da simulação (design.md D6).
export const FC_LIMIAR_MIN = 100;
export const FC_LIMIAR_MAX = 200;
export const FC_MAXIMA_MIN = 120;
export const FC_MAXIMA_MAX = 220;
export const PACE_LIMIAR_MIN_SEG = 150;
export const PACE_LIMIAR_MAX_SEG = 720;
export const DATA_TESTE_MIN = '2000-01-01';

/** Topo da Z5 sobre o limiar: a máxima real não pode ficar abaixo (D4). */
const FATOR_TOPO_Z5 = 1.06;

/** "4:50" -> 290. Retorna null para formato inválido ou segundos >= 60. */
export function parsePace(texto: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(texto.trim());
  if (!m) return null;
  const seg = Number(m[2]);
  return seg < 60 ? Number(m[1]) * 60 + seg : null;
}

/** 290 -> "4:50". */
export function formatPace(segKm: number): string {
  const total = Math.round(segKm);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export interface FcAnchorForm {
  limiar: number | null;
  /** null = vazio = manter a vigente. */
  maxima: number | null;
  /** Máxima já gravada e real (não estimada); null quando não há. */
  maximaGravada: number | null;
  dataTeste: string;
}

export interface PaceAnchorForm {
  limiarSegKm: number | null;
  dataTeste: string;
}

export type AnchorErrors<K extends string> = Partial<Record<K, string>>;

function validarDataTeste(dataTeste: string, hoje: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataTeste)) return 'Informe a data do teste';
  if (dataTeste < DATA_TESTE_MIN) return 'Data anterior a 2000';
  if (dataTeste > hoje) return 'A data do teste não pode ser futura';
  return undefined;
}

/** `hoje` em ISO (yyyy-MM-dd), data local do navegador — o backend decide pelo fuso do atleta. */
export function validarAncoraFc(
  f: FcAnchorForm,
  hoje: string,
): AnchorErrors<'limiar' | 'maxima' | 'dataTeste'> {
  const erros: AnchorErrors<'limiar' | 'maxima' | 'dataTeste'> = {};

  if (f.limiar == null || !Number.isInteger(f.limiar)) {
    erros.limiar = 'Informe o limiar de FC';
  } else if (f.limiar < FC_LIMIAR_MIN || f.limiar > FC_LIMIAR_MAX) {
    erros.limiar = `Limiar entre ${FC_LIMIAR_MIN} e ${FC_LIMIAR_MAX} bpm`;
  }

  if (f.maxima != null) {
    if (!Number.isInteger(f.maxima) || f.maxima < FC_MAXIMA_MIN || f.maxima > FC_MAXIMA_MAX) {
      erros.maxima = `Máxima entre ${FC_MAXIMA_MIN} e ${FC_MAXIMA_MAX} bpm`;
    }
  }

  // Só máxima real valida o cruzamento: informada, ou gravada quando o campo está vazio.
  const maximaReal = f.maxima ?? f.maximaGravada;
  if (!erros.limiar && !erros.maxima && f.limiar != null && maximaReal != null) {
    const piso = Math.round(f.limiar * FATOR_TOPO_Z5);
    if (maximaReal < piso) erros.maxima = `A máxima deve ser de pelo menos ${piso} bpm`;
  }

  const erroData = validarDataTeste(f.dataTeste, hoje);
  if (erroData) erros.dataTeste = erroData;
  return erros;
}

export function validarAncoraPace(
  f: PaceAnchorForm,
  hoje: string,
): AnchorErrors<'limiarSegKm' | 'dataTeste'> {
  const erros: AnchorErrors<'limiarSegKm' | 'dataTeste'> = {};
  if (f.limiarSegKm == null || !Number.isInteger(f.limiarSegKm)) {
    erros.limiarSegKm = 'Informe o ritmo no formato m:ss';
  } else if (f.limiarSegKm < PACE_LIMIAR_MIN_SEG || f.limiarSegKm > PACE_LIMIAR_MAX_SEG) {
    erros.limiarSegKm = 'Ritmo entre 2:30 e 12:00 /km';
  }
  const erroData = validarDataTeste(f.dataTeste, hoje);
  if (erroData) erros.dataTeste = erroData;
  return erros;
}

export type EixoPrevia = 'fc' | 'pace';

export interface ZonePreviewRow {
  numero: number;
  nome: string;
  /** "75–85% LTHR" / "129–145% limiar"; "—" sem faixa ou sem âncora. */
  referencia: string;
  de: string;
  ate: string;
  /** Z6 de FC: o backend não calcula faixa porque a FC não estabiliza em esforço curto. */
  semFc: boolean;
}

export interface ZonePreview {
  linhas: ZonePreviewRow[];
  /** Largura de cada zona na barra, proporcional à faixa; zonas sem faixa ficam de fora. */
  barra: { numero: number; peso: number }[];
}

/**
 * Prévia das zonas devolvidas pela simulação. A referência é derivada das faixas do backend sobre a
 * âncora (não reimplementa o cálculo): mostra ao treinador de onde cada faixa veio.
 */
export function buildZonePreviewFromZones(zonas: AthleteTrainingZonesDto, eixo: EixoPrevia): ZonePreview {
  const limiar = eixo === 'fc'
    ? zonas.ancoras.fcLimiar
    : zonas.ancoras.paceLimiarMinKm != null ? Math.round(zonas.ancoras.paceLimiarMinKm * 60) : null;
  const sufixo = eixo === 'fc' ? 'LTHR' : 'limiar';
  const pct = (v: number) => Math.round((v / (limiar as number)) * 100);

  const linhas: ZonePreviewRow[] = [];
  const barra: ZonePreview['barra'] = [];
  for (const z of zonas.zonas) {
    const faixa = eixo === 'fc' ? (z.fc ? { min: z.fc.min, max: z.fc.max } : null)
      : z.pace ? { min: z.pace.minSegKm, max: z.pace.maxSegKm } : null;
    const fmt = (v: number) => (eixo === 'fc' ? String(v) : formatPace(v));
    linhas.push({
      numero: z.numero,
      nome: z.nome,
      referencia: faixa && limiar ? `${pct(faixa.min)}–${pct(faixa.max)}% ${sufixo}` : '—',
      de: faixa ? fmt(faixa.min) : '—',
      ate: faixa ? fmt(faixa.max) : '—',
      semFc: eixo === 'fc' && !z.fc && z.motivoFc === 'FC_NAO_ESTABILIZA',
    });
    if (faixa) barra.push({ numero: z.numero, peso: Math.max(1, faixa.max - faixa.min) });
  }
  return { linhas, barra };
}
