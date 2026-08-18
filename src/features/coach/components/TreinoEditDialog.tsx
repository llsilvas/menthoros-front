import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import RepeatIcon from '@mui/icons-material/Repeat';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { primary, surface } from '../../../theme/tokens';
import { overlayWhite } from '../../../theme/overlays';
import { elevation } from '../../../shared/design-tokens';
import { GHOST_BTN_SX, PRIMARY_BTN_SX } from '../../../shared/components/actionButtonSx';
import { activeTheme } from '../../../theme/activeTheme';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import type { TreinoPlanejadoDto, TreinoPlanejadoPatch } from '../../../types/PlanoReview';
import {
    emptyStep,
    emptyBlock,
    emptySubStep,
    itensFromEtapas,
    serializarItens,
    type EtapaItem,
} from './etapas/etapaItem';
import { WorkoutTimelineChart } from '../../../components/features/planos/WorkoutTimelineChart/WorkoutTimelineChart';
import type { WorkoutBlock, BlockType } from '../../../components/features/planos/WorkoutTimelineChart/types';
import type { ZoneKey } from '../../../theme/tokens';

// ── Helpers ──────────────────────────────────────────────────────────────────


function toIso8601(minutos: string): string | undefined {
    const n = parseInt(minutos, 10);
    return isNaN(n) || n <= 0 ? undefined : `PT${n}M`;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const TIPOS_TREINO = [
    { value: 'FACIL',        label: 'Fácil'        },
    { value: 'CONTINUO',     label: 'Contínuo'     },
    { value: 'LONGO',        label: 'Longo'        },
    { value: 'TEMPO_RUN',    label: 'Tempo Run'    },
    { value: 'INTERVALADO',  label: 'Intervalado'  },
    { value: 'FARTLEK',      label: 'Fartlek'      },
    { value: 'REGENERATIVO', label: 'Regenerativo' },
    { value: 'TIRO',         label: 'Tiro'         },
    { value: 'SUBIDA',       label: 'Subida'       },
    { value: 'PROVA',        label: 'Prova'        },
];


const ACCENT = activeTheme.trainingStage;

// ── Zone inference ────────────────────────────────────────────────────────────

function zoneFromString(s: string): 1 | 2 | 3 | 4 | 5 {
    const match = s.toUpperCase().match(/Z(\d)/);
    if (match) {
        const z = parseInt(match[1], 10);
        if (z >= 1 && z <= 5) return z as 1 | 2 | 3 | 4 | 5;
    }
    return 1;
}

// ── Estado de bloco ───────────────────────────────────────────────────────────

interface BlocoState {
    distanciaKm: string;
    duracaoMin: string;
    zonaAlvo: string;
    rpe: string;
}




// ── BlocoCard ─────────────────────────────────────────────────────────────────

function fieldSx(accent: string) {
    return {
        '& .MuiOutlinedInput-root': {
            fontSize: '0.82rem',
            color: surface[100],
            bgcolor: overlayWhite[4],
            '& fieldset': { borderColor: overlayWhite[10] },
            '&:hover fieldset': { borderColor: overlayWhite[22] },
            '&.Mui-focused fieldset': { borderColor: accent },
        },
        '& .MuiInputLabel-root': { fontSize: '0.72rem', color: surface[500] },
        '& .MuiInputLabel-root.Mui-focused': { color: accent },
        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
            WebkitAppearance: 'none',
        },
    } as const;
}


/** BlocoCard fala em BlocoState; o modelo de itens fala em tipoEtapa/fcAlvoEtapa. */
function blocoStateDe(e: { duracaoMin: string; distanciaKm: string; fcAlvoEtapa: string }): BlocoState {
    return { distanciaKm: e.distanciaKm, duracaoMin: e.duracaoMin, zonaAlvo: e.fcAlvoEtapa, rpe: '' };
}

function camposDe(b: BlocoState): { duracaoMin: string; distanciaKm: string; fcAlvoEtapa: string } {
    return { duracaoMin: b.duracaoMin, distanciaKm: b.distanciaKm, fcAlvoEtapa: b.zonaAlvo };
}

