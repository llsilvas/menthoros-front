import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import { primary, surface, semantic } from '../../../theme/tokens';
import { activeTheme } from '../../../theme/activeTheme';
import { useTreinoPlanejado } from '../../../hooks/useTreinoPlanejado';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { GHOST_BTN_SX, PRIMARY_BTN_SX } from '../../../shared/components/actionButtonSx';
import type { TreinoPlanejadoDto, TreinoPlanejadoAddPayload } from '../../../types/PlanoReview';
import { serializarItens, totaisDeItens, type EtapaItem } from './etapas/etapaItem';
import { EtapasEditor } from './etapas/EtapasEditor';
import { detalheDaZonaPredominante, minutosNaZonaAlvo, zonaPredominante } from '../adapters/zonaPredominante';
import { useAthleteTrainingZones } from '../../../hooks/useAthleteTrainingZones';
import { AthleteZonesTable } from './AthleteZonesTable';
import { EYEBROW_SX, fieldSx } from './etapas/etapasStyles';
import { TIPOS_TREINO } from './tiposTreino';
import { WorkoutProfile, selectWorkoutProfile, fromEtapaItens } from '../../workout/profile';

/*
  Adicionar treino usa o MESMO editor de etapas do Editar treino (`EtapasEditor`) e mostra o mesmo
  gráfico de perfil (improve-plan-edit-usability, Fase 3). Antes eram duas interfaces para o mesmo
  payload — "Bloco repetido" / "passo" / colunas MIN·KM·ZONA aqui, "Série" / "etapa" / cartões lá —
  e só a de edição desenhava o treino que o coach estava montando.
*/

const DIAS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function gerarDatas(semanaInicio: string, semanaFim: string): string[] {
    const datas: string[] = [];
    const inicio = new Date(`${semanaInicio}T00:00:00`);
    const fim    = new Date(`${semanaFim}T00:00:00`);
    for (const d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1))
        datas.push(d.toISOString().slice(0, 10));
    return datas;
}

