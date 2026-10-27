import { useState } from 'react';
import { Box, ButtonBase, TextField, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { activeTheme } from '../../../../theme/activeTheme';
import { content, primary, semantic, surface, text } from '../../../../theme/tokens';
import type { AthleteTrainingZonesDto } from '../../../../types/AthleteTrainingZones';
import type { ZoneKey } from '../../../workout/profile/types';
import {
    aplicarZona,
    avisosDaEtapa,
    editarValor,
    escolherEixo,
    type IntensidadeEtapa,
} from '../../adapters/zoneSelectorLogic';
import { fieldSx } from './etapasStyles';

const ZONAS: ZoneKey[] = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6'];
const MONO = activeTheme.font.mono;

export interface ZoneSelectorProps {
    value: IntensidadeEtapa;
    /** `null` enquanto carrega ou em erro: o seletor some e ficam só os campos de valor. */
    zones: AthleteTrainingZonesDto | null;
    tipoEtapa: string;
    tipoTreino?: string;
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

/**
 * Seletor de zona da etapa + eixo que o relógio controla. Controlado: a lógica vive em
 * `zoneSelectorLogic` (funções puras); aqui só se desenha e se encaminha o clique.
 *
 * Lime só no segmento selecionado do toggle `Relógio:` — em leitura nunca (design D9 V3).
 */
export function ZoneSelector({ value, zones, tipoEtapa, tipoTreino, disabled, idBase, onChange }: ZoneSelectorProps) {
    // Um eixo que veio gravado (ou que o treinador já trocou) não é sobrescrito pelo default da regra.
    const [eixoTocado, setEixoTocado] = useState(Boolean(value.alvoPrimario));
    const sx = fieldSx(primary[500]);

    const avisos = avisosDaEtapa(value, { zones, tipoEtapa, tipoTreino });
    const avisoIds = avisos.map((a) => `${idBase}-aviso-${a.id}`).join(' ') || undefined;
    const temPace = value.ritmoAlvo.trim() !== '';
    const temFc = value.fcAlvoEtapa.trim() !== '';
    const z6SemPace = value.zona === 'Z6' && !temPace;

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
                        return (
                            <ButtonBase
                                key={z}
                                role="radio"
                                aria-checked={ativa}
                                aria-label={z}
                                disabled={disabled}
                                onClick={() => onChange(aplicarZona(value, z, zones, tipoEtapa, eixoTocado))}
                                sx={{
                                    ...radioBase,
                                    minHeight: 40,
                                    minWidth: 44,
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
                                ? { bgcolor: surface[700], borderColor: text.secondary }
                                : {}),
                        }}
                    >
                        Personalizado
                    </ButtonBase>
                </Box>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
                <TextField
                    label="Ritmo"
                    placeholder="5:15-5:45/km"
                    value={value.ritmoAlvo}
                    onChange={(e) => onChange(editarValor(value, 'ritmoAlvo', e.target.value, tipoEtapa))}
                    disabled={disabled}
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    inputProps={{ maxLength: 40, 'aria-describedby': avisoIds }}
                    sx={sx}
                />
                <TextField
                    label="FC"
                    placeholder="143-150 bpm"
                    value={value.fcAlvoEtapa}
                    onChange={(e) => onChange(editarValor(value, 'fcAlvoEtapa', e.target.value, tipoEtapa))}
                    disabled={disabled}
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    inputProps={{ maxLength: 50, 'aria-describedby': avisoIds }}
                    sx={sx}
                />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: '0.75rem', color: text.secondary }}>Relógio:</Typography>
                <Box role="radiogroup" aria-label="Eixo que o relógio controla" sx={{ display: 'flex', gap: 0.5 }}>
                    {([['PACE', 'Pace', temPace], ['FC', 'FC', temFc]] as const).map(([eixo, rotulo, tem]) => {
                        const ativo = value.alvoPrimario === eixo;
                        return (
                            <ButtonBase
                                key={eixo}
                                role="radio"
                                aria-checked={ativo}
                                aria-label={rotulo}
                                disabled={disabled || !tem}
                                onClick={() => {
                                    setEixoTocado(true);
                                    onChange(escolherEixo(value, eixo));
                                }}
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
                {value.alvoPrimario === 'NENHUM' && (
                    <Typography sx={{ fontSize: '0.75rem', color: text.secondary }}>Sem meta no relógio</Typography>
                )}
            </Box>

            {z6SemPace && (
                <Typography sx={{ fontSize: '0.75rem', color: text.primary }}>
                    Z6 precisa do pace de limiar do atleta.
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
