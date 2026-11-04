import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../../../api/core/ApiError';
import { CoachAthleteZonesService } from '../../../api/services/CoachAthleteZonesService';
import { invalidarZonasDoAtleta } from '../../../hooks/useAthleteTrainingZones';
import type {
    AthleteTrainingZonesDto,
    AthleteZoneAnchorsInput,
    AthleteZonesManualInput,
    FonteLimiar,
    ModoZonas,
} from '../../../types/AthleteTrainingZones';
import { formatPace, parsePace, validarAncoraFc, validarAncoraPace } from '../adapters/zoneAnchors';
import {
    corpoManual,
    faixasDoLimiar,
    linhasDasZonas,
    validarFaixasManuais,
    type ErrosManuais,
    type LinhaManual,
} from '../adapters/manualZones';

export type EixoZona = 'fc' | 'pace';

export interface FcForm {
    limiar: string;
    /** Vazio = manter a vigente (design D4). */
    maxima: string;
    dataTeste: string;
    origem: FonteLimiar | '';
}
export interface PaceForm {
    /** "m:ss" */
    limiar: string;
    dataTeste: string;
    origem: FonteLimiar | '';
}

export const DEBOUNCE_SIMULACAO_MS = 300;

function hojeLocal(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
}

function formsIniciais(z: AthleteTrainingZonesDto | null, hoje: string) {
    const a = z?.ancoras;
    const fc: FcForm = {
        // Limiar estimado pela idade não é valor informado: começa vazio (CA9).
        limiar: a && !a.fcLimiarEstimada ? String(a.fcLimiar) : '',
        maxima: z && !z.fcMaxima.estimada ? String(z.fcMaxima.bpm) : '',
        dataTeste: a?.dataUltimoTesteFc ?? hoje,
        origem: a?.fonteLimiarFc ?? '',
    };
    const pace: PaceForm = {
        limiar: a?.paceLimiarMinKm ? formatPace(Math.round(a.paceLimiarMinKm * 60)) : '',
        dataTeste: a?.dataUltimoTestePace ?? hoje,
        origem: a?.fonteLimiarPace ?? '',
    };
    const modos = { fc: z?.modos?.fc ?? 'LIMIAR', pace: z?.modos?.pace ?? 'LIMIAR' } as Record<EixoZona, ModoZonas>;
    const linhas: Record<EixoZona, LinhaManual[]> = {
        fc: z ? linhasDasZonas(z.zonas, 'fc') : [],
        pace: z ? linhasDasZonas(z.zonas, 'pace') : [],
    };
    return { fc, pace, modos, linhas };
}

const EIXOS: EixoZona[] = ['fc', 'pace'];

/**
 * Texto seguro para o treinador: só os `fields` do 400 de validação do backend (mensagens de regra,
 * sem dado do atleta). Qualquer outra falha vira o texto padrão — `err.message` não é exibido.
 */
export function mensagemDeErro(err: unknown, padrao: string): string {
    if (!(err instanceof ApiError)) return padrao;
    const fields = (err.body as { fields?: Record<string, string> } | undefined)?.fields;
    const itens = fields ? Object.entries(fields) : [];
    if (err.status === 400 && itens.length > 0) return itens.map(([campo, msg]) => `${campo}: ${msg}`).join('; ');
    if (err.status === 404) return 'Atleta não encontrado';
    return padrao;
}

// Erro de um campo que nasce da combinação com outro: aparece se qualquer um dos dois foi tocado.
const CAMPOS_RELACIONADOS: Record<string, string[]> = { 'fc.maxima': ['fc.limiar'] };

const inteiro = (t: string): number | null => (/^\d+$/.test(t.trim()) ? Number(t) : null);

/**
 * Estado do diálogo "Zonas do atleta": formulário por eixo, validação local no blur, prévia por
 * simulação no backend (debounce, resposta ultrapassada descartada) e salvar. O componente não
 * chama o service.
 */
