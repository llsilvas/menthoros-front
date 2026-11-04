import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
                .catch(() => {
                    if (minha === seq.current) setPrevia(null);
                });
        }, DEBOUNCE_SIMULACAO_MS);
        return () => clearTimeout(t);
    }, [atletaId, eixoAtivo, ativoValido, corpoFc, corpoPace]);

    const tocar = useCallback((campo: string) => setTocados((s) => new Set(s).add(campo)), []);
    const visivel = <T extends Record<string, string | undefined>>(erros: T, eixo: EixoZona) =>
        Object.fromEntries(Object.entries(erros).filter(([k]) => tocados.has(`${eixo}.${k}`))) as Partial<T>;

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
            setError(err instanceof Error ? err.message : 'Erro ao salvar as zonas');
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
        salvar,
    };
}
