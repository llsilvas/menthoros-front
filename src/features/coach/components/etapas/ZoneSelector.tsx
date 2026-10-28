import { Box, ButtonBase, TextField, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { activeTheme } from '../../../../theme/activeTheme';
import { content, primary, semantic, text } from '../../../../theme/tokens';
import type { AthleteTrainingZonesDto } from '../../../../types/AthleteTrainingZones';
import type { ZoneKey } from '../../../workout/profile/types';
import {
    aplicarZona,
    avisosDaEtapa,
    editarValor,
    eixoFoiEscolhido,
    escolherEixo,
    type IntensidadeEtapa,
} from '../../adapters/zoneSelectorLogic';
import { fcLegivel, normalizarFc, normalizarPace, paceLegivel } from '../../adapters/intensityFormat';
import { fieldSx } from './etapasStyles';

const ZONAS: ZoneKey[] = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6'];
const MONO = activeTheme.font.mono;

export interface ZoneSelectorProps {
    value: IntensidadeEtapa;
    /** `null` enquanto carrega ou em erro: o seletor some e ficam só os campos de valor. */
    zones: AthleteTrainingZonesDto | null;
    tipoEtapa: string;
    tipoTreino?: string;
    /** Descrição para o atleta: só para avisar quando ela cita uma zona diferente dos valores. */
    descricao?: string;
    disabled?: boolean;
    /** Prefixo estável para os ids de aria (um seletor por etapa). */
    idBase: string;
    onChange: (v: IntensidadeEtapa) => void;
}

const radioBase = {
    borderRadius: '8px',
    border: `1px solid ${content.cardBorder}`,
    fontFamily: MONO,
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: text.primary,
    px: 1.25,
    '&.Mui-disabled': { opacity: 0.45 },
    '&:focus-visible': { outline: `2px solid ${text.primary}`, outlineOffset: 2 },
} as const;

const PILL_SX = {
    fontFamily: MONO,
    fontSize: '0.8125rem',
    color: text.primary,
    px: 1,
    py: 0.5,
    borderRadius: '6px',
    border: `1px solid ${content.cardBorder}`,
} as const;

/**
 * Seletor de zona da etapa + eixo que o relógio controla. Controlado: a lógica vive em
 * `zoneSelectorLogic` (funções puras); aqui só se desenha e se encaminha o clique.
 *
 * Com uma zona escolhida os valores aparecem como pills (leitura); para ajustá-los o treinador vai
 * a "Personalizado", onde ficam os campos editáveis. Lime só no segmento selecionado do toggle
 * `Relógio:` — em leitura nunca (design D9 V3).
 */
export function ZoneSelector({ value, zones, tipoEtapa, tipoTreino, descricao, disabled, idBase, onChange }: ZoneSelectorProps) {
    // Um eixo que veio gravado (ou que o treinador já trocou) não é sobrescrito pelo default da regra.
    const eixoTocado = eixoFoiEscolhido(value);
    const sx = fieldSx(text.secondary);
    const escolher = (eixo: 'PACE' | 'FC') => onChange(escolherEixo(value, eixo));

    const avisos = avisosDaEtapa(value, { zones, tipoEtapa, tipoTreino, descricao });
    const avisoIds = avisos.map((a) => `${idBase}-aviso-${a.id}`).join(' ') || undefined;
    const temPace = value.ritmoAlvo.trim() !== '';
    const temFc = value.fcAlvoEtapa.trim() !== '';
    const zonaEscolhida = zones && value.zona && value.zona !== 'PERSONALIZADO' ? value.zona : null;
    const semPaceLimiar = zones ? !zones.disponibilidade.pace : false;

    const dica = (() => {
        if (!temPace || !temFc) return null;
        if (eixoTocado) return 'Sua escolha · mantida ao trocar de zona';
        return value.alvoPrimario === 'PACE'
            ? 'Pré-preenchido com pace: a FC leva ~2 min para estabilizar. Troque se preferir.'
            : 'Pré-preenchido · troque o eixo se preferir';
    })();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {zones && (
                <Box
                    role="radiogroup"
                    aria-label="Zona da etapa"
                    sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}
                >
                    {ZONAS.map((z) => {
                        const ativa = value.zona === z;
                        // Z6 só existe em pace: sem pace de limiar não há o que preencher.
                        const indisponivel = z === 'Z6' && semPaceLimiar;
                        return (
                            <ButtonBase
                                key={z}
                                role="radio"
                                aria-checked={ativa}
                                aria-label={z}
                                disabled={disabled || indisponivel}
                                title={indisponivel ? 'Z6 precisa do pace de limiar do atleta' : undefined}
                                onClick={() => onChange(aplicarZona(value, z, zones, tipoEtapa))}
                                sx={{
                                    ...radioBase,
                                    minHeight: 40,
                                    minWidth: 44,
                                    // A cor da zona fica à mostra mesmo inativa: o treinador lê a escala sem clicar.
                                    borderLeft: `3px solid ${activeTheme.zones[z].color}`,
                                    ...(ativa
                                        ? { bgcolor: activeTheme.zones[z].color, color: activeTheme.primary.contrastText, borderColor: activeTheme.zones[z].color }
                                        : {}),
                                }}
                            >
                                {z}
                            </ButtonBase>
                        );
                    })}
                    <ButtonBase
                        role="radio"
                        aria-checked={value.zona === 'PERSONALIZADO'}
                        aria-label="Personalizado"
                        disabled={disabled}
                        onClick={() => onChange({ ...value, zona: 'PERSONALIZADO' })}
                        sx={{
                            ...radioBase,
                            minHeight: 40,
                            fontFamily: 'inherit',
                            fontWeight: 600,
                            ...(value.zona === 'PERSONALIZADO'
                                ? { bgcolor: primary[500], borderColor: primary[500], color: activeTheme.primary.contrastText }
                                : {}),
                        }}
                    >
                        Personalizado
                    </ButtonBase>
                </Box>
            )}

            {zonaEscolhida ? (
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Box component="span" data-testid="pilula-pace" sx={{ ...PILL_SX, ...(temPace ? {} : { color: text.secondary }) }}>
                        {temPace ? `${paceLegivel(value.ritmoAlvo)} /km` : 'pace indisponível'}
                    </Box>
                    <Box component="span" data-testid="pilula-fc" sx={{ ...PILL_SX, ...(temFc ? {} : { color: text.secondary }) }}>
                        {temFc ? fcLegivel(value.fcAlvoEtapa) : zonaEscolhida === 'Z6' ? 'sem FC' : 'FC não preenchida'}
                    </Box>
                    <EixoDoRelogio
                        value={value}
                        temPace={temPace}
                        temFc={temFc}
                        disabled={disabled}
                        onEscolher={escolher}
                    />
                </Box>
            ) : (
                <>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
                        <TextField
                            label="Pace alvo"
                            placeholder="—"
                            value={value.ritmoAlvo}
                            onChange={(e) => onChange(editarValor(value, 'ritmoAlvo', e.target.value, tipoEtapa))}
                            onBlur={() => {
                                const normalizado = normalizarPace(value.ritmoAlvo);
                                if (normalizado !== value.ritmoAlvo) onChange(editarValor(value, 'ritmoAlvo', normalizado, tipoEtapa));
                            }}
                            disabled={disabled}
                            size="small"
                            slotProps={{ inputLabel: { shrink: true } }}
                            inputProps={{ maxLength: 40, 'aria-describedby': avisoIds }}
                            sx={sx}
                        />
                        <TextField
                            label="FC alvo (bpm)"
                            placeholder="—"
                            value={value.fcAlvoEtapa}
                            onChange={(e) => onChange(editarValor(value, 'fcAlvoEtapa', e.target.value, tipoEtapa))}
                            onBlur={() => {
                                const normalizado = normalizarFc(value.fcAlvoEtapa);
                                if (normalizado !== value.fcAlvoEtapa) onChange(editarValor(value, 'fcAlvoEtapa', normalizado, tipoEtapa));
                            }}
                            disabled={disabled}
                            size="small"
                            slotProps={{ inputLabel: { shrink: true } }}
                            inputProps={{ maxLength: 50, 'aria-describedby': avisoIds }}
                            sx={sx}
                        />
                    </Box>
                    <EixoDoRelogio
                        value={value}
                        temPace={temPace}
                        temFc={temFc}
                        disabled={disabled}
                        onEscolher={escolher}
                    />
                </>
            )}

            {dica && <Typography sx={{ fontSize: '0.75rem', color: text.secondary }}>{dica}</Typography>}

            {zonaEscolhida === 'Z6' && (
                <Typography sx={{ fontSize: '0.75rem', color: text.secondary }}>
                    Z6 não tem alvo de FC: a FC não estabiliza em esforço curto.
                </Typography>
            )}

            {!temPace && !temFc && !zonaEscolhida && value.alvoPrimario === 'NENHUM' && (
                <Typography sx={{ fontSize: '0.75rem', color: text.secondary }}>
                    Etapa livre, sem meta de intensidade — igual ao "Sem objetivo" do Garmin.
                </Typography>
            )}

            {avisos.map((a) => (
                <Box
                    key={a.id}
                    id={`${idBase}-aviso-${a.id}`}
                    role="alert"
                    sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}
                >
                    <WarningAmberIcon sx={{ fontSize: '1rem', mt: '1px', color: semantic.warning[500] }} aria-hidden />
                    <Typography sx={{ fontSize: '0.75rem', color: text.primary }}>{a.texto}</Typography>
                </Box>
            ))}
        </Box>
    );
}

