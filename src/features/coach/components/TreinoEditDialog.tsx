import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    MenuItem,
    Select,
    TextField,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TIPOS_TREINO } from './tiposTreino';
import { primary, surface } from '../../../theme/tokens';
import { overlayWhite } from '../../../theme/overlays';
import { elevation } from '../../../shared/design-tokens';
import { GHOST_BTN_SX, PRIMARY_BTN_SX } from '../../../shared/components/actionButtonSx';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import type { TreinoPlanejadoDto, TreinoPlanejadoPatch } from '../../../types/PlanoReview';
import {
    itensFromEtapas,
    serializarItens,
    totaisDeItens,
    type EtapaItem,
} from './etapas/etapaItem';
import { EtapasEditor } from './etapas/EtapasEditor';
import { WorkoutProfile, selectWorkoutProfile, fromEtapaItens } from '../../workout/profile';

// ── Helpers ──────────────────────────────────────────────────────────────────


function toIso8601(minutos: string): string | undefined {
    const n = parseInt(minutos, 10);
    return isNaN(n) || n <= 0 ? undefined : `PT${n}M`;
}

// ── Constantes ────────────────────────────────────────────────────────────────

/** Altura em que o gráfico de perfil passa a nascer recolhido: em 1024×640 ele tomava 55% do dialog. */
const TELA_BAIXA_QUERY = '(max-height: 700px)';

// A inferência de zona vivia aqui, numa segunda derivação independente da do
// detalhe do treino — o mesmo treino podia sair com zonas diferentes em cada
// tela. Agora existe uma só, em `selectWorkoutProfile`.


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

// ── TreinoEditDialog ──────────────────────────────────────────────────────────

export interface TreinoEditDialogProps {
    open: boolean;
    treino: TreinoPlanejadoDto;
    isSaving: boolean;
    /** Contexto no cabeçalho ("Bruno Dias · Ter 20/10"): dois treinos abertos em sequência eram idênticos. */
    contexto?: string;
    onClose: () => void;
    onSave: (patch: TreinoPlanejadoPatch) => void;
}

