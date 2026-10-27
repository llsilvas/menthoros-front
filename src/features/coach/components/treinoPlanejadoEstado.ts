import { semantic, surface } from '../../../theme/tokens';

export type EstadoExecucao = 'PENDENTE' | 'REALIZADO' | 'PERDIDO' | 'CANCELADO';

export interface EstadoTreinoVisual {
    rotulo: string;
    /** Cor de destaque (borda/tinta do card); `null` = sem destaque (pendente, cancelado). */
    cor: string | null;
    icone: 'realizado' | 'perdido' | 'pendente';
}

/**
 * Estado de execução do treino planejado, no mesmo desenho do `TreinoCard` dos Planos: texto + ícone,
 * e tinta só para realizado/perdido — a cor nunca é o único sinal.
 */
export function estadoDeExecucao(status: EstadoExecucao | string | undefined): EstadoTreinoVisual {
    switch (status) {
        case 'REALIZADO': return { rotulo: 'Realizado', cor: semantic.success[500], icone: 'realizado' };
        case 'PERDIDO':   return { rotulo: 'Perdido',   cor: semantic.danger[500],  icone: 'perdido' };
        case 'CANCELADO': return { rotulo: 'Cancelado', cor: null,                   icone: 'perdido' };
        default:          return { rotulo: 'Pendente',  cor: null,                   icone: 'pendente' };
    }
}

export const COR_ICONE_PENDENTE = surface[500];
