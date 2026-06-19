import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Slider,
    TextField,
    Typography,
} from '@mui/material';
import { format, subDays } from 'date-fns';
import type { TipoTreino, TreinoManualInput } from '../../../types/TreinoManual';
import { TIPO_TREINO_LABELS } from '../../../types/TreinoManual';
import { primary, surface, content, backgrounds } from '../../../theme/tokens';

const TIPOS = Object.keys(TIPO_TREINO_LABELS) as Array<keyof typeof TIPO_TREINO_LABELS>;

const RPE_LABELS: Record<number, string> = {
    1: 'Muito fácil', 2: 'Muito fácil',
    3: 'Fácil', 4: 'Fácil',
    5: 'Moderado', 6: 'Moderado',
    7: 'Difícil', 8: 'Difícil',
    9: 'Máximo', 10: 'Máximo',
};

function estimarTss(duracaoMinutos: number, rpe: number): number {
    return Math.round((duracaoMinutos / 60) * Math.pow(rpe / 10, 2) * 100);
}

export interface ManualTrainingFormProps {
    loading: boolean;
    hasTreinoHoje: boolean;
    onSubmit: (input: TreinoManualInput) => Promise<void>;
}

export function ManualTrainingForm({ loading, hasTreinoHoje, onSubmit }: ManualTrainingFormProps) {
    const [hoje, minData] = useMemo(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const min = format(subDays(new Date(), 7), 'yyyy-MM-dd');
        return [today, min];
    }, []);

    const [tipo, setTipo] = useState<TipoTreino>('CONTINUO');
    const [data, setData] = useState(hoje);
    const [duracaoMinutos, setDuracaoMinutos] = useState<number | ''>(45);
    const [distanciaKm, setDistanciaKm] = useState<number | ''>('');
    const [rpe, setRpe] = useState<number>(6);
    const [observacoes, setObservacoes] = useState('');

    const tssEstimado = duracaoMinutos !== '' && duracaoMinutos > 0
        ? estimarTss(duracaoMinutos, rpe)
        : 0;

    const isValid = Boolean(tipo)
        && data >= minData && data <= hoje
        && duracaoMinutos !== '' && duracaoMinutos >= 1 && duracaoMinutos <= 600
        && rpe >= 1 && rpe <= 10;

    const handleSubmit = useCallback(async () => {
        if (!isValid) return;
        const duracao = typeof duracaoMinutos === 'number' ? duracaoMinutos : 0;
        const distancia = tipo !== 'REGENERATIVO'
            && typeof distanciaKm === 'number' && distanciaKm > 0
            ? distanciaKm
            : undefined;
        await onSubmit({
            tipo,
            data,
            duracaoMinutos: duracao,
            distanciaKm: distancia,
            percepcaoEsforco: rpe,
            observacoes: observacoes.trim() || undefined,
        });
        setTipo('CONTINUO');
        setDuracaoMinutos(45);
        setDistanciaKm('');
        setRpe(6);
        setObservacoes('');
        setData(hoje);
    }, [isValid, duracaoMinutos, distanciaKm, tipo, data, rpe, observacoes, hoje, onSubmit]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            {hasTreinoHoje && (
                <Alert severity="info" sx={{ fontSize: '0.85rem' }}>
                    Você já registrou um treino hoje. Pode registrar outro se desejar.
                </Alert>
            )}

            <Box>
                <SectionLabel>Tipo de treino</SectionLabel>
                <Box
                    role="radiogroup"
                    aria-label="Tipo de treino"
                    sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}
                >
                    {TIPOS.map((t) => (
                        <Chip
                            key={t}
                            label={TIPO_TREINO_LABELS[t]}
                            onClick={() => setTipo(t)}
                            role="radio"
                            aria-checked={tipo === t}
                            sx={{
                                bgcolor: tipo === t ? primary[500] : content.cardBg,
                                color: tipo === t ? backgrounds.canvas : surface[200],
                                fontWeight: tipo === t ? 700 : 400,
                                border: `1px solid ${tipo === t ? primary[500] : content.cardBorder}`,
                                '&:hover': {
                                    bgcolor: tipo === t ? primary[400] : content.cardBgHover,
                                },
                                cursor: 'pointer',
                            }}
                        />
                    ))}
                </Box>
            </Box>

            <Box>
                <SectionLabel>Data do treino</SectionLabel>
                <TextField
                    type="date"
                    label="Data do treino"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    fullWidth
                    inputProps={{ min: minData, max: hoje }}
                    sx={inputSx}
                />
            </Box>

            <Box>
                <SectionLabel>Duração (minutos)</SectionLabel>
                <TextField
                    type="number"
                    label="Duração (minutos)"
                    value={duracaoMinutos}
                    onChange={(e) => {
                        const v = e.target.value === '' ? '' : Number(e.target.value);
                        setDuracaoMinutos(v);
                    }}
                    fullWidth
                    inputProps={{ min: 1, max: 600 }}
                    sx={inputSx}
                />
            </Box>

            {tipo !== 'REGENERATIVO' && (
                <Box>
                    <SectionLabel>Distância (km) — opcional</SectionLabel>
                    <TextField
                        type="number"
                        label="Distância (km)"
                        value={distanciaKm}
                        onChange={(e) => {
                            const v = e.target.value === '' ? '' : Number(e.target.value);
                            setDistanciaKm(v);
                        }}
                        fullWidth
                        inputProps={{ min: 0.1, max: 200, step: 0.1 }}
                        sx={inputSx}
                    />
                </Box>
            )}

            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <SectionLabel>Percepção de esforço (RPE)</SectionLabel>
                    <Typography sx={{ color: primary[500], fontSize: '0.85rem', fontWeight: 700 }}>
                        {rpe}/10 — {RPE_LABELS[rpe]}
                    </Typography>
                </Box>
                <Slider
                    value={rpe}
                    min={1}
                    max={10}
                    step={1}
                    marks
                    aria-label="Percepção de esforço (RPE)"
                    getAriaValueText={(v) => `${v}/10 — ${RPE_LABELS[v]}`}
                    onChange={(_e, v) => { if (typeof v === 'number') setRpe(v); }}
                    sx={{
                        color: primary[500],
                        '& .MuiSlider-mark': { bgcolor: surface[600] },
                        '& .MuiSlider-markActive': { bgcolor: primary[500] },
                    }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: surface[400], fontSize: '0.75rem' }}>Muito fácil</Typography>
                    <Typography sx={{ color: surface[400], fontSize: '0.75rem' }}>Máximo</Typography>
                </Box>

                {tssEstimado > 0 && (
                    <Typography sx={{ color: surface[400], fontSize: '0.8rem', mt: 1 }}>
                        ~{tssEstimado} TSS (estimativa)
                    </Typography>
                )}
            </Box>

            <Box>
                <SectionLabel>Observações (opcional)</SectionLabel>
                <TextField
                    multiline
                    rows={3}
                    label="Observações"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value.slice(0, 500))}
                    fullWidth
                    placeholder="Como foi o treino? Algo a registrar?"
                    helperText={`${observacoes.length}/500`}
                    sx={inputSx}
                />
            </Box>

            <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={!isValid || loading}
                fullWidth
                sx={{
                    bgcolor: primary[500],
                    color: backgrounds.canvas,
                    fontWeight: 700,
                    fontSize: '1rem',
                    py: 1.5,
                    '&:hover': { bgcolor: primary[400] },
                    '&.Mui-disabled': { bgcolor: surface[700], color: surface[500] },
                }}
            >
                {loading ? 'Registrando...' : 'Registrar treino'}
            </Button>
        </Box>
    );
}

function SectionLabel({ children }: { children: ReactNode }) {
    return (
        <Typography sx={{ color: surface[50], fontSize: '0.875rem', fontWeight: 600 }}>
            {children}
        </Typography>
    );
}

const inputSx = {
    mt: 0.5,
    '& .MuiOutlinedInput-root': {
        color: surface[50],
        bgcolor: content.inputBg,
        '& fieldset': { borderColor: content.inputBorder },
        '&:hover fieldset': { borderColor: content.inputBorderFocus },
        '&.Mui-focused fieldset': { borderColor: primary[500] },
        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
            display: 'none',
        },
    },
    '& .MuiInputLabel-root': { color: surface[400] },
    '& .MuiInputLabel-root.Mui-focused': { color: primary[500] },
    '& .MuiFormHelperText-root': { color: surface[500] },
};
