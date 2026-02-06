import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, FormControlLabel, Checkbox, Alert, Typography, FormGroup, Box } from "@mui/material";
import Grid from '@mui/material/Grid';

import type { Atleta, CreateAtleta, UpdateAtleta, AtletaDialogProps, diaSemana } from "../../../types/Atleta";

interface FormErrors {
    nome?: string;
    idade?: string;
    pesoKg?: string;
    alturaCm?: string;
    objetivo?: string;
    nivelExperiencia?: string;
    diasDisponiveis?: string;
    diaPreferidoLongo?: string;
    temLesao?: string;
    descricaoLesao?: string;
}

const getInitialFormData = (atleta?: Atleta): CreateAtleta | UpdateAtleta => {
    // Garantir que os valores são sempre strings válidas para os selects
    const validarNivelExperiencia = (nivel: any): "INICIANTE" | "INTERMEDIARIO" | "AVANCADO" => {
        // Se for um objeto com propriedade value
        if (nivel && typeof nivel === 'object' && nivel.value) {
            const value = nivel.value;
            if (typeof value === 'string' && ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'].includes(value)) {
                return value as "INICIANTE" | "INTERMEDIARIO" | "AVANCADO";
            }
        }
        // Se for uma string direta
        if (typeof nivel === 'string' && ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'].includes(nivel)) {
            return nivel as "INICIANTE" | "INTERMEDIARIO" | "AVANCADO";
        }
        return "INICIANTE";
    };

    const validarDiaSemana = (dia: any): diaSemana => {
        // Se for um objeto com propriedade value
        if (dia && typeof dia === 'object' && dia.value) {
            const value = dia.value;
            if (typeof value === 'string' && ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'].includes(value)) {
                return value as diaSemana;
            }
        }
        // Se for uma string direta
        if (typeof dia === 'string' && ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'].includes(dia)) {
            return dia as diaSemana;
        }
        return "DOMINGO";
    };

    const validarDiasDisponiveis = (dias: any): diaSemana[] => {
        if (Array.isArray(dias)) {
            return dias.map(dia => {
                // Se for um objeto com propriedade value
                if (dia && typeof dia === 'object' && dia.value) {
                    return dia.value;
                }
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
        idade: typeof atleta?.idade === 'number' ? atleta.idade : 0,
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
        if (!formData.idade || formData.idade <= 0) newErrors.idade = 'Idade deve ser um número positivo';
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
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {isEditMode ? 'Editar Atleta' : 'Adicionar Atleta'}
            </Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
            <DialogContent dividers sx={{ p: 2 }}>
                {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
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
                            label="Idade"
                            name="idade"
                            type="number"
                            value={formData.idade}
                            onChange={handleChange}
                            error={Boolean(errors.idade)}
                            helperText={errors.idade}
                            fullWidth
                            required
                            size="small"
                        />
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
            </DialogContent>
            <DialogActions sx={{ px: 2, pb: 2 }}>
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
