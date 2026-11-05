import { useMemo } from 'react';
import { Alert, Box, Button, CircularProgress } from '@mui/material';
import WatchIcon from '@mui/icons-material/Watch';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { text } from '../../../theme/tokens';
import { buildExecucaoFromDetalhe } from '../adapters/treinoRealizadoDetalheAdapters';
import { useAnaliseTreinoRealizado, type AnaliseTreinoRealizadoState } from '../hooks/useAnaliseTreinoRealizado';
import { useTreinoRealizadoDetalhe } from '../hooks/useTreinoRealizadoDetalhe';
import type { PlanejadoComparavel } from '../types/ExecucaoTreino';
import { ExecucaoAnaliseBanner } from './ExecucaoAnaliseBanner';
import { ExecucaoComparativo } from './ExecucaoComparativo';
import { ExecucaoDadosRelogio } from './ExecucaoDadosRelogio';
import { ExecucaoEtapas } from './ExecucaoEtapas';
import { ExecucaoZonas } from './ExecucaoZonas';

export interface ExecucaoTreinoDialogProps {
    open: boolean;
    onClose: () => void;
    treinoRealizadoId: string;
    planejado: PlanejadoComparavel;
    /** Nome do treino no cabeçalho (ex.: "Longo"). */
    titulo: string;
    /** Estado da análise já buscado pelo card; sem ele o dialog busca sozinho (D4). */
    analise?: AnaliseTreinoRealizadoState;
}

function Conteudo({ treinoRealizadoId, planejado, analise: analiseDoCard }: Omit<ExecucaoTreinoDialogProps, 'open' | 'onClose' | 'titulo'>) {
    const detalhe = useTreinoRealizadoDetalhe(treinoRealizadoId);
    // Só busca a análise depois do detalhe: sem ele não se sabe se há RPE, e buscar antes piscaria
    // a nota de "depende do RPE".
    const analiseLocal = useAnaliseTreinoRealizado(
        analiseDoCard || !detalhe.data ? undefined : treinoRealizadoId,
        detalhe.data?.percepcaoEsforco != null,
    );
    const analise = analiseDoCard ?? analiseLocal;
    const execucao = useMemo(
        () => (detalhe.data ? buildExecucaoFromDetalhe(detalhe.data, planejado) : null),
        [detalhe.data, planejado],
    );

    if (detalhe.error) {
        return (
            <Alert
                severity="error"
                action={<Button color="inherit" size="small" onClick={detalhe.refetch}>Tentar de novo</Button>}
            >
                Não foi possível carregar o treino realizado.
            </Alert>
        );
    }
    if (!execucao) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress aria-label="Carregando treino realizado" />
            </Box>
        );
    }
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <ExecucaoAnaliseBanner analise={analise} />
            <ExecucaoComparativo linhas={execucao.comparativo} />
            <ExecucaoZonas zonas={execucao.zonas} />
            <ExecucaoEtapas etapas={execucao.etapas} total={execucao.total} />
            <ExecucaoDadosRelogio grupos={execucao.grupos} />
        </Box>
    );
}

/** Execução do treino realizado: planejado × realizado primeiro (protótipo B, D4). */
export function ExecucaoTreinoDialog({ open, onClose, titulo, ...resto }: ExecucaoTreinoDialogProps) {
    return (
        <CoachDialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            title={`${titulo} · execução`}
            subtitle={
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: text.secondary }}>
                    <WatchIcon sx={{ fontSize: 14 }} /> Dados do relógio
                </Box>
            }
        >
            {open && <Conteudo {...resto} />}
        </CoachDialog>
    );
}
