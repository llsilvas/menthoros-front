import type { AlvoPrimario, AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';
import type { ZoneKey } from '../../workout/profile/types';
import { defaultAlvoPrimario } from './alvoPrimario';
import { faixaFcTipica } from './etapaFcTipica';
import {
    fcEntendidaPeloRelogio,
    matchZone,
    parseCanonicalFc,
    parseCanonicalPace,
    toCanonicalFc,
    toCanonicalPace,
    zonaDoPonto,
} from './intensityFormat';

export type ZonaSelecionada = ZoneKey | 'PERSONALIZADO' | null;

/** O que o seletor edita numa etapa. `alvoPrimario` ausente = etapa legada (o backend deriva). */
export interface IntensidadeEtapa {
    zona: ZonaSelecionada;
    fcAlvoEtapa: string;
    ritmoAlvo: string;
    alvoPrimario?: AlvoPrimario;
    /**
     * O treinador escolheu o eixo (clicou no toggle). Fica na etapa, não no componente: o seletor
     * só monta na etapa em foco, e recolher/reabrir não pode devolver o eixo à regra de pré-preenchimento.
     * Ausente em etapa que veio do backend com eixo gravado = escolha anterior, tratada como tocada.
     */
    eixoTocado?: boolean;
}

/** Eixo escolhido pelo treinador (ou gravado antes) — a regra de pré-preenchimento não o sobrescreve. */
export const eixoFoiEscolhido = (i: Pick<IntensidadeEtapa, 'alvoPrimario' | 'eixoTocado'>): boolean =>
    i.eixoTocado ?? Boolean(i.alvoPrimario);

export interface AvisoEtapa {
    id:
        | 'texto-legado'
        | 'zonas-divergentes'
        | 'fc-acima-maxima'
        | 'fc-fora-da-faixa-tipica'
        | 'sem-pace-limiar'
        | 'fc-limiar-estimada';
    texto: string;
}

const MIN_SOBREPOSICAO_FC = 0.5;

function eixoDisponivel(eixo: 'PACE' | 'FC', i: Pick<IntensidadeEtapa, 'fcAlvoEtapa' | 'ritmoAlvo'>): boolean {
    return eixo === 'PACE' ? i.ritmoAlvo.trim() !== '' : i.fcAlvoEtapa.trim() !== '';
}

/** Escolhe o eixo entre os que têm valor: o preferido se existir, senão o que sobrou, senão NENHUM. */
function eixoPara(preferido: 'PACE' | 'FC', i: Pick<IntensidadeEtapa, 'fcAlvoEtapa' | 'ritmoAlvo'>): AlvoPrimario {
    if (eixoDisponivel(preferido, i)) return preferido;
    const outro = preferido === 'PACE' ? 'FC' : 'PACE';
    return eixoDisponivel(outro, i) ? outro : 'NENHUM';
}

/**
 * Escolher Zn preenche pace e FC do atleta com a faixa **base** (nenhum ajuste de fadiga é somado) e
 * aplica o default do eixo — a menos que o treinador já tenha mexido nele (`eixoFoiEscolhido`).
 * FC de limiar estimado nunca é copiada: um bpm literal furaria a regra "sem limiar medido, sem meta".
 */
export function aplicarZona(
    atual: IntensidadeEtapa,
    zona: ZoneKey,
    zones: AthleteTrainingZonesDto,
    tipoEtapa: string,
): IntensidadeEtapa {
    const eixoTocado = eixoFoiEscolhido(atual);
    const dados = zones.zonas.find((z) => `Z${z.numero}` === zona);
    const ritmoAlvo = zones.disponibilidade.pace && dados?.pace
        ? toCanonicalPace(dados.pace.minSegKm, dados.pace.maxSegKm)
        : '';
    const fcAlvoEtapa = !zones.ancoras.fcLimiarEstimada && dados?.fc
        ? toCanonicalFc(dados.fc.min, dados.fc.max)
        : '';
    const valores = { ritmoAlvo, fcAlvoEtapa };

    const mantem = eixoTocado && (atual.alvoPrimario === 'PACE' || atual.alvoPrimario === 'FC')
        ? atual.alvoPrimario
        : null;
    const preferido = mantem ?? defaultAlvoPrimario(tipoEtapa, zona);

    return { zona, ...valores, alvoPrimario: eixoPara(preferido, valores), eixoTocado };
}

/**
 * Editar um valor à mão tira a etapa de qualquer zona (`PERSONALIZADO`) sem apagar o outro campo.
 * O eixo escolhido continua enquanto tiver valor; sem ele, vale o único preenchido, ou o default do
 * tipo quando os dois estão, ou NENHUM quando não sobrou nada.
 */
export function editarValor(
    atual: IntensidadeEtapa,
    campo: 'fcAlvoEtapa' | 'ritmoAlvo',
    valor: string,
    tipoEtapa: string,
): IntensidadeEtapa {
    const proximo = { ...atual, [campo]: valor };
    const eixoAtual = proximo.alvoPrimario === 'PACE' || proximo.alvoPrimario === 'FC' ? proximo.alvoPrimario : null;
    const preferido = eixoAtual && eixoDisponivel(eixoAtual, proximo)
        ? eixoAtual
        : defaultAlvoPrimario(tipoEtapa, null);
    return { ...proximo, zona: 'PERSONALIZADO', alvoPrimario: eixoPara(preferido, proximo) };
}

export function escolherEixo(atual: IntensidadeEtapa, eixo: Exclude<AlvoPrimario, 'NENHUM'>): IntensidadeEtapa {
    return { ...atual, alvoPrimario: eixo, eixoTocado: true };
}

/** Zona de uma etapa carregada do backend: reconhece pelos valores; o que não casa é personalizado. */
export function zonaDaEtapa(
    fcAlvoEtapa: string | undefined,
    ritmoAlvo: string | undefined,
    zones: AthleteTrainingZonesDto | null,
): ZonaSelecionada {
    const fc = fcAlvoEtapa?.trim() ?? '';
    const ritmo = ritmoAlvo?.trim() ?? '';
    if (!zones || (!fc && !ritmo)) return null;
    const fcFaixa = parseCanonicalFc(fc);
    const paceFaixa = parseCanonicalPace(ritmo);
    if ((fc && !fcFaixa) || (ritmo && !paceFaixa)) return 'PERSONALIZADO';
    return matchZone(fcFaixa ?? undefined, paceFaixa ?? undefined, zones.zonas) ?? 'PERSONALIZADO';
}

interface ContextoAvisos {
    zones: AthleteTrainingZonesDto | null;
    tipoEtapa: string;
    tipoTreino?: string;
}

/** Avisos informativos do seletor — nunca bloqueiam o salvar. */
export function avisosDaEtapa(i: IntensidadeEtapa, { zones, tipoEtapa, tipoTreino }: ContextoAvisos): AvisoEtapa[] {
    const avisos: AvisoEtapa[] = [];
    const fcTexto = i.fcAlvoEtapa.trim();
    const paceTexto = i.ritmoAlvo.trim();
    const fc = parseCanonicalFc(fcTexto);
    const pace = parseCanonicalPace(paceTexto);

    const naoLidos = [
        fcTexto && !fcEntendidaPeloRelogio(fcTexto) ? fcTexto : '',
        paceTexto && !pace ? paceTexto : '',
    ].filter(Boolean);
    if (naoLidos.length) {
        avisos.push({
            id: 'texto-legado',
            texto: `"${naoLidos.join('" e "')}": texto preservado, mas não vira alvo no relógio. Escolher uma zona converte; salvar sem mexer mantém como está.`,
        });
    }
    if (!zones) return avisos;

    if (fc && pace) {
        const { fc: zf, pace: zp } = zonaDoPonto(fc, pace, zones.zonas);
        if (zf && zp && zf !== zp) {
            avisos.push({
                id: 'zonas-divergentes',
                texto: `Pace é ${zp} e FC é ${zf} para este atleta. O relógio segue só o eixo escolhido: confira qual vale. Salvar continua permitido.`,
            });
        }
    }

    const eixoFc = i.alvoPrimario !== 'PACE' && i.alvoPrimario !== 'NENHUM';
    if (fc && eixoFc && fc.max > zones.fcMaxima.bpm) {
        avisos.push({
            id: 'fc-acima-maxima',
            texto: `A FC passa da máxima do atleta (${zones.fcMaxima.bpm} bpm${zones.fcMaxima.estimada ? ', estimada' : ''}); o relógio descarta esse alvo.`,
        });
    }

    const tipica = fc ? faixaFcTipica(tipoEtapa, tipoTreino, zones.zonas) : null;
    if (fc && tipica) {
        const sobreposicao = Math.max(0, Math.min(fc.max, tipica.max) - Math.max(fc.min, tipica.min));
        if (sobreposicao / Math.max(1, fc.max - fc.min) < MIN_SOBREPOSICAO_FC) {
            avisos.push({
                id: 'fc-fora-da-faixa-tipica',
                texto: `A FC está fora da faixa típica para esta etapa (${tipica.min}–${tipica.max} bpm).`,
            });
        }
    }

    const zonaEscolhida = i.zona !== null && i.zona !== 'PERSONALIZADO';
    if (zonaEscolhida && !zones.disponibilidade.pace) {
        avisos.push({ id: 'sem-pace-limiar', texto: 'Sem pace de limiar: a zona grava só a FC. Cadastre o limiar para prescrever por ritmo.' });
    }
    if (zonaEscolhida && zones.ancoras.fcLimiarEstimada && !fcTexto) {
        avisos.push({ id: 'fc-limiar-estimada', texto: 'O limiar de FC é estimado: informe a FC à mão ou cadastre o limiar.' });
    }
    return avisos;
}

/**
 * Zona de uma etapa para o **perfil do treino** (zona predominante, gráfico), olhando onde os valores
 * *caem*: faixa de IA ou digitada à mão raramente casa a zona inteira, mas está dentro dela. Isso não
 * muda o que o seletor mostra (Personalizado) — só deixa a etapa contar para a zona do treino.
 * FC e pace em zonas diferentes: vale o eixo que o relógio controla; sem eixo definido, a etapa fica sem zona.
 */
export function zonaPorValor(
    fcAlvoEtapa: string | undefined,
    ritmoAlvo: string | undefined,
    alvoPrimario: AlvoPrimario | undefined,
    zones: AthleteTrainingZonesDto | null,
): ZoneKey | null {
    if (!zones) return null;
    const fc = parseCanonicalFc(fcAlvoEtapa) ?? undefined;
    const pace = parseCanonicalPace(ritmoAlvo) ?? undefined;
    if (!fc && !pace) return null;
    const { fc: zf, pace: zp } = zonaDoPonto(fc, pace, zones.zonas);
    if (zf && zp && zf !== zp) return alvoPrimario === 'PACE' ? zp : alvoPrimario === 'FC' ? zf : null;
    return zf ?? zp;
}
