import { useState } from 'react';
import {
    Box,
    Button,
    FormControl,
    IconButton,
    InputLabel,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import RepeatIcon from '@mui/icons-material/Repeat';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { backgrounds, content, primary, surface } from '../../../../theme/tokens';
import { activeTheme } from '../../../../theme/activeTheme';
import { Card } from '../../../../shared/components/Card';
import { GHOST_BTN_SX } from '../../../../shared/components/actionButtonSx';
import { TIPOS_ETAPA, TIPO_ETAPA_LABEL, tipoEtapaLabel } from '../tiposTreino';
import { EYEBROW_SX, fieldSx } from './etapasStyles';
import { emptyBlock, emptyStep, emptySubStep, type EtapaItem } from './etapaItem';
import { ZoneSelector } from './ZoneSelector';
import { StepSummaryRow } from './StepSummaryRow';
import { zonaDaEtapa, type IntensidadeEtapa } from '../../adapters/zoneSelectorLogic';
import type { AlvoPrimario, AthleteTrainingZonesDto } from '../../../../types/AthleteTrainingZones';
import type { ZoneKey } from '../../../workout/profile/types';

/**
 * Editor de etapas — a lista de etapas avulsas e séries repetidas de um treino.
 *
 * Extraído de `TreinoEditDialog` para que `TreinoAddDialog` use o mesmo editor
 * (improve-plan-edit-usability, Fase 3). Antes eram dois: o de edição com cartões, "Série" e
 * rótulos flutuantes; o de adição com colunas MIN·KM·ZONA, "Bloco repetido" e "passo". O treinador
 * aprendia duas interfaces para o mesmo payload, e só uma delas mostrava o gráfico do treino.
 *
 * O componente é controlado: recebe `itens` e devolve cada mudança como função `prev → next`, para
 * que o dono do estado decida o que fazer (marcar "etapas mudaram", recalcular totais).
 */

const ACCENT = activeTheme.trainingStage;
const MONO = activeTheme.font.mono;

function accentDe(tipoEtapa: string): string {
    switch (tipoEtapa?.toUpperCase()) {
        case 'AQUECIMENTO':    return ACCENT.aquecimento;
        case 'DESAQUECIMENTO': return ACCENT.desaquecimento;
        case 'RECUPERACAO':    return ACCENT.recuperacao;
        case 'INTERVALADO':    return ACCENT.esforco;
        default:               return ACCENT.principal;
    }
}

// ── Estado de uma etapa ───────────────────────────────────────────────────────

/**
 * Campos editáveis de uma etapa. Sem RPE: o esforço esperado é do treino, e fica nos campos
 * globais. Ritmo e descrição são o que o atleta lê na etapa ("4:10/km", "800m forte").
 */
interface BlocoState {
    distanciaKm: string;
    duracaoMin: string;
    intensidade: IntensidadeEtapa;
    descricao: string;
}

type CamposEtapa = {
    duracaoMin: string;
    distanciaKm: string;
    fcAlvoEtapa: string;
    ritmoAlvo?: string;
    descricaoEtapa?: string;
    alvoPrimario?: AlvoPrimario;
    zonaEtapa?: ZoneKey | 'PERSONALIZADO';
};

function blocoStateDe(e: CamposEtapa, zones: AthleteTrainingZonesDto | null): BlocoState {
    return {
        distanciaKm: e.distanciaKm,
        duracaoMin: e.duracaoMin,
        intensidade: {
            // Etapa vinda do backend não traz a zona: reconhece pelos valores contra as zonas do atleta.
            zona: e.zonaEtapa ?? zonaDaEtapa(e.fcAlvoEtapa, e.ritmoAlvo, zones),
            fcAlvoEtapa: e.fcAlvoEtapa,
            ritmoAlvo: e.ritmoAlvo ?? '',
            alvoPrimario: e.alvoPrimario,
        },
        descricao: e.descricaoEtapa ?? '',
    };
}

function camposDe(b: BlocoState): CamposEtapa {
    return {
        duracaoMin: b.duracaoMin,
        distanciaKm: b.distanciaKm,
        fcAlvoEtapa: b.intensidade.fcAlvoEtapa,
        // Vazio vira `undefined` para o serializador omitir o campo.
        ritmoAlvo: b.intensidade.ritmoAlvo.trim() || undefined,
        descricaoEtapa: b.descricao.trim() || undefined,
        alvoPrimario: b.intensidade.alvoPrimario,
        zonaEtapa: b.intensidade.zona ?? undefined,
    };
}

// ── Ações de um item (mover / remover) ────────────────────────────────────────

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
                <ArrowUpwardIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton size="small" aria-label={`Mover ${nome} ${idx + 1} para baixo`}
                disabled={disabled || idx === total - 1} onClick={() => onMover(idx, 1)}>
                <ArrowDownwardIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton size="small" aria-label={`Remover ${nome} ${idx + 1}`}
                disabled={disabled} onClick={() => onRemover(idx)}>
                <DeleteOutlineIcon sx={{ fontSize: 17 }} />
            </IconButton>
        </Box>
    );
}

