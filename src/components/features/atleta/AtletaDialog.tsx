import React, { useState, useEffect } from "react";
import { Button, TextField, MenuItem, FormControlLabel, Checkbox, Alert, Typography, Box, Chip, Stack, InputAdornment, FormHelperText } from "@mui/material";
import Grid from '@mui/material/Grid';
import { surface } from '../../../theme/tokens';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { GHOST_BTN_SX, PRIMARY_BTN_SX } from '../../../shared/components/actionButtonSx';

import { DIA_SEMANA_LABELS, NIVEL_EXPERIENCIA_LABELS } from "../../../types/Atleta";
import type { Atleta, CreateAtleta, UpdateAtleta, AtletaDialogProps, diaSemana, Sexo, nivelExperiencia } from "../../../types/Atleta";

type FormErrors = Partial<Record<keyof AtletaFormState, string>>;

/**
 * Estado do formulário separado do payload: os campos de escolha começam em `''` (sem default
 * silencioso) e peso/altura são texto para aceitar vírgula. Só vira `CreateAtleta` depois de válido.
 */
interface AtletaFormState {
    nome: string;
    email: string;
    dataNascimento: string;
    sexo: Sexo | '';
    pesoKg: string;
    alturaCm: string;
    objetivo: string;
    nivelExperiencia: nivelExperiencia | '';
    diasDisponiveis: diaSemana[];
    diaPreferidoLongo: diaSemana | '';
    temLesao: boolean;
    descricaoLesao: string;
}

const DIAS: diaSemana[] = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];
const NIVEIS: nivelExperiencia[] = ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'];
const SEXOS: { value: Sexo; label: string }[] = [
    { value: 'MASCULINO', label: 'Masculino' },
    { value: 'FEMININO', label: 'Feminino' },
    { value: 'OUTRO', label: 'Outro' },
];

const getObjectValue = (value: unknown): unknown => {
    if (value && typeof value === 'object' && 'value' in value) {
        return value.value;
    }
    return undefined;
};

// Aceita string direta ou objeto `{ value }` vindo do backend legado
const comoOpcao = <T extends string>(valor: unknown, opcoes: readonly T[]): T | '' => {
    const v = getObjectValue(valor) ?? valor;
    return typeof v === 'string' && (opcoes as readonly string[]).includes(v) ? (v as T) : '';
};

const parseDecimal = (texto: string): number => Number(texto.trim().replace(',', '.'));

const getInitialFormData = (atleta?: Atleta): AtletaFormState => ({
    nome: typeof atleta?.nome === 'string' ? atleta.nome : "",
    email: typeof atleta?.email === 'string' ? atleta.email : "",
    dataNascimento: typeof atleta?.dataNascimento === 'string' ? atleta.dataNascimento : "",
    sexo: comoOpcao(atleta?.sexo, SEXOS.map(s => s.value)),
    pesoKg: typeof atleta?.pesoKg === 'number' ? String(atleta.pesoKg) : "",
    alturaCm: typeof atleta?.alturaCm === 'number' ? String(atleta.alturaCm) : "",
    objetivo: typeof atleta?.objetivo === 'string' ? atleta.objetivo : "",
    nivelExperiencia: comoOpcao(atleta?.nivelExperiencia, NIVEIS),
    diasDisponiveis: Array.isArray(atleta?.diasDisponiveis)
        ? atleta.diasDisponiveis.map(d => comoOpcao(d, DIAS)).filter((d): d is diaSemana => d !== '')
        : [],
    diaPreferidoLongo: comoOpcao(atleta?.diaPreferidoLongo, DIAS),
    temLesao: typeof atleta?.temLesao === 'boolean' ? atleta.temLesao : false,
    descricaoLesao: typeof atleta?.descricaoLesao === 'string' ? atleta.descricaoLesao : "",
});

const toPayload = (form: AtletaFormState, id?: string): CreateAtleta | UpdateAtleta => {
    const base: CreateAtleta = {
        nome: form.nome,
        email: form.email,
        dataNascimento: form.dataNascimento,
        sexo: form.sexo as Sexo,
        pesoKg: parseDecimal(form.pesoKg),
        alturaCm: parseDecimal(form.alturaCm),
        objetivo: form.objetivo,
        nivelExperiencia: form.nivelExperiencia as nivelExperiencia,
        diasDisponiveis: form.diasDisponiveis,
        diaPreferidoLongo: form.diaPreferidoLongo as diaSemana,
        temLesao: form.temLesao,
        descricaoLesao: form.descricaoLesao,
    };
    return id ? { ...base, id } : base;
};