interface EixoDoRelogioProps {
    value: IntensidadeEtapa;
    temPace: boolean;
    temFc: boolean;
    disabled?: boolean;
    onEscolher: (eixo: 'PACE' | 'FC') => void;
}

/** Toggle `Relógio: Pace | FC` quando os dois eixos têm valor; com um só, diz qual é o único. */
function EixoDoRelogio({ value, temPace, temFc, disabled, onEscolher }: EixoDoRelogioProps) {
    if (!temPace && !temFc) return null;
    if (temPace !== temFc) {
        return (
            <Typography data-testid="eixo-unico" sx={{ fontSize: '0.75rem', color: text.secondary }}>
                {temPace ? 'Pace' : 'FC'} · único eixo
            </Typography>
        );
    }
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '0.75rem', color: text.secondary }}>Relógio alerta por:</Typography>
            <Box role="radiogroup" aria-label="Eixo que o relógio controla" sx={{ display: 'flex', gap: 0.5 }}>
                {([['PACE', 'Pace'], ['FC', 'FC']] as const).map(([eixo, rotulo]) => {
                    const ativo = value.alvoPrimario === eixo;
                    return (
                        <ButtonBase
                            key={eixo}
                            role="radio"
                            aria-checked={ativo}
                            aria-label={rotulo}
                            disabled={disabled}
                            onClick={() => onEscolher(eixo)}
                            sx={{
                                ...radioBase,
                                minHeight: 44,
                                minWidth: 64,
                                fontFamily: 'inherit',
                                ...(ativo ? { bgcolor: primary[500], borderColor: primary[500], color: activeTheme.primary.contrastText } : {}),
                            }}
                        >
                            {rotulo}
                        </ButtonBase>
                    );
                })}
            </Box>
        </Box>
    );
}