// ── Cartão de uma etapa ───────────────────────────────────────────────────────

interface BlocoCardProps {
    accent: string;
    bloco: BlocoState;
    onChange: (b: BlocoState) => void;
    disabled?: boolean;
    actions?: React.ReactNode;
    tipoEtapa?: string;
    onTipoChange?: (tipo: string) => void;
    tipoAriaLabel?: string;
    /** Etapa dentro de uma série: fundo mais recuado, para não competir com o card da série. */
    aninhado?: boolean;
    zones: AthleteTrainingZonesDto | null;
    tipoTreino?: string;
    /** Só a etapa em foco mostra o seletor de intensidade inteiro; as demais viram uma linha-resumo. */
    focada: boolean;
    onFocar: () => void;
    idBase: string;
}

/**
 * Uma etapa, no mesmo desenho do `TreinoCard` dos Planos: `Card` flat, quadradinho na cor do tipo,
 * métricas em colunas. Distância, duração e zona ficam à vista; ritmo e descrição — o que o atleta
 * lê na etapa — ficam em "Mais detalhes", abertos sozinhos quando já têm valor.
 */
function BlocoCard({
    accent, bloco, onChange, disabled, actions, tipoEtapa, onTipoChange, tipoAriaLabel, aninhado,
    zones, tipoTreino, focada, onFocar, idBase,
}: BlocoCardProps) {
    const sx = fieldSx(accent);
    const semTipo = onTipoChange != null && !tipoEtapa;
    const temDetalhes = Boolean(bloco.descricao);
    const [detalhesAbertos, setDetalhesAbertos] = useState(false);
    const mostraDetalhes = detalhesAbertos || temDetalhes;
    return (
        <Card
            variant="flat"
            sx={{ p: 0, overflow: 'hidden', minWidth: 0, ...(aninhado ? { backgroundColor: backgrounds.panel } : {}) }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 1,
                    borderBottom: `1px solid ${content.divider}`,
                }}
            >
                <Box aria-hidden sx={{ flex: 'none', width: 10, height: 10, borderRadius: '3px', bgcolor: accent }} />
                {onTipoChange ? (
                    <FormControl size="small" sx={{ minWidth: 170, ...sx }}>
                        <InputLabel shrink>Tipo da etapa</InputLabel>
                        <Select
                            native
                            label="Tipo da etapa"
                            value={tipoEtapa ?? ''}
                            onChange={e => onTipoChange(e.target.value as string)}
                            disabled={disabled}
                            inputProps={{ 'aria-label': tipoAriaLabel ?? 'Tipo da etapa' }}
                        >
                            <option value="" disabled>Escolha…</option>
                            {TIPOS_ETAPA.map(t => <option key={t} value={t}>{TIPO_ETAPA_LABEL[t]}</option>)}
                        </Select>
                    </FormControl>
                ) : (
                    <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: surface[50] }}>{tipoEtapaLabel(tipoEtapa)}</Typography>
                )}
                {semTipo && (
                    // Etapa sem tipo não é persistida (`serializarItens` a descarta): sem este aviso
                    // o treinador preenchia os campos e nada era gravado, em silêncio.
                    <Typography data-testid="etapa-sem-tipo" sx={{ fontSize: '0.75rem', color: surface[400] }}>
                        Escolha o tipo para a etapa ser salva
                    </Typography>
                )}
                {actions && <Box sx={{ ml: 'auto' }}>{actions}</Box>}
            </Box>

            <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
                    <TextField
                        label="Distância (km)"
                        type="number"
                        value={bloco.distanciaKm}
                        onChange={e => onChange({ ...bloco, distanciaKm: e.target.value })}
                        disabled={disabled}
                        size="small"
                        inputProps={{ min: 0, step: 0.1 }}
                        sx={sx}
                    />
                    <TextField
                        label="Duração (min)"
                        type="number"
                        value={bloco.duracaoMin}
                        onChange={e => onChange({ ...bloco, duracaoMin: e.target.value })}
                        disabled={disabled}
                        size="small"
                        inputProps={{ min: 1, step: 1 }}
                        sx={sx}
                    />
                </Box>

                {focada ? (
                    <ZoneSelector
                        idBase={idBase}
                        value={bloco.intensidade}
                        zones={zones}
                        tipoEtapa={tipoEtapa ?? ''}
                        tipoTreino={tipoTreino}
                        disabled={disabled}
                        onChange={intensidade => onChange({ ...bloco, intensidade })}
                    />
                ) : (
                    <StepSummaryRow
                        intensidade={bloco.intensidade}
                        zones={zones}
                        tipoEtapa={tipoEtapa ?? ''}
                        tipoTreino={tipoTreino}
                        onAbrir={onFocar}
                        rotulo={tipoAriaLabel ?? 'etapa'}
                    />
                )}

                {!mostraDetalhes && (
                    <Button
                        size="small"
                        onClick={() => setDetalhesAbertos(true)}
                        disabled={disabled}
                        endIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
                        sx={{ ...GHOST_BTN_SX, alignSelf: 'flex-start', px: 0.5, minHeight: 28, ...EYEBROW_SX }}
                    >
                        Mais detalhes
                    </Button>
                )}

                {mostraDetalhes && (
                    <>
                        <TextField
                            label="Descrição para o atleta"
                            placeholder="Ex.: 800m forte, trote entre os tiros"
                            value={bloco.descricao}
                            onChange={e => onChange({ ...bloco, descricao: e.target.value })}
                            disabled={disabled}
                            size="small"
                            fullWidth
                            slotProps={{ inputLabel: { shrink: true } }}
                            inputProps={{ maxLength: 200 }}
                            sx={sx}
                        />
                    </>
                )}
            </Box>
        </Card>
    );
}