const AtletaDialog: React.FC<AtletaDialogProps> = ({ open, onClose, onSave, atleta }) => {
    const isEditMode = Boolean(atleta);
    const [formData, setFormData] = useState<AtletaFormState>(getInitialFormData(atleta));
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        setFormData(getInitialFormData(atleta));
        setErrors({});
        setSubmitError(null);
    }, [atleta, open]);

    const limparErro = (campo: keyof AtletaFormState) => {
        if (errors[campo]) setErrors(prev => ({ ...prev, [campo]: undefined }));
        if (submitError) setSubmitError(null);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = event.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        limparErro(name as keyof AtletaFormState);
    };

    const alternarDia = (dia: diaSemana) => {
        setFormData(prev => {
            const marcado = prev.diasDisponiveis.includes(dia);
            const diasDisponiveis = marcado ? prev.diasDisponiveis.filter(d => d !== dia) : [...prev.diasDisponiveis, dia];
            const diaPreferidoLongo = marcado && prev.diaPreferidoLongo === dia ? '' : prev.diaPreferidoLongo;
            return { ...prev, diasDisponiveis, diaPreferidoLongo };
        });
        limparErro('diasDisponiveis');
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
        if (!formData.dataNascimento) newErrors.dataNascimento = 'Data de nascimento é obrigatória';
        if (!formData.sexo) newErrors.sexo = 'Escolha o sexo';
        if (!(parseDecimal(formData.pesoKg) > 0)) newErrors.pesoKg = 'Informe o peso';
        if (!(parseDecimal(formData.alturaCm) > 0)) newErrors.alturaCm = 'Informe a altura';
        if (!formData.objetivo.trim()) newErrors.objetivo = 'Objetivo é obrigatório';
        if (!formData.nivelExperiencia) newErrors.nivelExperiencia = 'Escolha o nível de experiência';
        if (formData.diasDisponiveis.length === 0) newErrors.diasDisponiveis = 'Marque ao menos um dia';
        if (!formData.diaPreferidoLongo) newErrors.diaPreferidoLongo = 'Escolha o dia do treino longo';
        if (formData.temLesao && !formData.descricaoLesao.trim()) newErrors.descricaoLesao = 'Descrição da lesão é obrigatória';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event: React.FormEvent): Promise<void> => {
        event.preventDefault();
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setSubmitError(null);

        try {
            await onSave(toPayload(formData, atleta?.id));
            onClose();
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Erro ao salvar atleta');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = (): void => {
        if (!loading) {
            onClose();
        }
    };

    // Legado: longão fora dos dias marcados continua visível até o treinador trocar
    const opcoesLongao = DIAS.filter(d =>
        formData.diasDisponiveis.includes(d) || d === formData.diaPreferidoLongo,
    );

    const secao = (titulo: string) => (
        <Typography variant="overline" sx={{ color: surface[400], fontWeight: 700, display: 'block', mb: 1.5 }}>
            {titulo}
        </Typography>
    );

    return (
        <CoachDialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            disableClose={loading}
            title={isEditMode ? 'Editar atleta' : 'Adicionar atleta'}
            subtitle="Informe os dados para montar o plano de treino. Campos com * são obrigatórios."
            component="form"
            onSubmit={handleSubmit}
            dividers
            actions={
                <>
                    <Button onClick={handleClose} disabled={loading} size="small" sx={GHOST_BTN_SX}>Cancelar</Button>
                    <Button type="submit" variant="contained" disabled={loading} size="small" sx={PRIMARY_BTN_SX}>
                        {loading ? 'Salvando...' : isEditMode ? 'Salvar alterações' : 'Adicionar atleta'}
                    </Button>
                </>
            }
        >
            <Stack spacing={3.5}>
                {submitError && <Alert severity="error">{submitError}</Alert>}

                <Box>
                    {secao('Identificação')}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField label="Nome" name="nome" value={formData.nome} onChange={handleChange}
                                error={Boolean(errors.nome)} helperText={errors.nome} fullWidth required size="small" />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField label="E-mail" name="email" type="email" value={formData.email} onChange={handleChange}
                                helperText="Necessário para enviar o convite de acesso" fullWidth size="small" />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField label="Data de nascimento" name="dataNascimento" type="date" value={formData.dataNascimento} onChange={handleChange}
                                error={Boolean(errors.dataNascimento)} helperText={errors.dataNascimento} fullWidth required size="small"
                                slotProps={{ inputLabel: { shrink: true } }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField select label="Sexo" name="sexo" value={formData.sexo} onChange={handleChange}
                                error={Boolean(errors.sexo)} helperText={errors.sexo} fullWidth required size="small">
                                {SEXOS.map(op => <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>)}
                            </TextField>
                        </Grid>
                    </Grid>
                </Box>

                <Box>
                    {secao('Perfil físico e objetivo')}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField label="Peso" name="pesoKg" value={formData.pesoKg} onChange={handleChange}
                                error={Boolean(errors.pesoKg)} helperText={errors.pesoKg} fullWidth required size="small"
                                slotProps={{ htmlInput: { inputMode: 'decimal' }, input: { endAdornment: <InputAdornment position="end">kg</InputAdornment> } }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField label="Altura" name="alturaCm" value={formData.alturaCm} onChange={handleChange}
                                error={Boolean(errors.alturaCm)} helperText={errors.alturaCm} fullWidth required size="small"
                                slotProps={{ htmlInput: { inputMode: 'decimal' }, input: { endAdornment: <InputAdornment position="end">cm</InputAdornment> } }} />
                        </Grid>
                        <Grid size={12}>
                            <TextField label="Objetivo" name="objetivo" value={formData.objetivo} onChange={handleChange}
                                placeholder="Ex.: completar a primeira meia maratona"
                                error={Boolean(errors.objetivo)} helperText={errors.objetivo} fullWidth required size="small" />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField select label="Nível de experiência" name="nivelExperiencia" value={formData.nivelExperiencia} onChange={handleChange}
                                error={Boolean(errors.nivelExperiencia)} helperText={errors.nivelExperiencia} fullWidth required size="small">
                                {NIVEIS.map(n => <MenuItem key={n} value={n}>{NIVEL_EXPERIENCIA_LABELS[n]}</MenuItem>)}
                            </TextField>
                        </Grid>
                    </Grid>
                </Box>

                <Box>
                    {secao('Disponibilidade e saúde')}
                    <Box role="group" aria-labelledby="dias-disponiveis-label" sx={{ mb: 2.5 }}>
                        <Typography id="dias-disponiveis-label" variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            Dias disponíveis para treinar *
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {DIAS.map(dia => {
                                const marcado = formData.diasDisponiveis.includes(dia);
                                return (
                                    <Chip
                                        key={dia}
                                        label={DIA_SEMANA_LABELS[dia].slice(0, 3)}
                                        aria-label={DIA_SEMANA_LABELS[dia]}
                                        aria-pressed={marcado}
                                        color={marcado ? 'primary' : 'default'}
                                        variant={marcado ? 'filled' : 'outlined'}
                                        onClick={() => alternarDia(dia)}
                                    />
                                );
                            })}
                        </Stack>
                        <FormHelperText error={Boolean(errors.diasDisponiveis)}>{errors.diasDisponiveis ?? 'Marque ao menos um dia.'}</FormHelperText>
                    </Box>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField select label="Dia do treino longo" name="diaPreferidoLongo" value={formData.diaPreferidoLongo} onChange={handleChange}
                                disabled={opcoesLongao.length === 0}
                                error={Boolean(errors.diaPreferidoLongo)}
                                helperText={errors.diaPreferidoLongo ?? (opcoesLongao.length === 0 ? 'Marque os dias primeiro' : 'Só aparecem os dias marcados acima.')}
                                fullWidth required size="small">
                                {opcoesLongao.map(d => <MenuItem key={d} value={d}>{DIA_SEMANA_LABELS[d]}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                            <FormControlLabel
                                control={<Checkbox checked={formData.temLesao} onChange={handleChange} name="temLesao" />}
                                label="Possui lesão ou restrição"
                            />
                        </Grid>
                        {formData.temLesao && (
                            <Grid size={12}>
                                <TextField label="Descrição da lesão" name="descricaoLesao" value={formData.descricaoLesao} onChange={handleChange}
                                    error={Boolean(errors.descricaoLesao)} helperText={errors.descricaoLesao} fullWidth required size="small" />
                            </Grid>
                        )}
                    </Grid>
                </Box>
            </Stack>
        </CoachDialog>
    )

}

export default AtletaDialog;
