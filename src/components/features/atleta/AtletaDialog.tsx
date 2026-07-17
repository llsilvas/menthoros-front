import React, { useState, useEffect } from "react";
import { Button, TextField, MenuItem, FormControlLabel, Checkbox, Alert, Typography, FormGroup, Box, Chip, Stack, useMediaQuery } from "@mui/material";
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import { primary, surface, content } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { GHOST_BTN_SX, PRIMARY_BTN_SX } from '../../../shared/components/actionButtonSx';

import type { Atleta, CreateAtleta, UpdateAtleta, AtletaDialogProps, diaSemana, Sexo, TipoPlanoAtleta } from "../../../types/Atleta";

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
        tipoPlanoAtleta: atleta?.tipoPlanoAtleta,
        dataVencimentoPlano: typeof atleta?.dataVencimentoPlano === 'string' ? atleta.dataVencimentoPlano : "",
    };

    if (atleta?.id && typeof atleta.id === 'string') {
        return { ...baseData, id: atleta.id };
    }

    return baseData;
};

const AtletaDialog: React.FC<AtletaDialogProps> = ({ open, onClose, onSave, atleta }) => {
    const isEditMode = Boolean(atleta);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
            // tipoPlanoAtleta/dataVencimentoPlano são opcionais — string vazia vira undefined
            // para não enviar um enum/LocalDate inválido ao backend (campo "não definido").
            await onSave({
                ...formData,
                tipoPlanoAtleta: formData.tipoPlanoAtleta || undefined,
                dataVencimentoPlano: formData.dataVencimentoPlano || undefined,
            });
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
    const atletaChip = (
        <Chip
            label={isEditMode ? 'Edição' : 'Cadastro'}
            size="small"
            sx={{
                bgcolor: content.cardBgHover,
                color: surface[200],
                fontWeight: 700,
                border: `1px solid ${content.cardBorder}`,
            }}
        />
    );

    return (
        <CoachDialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            disableClose={loading}
            chip={atletaChip}
            title={isEditMode ? 'Editar Atleta' : 'Adicionar Atleta'}
            subtitle="Atualize os dados de perfil, disponibilidade e preferências mantendo a mesma linguagem visual dos outros dialogs."
            component="form"
            onSubmit={handleSubmit}
            dividers
            contentSx={{
                p: 0,
                background: `radial-gradient(circle at top right, ${primary[500]}14, transparent 24%), linear-gradient(180deg, ${elevation.base} 0%, ${elevation.panel} 100%)`,
            }}
            actionsHint={
                <Typography variant="caption" sx={{ color: surface[400] }}>
                    Tamanho e estilo padronizados com os dialogs de planos e detalhe.
                </Typography>
            }
            actions={
                <>
                    <Button onClick={handleClose} disabled={loading} size="small" fullWidth={isMobile} sx={{ ...GHOST_BTN_SX, fontSize: { xs: '0.8rem', md: '0.875rem' }, minHeight: { xs: 40, md: 32 } }}>Cancelar</Button>
                    <Button type="submit" variant="contained" disabled={loading} size="small" fullWidth={isMobile} sx={{ ...PRIMARY_BTN_SX, fontSize: { xs: '0.8rem', md: '0.875rem' }, minHeight: { xs: 40, md: 32 } }}>
                        {loading ? 'Salvando...' : 'Salvar'}
                    </Button>
                </>
            }
        >
                <Stack spacing={2.5} sx={{ p: { xs: 1.5, md: 3 } }}>
                    {submitError && <Alert severity="error">{submitError}</Alert>}
                    <Box
                        sx={{
                            borderRadius: 1,
                            border: `1px solid ${content.cardBorder}`,
                            background: elevation.card,
                            p: { xs: 2, md: 2.5 },
                        }}
                    >
                        <Box sx={{ mb: 2 }}>
                            <Typography
                                sx={{
                                    fontFamily: 'Syne, sans-serif',
                                    fontSize: '1.1rem',
                                    fontWeight: 800,
                                    color: surface[50],
                                }}
                            >
                                Dados do atleta
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, color: surface[400] }}>
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
                            <Grid size={6}>
                        <TextField
                            select
                            label="Tipo de Plano (com a assessoria)"
                            name="tipoPlanoAtleta"
                            value={formData.tipoPlanoAtleta ?? ''}
                            onChange={handleChange}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value="">Não definido</MenuItem>
                            {(['MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'] as TipoPlanoAtleta[]).map(option => (
                                <MenuItem key={option} value={option}>
                                    {option.charAt(0) + option.slice(1).toLowerCase()}
                                </MenuItem>
                            ))}
                        </TextField>
                            </Grid>
                            <Grid size={6}>
                        <TextField
                            label="Vencimento do Plano"
                            name="dataVencimentoPlano"
                            type="date"
                            value={formData.dataVencimentoPlano ?? ''}
                            onChange={handleChange}
                            fullWidth
                            size="small"
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
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
        </CoachDialog>
    )

}

export default AtletaDialog;