// ── Editor ────────────────────────────────────────────────────────────────────

export interface EtapasEditorProps {
    itens: EtapaItem[];
    /** Recebe a função de transformação — o dono decide como aplicar (e marcar "mudou"). */
    onChange: (fn: (prev: EtapaItem[]) => EtapaItem[]) => void;
    disabled?: boolean;
    /** Texto do estado vazio; o de edição diz "Nenhuma etapa. Use os botões abaixo…". */
    vazio?: string;
    /** Zonas do atleta; `null` (carregando ou erro) deixa só os campos de ritmo e FC. */
    zones?: AthleteTrainingZonesDto | null;
    /** Tipo do treino: afina a faixa de FC típica de cada etapa. */
    tipoTreino?: string;
}

export function EtapasEditor({ itens, onChange, disabled = false, vazio, zones = null, tipoTreino }: EtapasEditorProps) {
    // A etapa em foco mostra o seletor inteiro; sem escolha explícita, a primeira.
    const [focoId, setFocoId] = useState<string | null>(null);
    const primeiraEtapaId = (() => {
        const primeiro = itens[0];
        if (!primeiro) return null;
        return primeiro.kind === 'step' ? primeiro.id : primeiro.steps[0]?.id ?? null;
    })();
    const focoAtual = focoId ?? primeiraEtapaId;

    const atualizaStep = (idx: number, b: BlocoState) =>
        onChange(prev => prev.map((it, i) =>
            i !== idx || it.kind !== 'step' ? it : { ...it, ...camposDe(b) }));

    const atualizaSubStep = (idx: number, si: number, b: BlocoState) =>
        onChange(prev => prev.map((it, i) =>
            i !== idx || it.kind !== 'block' ? it
                : { ...it, steps: it.steps.map((s, y) => y !== si ? s : { ...s, ...camposDe(b) }) }));

    const atualizaTipoStep = (idx: number, tipo: string) =>
        onChange(prev => prev.map((it, i) =>
            i !== idx || it.kind !== 'step' ? it : { ...it, tipoEtapa: tipo }));

    const atualizaTipoSubStep = (idx: number, si: number, tipo: string) =>
        onChange(prev => prev.map((it, i) =>
            i !== idx || it.kind !== 'block' ? it
                : { ...it, steps: it.steps.map((s, y) => y !== si ? s : { ...s, tipoEtapa: tipo }) }));

    const atualizaReps = (idx: number, delta: number) =>
        onChange(prev => prev.map((it, i) => {
            if (i !== idx || it.kind !== 'block') return it;
            const atual = parseInt(it.repeticoes, 10) || 1;
            return { ...it, repeticoes: String(Math.min(20, Math.max(1, atual + delta))) };
        }));

    const adicionarStep = () => {
        const novo = emptyStep();
        setFocoId(novo.id);
        onChange(prev => [...prev, novo]);
    };
    const adicionarBloco = () => {
        const novo = emptyBlock();
        setFocoId(novo.steps[0].id);
        onChange(prev => [...prev, novo]);
    };

    const adicionarSubStep = (idx: number) => {
        const novo = emptySubStep();
        setFocoId(novo.id);
        onChange(prev => prev.map((it, i) =>
            i !== idx || it.kind !== 'block' ? it : { ...it, steps: [...it.steps, novo] }));
    };

    const removerSubStep = (idx: number, si: number) =>
        onChange(prev => prev.map((it, i) =>
            i !== idx || it.kind !== 'block' ? it : { ...it, steps: it.steps.filter((_, y) => y !== si) }));

    const removerItem = (idx: number) => onChange(prev => prev.filter((_, i) => i !== idx));

    const moverItem = (idx: number, delta: number) =>
        onChange(prev => {
            const destino = idx + delta;
            if (destino < 0 || destino >= prev.length) return prev;
            const copia = [...prev];
            [copia[idx], copia[destino]] = [copia[destino], copia[idx]];
            return copia;
        });

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {itens.length === 0 && (
                <Box sx={{ py: 2, textAlign: 'center', color: surface[500], fontSize: '0.8rem' }}>
                    {vazio ?? 'Nenhuma etapa. Use os botões abaixo para montar o treino.'}
                </Box>
            )}

            {itens.map((item, idx) => item.kind === 'step' ? (
                <BlocoCard
                    key={item.id}
                    accent={accentDe(item.tipoEtapa)}
                    bloco={blocoStateDe(item, zones)}
                    onChange={b => atualizaStep(idx, b)}
                    zones={zones}
                    tipoTreino={tipoTreino}
                    focada={focoAtual === item.id}
                    onFocar={() => setFocoId(item.id)}
                    idBase={`etapa-${item.id}`}
                    disabled={disabled}
                    tipoEtapa={item.tipoEtapa}
                    onTipoChange={t => atualizaTipoStep(idx, t)}
                    tipoAriaLabel={`Tipo da etapa ${idx + 1}`}
                    actions={
                        <ItemActions
                            idx={idx}
                            total={itens.length}
                            disabled={disabled}
                            onMover={moverItem}
                            onRemover={removerItem}
                        />
                    }
                />
            ) : (
                <Card
                    key={item.id}
                    variant="flat"
                    sx={{ p: 0, overflow: 'hidden', minWidth: 0 }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1.5,
                            py: 0.75,
                            borderBottom: `1px solid ${content.divider}`,
                        }}
                    >
                        <Typography sx={EYEBROW_SX}>Série</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                            <IconButton
                                size="small"
                                aria-label={`Diminuir repetições da série ${idx + 1}`}
                                disabled={disabled || (parseInt(item.repeticoes, 10) || 1) <= 1}
                                onClick={() => atualizaReps(idx, -1)}
                            >
                                <RemoveIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <Box
                                data-testid={`repeticoes-display-${idx}`}
                                sx={{
                                    minWidth: 36,
                                    textAlign: 'center',
                                    fontFamily: MONO,
                                    fontSize: '0.6875rem',
                                    fontWeight: 700,
                                    color: primary[400],
                                    border: `1px solid ${content.cardBorder}`,
                                    borderRadius: '11px',
                                    py: 0.25,
                                }}
                            >
                                {item.repeticoes}×
                            </Box>
                            <IconButton
                                size="small"
                                aria-label={`Aumentar repetições da série ${idx + 1}`}
                                disabled={disabled || (parseInt(item.repeticoes, 10) || 1) >= 20}
                                onClick={() => atualizaReps(idx, 1)}
                            >
                                <AddIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <ItemActions
                                idx={idx}
                                total={itens.length}
                                disabled={disabled}
                                onMover={moverItem}
                                onRemover={removerItem}
                                nome="série"
                            />
                        </Box>
                    </Box>

                    <Box sx={{ p: 1.25, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {item.steps.map((sub, si) => (
                            <BlocoCard
                                key={sub.id}
                                aninhado
                                accent={accentDe(sub.tipoEtapa)}
                                bloco={blocoStateDe(sub, zones)}
                                onChange={b => atualizaSubStep(idx, si, b)}
                                zones={zones}
                                tipoTreino={tipoTreino}
                                focada={focoAtual === sub.id}
                                onFocar={() => setFocoId(sub.id)}
                                idBase={`etapa-${sub.id}`}
                                disabled={disabled}
                                tipoEtapa={sub.tipoEtapa}
                                onTipoChange={t => atualizaTipoSubStep(idx, si, t)}
                                tipoAriaLabel={`Tipo da etapa ${si + 1} da série ${idx + 1}`}
                                actions={
                                    <IconButton
                                        size="small"
                                        aria-label={`Remover etapa ${si + 1} da série ${idx + 1}`}
                                        disabled={disabled || item.steps.length <= 1}
                                        onClick={() => removerSubStep(idx, si)}
                                    >
                                        <RemoveIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                }
                            />
                        ))}

                        <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => adicionarSubStep(idx)}
                            disabled={disabled}
                            sx={{ ...GHOST_BTN_SX, alignSelf: 'flex-start' }}
                        >
                            Etapa na série
                        </Button>
                    </Box>
                </Card>
            ))}

            <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={adicionarStep}
                    disabled={disabled}
                    sx={GHOST_BTN_SX}
                >
                    Etapa
                </Button>
                <Button
                    size="small"
                    startIcon={<RepeatIcon />}
                    onClick={adicionarBloco}
                    disabled={disabled}
                    sx={GHOST_BTN_SX}
                >
                    Série
                </Button>
            </Box>
        </Box>
    );
}
