import { format, isValid, parseISO } from 'date-fns';
import type { PlanoSemanal } from '../../../types/PlanoSemanal';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';
import { getSafeNumber, getSafeValue } from '../../../utils/safeValues';

const getDiaSemanaLabel = (diaSemana: TreinoPlanejado['diaSemana']): string => {
    if (typeof diaSemana === 'string') {
        return diaSemana;
    }
    return diaSemana?.value || diaSemana?.label || '';
};

const normalizeDiaSemana = (label: string): string => (
    label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z]/g, '')
);

const dayOrder: Record<string, number> = {
    segundafeira: 0,
    segunda: 0,
    seg: 0,
    tercafeira: 1,
    terca: 1,
    ter: 1,
    quartafeira: 2,
    quarta: 2,
    qua: 2,
    quintafeira: 3,
    quinta: 3,
    qui: 3,
    sextafeira: 4,
    sexta: 4,
    sex: 4,
    sabado: 5,
    sab: 5,
    domingo: 6,
    dom: 6,
};

const getDiaSemanaOrder = (diaSemana: TreinoPlanejado['diaSemana']): number => {
    const label = getDiaSemanaLabel(diaSemana);
    const key = normalizeDiaSemana(label);
    if (key && dayOrder[key] !== undefined) {
        return dayOrder[key];
    }
    if (typeof diaSemana === 'object' && typeof diaSemana?.order === 'number') {
        return diaSemana.order;
    }
    return Number.MAX_SAFE_INTEGER;
};

export const ordenarPorDiaSemana = (treinos: TreinoPlanejado[]): TreinoPlanejado[] =>
    [...treinos].sort((a, b) => getDiaSemanaOrder(a.diaSemana) - getDiaSemanaOrder(b.diaSemana));

export const isTreinoRealizado = (treino: TreinoPlanejado): boolean => {
    const status = typeof treino.statusTreino === 'object' ? treino.statusTreino?.value : treino.statusTreino;
    return status === 'REALIZADO' || treino.realizado === true;
};

/** Soma a distância dos treinos já realizados — o plano não traz esse total pronto. */
export const calcularVolumeRealizado = (treinos: TreinoPlanejado[]): number =>
    treinos.reduce((total, treino) => total + (isTreinoRealizado(treino) ? getSafeNumber(treino.distanciaKm) : 0), 0);

export const formatarKm = (km: number): string =>
    `${km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;

/**
 * `parseISO` lê "2026-09-28" como data local. `new Date('2026-09-28')` a lê como UTC e, em
 * America/Sao_Paulo, a exibição recua um dia.
 */
const formatarData = (valor: string, padrao: string): string => {
    const data = parseISO(valor);
    return isValid(data) ? format(data, padrao) : valor;
};

export const formatarPeriodo = (inicio: string, fim: string): string =>
    `${formatarData(inicio, 'dd/MM/yyyy')} – ${formatarData(fim, 'dd/MM/yyyy')}`;

export const formatarPeriodoCurto = (inicio: string, fim: string): string =>
    `${formatarData(inicio, 'dd/MM')} – ${formatarData(fim, 'dd/MM')}`;

/** Chave estável de um plano na lista; planos sem `id` caem no índice. */
export const planoKey = (plano: PlanoSemanal, index: number): string => plano.id ?? `plano-${index}`;

/** "Terça-feira" / "TERCA" → "TER". */
export const formatarDiaCurto = (dia: string): string =>
    dia.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();

/** "2026-09-29" → "29/09". */
export const formatarDataCurta = (data: string): string => formatarData(data, 'dd/MM');

const TIPO_TREINO_COACH: Readonly<Record<string, string>> = {
    FACIL: 'Fácil',
    CONTINUO: 'Contínuo',
    LONGO: 'Longo',
    TEMPO: 'Tempo',
    INTERVALADO: 'Intervalado',
    FARTLEK: 'Fartlek',
    REGENERATIVO: 'Regenerativo',
    PROVA: 'Prova',
};

/** Rótulo PT-BR do tipo para o coach; tipo desconhecido vira texto legível, não o código cru. */
export const rotuloTipoTreino = (tipo: string): string => {
    const codigo = tipo.toUpperCase();
    if (TIPO_TREINO_COACH[codigo]) return TIPO_TREINO_COACH[codigo];
    const texto = tipo.replace(/_/g, ' ').toLowerCase();
    return texto.charAt(0).toUpperCase() + texto.slice(1);
};

/** ISO (`YYYY-MM-DD`) compara como string; o backend não garante ordem. */
const maisRecentePrimeiro = (a: PlanoSemanal, b: PlanoSemanal): number =>
    String(getSafeValue(b.semanaInicio)).localeCompare(String(getSafeValue(a.semanaInicio)));

/** Semanas da mais recente para a mais antiga, sem alterar a lista original. Cada plano vira uma aba. */
export const ordenarPlanosPorSemana = (planos: PlanoSemanal[]): PlanoSemanal[] =>
    [...planos].sort(maisRecentePrimeiro);