function accentDe(tipoEtapa: string): string {
    switch (tipoEtapa?.toUpperCase()) {
        case 'AQUECIMENTO':    return ACCENT.aquecimento;
        case 'DESAQUECIMENTO': return ACCENT.desaquecimento;
        case 'RECUPERACAO':    return ACCENT.recuperacao;
        case 'INTERVALADO':    return ACCENT.esforco;
        default:               return ACCENT.principal;
    }
}

interface ItemActionsProps {
    idx: number;
    total: number;
    /** "etapa" ou "série" — o rótulo do leitor de tela precisa dizer o que está sendo movido. */
    nome?: string;
    disabled?: boolean;
    onMover: (idx: number, delta: number) => void;
    onRemover: (idx: number) => void;
}

function ItemActions({ idx, total, disabled, onMover, onRemover, nome = 'etapa' }: ItemActionsProps) {
    return (
        <Box sx={{ display: 'flex', gap: 0.25 }}>
            <IconButton size="small" aria-label={`Mover ${nome} ${idx + 1} para cima`}
                disabled={disabled || idx === 0} onClick={() => onMover(idx, -1)}>
                <ArrowUpwardIcon sx={{ fontSize: 14 }} />
            </IconButton>
            <IconButton size="small" aria-label={`Mover ${nome} ${idx + 1} para baixo`}
                disabled={disabled || idx === total - 1} onClick={() => onMover(idx, 1)}>
                <ArrowDownwardIcon sx={{ fontSize: 14 }} />
            </IconButton>
            <IconButton size="small" aria-label={`Remover ${nome} ${idx + 1}`}
                disabled={disabled} onClick={() => onRemover(idx)}>
                <DeleteOutlineIcon sx={{ fontSize: 15 }} />
            </IconButton>
        </Box>
    );
}


/**
 * Itens iniciais do editor. Um treino sem etapas detalhadas — só distância/duração no nível do
 * treino — vira uma etapa PRINCIPAL sintética, senão não haveria o que editar: era o que o dialog
 * antigo fazia com `blocoFromTreino`.
 */
function itensIniciais(treino: TreinoPlanejadoDto): EtapaItem[] {
    const itens = itensFromEtapas(treino.etapas);
    if (itens.length > 0) return itens;

    const duracaoMin = parseDuracaoMinutos(treino.duracaoMin);
    const distanciaKm = treino.distanciaKm != null ? String(treino.distanciaKm) : '';
    if (!duracaoMin && !distanciaKm) return [];

    return [{
        id: crypto.randomUUID(),
        kind: 'step',
        tipoEtapa: 'PRINCIPAL',
        duracaoMin,
        distanciaKm,
        fcAlvoEtapa: treino.zonaAlvo ?? '',
    }];
}

/** "PT90M" → "90". O contrato usa ISO-8601; o formulário, minutos. */
function parseDuracaoMinutos(iso: string | undefined): string {
    if (!iso) return '';
    const m = /^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(iso);
    if (!m) return '';
    const horas = m[1] ? parseInt(m[1], 10) : 0;
    const min   = m[2] ? parseInt(m[2], 10) : 0;
    const total = horas * 60 + min;
    return total > 0 ? String(total) : '';
}

const TIPOS_ETAPA = ['AQUECIMENTO', 'PRINCIPAL', 'INTERVALADO', 'RECUPERACAO', 'DESAQUECIMENTO'] as const;

interface BlocoCardProps {
    label: string;
    accent: string;
    bloco: BlocoState;
    onChange: (b: BlocoState) => void;
    disabled?: boolean;
    actions?: React.ReactNode;
    /** Quando presente, o card deixa o coach escolher o tipo — etapa sem tipo não é persistida. */
    tipoEtapa?: string;
    onTipoChange?: (tipo: string) => void;
    tipoAriaLabel?: string;
}