export function useAthleteZoneAnchorsEditor(
    atletaId: string,
    zonasAtuais: AthleteTrainingZonesDto | null,
    eixoAtivo: EixoZona,
) {
    const hoje = useMemo(hojeLocal, []);
    const inicial = useMemo(() => formsIniciais(zonasAtuais, hoje), [zonasAtuais, hoje]);
    const [fc, setFc] = useState<FcForm>(inicial.fc);
    const [pace, setPace] = useState<PaceForm>(inicial.pace);
    const [tocados, setTocados] = useState<Set<string>>(new Set());
    const [previa, setPrevia] = useState<AthleteTrainingZonesDto | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [erroPrevia, setErroPrevia] = useState<string | null>(null);
    const [modos, setModos] = useState(inicial.modos);
    const [linhas, setLinhas] = useState(inicial.linhas);
    const seq = useRef(0);
    // Corpo de âncoras já gravado nesta edição: no retry depois de falha só das faixas, não reenvia.
    const ancorasGravadas = useRef<string | null>(null);

    // Só a troca de atleta zera o formulário. Reabrir o diálogo remonta o hook; um refetch de zonas
    // com o diálogo aberto muda `inicial` e não pode apagar o que o coach digitou.
    const [atletaAnterior, setAtletaAnterior] = useState(atletaId);
    if (atletaAnterior !== atletaId) {
        setAtletaAnterior(atletaId);
        setFc(inicial.fc);
        setPace(inicial.pace);
        setModos(inicial.modos);
        setLinhas(inicial.linhas);
        setTocados(new Set());
        setPrevia(null);
        setError(null);
        setErroPrevia(null);
    }

    const maximaGravada = zonasAtuais && !zonasAtuais.fcMaxima.estimada ? zonasAtuais.fcMaxima.bpm : null;

    const errosFc = useMemo(
        () =>
            validarAncoraFc(
                {
                    limiar: inteiro(fc.limiar),
                    maxima: fc.maxima.trim() === '' ? null : (inteiro(fc.maxima) ?? NaN),
                    maximaGravada,
                    dataTeste: fc.dataTeste,
                },
                hoje,
            ),
        [fc, maximaGravada, hoje],
    );
    const errosPace = useMemo(
        () => validarAncoraPace({ limiarSegKm: parsePace(pace.limiar), dataTeste: pace.dataTeste }, hoje),
        [pace, hoje],
    );

    const fcValido = Object.keys(errosFc).length === 0;
    const paceValido = Object.keys(errosPace).length === 0;
    const fcAlterado = JSON.stringify(fc) !== JSON.stringify(inicial.fc);
    const paceAlterado = JSON.stringify(pace) !== JSON.stringify(inicial.pace);

    const corpoFc = useCallback((): AthleteZoneAnchorsInput['fc'] => ({
        limiar: Number(fc.limiar),
        maxima: fc.maxima.trim() === '' ? null : Number(fc.maxima),
        dataTeste: fc.dataTeste,
        origem: fc.origem || null,
    }), [fc]);
    const corpoPace = useCallback((): AthleteZoneAnchorsInput['pace'] => ({
        limiarSegKm: parsePace(pace.limiar) as number,
        dataTeste: pace.dataTeste,
        origem: pace.origem || null,
    }), [pace]);

    // Prévia: só o eixo ativo, só quando válido; inválido esconde a prévia (CA11).
    const ativoValido = eixoAtivo === 'fc' ? fcValido : paceValido;
    useEffect(() => {
        const minha = ++seq.current;
        setErroPrevia(null);
        if (!ativoValido) {
            setPrevia(null);
            return;
        }
        const corpo: AthleteZoneAnchorsInput =
            eixoAtivo === 'fc' ? { fc: corpoFc() } : { pace: corpoPace() };
        const t = setTimeout(() => {
            CoachAthleteZonesService.simular(atletaId, corpo)
                .then((z) => {
                    if (minha === seq.current) setPrevia(z);
                })
                .catch((err) => {
                    if (minha !== seq.current) return;
                    setPrevia(null);
                    setErroPrevia(mensagemDeErro(err, 'Não foi possível simular as zonas'));
                });
        }, DEBOUNCE_SIMULACAO_MS);
        return () => clearTimeout(t);
    }, [atletaId, eixoAtivo, ativoValido, corpoFc, corpoPace]);

    const tocar = useCallback((campo: string) => setTocados((s) => new Set(s).add(campo)), []);
    const visivel = <T extends Record<string, string | undefined>>(erros: T, eixo: EixoZona) =>
        Object.fromEntries(Object.entries(erros).filter(([k]) => {
                const chave = `${eixo}.${k}`;
                return tocados.has(chave) || (CAMPOS_RELACIONADOS[chave] ?? []).some((c) => tocados.has(c));
            })) as Partial<T>;

    // Modo manual: a faixa que o limiar daria vem da simulação das âncoras digitadas ou, sem ela, do GET.
    const fonteLimiar = previa ?? zonasAtuais;
    const linhasDoLimiar = useCallback(
        (eixo: EixoZona) => (fonteLimiar ? faixasDoLimiar(fonteLimiar, eixo) : null),
        [fonteLimiar],
    );
    const errosManuais: Record<EixoZona, ErrosManuais> = useMemo(() => ({
        fc: modos.fc === 'MANUAL' ? validarFaixasManuais(linhas.fc, 'fc') : {},
        pace: modos.pace === 'MANUAL' ? validarFaixasManuais(linhas.pace, 'pace') : {},
    }), [modos, linhas]);
    const manualAlterado = useCallback((eixo: EixoZona) =>
        modos[eixo] !== inicial.modos[eixo]
        || (modos[eixo] === 'MANUAL' && JSON.stringify(linhas[eixo]) !== JSON.stringify(inicial.linhas[eixo])),
    [modos, linhas, inicial]);
    const manualValido = (eixo: EixoZona) => Object.keys(errosManuais[eixo]).length === 0;
    const algumManualAlterado = EIXOS.some(manualAlterado);

    /** Entrar no manual com as linhas intocadas recarrega o cálculo vigente (âncoras digitadas, se válidas). */
    const setModo = useCallback((eixo: EixoZona, modo: ModoZonas) => {
        setModos((m) => ({ ...m, [eixo]: modo }));
        if (modo === 'MANUAL' && inicial.modos[eixo] === 'LIMIAR') {
            const doLimiar = linhasDoLimiar(eixo);
            if (doLimiar) setLinhas((l) => ({ ...l, [eixo]: doLimiar }));
        }
    }, [inicial.modos, linhasDoLimiar]);
    const setLinha = useCallback((eixo: EixoZona, indice: number, campo: keyof LinhaManual, valor: string) => {
        setLinhas((l) => ({ ...l, [eixo]: l[eixo].map((x, i) => (i === indice ? { ...x, [campo]: valor } : x)) }));
    }, []);
    const recalcular = useCallback((eixo: EixoZona) => {
        const doLimiar = linhasDoLimiar(eixo);
        if (doLimiar) setLinhas((l) => ({ ...l, [eixo]: doLimiar }));
    }, [linhasDoLimiar]);

    // Salvar envia os eixos alterados; eixo alterado e inválido bloqueia.
    const podeSalvar =
        !saving && (fcAlterado || paceAlterado || algumManualAlterado)
        && (!fcAlterado || fcValido) && (!paceAlterado || paceValido)
        && EIXOS.every((e) => !manualAlterado(e) || manualValido(e));

    const salvar = useCallback(async (): Promise<boolean> => {
        if (!podeSalvar) return false;
        const ancoras: AthleteZoneAnchorsInput = {};
        if (fcAlterado) ancoras.fc = corpoFc();
        if (paceAlterado) ancoras.pace = corpoPace();
        const manuais: AthleteZonesManualInput = {};
        for (const e of EIXOS) {
            if (manualAlterado(e)) {
                manuais[e] = modos[e] === 'MANUAL' ? { modo: 'MANUAL', faixas: corpoManual(linhas[e], e) } : { modo: 'LIMIAR' };
            }
        }
        const chaveAncoras = JSON.stringify(ancoras);
        const enviarAncoras = Object.keys(ancoras).length > 0 && chaveAncoras !== ancorasGravadas.current;
        setSaving(true);
        setError(null);
        let ancorasOk = false;
        try {
            // Âncoras primeiro: a faixa manual não depende delas, e cada PUT é idempotente por eixo.
            if (enviarAncoras) {
                await CoachAthleteZonesService.salvarAncoras(atletaId, ancoras);
                ancorasGravadas.current = chaveAncoras;
                ancorasOk = true;
            }
            if (Object.keys(manuais).length > 0) await CoachAthleteZonesService.salvarZonasManuais(atletaId, manuais);
            invalidarZonasDoAtleta(atletaId);
            return true;
        } catch (err) {
            const msg = mensagemDeErro(err, 'Erro ao salvar as zonas');
            if (ancorasOk) {
                invalidarZonasDoAtleta(atletaId);
                setError(`Limiares salvos; faixas manuais não — tente de novo. ${msg}`);
            } else {
                setError(msg);
            }
            return false;
        } finally {
            setSaving(false);
        }
    }, [podeSalvar, fcAlterado, paceAlterado, corpoFc, corpoPace, atletaId, modos, linhas, manualAlterado]);

    const fcMaximaReal = zonasAtuais && !zonasAtuais.fcMaxima.estimada ? zonasAtuais.fcMaxima.bpm : null;

    return {
        fc,
        setFc,
        pace,
        setPace,
        tocar,
        errosFc: visivel(errosFc, 'fc'),
        errosPace: visivel(errosPace, 'pace'),
        previa,
        podeSalvar,
        saving,
        error,
        erroPrevia,
        salvar,
        modos,
        setModo,
        /** O eixo está em MANUAL no backend: voltar ao limiar apaga as faixas ao salvar (Q1). */
        manualGravado: inicial.modos,
        linhas,
        setLinha,
        errosManuais,
        recalcular,
        recalcularDisponivel: (eixo: EixoZona) => linhasDoLimiar(eixo) != null,
        /** Limiar alterado com o eixo em manual: as faixas manuais não acompanham. */
        limiarMudouComManual: (eixo: EixoZona) =>
            modos[eixo] === 'MANUAL' && (eixo === 'fc' ? fcAlterado : paceAlterado),
        /** Zonas manuais de FC acima da máxima real não vão ao relógio (o push descarta). */
        fcManualAcimaDaMaxima:
            modos.fc === 'MANUAL' && fcMaximaReal != null
            && linhas.fc.some((l) => /^\d+$/.test(l.ate.trim()) && Number(l.ate) > fcMaximaReal)
                ? fcMaximaReal
                : null,
    };
}
