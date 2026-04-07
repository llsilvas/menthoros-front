import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, FormControlLabel, Checkbox, Alert, Typography, FormGroup, Box, Chip, IconButton, Stack } from "@mui/material";
import { Close as CloseIcon } from '@mui/icons-material';
import Grid from '@mui/material/Grid';

import type { Atleta, CreateAtleta, UpdateAtleta, AtletaDialogProps, diaSemana, Sexo } from "../../../types/Atleta";

interface FormErrors {
    nome?: string;
    dataNascimento?: string;
    pesoKg?: string;
    alturaCm?: string;
    objetivo?: string;
    nivelExperiencia?: string;
    diasDisponiveis?: string;
    diaPreferidoLongo?: string;
    temLesao?: string;
    descricaoLesao?: string;
}

const getObjectValue = (value: unknown): unknown => {
    if (value && typeof value === 'object' && 'value' in value) {
        return value.value;
    }
    return undefined;
};

const getInitialFormData = (atleta?: Atleta): CreateAtleta | UpdateAtleta => {
    // Garantir que os valores são sempre strings válidas para os selects
    const validarNivelExperiencia = (nivel: unknown): "INICIANTE" | "INTERMEDIARIO" | "AVANCADO" => {
        // Se for um objeto com propriedade value
        const value = getObjectValue(nivel);
        if (typeof value === 'string' && ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'].includes(value)) {
            return value as "INICIANTE" | "INTERMEDIARIO" | "AVANCADO";
        }
        // Se for uma string direta
        if (typeof nivel === 'string' && ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'].includes(nivel)) {
            return nivel as "INICIANTE" | "INTERMEDIARIO" | "AVANCADO";
        }
        return "INICIANTE";
    };

    const validarDiaSemana = (dia: unknown): diaSemana => {
        // Se for um objeto com propriedade value
        const value = getObjectValue(dia);
        if (typeof value === 'string' && ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'].includes(value)) {
            return value as diaSemana;
        }
        // Se for uma string direta
        if (typeof dia === 'string' && ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'].includes(dia)) {
            return dia as diaSemana;
        }
        return "DOMINGO";
    };

    const validarDiasDisponiveis = (dias: unknown): diaSemana[] => {
        if (Array.isArray(dias)) {
            return dias.map(dia => {
                // Se for um objeto com propriedade value
                const value = getObjectValue(dia);
                if (value != null) return value;
                // Se for uma string direta
                return dia;
            }).filter(value =>
                typeof value === 'string' &&
                ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'].includes(value)
            );
        }
        return [];
    };

    const baseData = {
        nome: typeof atleta?.nome === 'string' ? atleta.nome : "",
        dataNascimento: typeof atleta?.dataNascimento === 'string' ? atleta.dataNascimento : "",
        sexo: (atleta?.sexo as Sexo) ?? 'MASCULINO',
        pesoKg: typeof atleta?.pesoKg === 'number' ? atleta.pesoKg : 0,
        alturaCm: typeof atleta?.alturaCm === 'number' ? atleta.alturaCm : 0,
        objetivo: typeof atleta?.objetivo === 'string' ? atleta.objetivo : "",
        nivelExperiencia: validarNivelExperiencia(atleta?.nivelExperiencia),
        diasDisponiveis: validarDiasDisponiveis(atleta?.diasDisponiveis),
        diaPreferidoLongo: validarDiaSemana(atleta?.diaPreferidoLongo),
        temLesao: typeof atleta?.temLesao === 'boolean' ? atleta.temLesao : false,
        descricaoLesao: typeof atleta?.descricaoLesao === 'string' ? atleta.descricaoLesao : "",
    };

    if (atleta?.id && typeof atleta.id === 'string') {
        return { ...baseData, id: atleta.id };
    }

    return baseData;
};