function formatarDataLabel(iso: string): string {
    const d = new Date(`${iso}T00:00:00`);
    return `${DIAS_PT[d.getDay()]} ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface TreinoAddDialogProps {
    open: boolean;
    planoId: string;
    semanaInicio: string;
    semanaFim: string;
    treinosExistentes: TreinoPlanejadoDto[];
    /** Quem é o atleta, para o cabeçalho ("Bruno Dias"): sem isso o diálogo não dizia para quem. */
    contexto?: string;
    /**
     * Data ISO pré-preenchida ao abrir (show-descanso-no-plano, CA3): o treinador entrou por um dia
     * específico — hoje só o chip de descanso faz isso. Continua editável (CA3d): o efeito segue a
     * data salva, não a de origem.
     */
    dataInicial?: string;
    /** Atleta do plano: habilita o seletor de zona por etapa. */
    atletaId?: string;
    onClose: () => void;
    onSaved: (treino: TreinoPlanejadoDto) => void;
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const FIELD_SX = fieldSx(primary[500]);

// ── Dialog ────────────────────────────────────────────────────────────────────

export function TreinoAddDialog({
    open, planoId, semanaInicio, semanaFim, treinosExistentes, contexto, dataInicial, atletaId, onClose, onSaved,
}: TreinoAddDialogProps) {
    const { zones, loading: zonesLoading, error: zonesError } = useAthleteTrainingZones(atletaId);
    const [tipoTreino,  setTipoTreino]  = useState('');
    const [dataTreino,  setDataTreino]  = useState(dataInicial ?? '');
    const [observacoes, setObservacoes] = useState('');
    const [tss,         setTss]         = useState('');
    // Totais e zona/RPE do treino inteiro. Distância e duração só valem sem etapas — com etapas, vêm
    // da soma delas (e o campo some, para não haver dois números disputando).
    const [distancia,   setDistancia]   = useState('');
    const [duracao,     setDuracao]     = useState('');
    const [rpe,         setRpe]         = useState('');
    const [itens,       setItens]       = useState<EtapaItem[]>([]);
    const [apiError,    setApiError]    = useState<string | null>(null);
    const [confirmarDescarte, setConfirmarDescarte] = useState(false);

    const { isSaving, adicionarTreino } = useTreinoPlanejado();
    const datas = useMemo(() => gerarDatas(semanaInicio, semanaFim), [semanaInicio, semanaFim]);
    const treinosNaData = useMemo(
        () => (dataTreino ? treinosExistentes.filter(t => t.dataTreino === dataTreino) : []),
        [dataTreino, treinosExistentes]
    );

    const faltando = [
        ...(tipoTreino.trim() ? [] : ['o tipo de treino']),
        ...(dataTreino ? [] : ['o dia']),
    ];
    const canSave = faltando.length === 0;

    const etapasValidas = useMemo(() => serializarItens(itens), [itens]);
    const temEtapas = etapasValidas.length > 0;
    const totais = useMemo(() => {
        const t = totaisDeItens(itens);
        return { min: t.min, km: Math.round(t.km * 100) / 100 };
    }, [itens]);

    // O gráfico desenha o que o coach está montando (estado vivo, não o salvo) — mesmo critério do
    // editor de treino.
    const profile = useMemo(
        () => selectWorkoutProfile(fromEtapaItens(itens, zones), {
            sport: 'run',
            tss: tss ? parseInt(tss, 10) || null : null,
        }),
        [itens, tss, zones],
    );
    const predominante = useMemo(() => zonaPredominante(profile.blocks), [profile]);

    const temAlteracoes =
        tipoTreino !== '' || dataTreino !== (dataInicial ?? '') || observacoes !== '' || tss !== ''
        || distancia !== '' || duracao !== '' || rpe !== '' || itens.length > 0;

    // CA3c: aplicar a data a CADA abertura. O dialog fica montado entre aberturas e o `resetForm`
    // limpa o campo ao fechar — só inicializar o useState daria a data da 1ª abertura para sempre.
    useEffect(() => {
        if (open) setDataTreino(dataInicial ?? '');
    }, [open, dataInicial]);

    const resetForm = () => {
        setTipoTreino(''); setDataTreino(''); setObservacoes(''); setTss('');
        setDistancia(''); setDuracao(''); setRpe('');
        setItens([]); setApiError(null); setConfirmarDescarte(false);
    };

    const fechar = () => { resetForm(); onClose(); };

    // Fechar com alteração pendente pede confirmação (mesmo critério do Editar treino).
    const handleClose = () => {
        if (isSaving) return;
        if (temAlteracoes) { setConfirmarDescarte(true); return; }
        fechar();
    };

    const handleSalvar = async () => {
        if (!canSave) return;
        setApiError(null);
        const payload: TreinoPlanejadoAddPayload = { tipoTreino, dataTreino };

        if (temEtapas) {
            if (totais.min > 0) payload.duracaoMin  = totais.min;
            if (totais.km  > 0) payload.distanciaKm = totais.km;
            payload.etapas = etapasValidas;
        } else {
            if (duracao)   { const v = parseInt(duracao, 10);    if (!isNaN(v)) payload.duracaoMin  = v; }
            if (distancia) { const v = parseFloat(distancia);    if (!isNaN(v)) payload.distanciaKm = v; }
        }
        // A zona do treino é derivada das etapas, não digitada: sem zona derivável o campo fica de fora.
        // O esforço é do treino e vale com ou sem etapas — antes sumia do payload assim que a primeira
        // etapa era criada, mesmo preenchido.
        if (predominante) payload.zonaAlvo = predominante.zona;
        if (rpe)  { const v = parseInt(rpe, 10); if (!isNaN(v)) payload.percepcaoEsforcoEsperada = v; }

        if (observacoes) payload.observacoes  = observacoes;
        if (tss)         { const v = parseInt(tss, 10); if (!isNaN(v)) payload.tssPlanejado = v; }

        try {
            const novo = await adicionarTreino(planoId, payload);
            resetForm(); onSaved(novo);
        } catch (err) {
            setApiError(err instanceof Error ? err.message : 'Erro ao adicionar treino');
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    const contextoChip = (
        <Box sx={{
            px: 0.75, py: 0.25, borderRadius: '4px', bgcolor: `${surface[0]}12`, fontSize: '0.72rem',
            fontWeight: 700, color: surface[300], letterSpacing: '0.04em', userSelect: 'none', width: 'fit-content',
        }}>
            {contexto ?? 'Novo treino'}
        </Box>
    );

    const resumoRodape = canSave ? (
        temEtapas && (totais.min > 0 || totais.km > 0) ? (
            <Box data-testid="totais-treino" sx={{ display: 'flex', gap: 2, fontSize: '0.78rem', color: surface[200], fontFamily: activeTheme.font.mono }}>
                <Box component="span" sx={EYEBROW_SX}>Total</Box>
                {totais.km > 0 && <span>{totais.km} km</span>}
                {totais.min > 0 && <span>{totais.min} min</span>}
                {predominante && (
                    <span data-testid="total-na-zona-alvo">{minutosNaZonaAlvo(predominante)} min {predominante.zona}</span>
                )}
            </Box>
        ) : null
    ) : (
        <Typography data-testid="falta-para-salvar" sx={{ fontSize: '0.78rem', color: surface[400] }}>
            Falta escolher {faltando.join(' e ')}.
        </Typography>
    );

    return (
        <CoachDialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            disableClose={isSaving}
            chip={contextoChip}
            title="Adicionar treino"
            contentSx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 1.75 }}
            actionsHint={resumoRodape}
            actions={
                <>
                    <Button variant="text" onClick={handleClose} disabled={isSaving}
                        sx={{ ...GHOST_BTN_SX, fontSize: '0.8rem' }}>
                        Cancelar
                    </Button>
                    <Button variant="contained" onClick={handleSalvar}
                        disabled={!canSave || isSaving}
                        aria-label="Salvar treino"
                        sx={{
                            ...PRIMARY_BTN_SX,
                            fontSize: '0.8rem', px: 2.5,
                            '&.Mui-disabled': { bgcolor: surface[800], color: surface[600] },
                        }}>
                        {isSaving ? <CircularProgress size={14} sx={{ color: surface[900] }} /> : 'Salvar'}
                    </Button>
                </>
            }
        >
            {/* Modal próprio, não aviso inline: o clique vem do rodapé e o aviso no topo do conteúdo
                ficava fora da tela; e o botão destrutivo não pode ter a cor de Salvar. */}
            <ConfirmDialog
                open={confirmarDescarte}
                title="Descartar alterações?"
                message="As mudanças neste treino não foram salvas e serão perdidas."
                confirmLabel="Descartar"
                cancelLabel="Voltar a editar"
                severity="danger"
                onClose={() => setConfirmarDescarte(false)}
                onConfirm={fechar}
            />

            {/* ── Tipo + Data ─────────────────────────────────────────── */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
                <FormControl fullWidth size="small" sx={FIELD_SX}>
                    <InputLabel htmlFor="tipo-treino-input" shrink>Tipo de treino</InputLabel>
                    <Select native label="Tipo de treino" value={tipoTreino}
                        onChange={e => setTipoTreino(e.target.value as string)} disabled={isSaving}
                        inputProps={{ id: 'tipo-treino-input', 'aria-label': 'Tipo de treino' }}>
                        <option value="" disabled>Escolha o tipo…</option>
                        {TIPOS_TREINO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </Select>
                </FormControl>
                <FormControl fullWidth size="small" sx={FIELD_SX}>
                    <InputLabel htmlFor="data-treino-input" shrink>Data do treino</InputLabel>
                    <Select native label="Data do treino" value={dataTreino}
                        onChange={e => setDataTreino(e.target.value as string)} disabled={isSaving}
                        inputProps={{ id: 'data-treino-input', 'aria-label': 'Data do treino' }}>
                        <option value="" disabled>Escolha o dia…</option>
                        {datas.map(d => <option key={d} value={d}>{formatarDataLabel(d)}</option>)}
                    </Select>
                </FormControl>
            </Box>

            {/* ── Aviso double-day ────────────────────────────────────── */}
            {treinosNaData.length > 0 && (
                <Alert severity="warning" variant="outlined" sx={{
                    fontSize: '0.78rem', py: 0.5,
                    borderColor: `${semantic.warning[500]}40`, bgcolor: `${semantic.warning[500]}08`,
                    color: semantic.warning[400],
                    '& .MuiAlert-icon':    { color: semantic.warning[400], fontSize: '1rem' },
                    '& .MuiAlert-message': { fontSize: '0.78rem' },
                }}>
                    {treinosNaData.length} treino(s) já nesta data — double-day permitido, confirme.
                </Alert>
            )}

            {/* ── Zonas do atleta ─────────────────────────────────────── */}
            {(zonesLoading || zonesError || zones) && (
                <AthleteZonesTable zones={zones} loading={zonesLoading} error={zonesError} nomeAtleta={contexto} />
            )}

            {/* ── Etapas (opcional) ───────────────────────────────────── */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography sx={EYEBROW_SX}>Etapas do treino (opcional)</Typography>
                <Typography sx={{ fontSize: '0.78rem', color: surface[400], mt: -0.5 }}>
                    Monte por etapas para ver o gráfico e somar distância e duração sozinho. Sem etapas, informe os totais abaixo.
                </Typography>

                {temEtapas && <WorkoutProfile profile={profile} />}

                <EtapasEditor
                    itens={itens}
                    onChange={fn => setItens(fn)}
                    disabled={isSaving}
                    vazio="Nenhuma etapa ainda."
                    zones={zones}
                    tipoTreino={tipoTreino}
                />
            </Box>

            {/* ── Treino inteiro ──────────────────────────────────────── */}
            <Box sx={{ pt: 1.5, borderTop: `1px solid ${surface[0]}12`, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Typography sx={EYEBROW_SX}>Treino inteiro</Typography>

                {!temEtapas && (
                    <Box sx={{ display: 'flex', gap: 1.25 }}>
                        <TextField label="Distância (km)" type="number" value={distancia}
                            onChange={e => setDistancia(e.target.value)} disabled={isSaving}
                            size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }}
                            placeholder="0.0" inputProps={{ min: 0, step: 0.1 }} sx={FIELD_SX} />
                        <TextField label="Duração (min)" type="number" value={duracao}
                            onChange={e => setDuracao(e.target.value)} disabled={isSaving}
                            size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }}
                            placeholder="0" inputProps={{ min: 1, step: 1 }} sx={FIELD_SX} />
                    </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1.25 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: surface[400] }}>Zona predominante</Typography>
                        <Typography data-testid="zona-predominante" sx={{ fontFamily: activeTheme.font.mono, fontWeight: 600, color: surface[50] }}>
                            {predominante?.zona ?? '—'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.6875rem', color: surface[400] }}>
                            {predominante
                                ? `Derivada das etapas (${detalheDaZonaPredominante(predominante)}) — resumo mostrado no card do plano`
                                : 'Escolha a zona das etapas para derivar a zona predominante'}
                        </Typography>
                    </Box>
                    <TextField label="Esforço esperado (RPE 1–10)" type="number" value={rpe}
                        onChange={e => setRpe(e.target.value)} disabled={isSaving}
                        size="small" slotProps={{ inputLabel: { shrink: true } }}
                        placeholder="1–10" inputProps={{ min: 1, max: 10, step: 1 }}
                        // largura fixa: com fullWidth o campo tomava a linha inteira e esmagava a zona predominante
                        sx={{ ...FIELD_SX, flex: '0 0 200px' }} />
                </Box>

                <TextField label="TSS planejado (opcional)" type="number" value={tss}
                    onChange={e => setTss(e.target.value)}
                    disabled={isSaving} size="small" fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    placeholder="calculado automaticamente se omitido"
                    inputProps={{ min: 1, step: 1 }} sx={FIELD_SX} />

                <TextField label="Observação (nota do treinador)" value={observacoes}
                    onChange={e => setObservacoes(e.target.value)} disabled={isSaving}
                    multiline rows={2} fullWidth slotProps={{ inputLabel: { shrink: true } }}
                    placeholder="Notas para o atleta…" inputProps={{ maxLength: 500 }} sx={FIELD_SX} />
            </Box>

            {/* ── Erro ─────────────────────────────────────────────────── */}
            {apiError && (
                <Alert severity="error" sx={{
                    fontSize: '0.78rem', py: 0.5,
                    bgcolor: `${semantic.danger[500]}10`, borderColor: `${semantic.danger[500]}40`,
                    color: semantic.danger[300],
                    '& .MuiAlert-icon': { color: semantic.danger[300], fontSize: '1rem' },
                }}>
                    {apiError}
                </Alert>
            )}
        </CoachDialog>
    );
}