function BlocoCard({
    label, accent, bloco, onChange, disabled, actions, tipoEtapa, onTipoChange, tipoAriaLabel,
}: BlocoCardProps) {
    return (
        <Box
            sx={{
                borderLeft: `3px solid ${accent}`,
                borderRadius: '0 8px 8px 0',
                bgcolor: alpha(surface[0], 0.025),
                p: 1.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                    sx={{
                        px: 0.75,
                        py: 0.2,
                        borderRadius: '4px',
                        bgcolor: `${accent}18`,
                        border: `1px solid ${accent}33`,
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        color: accent,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        fontFamily: 'monospace',
                        userSelect: 'none',
                    }}
                >
                    {label}
                </Box>
                {onTipoChange && (
                    <FormControl size="small" sx={{ minWidth: 150, ...fieldSx(accent) }}>
                        <InputLabel shrink>Tipo</InputLabel>
                        <Select
                            native
                            label="Tipo"
                            value={tipoEtapa ?? ''}
                            onChange={e => onTipoChange(e.target.value as string)}
                            disabled={disabled}
                            inputProps={{ 'aria-label': tipoAriaLabel ?? 'Tipo da etapa' }}
                        >
                            <option value="" disabled />
                            {TIPOS_ETAPA.map(t => <option key={t} value={t}>{t}</option>)}
                        </Select>
                    </FormControl>
                )}
                {actions && <Box sx={{ ml: 'auto' }}>{actions}</Box>}
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                    label="Distância (km)"
                    type="number"
                    value={bloco.distanciaKm}
                    onChange={e => onChange({ ...bloco, distanciaKm: e.target.value })}
                    disabled={disabled}
                    size="small"
                    fullWidth
                    inputProps={{ min: 0, step: 0.1 }}
                    sx={fieldSx(accent)}
                />
                <TextField
                    label="Duração (min)"
                    type="number"
                    value={bloco.duracaoMin}
                    onChange={e => onChange({ ...bloco, duracaoMin: e.target.value })}
                    disabled={disabled}
                    size="small"
                    fullWidth
                    inputProps={{ min: 1, step: 1 }}
                    sx={fieldSx(accent)}
                />
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                    label="Zona alvo"
                    value={bloco.zonaAlvo}
                    onChange={e => onChange({ ...bloco, zonaAlvo: e.target.value })}
                    disabled={disabled}
                    size="small"
                    fullWidth
                    sx={fieldSx(accent)}
                />
                <TextField
                    label="RPE (1–10)"
                    type="number"
                    value={bloco.rpe}
                    onChange={e => onChange({ ...bloco, rpe: e.target.value })}
                    disabled={disabled}
                    size="small"
                    fullWidth
                    inputProps={{ min: 1, max: 10, step: 1 }}
                    sx={fieldSx(accent)}
                />
            </Box>
        </Box>
    );
}


// ── TreinoEditDialog ──────────────────────────────────────────────────────────

export interface TreinoEditDialogProps {
    open: boolean;
    treino: TreinoPlanejadoDto;
    isSaving: boolean;
    onClose: () => void;
    onSave: (patch: TreinoPlanejadoPatch) => void;
}

export function TreinoEditDialog({ open, treino, isSaving, onClose, onSave }: TreinoEditDialogProps) {
    const [tipoTreino, setTipoTreino]         = useState(treino.tipoTreino ?? '');
    const [tss, setTss]                       = useState(treino.tssPlanejado != null ? String(treino.tssPlanejado) : '');
    const [observacao, setObservacao]         = useState(treino.observacao ?? '');

    // O treino é editado como lista de itens — etapas avulsas e blocos repetidos —, o mesmo modelo
    // do TreinoAddDialog. Antes eram quatro campos fixos, e qualquer série heterogênea era achatada
    // no primeiro par ao abrir e replicada ao salvar.
    const [itens, setItens]                   = useState<EtapaItem[]>(() => itensIniciais(treino));
    // RPE é do treino, não da etapa: o dialog antigo mostrava um campo por bloco, mas só o do
    // principal era lido — os outros três eram inertes.
    const [rpe, setRpe]                       = useState(
        treino.percepcaoEsforcoEsperada != null ? String(treino.percepcaoEsforcoEsperada) : '');
    const [zonaAlvo, setZonaAlvo]             = useState(treino.zonaAlvo ?? '');
    // Rastreia se o usuário alterou as etapas — evita incluir etapas em patches sem mudança.
    // Sem esta guarda, mudar só o TSS regravaria a estrutura inteira do treino.
    const [blocosMudados, setBlocosMudados]   = useState(false);
    // Aviso de remoção de aquecimento/desaquecimento, com o patch retido até a confirmação
    const [avisoRemocao, setAvisoRemocao]     = useState<string[] | null>(null);
    const [pendente, setPendente]             = useState<TreinoPlanejadoPatch | null>(null);

    useEffect(() => {
        setItens(itensIniciais(treino));
        setTipoTreino(treino.tipoTreino ?? '');
        setZonaAlvo(treino.zonaAlvo ?? '');
        setRpe(treino.percepcaoEsforcoEsperada != null ? String(treino.percepcaoEsforcoEsperada) : '');
        setTss(treino.tssPlanejado != null ? String(treino.tssPlanejado) : '');
        setObservacao(treino.observacao ?? '');
        setBlocosMudados(false);
    }, [treino]);


    /** Um item rende N cópias das suas sub-etapas; uma etapa avulsa rende ela mesma. */
    const etapasDoItem = (item: EtapaItem): { duracaoMin: string; distanciaKm: string; fcAlvoEtapa: string; tipoEtapa: string }[] => {
        if (item.kind === 'step') return [item];
        const reps = Math.max(1, parseInt(item.repeticoes, 10) || 1);
        return Array.from({ length: reps }, () => item.steps).flat();
    };

    // Totais em tempo real: soma o treino inteiro já expandido
    const { totalKm, totalMin } = useMemo(() => {
        let km = 0;
        let min = 0;
        for (const item of itens) {
            for (const e of etapasDoItem(item)) {
                km  += parseFloat(e.distanciaKm) || 0;
                min += parseInt(e.duracaoMin, 10) || 0;
            }
        }
        return {
            totalKm:  km  > 0 ? km.toFixed(1) : null,
            totalMin: min > 0 ? String(min)   : null,
        };
    }, [itens]);

    // Blocos derivados do estado ao vivo — gráfico atualiza a cada edição.
    // A expansão deixou de ser caso especial do intervalado: é a leitura natural da lista.
    const liveBlocks = useMemo((): WorkoutBlock[] => {
        const blocks: WorkoutBlock[] = [];

        const blockTypeDe = (tipoEtapa: string): BlockType => {
            switch (tipoEtapa?.toUpperCase()) {
                case 'AQUECIMENTO':    return 'warmup';
                case 'DESAQUECIMENTO': return 'cooldown';
                case 'INTERVALADO':    return 'interval';
                case 'RECUPERACAO':    return 'recovery';
                default:               return 'main';
            }
        };
        const iconHint = (bt: BlockType) =>
            bt === 'warmup' ? 'warmup' : bt === 'cooldown' ? 'cooldown' : 'main';

        itens.forEach((item, idx) => {
            if (item.kind === 'step') {
                const durationMin = parseInt(item.duracaoMin, 10) || 0;
                if (durationMin <= 0) return;
                const zone = zoneFromString(item.fcAlvoEtapa);
                const blockType = blockTypeDe(item.tipoEtapa);
                blocks.push({
                    id: `step-${item.id}`,
                    label: item.tipoEtapa || 'Etapa',
                    shortLabel: (item.tipoEtapa || 'ETAPA').slice(0, 5),
                    durationMin,
                    zone,
                    zoneKey: `Z${zone}` as ZoneKey,
                    blockType,
                    description: item.fcAlvoEtapa || undefined,
                    icon: iconHint(blockType),
                });
                return;
            }

            const reps = Math.max(1, parseInt(item.repeticoes, 10) || 1);
            for (let r = 1; r <= reps; r++) {
                item.steps.forEach((sub, si) => {
                    const durationMin = parseInt(sub.duracaoMin, 10) || 0;
                    if (durationMin <= 0) return;
                    const zone = zoneFromString(sub.fcAlvoEtapa);
                    const blockType = blockTypeDe(sub.tipoEtapa);
                    blocks.push({
                        id: `bloco-${idx}-${r}-${si}`,
                        label: `${sub.tipoEtapa || 'Etapa'} ${r}/${reps}`,
                        // Só a primeira etapa da repetição leva o contador; as demais mostram o
                        // tipo, senão a série inteira vira uma fileira de "1/4" repetidos.
                        shortLabel: reps > 1 && si === 0
                            ? `${r}/${reps}`
                            : (sub.tipoEtapa || 'ETAPA').slice(0, 5),
                        durationMin,
                        zone,
                        zoneKey: `Z${zone}` as ZoneKey,
                        blockType,
                        description: sub.fcAlvoEtapa || undefined,
                        icon: iconHint(blockType),
                    });
                });
            }
        });

        return blocks;
    }, [itens]);

    /** Tipos que o treino tinha e deixou de ter — base do aviso antes de salvar. */
    const etapasRemovidas = (): string[] => {
        const tinha = new Set((treino.etapas ?? []).map(e => e.tipoEtapa?.toUpperCase()));
        const tem = new Set(
            itens.flatMap(i => i.kind === 'step' ? [i.tipoEtapa] : i.steps.map(s => s.tipoEtapa))
                 .map(t => t?.toUpperCase()),
        );
        return ['AQUECIMENTO', 'DESAQUECIMENTO'].filter(t => tinha.has(t) && !tem.has(t));
    };

    // ── Manipulação da lista de itens ────────────────────────────────────────

    const mudou = (fn: (prev: EtapaItem[]) => EtapaItem[]) => {
        setItens(fn);
        setBlocosMudados(true);
    };

    const atualizaStep = (idx: number, b: BlocoState) =>
        mudou(prev => prev.map((it, i) =>
            i !== idx || it.kind !== 'step' ? it : { ...it, ...camposDe(b) }));

    const atualizaSubStep = (idx: number, si: number, b: BlocoState) =>
        mudou(prev => prev.map((it, i) =>
            i !== idx || it.kind !== 'block' ? it
                : { ...it, steps: it.steps.map((s, y) => y !== si ? s : { ...s, ...camposDe(b) }) }));

    const atualizaTipoStep = (idx: number, tipo: string) =>
        mudou(prev => prev.map((it, i) =>
            i !== idx || it.kind !== 'step' ? it : { ...it, tipoEtapa: tipo }));

    const atualizaTipoSubStep = (idx: number, si: number, tipo: string) =>
        mudou(prev => prev.map((it, i) =>
            i !== idx || it.kind !== 'block' ? it
                : { ...it, steps: it.steps.map((s, y) => y !== si ? s : { ...s, tipoEtapa: tipo }) }));

    const atualizaReps = (idx: number, delta: number) =>
        mudou(prev => prev.map((it, i) => {
            if (i !== idx || it.kind !== 'block') return it;
            const atual = parseInt(it.repeticoes, 10) || 1;
            return { ...it, repeticoes: String(Math.min(20, Math.max(1, atual + delta))) };
        }));

    const adicionarStep = () => mudou(prev => [...prev, emptyStep()]);
    const adicionarBloco = () => mudou(prev => [...prev, emptyBlock()]);

    const adicionarSubStep = (idx: number) =>
        mudou(prev => prev.map((it, i) =>
            i !== idx || it.kind !== 'block' ? it : { ...it, steps: [...it.steps, emptySubStep()] }));

    const removerSubStep = (idx: number, si: number) =>
        mudou(prev => prev.map((it, i) =>
            i !== idx || it.kind !== 'block' ? it : { ...it, steps: it.steps.filter((_, y) => y !== si) }));

    const removerItem = (idx: number) => mudou(prev => prev.filter((_, i) => i !== idx));

    const moverItem = (idx: number, delta: number) =>
        mudou(prev => {
            const destino = idx + delta;
            if (destino < 0 || destino >= prev.length) return prev;
            const copia = [...prev];
            [copia[idx], copia[destino]] = [copia[destino], copia[idx]];
            return copia;
        });

    const montarPatch = (): TreinoPlanejadoPatch => {
        const patch: TreinoPlanejadoPatch = {};

        if (tipoTreino && tipoTreino !== treino.tipoTreino) patch.tipoTreino = tipoTreino;

        // Distância e duração são DERIVADAS das etapas, então também ficam atrás da guarda. Sem
        // isso a promessa do CA7 valeria só para `etapas`: um treino cujo total no cabeçalho não
        // bate com a soma das etapas (arredondamento, ou o campo gravado antes de as etapas
        // existirem) teria os dois campos reescritos ao mudar apenas o TSS.
        if (blocosMudados) {
            const distNum = totalKm ? parseFloat(totalKm) : NaN;
            const durMin  = totalMin ? parseInt(totalMin, 10) : NaN;

            if (!isNaN(distNum) && distNum !== treino.distanciaKm) patch.distanciaKm = distNum;

            const duracaoIso = toIso8601(String(durMin));
            if (duracaoIso && duracaoIso !== treino.duracaoMin) patch.duracaoMin = duracaoIso;
        }

        if (zonaAlvo && zonaAlvo !== treino.zonaAlvo) patch.zonaAlvo = zonaAlvo;

        const rpeNum = parseInt(rpe, 10);
        if (!isNaN(rpeNum) && rpeNum !== treino.percepcaoEsforcoEsperada) patch.percepcaoEsforcoEsperada = rpeNum;

        const tssNum = parseInt(tss, 10);
        if (!isNaN(tssNum) && tssNum !== treino.tssPlanejado) patch.tssPlanejado = tssNum;

        if (observacao !== treino.observacao) patch.observacao = observacao || undefined;

        // Etapas só entram no patch se o treinador mexeu nelas. Sem esta guarda, mudar apenas o TSS
        // regravaria a estrutura inteira — a hidratação infere blocos e a serialização os reexpande,
        // e o backend limpa e recria. O treino "não mudou" e mesmo assim foi reescrito.
        if (blocosMudados) {
            const etapasPatch = serializarItens(itens);
            if (etapasPatch.length > 0) patch.etapas = etapasPatch;
        }

        return patch;
    };

    const handleSalvar = () => {
        const patch = montarPatch();

        if (Object.keys(patch).length === 0) {
            onClose();
            return;
        }

        // Aviso, não bloqueio: o treinador decide a estrutura. O que se evita é a remoção acidental
        // durante uma edição rápida — um intervalado sem aquecimento manda o atleta direto para Z5.
        const removidas = blocosMudados ? etapasRemovidas() : [];
        if (removidas.length > 0) {
            setPendente(patch);
            setAvisoRemocao(removidas);
            return;
        }

        onSave(patch);
    };

    const confirmarRemocao = () => {
        const patch = pendente;
        setAvisoRemocao(null);
        setPendente(null);
        if (patch) onSave(patch);
    };

    const diaSemana = typeof treino.diaSemana === 'string'
        ? treino.diaSemana
        : (treino.diaSemana as { value: string }).value;

    const footerFieldSx = {
        '& .MuiOutlinedInput-root': {
            fontSize: '0.82rem',
            color: surface[100],
            bgcolor: overlayWhite[4],
            '& fieldset': { borderColor: overlayWhite[10] },
            '&:hover fieldset': { borderColor: overlayWhite[22] },
            '&.Mui-focused fieldset': { borderColor: primary[500] },
        },
        '& .MuiInputLabel-root': { fontSize: '0.72rem', color: surface[500] },
        '& .MuiInputLabel-root.Mui-focused': { color: primary[500] },
        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
            WebkitAppearance: 'none',
        },
    } as const;

    const handleClose = () => {
        if (!isSaving) onClose();
    };

    const diaChip = (
        <Box
            sx={{
                px: 0.75,
                py: 0.25,
                borderRadius: '4px',
                bgcolor: overlayWhite[7],
                fontSize: '0.62rem',
                fontWeight: 700,
                color: surface[400],
                fontFamily: 'monospace',
                letterSpacing: '0.07em',
                userSelect: 'none',
            }}
        >
            {diaSemana.slice(0, 3).toUpperCase()}
        </Box>
    );

    const tipoSelect = (
        <Select
            value={tipoTreino}
            onChange={e => setTipoTreino(e.target.value)}
            size="small"
            disabled={isSaving}
            variant="standard"
            disableUnderline
            sx={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: surface[50],
                '& .MuiSvgIcon-root': { color: surface[500], fontSize: '1.1rem' },
                '&.MuiInputBase-root': { bgcolor: 'transparent' },
            }}
            MenuProps={{ PaperProps: { sx: { bgcolor: elevation.highest, borderRadius: '10px', mt: 0.5 } } }}
        >
            {TIPOS_TREINO.map(t => (
                <MenuItem key={t.value} value={t.value} sx={{ fontSize: '0.85rem' }}>
                    {t.label}
                </MenuItem>
            ))}
        </Select>
    );

    const totalHint = (totalKm || totalMin) ? (
        <Box
            sx={{
                px: 1.5,
                py: 0.7,
                borderRadius: '6px',
                bgcolor: overlayWhite[4],
                border: `1px solid ${overlayWhite[8]}`,
                display: 'flex',
                gap: 2.5,
            }}
        >
            <Typography
                sx={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: surface[500],
                    fontFamily: 'monospace',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                }}
            >
                Total
            </Typography>
            {totalKm && (
                <Typography sx={{ fontSize: '0.68rem', color: surface[200], fontFamily: 'monospace' }}>
                    {totalKm} km
                </Typography>
            )}
            {totalMin && (
                <Typography sx={{ fontSize: '0.68rem', color: surface[200], fontFamily: 'monospace' }}>
                    {totalMin} min
                </Typography>
            )}
        </Box>
    ) : null;

    return (
        <CoachDialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            disableClose={isSaving}
            chip={diaChip}
            title="Editar treino"
            headerAction={tipoSelect}
            contentSx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}
            actionsHint={totalHint}
            actions={
                <>
                    <Button
                        variant="text"
                        onClick={onClose}
                        disabled={isSaving}
                        sx={{ ...GHOST_BTN_SX, fontSize: '0.8rem' }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSalvar}
                        disabled={isSaving}
                        aria-label="Salvar"
                        sx={{
                            ...PRIMARY_BTN_SX,
                            fontSize: '0.8rem',
                            px: 2.5,
                            '&.Mui-disabled': { bgcolor: surface[700], color: surface[500] },
                        }}
                    >
                        {isSaving ? <CircularProgress size={14} sx={{ color: surface[900] }} /> : 'Salvar'}
                    </Button>
                </>
            }
        >

                <WorkoutTimelineChart blocks={liveBlocks} />

                {/* ── Lista de etapas: avulsas e blocos repetidos ── */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {itens.length === 0 && (
                        <Box sx={{ py: 2, textAlign: 'center', color: surface[500], fontSize: '0.8rem' }}>
                            Nenhuma etapa. Use os botões abaixo para montar o treino.
                        </Box>
                    )}

                    {itens.map((item, idx) => item.kind === 'step' ? (
                        <BlocoCard
                            key={item.id}
                            label={item.tipoEtapa || 'Etapa'}
                            accent={accentDe(item.tipoEtapa)}
                            bloco={blocoStateDe(item)}
                            onChange={b => atualizaStep(idx, b)}
                            disabled={isSaving}
                            tipoEtapa={item.tipoEtapa}
                            onTipoChange={t => atualizaTipoStep(idx, t)}
                            tipoAriaLabel={`Tipo da etapa ${idx + 1}`}
                            actions={
                                <ItemActions
                                    idx={idx}
                                    total={itens.length}
                                    disabled={isSaving}
                                    onMover={moverItem}
                                    onRemover={removerItem}
                                />
                            }
                        />
                    ) : (
                        <Box
                            key={item.id}
                            sx={{
                                border: `1px solid ${overlayWhite[7]}`,
                                borderRadius: '8px',
                                p: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.75,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5 }}>
                                <Box sx={{ fontSize: '0.7rem', letterSpacing: '0.08em', color: surface[400] }}>
                                    SÉRIE
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                                    <IconButton
                                        size="small"
                                        aria-label={`Diminuir repetições da série ${idx + 1}`}
                                        disabled={isSaving || (parseInt(item.repeticoes, 10) || 1) <= 1}
                                        onClick={() => atualizaReps(idx, -1)}
                                    >
                                        <RemoveIcon sx={{ fontSize: 15 }} />
                                    </IconButton>
                                    <Box
                                        data-testid={`repeticoes-display-${idx}`}
                                        sx={{ minWidth: 28, textAlign: 'center', fontWeight: 700, color: primary[400] }}
                                    >
                                        {item.repeticoes}×
                                    </Box>
                                    <IconButton
                                        size="small"
                                        aria-label={`Aumentar repetições da série ${idx + 1}`}
                                        disabled={isSaving || (parseInt(item.repeticoes, 10) || 1) >= 20}
                                        onClick={() => atualizaReps(idx, 1)}
                                    >
                                        <AddIcon sx={{ fontSize: 15 }} />
                                    </IconButton>
                                    <ItemActions
                                        idx={idx}
                                        total={itens.length}
                                        disabled={isSaving}
                                        onMover={moverItem}
                                        onRemover={removerItem}
                                        nome="série"
                                    />
                                </Box>
                            </Box>

                            {item.steps.map((sub, si) => (
                                <BlocoCard
                                    key={sub.id}
                                    label={sub.tipoEtapa || 'Etapa'}
                                    accent={accentDe(sub.tipoEtapa)}
                                    bloco={blocoStateDe(sub)}
                                    onChange={b => atualizaSubStep(idx, si, b)}
                                    disabled={isSaving}
                                    tipoEtapa={sub.tipoEtapa}
                                    onTipoChange={t => atualizaTipoSubStep(idx, si, t)}
                                    tipoAriaLabel={`Tipo da etapa ${si + 1} da série ${idx + 1}`}
                                    actions={
                                        <IconButton
                                            size="small"
                                            aria-label={`Remover etapa ${si + 1} da série ${idx + 1}`}
                                            disabled={isSaving || item.steps.length <= 1}
                                            onClick={() => removerSubStep(idx, si)}
                                        >
                                            <RemoveIcon sx={{ fontSize: 15 }} />
                                        </IconButton>
                                    }
                                />
                            ))}

                            <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => adicionarSubStep(idx)}
                                disabled={isSaving}
                                sx={{ ...GHOST_BTN_SX, alignSelf: 'flex-start' }}
                            >
                                Etapa na série
                            </Button>
                        </Box>
                    ))}

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={adicionarStep}
                            disabled={isSaving}
                            sx={GHOST_BTN_SX}
                        >
                            Etapa
                        </Button>
                        <Button
                            size="small"
                            startIcon={<RepeatIcon />}
                            onClick={adicionarBloco}
                            disabled={isSaving}
                            sx={GHOST_BTN_SX}
                        >
                            Série
                        </Button>
                    </Box>
                </Box>

                {avisoRemocao && (
                    <Box
                        // role="alert" e não "alertdialog": é uma faixa inline, sem captura de
                        // foco nem Escape. Prometer modalidade que não existe confunde o leitor de
                        // tela mais do que ajuda.
                        role="alert"
                        aria-label="Confirmar remoção de etapa"
                        sx={{
                            border: `1px solid ${alpha(primary[500], 0.4)}`,
                            borderRadius: '8px',
                            p: 1.5,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                        }}
                    >
                        <Box sx={{ fontSize: '0.82rem', color: surface[200] }}>
                            {avisoRemocao.length === 1
                                ? `Este treino ficará sem ${avisoRemocao[0].toLowerCase()}.`
                                : 'Este treino ficará sem aquecimento e sem desaquecimento.'}
                            {' '}Confirmar mesmo assim?
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button size="small" sx={GHOST_BTN_SX}
                                onClick={() => { setAvisoRemocao(null); setPendente(null); }}>
                                Voltar
                            </Button>
                            <Button size="small" sx={PRIMARY_BTN_SX} onClick={confirmarRemocao}>
                                Salvar assim
                            </Button>
                        </Box>
                    </Box>
                )}

                {/* ── Campos globais ── */}
                <Box
                    sx={{
                        pt: 1.5,
                        mt: 0.5,
                        borderTop: `1px solid ${overlayWhite[7]}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.25,
                    }}
                >
                    <Box sx={{ display: 'flex', gap: 1.25 }}>
                        <TextField
                            label="Zona alvo"
                            value={zonaAlvo}
                            onChange={e => setZonaAlvo(e.target.value)}
                            disabled={isSaving}
                            size="small"
                            fullWidth
                            sx={footerFieldSx}
                        />
                        <TextField
                            label="RPE (1–10)"
                            type="number"
                            value={rpe}
                            onChange={e => setRpe(e.target.value)}
                            disabled={isSaving}
                            size="small"
                            fullWidth
                            inputProps={{ min: 1, max: 10, step: 1 }}
                            sx={footerFieldSx}
                        />
                    </Box>
                    <TextField
                        label="TSS planejado (opcional)"
                        placeholder="Calculado automaticamente"
                        type="number"
                        value={tss}
                        onChange={e => setTss(e.target.value)}
                        disabled={isSaving}
                        size="small"
                        fullWidth
                        inputProps={{ min: 1, max: 500, step: 1 }}
                        sx={footerFieldSx}
                    />
                    <TextField
                        label="Observação"
                        value={observacao}
                        onChange={e => setObservacao(e.target.value)}
                        disabled={isSaving}
                        multiline
                        rows={2}
                        fullWidth
                        inputProps={{ maxLength: 500 }}
                        sx={footerFieldSx}
                    />
                </Box>
        </CoachDialog>
    );
}
