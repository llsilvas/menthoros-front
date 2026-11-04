import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../../../api/core/ApiError';
import { CoachAthleteZonesService } from '../../../api/services/CoachAthleteZonesService';
import { invalidarZonasDoAtleta } from '../../../hooks/useAthleteTrainingZones';
import type {
    AthleteTrainingZonesDto,
    AthleteZoneAnchorsInput,
    FonteLimiar,
} from '../../../types/AthleteTrainingZones';
import { formatPace, parsePace, validarAncoraFc, validarAncoraPace } from '../adapters/zoneAnchors';

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
    return { fc, pace };
}

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
    const seq = useRef(0);

    // Só a troca de atleta zera o formulário. Reabrir o diálogo remonta o hook; um refetch de zonas
    // com o diálogo aberto muda `inicial` e não pode apagar o que o coach digitou.
    const [atletaAnterior, setAtletaAnterior] = useState(atletaId);
    if (atletaAnterior !== atletaId) {
        setAtletaAnterior(atletaId);
        setFc(inicial.fc);
        setPace(inicial.pace);
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

    // Salvar envia os eixos alterados; eixo alterado e inválido bloqueia.
    const podeSalvar =
        !saving && (fcAlterado || paceAlterado) && (!fcAlterado || fcValido) && (!paceAlterado || paceValido);

    const salvar = useCallback(async (): Promise<boolean> => {
        if (!podeSalvar) return false;
        const corpo: AthleteZoneAnchorsInput = {};
        if (fcAlterado) corpo.fc = corpoFc();
        if (paceAlterado) corpo.pace = corpoPace();
        setSaving(true);
        setError(null);
        try {
            await CoachAthleteZonesService.salvarAncoras(atletaId, corpo);
            invalidarZonasDoAtleta(atletaId);
            return true;
        } catch (err) {
            setError(mensagemDeErro(err, 'Erro ao salvar as zonas'));
            return false;
        } finally {
            setSaving(false);
        }
    }, [podeSalvar, fcAlterado, paceAlterado, corpoFc, corpoPace, atletaId]);

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
    };
}