const AtletaDialog: React.FC<AtletaDialogProps> = ({ open, onClose, onSave, atleta }) => {
    const isEditMode = Boolean(atleta);
    const [formData, setFormData] = useState<CreateAtleta | UpdateAtleta>(getInitialFormData(atleta));
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        setFormData(getInitialFormData(atleta));
        setErrors({});
        setSubmitError(null);
    }, [atleta, open]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = event.target;

        setFormData(prev => {
            let newValue;

            if (type === 'checkbox' && name !== 'temLesao') {
                // Handle dias disponíveis checkboxes
                const currentDias = prev.diasDisponiveis || [];
                if (checked) {
                    newValue = [...currentDias, value as diaSemana];
                } else {
                    newValue = currentDias.filter(dia => dia !== value);
                }
                return { ...prev, diasDisponiveis: newValue };
            } else if (type === 'checkbox') {
                newValue = checked;
            } else if (type === 'number') {
                newValue = value ? parseFloat(value) : 0;
            } else if (name === 'diasDisponiveis') {
                // Handle multiple select for diasDisponiveis
                newValue = Array.isArray(value) ? value : [value];
            } else {
                newValue = value;
            }

            const newFormData = { ...prev, [name]: newValue };
            return newFormData;
        });

        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }

        if (submitError) {
            setSubmitError(null);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        if (!formData.nome?.trim()) newErrors.nome = 'Nome é obrigatório';
        if (!formData.dataNascimento) newErrors.dataNascimento = 'Data de nascimento é obrigatória';
        if (!formData.pesoKg || formData.pesoKg <= 0) newErrors.pesoKg = 'Peso deve ser um número positivo';
        if (!formData.alturaCm || formData.alturaCm <= 0) newErrors.alturaCm = 'Altura deve ser um número positivo';
        if (!formData.objetivo?.trim()) newErrors.objetivo = 'Objetivo é obrigatório';
        if (formData.temLesao && !formData.descricaoLesao?.trim()) newErrors.descricaoLesao = 'Descrição da lesão é obrigatória';

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
            await onSave(formData);
            handleClose();
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Erro ao salvar usuário');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = (): void => {
        if (!loading) {
            onClose();
        }
    };
    return (
    <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        slotProps={{
            paper: {
                sx: {
                    overflow: 'hidden',
                    borderRadius: 1,
                    backgroundColor: '#ffffff',
                },
            },
        }}
    >
        <DialogTitle
            sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                px: 3,
                py: 2.25,
                pr: 8,
                color: 'white',
                background: 'linear-gradient(135deg, #082130 0%, #0e3147 55%, #133c56 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
        >
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip
                        label={isEditMode ? 'Edição' : 'Cadastro'}
                        size="small"
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.12)',
                            color: '#e8eaed',
                            fontWeight: 700,
                            border: '1px solid rgba(255,255,255,0.12)',
                        }}
                    />
                </Box>
                <Typography
                    variant="h6"
                    component="div"
                    sx={{
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 800,
                        lineHeight: 1.15,
                        pr: 2,
                    }}
                >
                    {isEditMode ? 'Editar Atleta' : 'Adicionar Atleta'}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        mt: 0.75,
                        color: 'rgba(232, 234, 237, 0.72)',
                        maxWidth: 720,
                    }}
                >
                    Atualize os dados de perfil, disponibilidade e preferências mantendo a mesma linguagem visual dos outros dialogs.
                </Typography>
            </Box>

            <IconButton
                onClick={handleClose}
                disabled={loading}
                sx={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.12)',
                    },
                }}
            >
                <CloseIcon />
            </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
            <DialogContent
                dividers
                sx={{
                    p: 0,
                    background:
                        'radial-gradient(circle at top right, rgba(179,233,45,0.08), transparent 24%), linear-gradient(180deg, #eef3f8 0%, #e8edf4 100%)',
                }}
            >
                <Stack spacing={2.5} sx={{ p: { xs: 2, md: 3 } }}>
                    {submitError && <Alert severity="error">{submitError}</Alert>}
                    <Box
                        sx={{
                            borderRadius: 1,
                            border: '1px solid rgba(255,255,255,0.7)',
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.94) 100%)',
                            p: { xs: 2, md: 2.5 },
                        }}
                    >
                        <Box sx={{ mb: 2 }}>
                            <Typography
                                sx={{
                                    fontFamily: 'Syne, sans-serif',
                                    fontSize: '1.1rem',
                                    fontWeight: 800,
                                    color: '#1a2535',
                                }}
                            >
                                Dados do atleta
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, color: '#6b7a8d' }}>
                                Preencha as informações obrigatórias, rotina disponível e eventuais restrições.
                            </Typography>
                        </Box>

                        <Grid container spacing={1.5}>
                            <Grid size={6}>
                        <TextField
                            label="Nome"
                            name="nome"
                            value={formData.nome}
                            onChange={handleChange}
                            error={Boolean(errors.nome)}
                            helperText={errors.nome}
                            fullWidth
                            required
                            size="small"
                        />
                            </Grid>
                            <Grid size={6}>
                        <TextField
                            label="Data de Nascimento"
                            name="dataNascimento"
                            type="date"
                            value={formData.dataNascimento}
                            onChange={handleChange}
                            error={Boolean(errors.dataNascimento)}
                            helperText={errors.dataNascimento}
                            fullWidth
                            required
                            size="small"
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                            </Grid>
                            <Grid size={6}>
                        <TextField
                            select
                            label="Sexo"
                            name="sexo"
                            value={formData.sexo}
                            onChange={handleChange}
                            fullWidth
                            size="small"
                        >
                            {[
                                { value: 'MASCULINO', label: 'Masculino' },
                                { value: 'FEMININO',  label: 'Feminino'  },
                                { value: 'OUTRO',     label: 'Outro'     },
                            ].map(op => (
                                <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
                            ))}
                        </TextField>
                            </Grid>
                            <Grid size={6}>
                        <TextField
                            label="Peso (kg)"
                            name="pesoKg"
                            type="number"
                            value={formData.pesoKg}
                            onChange={handleChange}
                            error={Boolean(errors.pesoKg)}
                            helperText={errors.pesoKg}
                            fullWidth
                            required
                            size="small"
                        />
                            </Grid>
                            <Grid size={6}>
                        <TextField
                            label="Altura (cm)"
                            name="alturaCm"
                            type="number"
                            value={formData.alturaCm}
                            onChange={handleChange}
                            error={Boolean(errors.alturaCm)}
                            helperText={errors.alturaCm}
                            fullWidth
                            required
                            size="small"
                        />
                            </Grid>
                            <Grid size={12}>
                        <TextField
                            label="Objetivo"
                            name="objetivo"
                            value={formData.objetivo}
                            onChange={handleChange}
                            error={Boolean(errors.objetivo)}
                            helperText={errors.objetivo}
                            fullWidth
                            required
                            size="small"
                        />
                            </Grid>
                            <Grid size={6}>
                        <TextField
                            select
                            label="Nível de Experiência"
                            name="nivelExperiencia"
                            value={formData.nivelExperiencia}
                            onChange={handleChange}
                            fullWidth
                            size="small"
                        >
                            {['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'].map(option => (
                                <MenuItem key={option} value={option}>
                                    {option.charAt(0) + option.slice(1).toLowerCase()}
                                </MenuItem>
                            ))}
                        </TextField>
                            </Grid>
                            <Grid size={6}>
                        <TextField
                            select
                            label="Dia Preferido para Treino Longo"
                            name="diaPreferidoLongo"
                            value={formData.diaPreferidoLongo}
                            onChange={handleChange}
                            fullWidth
                            size="small"
                        >
                            {['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'].map(option => (
                                <MenuItem key={option} value={option}>
                                    {option.charAt(0) + option.slice(1).toLowerCase()}
                                </MenuItem>
                            ))}
                        </TextField>
                            </Grid>
                            <Grid size={12}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>
                                Dias Disponíveis para Treino
                            </Typography>
                            <FormGroup row>
                                {[
                                    { value: 'DOMINGO', label: 'Domingo' },
                                    { value: 'SEGUNDA', label: 'Segunda' },
                                    { value: 'TERCA', label: 'Terça' },
                                    { value: 'QUARTA', label: 'Quarta' },
                                    { value: 'QUINTA', label: 'Quinta' },
                                    { value: 'SEXTA', label: 'Sexta' },
                                    { value: 'SABADO', label: 'Sábado' }
                                ].map(dia => (
                                    <FormControlLabel
                                        key={dia.value}
                                        control={
                                            <Checkbox
                                                checked={formData.diasDisponiveis?.includes(dia.value as diaSemana) || false}
                                                onChange={handleChange}
                                                name="diasDisponiveis"
                                                value={dia.value}
                                            />
                                        }
                                        label={dia.label}
                                    />
                                ))}
                            </FormGroup>
                        </Box>
                            </Grid>
                            <Grid size={12}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.temLesao}
                                    onChange={handleChange}
                                    name="temLesao"
                                />
                            }
                            label="Possui Lesão"
                        />
                            </Grid>
                            {formData.temLesao && (
                                <Grid size={12}>
                            <TextField
                                label="Descrição da Lesão"
                                name="descricaoLesao"
                                value={formData.descricaoLesao}
                                onChange={handleChange}
                                error={Boolean(errors.descricaoLesao)}  
                                helperText={errors.descricaoLesao}
                                fullWidth
                                required
                                size="small"
                            />
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="caption" sx={{ color: '#6b7a8d' }}>
                        Tamanho e estilo padronizados com os dialogs de planos e detalhe.
                    </Typography>
                </Box>
                <Button onClick={handleClose} disabled={loading} size="small">Cancelar</Button>
                <Button type="submit" variant="contained" color="primary" disabled={loading} size="small">
                    {loading ? 'Salvando...' : 'Salvar'}
                </Button>
            </DialogActions>
        </form>
    </Dialog>
    )
    
}

export default AtletaDialog;
