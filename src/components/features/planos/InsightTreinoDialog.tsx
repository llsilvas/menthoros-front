import React, { useId, useState } from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { GHOST_BTN_SX } from '../../../shared/components/actionButtonSx';
import { content, semantic, surface } from '../../../theme/tokens';
import { activeTheme } from '../../../theme/activeTheme';
import { PRIMARY_CAUSE_LABEL, type AnaliseWorkout, type PrimaryAnalysisCause } from '../../../types/AnaliseWorkout';

const MONO = activeTheme.font.mono;

/**
 * Causa principal da análise. `NORMAL` é neutra; qualquer outra pede atenção do coach (âmbar).
 * O estado vai no texto e na cor do ponto, não só na cor.
 */
export const CausaChip: React.FC<{ causa: PrimaryAnalysisCause }> = ({ causa }) => {
    const atencao = causa !== 'NORMAL';
    const cor = atencao ? semantic.warning[500] : surface[400];
    return (
        <Chip
            size="small"
            label={PRIMARY_CAUSE_LABEL[causa]}
            icon={<Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cor, ml: '8px !important' }} />}
            sx={{
                bgcolor: `${cor}1F`,
                border: `1px solid ${cor}4D`,
                color: surface[50],
                fontWeight: 700,
                fontSize: '0.6875rem',
                height: 22,
            }}
        />
    );
};

/**
 * Causa principal em texto + ponto, sem pílula: versão minimalista para o card de treino.
 * O estado continua no texto e na cor do ponto (âmbar quando não é `NORMAL`).
 */
export const CausaTexto: React.FC<{ causa: PrimaryAnalysisCause }> = ({ causa }) => (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
        <Box
            component="span"
            sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, bgcolor: causa !== 'NORMAL' ? semantic.warning[500] : surface[400] }}
        />
        <Typography component="span" sx={{ fontSize: '0.6875rem', lineHeight: 1.3, color: surface[200] }}>
            {PRIMARY_CAUSE_LABEL[causa]}
        </Typography>
    </Box>
);

/**
 * Nota de execução da análise. Neutra de propósito: o RPE realizado também é "x/10" e usa cor de
 * esforço; o rótulo "Execução" e a ausência de cor evitam confundir os dois números.
 */
export const NotaExecucao: React.FC<{ valor: number; compacto?: boolean }> = ({ valor, compacto = false }) => (
    <Box sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.5 }}>
        <Typography component="span" sx={{ fontSize: '0.6875rem', color: surface[400] }}>
            Execução
        </Typography>
        <Typography component="span" sx={{ fontFamily: MONO, fontSize: compacto ? '0.6875rem' : '0.8125rem', fontWeight: 700, color: compacto ? surface[200] : surface[50] }}>
            {valor}/10
        </Typography>
    </Box>
);

const EYEBROW_SX = {
    mb: 0.75,
    fontSize: '0.6875rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 700,
    color: surface[400],
} as const;

interface InsightTreinoDialogProps {
    open: boolean;
    onClose: () => void;
    analise: AnaliseWorkout;
    /** Ex.: "Regenerativo · 6,1 km". */
    titulo: string;
    /** Ex.: "TER · 29/09". */
    dia?: string;
}

/**
 * Insight completo de um treino realizado. Ordem de leitura do coach: veredito (causa + nota), resumo,
 * Recomendação em destaque; "O que o atleta leu" é secundário e começa recolhido.
 */
const InsightTreinoDialog: React.FC<InsightTreinoDialogProps> = ({ open, onClose, analise, titulo, dia }) => {
    const [leuAberto, setLeuAberto] = useState(false);
    const leuId = useId();

    const textosAtleta = [
        analise.atletaReconhecimento,
        analise.atletaComoFoi,
        analise.atletaEsforco,
        analise.atletaProximoTreino,
    ].filter((texto): texto is string => Boolean(texto));

    const handleClose = () => {
        setLeuAberto(false);
        onClose();
    };

    return (
        <CoachDialog
            open={open}
            onClose={handleClose}
            title={titulo}
            chip={dia ? <Chip size="small" label={dia} sx={{ fontFamily: MONO, fontWeight: 700 }} /> : undefined}
            subtitle="Insight do treino"
            maxWidth="sm"
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(analise.primaryCause || analise.executionScore != null) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                        {analise.primaryCause ? <CausaChip causa={analise.primaryCause} /> : <span />}
                        {analise.executionScore != null && <NotaExecucao valor={analise.executionScore} />}
                    </Box>
                )}

                {analise.summary && (
                    <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.5, color: surface[50] }}>
                        {analise.summary}
                    </Typography>
                )}

                {analise.recommendation && (
                    <Box sx={{ p: 2, borderRadius: 1, bgcolor: content.cardBg, border: `1px solid ${content.cardBorder}` }}>
                        <Typography sx={EYEBROW_SX}>Recomendação</Typography>
                        <Typography sx={{ fontSize: '0.875rem', lineHeight: 1.6, color: surface[200], maxWidth: '62ch' }}>
                            {analise.recommendation}
                        </Typography>
                    </Box>
                )}

                {textosAtleta.length > 0 && (
                    <Box sx={{ borderRadius: 1, border: `1px solid ${content.divider}`, overflow: 'hidden' }}>
                        <Button
                            fullWidth
                            onClick={() => setLeuAberto((aberto) => !aberto)}
                            aria-expanded={leuAberto}
                            aria-controls={leuId}
                            endIcon={
                                <ExpandMoreIcon
                                    sx={{ transition: 'transform 0.2s ease', transform: leuAberto ? 'rotate(180deg)' : 'none' }}
                                />
                            }
                            sx={{
                                ...GHOST_BTN_SX,
                                justifyContent: 'space-between',
                                minHeight: 44,
                                px: 2,
                                borderRadius: 0,
                                textTransform: 'none',
                                fontWeight: 600,
                            }}
                        >
                            O que o atleta leu
                        </Button>
                        {leuAberto && (
                            <Box
                                id={leuId}
                                sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.25, borderTop: `1px solid ${content.divider}` }}
                            >
                                {textosAtleta.map((texto, idx) => (
                                    <Typography
                                        key={`atleta-${idx}`}
                                        sx={{ fontSize: '0.8125rem', lineHeight: 1.6, color: surface[200], maxWidth: '62ch' }}
                                    >
                                        {texto}
                                    </Typography>
                                ))}
                            </Box>
                        )}
                    </Box>
                )}
            </Box>
        </CoachDialog>
    );
};

export default InsightTreinoDialog;