export function TreinoEditDialog({ open, treino, isSaving, contexto, onClose, onSave }: TreinoEditDialogProps) {
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
    // Esc, X ou Cancelar com alteração pendente: pedir confirmação em vez de descartar em silêncio.
    const [confirmarDescarte, setConfirmarDescarte] = useState(false);
    // O gráfico nasce recolhido em altura baixa; o treinador abre quando quiser.
    const telaBaixa = useMediaQuery(TELA_BAIXA_QUERY);
    const [graficoAberto, setGraficoAberto]   = useState(!telaBaixa);

    useEffect(() => {
        setItens(itensIniciais(treino));
        setTipoTreino(treino.tipoTreino ?? '');
        setZonaAlvo(treino.zonaAlvo ?? '');
        setRpe(treino.percepcaoEsforcoEsperada != null ? String(treino.percepcaoEsforcoEsperada) : '');
        setTss(treino.tssPlanejado != null ? String(treino.tssPlanejado) : '');
        setObservacao(treino.observacao ?? '');
        setBlocosMudados(false);
        setConfirmarDescarte(false);
    }, [treino]);

    useEffect(() => { setGraficoAberto(!telaBaixa); }, [telaBaixa]);


    // Totais em tempo real: soma o treino inteiro já expandido (mesma conta do Adicionar treino)
    const { totalKm, totalMin } = useMemo(() => {
        const { km, min } = totaisDeItens(itens);
        return {
            totalKm:  km  > 0 ? km.toFixed(1) : null,
            totalMin: min > 0 ? String(min)   : null,
        };
    }, [itens]);

    /** Bloco destacado no gráfico — segue o campo em foco, ou o hover no próprio plot. */
    const [blocoDestacado, setBlocoDestacado] = useState<string | null>(null);

    // Perfil derivado do estado ao vivo: o gráfico atualiza a cada edição, e é
    // por isso que adapta de `EtapaItem[]` e não do DTO salvo — do DTO ele
    // desenharia o treino gravado, não o que o treinador está montando.
    const profile = useMemo(
        () => selectWorkoutProfile(fromEtapaItens(itens), {
            // TODO(DEP-3): o esporte não existe no contrato — nem `TreinoPlanejado`
            // nem `TreinoPlanejadoDto` carregam modalidade. Enquanto isso, todo
            // treino é normalizado na escala de corrida, inclusive bike e natação.
            sport: 'run',
            tss: treino.tssPlanejado ?? null,
            zonaAlvoTreino: treino.zonaAlvo ?? null,
        }),
        [itens, treino.tssPlanejado, treino.zonaAlvo],
    );

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

    const temAlteracoes = () => Object.keys(montarPatch()).length > 0;

    // Fechar (Esc, X, Cancelar) com alteração pendente pede confirmação: dez minutos montando uma
    // série não podem sumir num Esc. Sem alteração, fecha direto.
    const handleClose = () => {
        if (isSaving) return;
        if (temAlteracoes()) {
            setConfirmarDescarte(true);
            return;
        }
        onClose();
    };

    // TSS não é recalculado pelo sistema ao salvar etapas editadas: avisar em vez de fingir.
    const tssDesatualizado = blocosMudados && tss !== '' && tss === String(treino.tssPlanejado ?? '');

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
            {contexto ?? diaSemana.slice(0, 3).toUpperCase()}
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
            subtitle={treino.justificativaIa?.trim() || undefined}
            headerAction={tipoSelect}
            contentSx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}
            actionsHint={totalHint}
            actions={
                <>
                    <Button
                        variant="text"
                        onClick={handleClose}
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

                {confirmarDescarte && (
                    <Box
                        role="alert"
                        aria-label="Confirmar descarte das alterações"
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
                            Há alterações não salvas neste treino. Descartar?
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button size="small" sx={GHOST_BTN_SX} onClick={() => setConfirmarDescarte(false)}>
                                Continuar editando
                            </Button>
                            <Button size="small" sx={PRIMARY_BTN_SX} onClick={onClose}>
                                Descartar
                            </Button>
                        </Box>
                    </Box>
                )}

                {/* O bloco destacado segue a linha em edição — ganho direto do
                    modelo de lista: o treinador vê no gráfico o que está mexendo. */}
                {graficoAberto ? (
                    <WorkoutProfile
                        profile={profile}
                        activeBlockId={blocoDestacado}
                        onActiveBlockChange={setBlocoDestacado}
                    />
                ) : null}
                <Button
                    size="small"
                    onClick={() => setGraficoAberto(v => !v)}
                    startIcon={graficoAberto ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    aria-expanded={graficoAberto}
                    sx={{ ...GHOST_BTN_SX, alignSelf: 'flex-start', mt: -1 }}
                >
                    {graficoAberto ? 'Ocultar gráfico' : 'Mostrar gráfico do treino'}
                </Button>

                {/* ── Lista de etapas: avulsas e séries repetidas (editor compartilhado com o Adicionar) ── */}
                <EtapasEditor itens={itens} onChange={mudou} disabled={isSaving} />

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
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: surface[400], letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Treino inteiro
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.25 }}>
                        <TextField
                            label="Zona predominante"
                            // Havia "Zona alvo" por etapa E aqui, com o mesmo nome e semântica diferente.
                            helperText="Resumo mostrado no card do plano; a zona de cada etapa fica acima"
                            value={zonaAlvo}
                            onChange={e => setZonaAlvo(e.target.value)}
                            disabled={isSaving}
                            size="small"
                            fullWidth
                            sx={footerFieldSx}
                        />
                        <TextField
                            label="Esforço esperado (RPE 1–10)"
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
                        helperText={tssDesatualizado ? 'As etapas mudaram e o TSS não é recalculado ao salvar — confira ou apague para estimar depois.' : undefined}
                        sx={footerFieldSx}
                    />
                    <TextField
                        label="Observação (nota do treinador)"
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
