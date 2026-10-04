import React, { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Chip,
    Skeleton,
    Typography,
} from '@mui/material';
import { usePlanoSemanal } from '../../../hooks/usePlanoSemanal';
import { useBatchPlanGeneration } from '../../../hooks/useBatchPlanGeneration';
// Import relativo (não `@/features`) por causa do gotcha do tsconfig: `@/features/*` aponta para
// `src/components/features/*`, não para `src/features/*` (ver CLAUDE.md do front).
import { usePlanGenerationActions, useAtletaPlanGeneration } from '../../../features/coach/context/planGenerationContext';
import { BatchPlanService } from '../../../api/services/BatchPlanService';
import { isBatchJobTerminal } from '../../../types/BatchPlanJob';
import { AtletasService } from '../../../api/services/AtletasService';
import { TreinoService } from '../../../api/services/TreinoService';
import type { MetodoGeracaoPlano } from '../../../types/PlanoSemanal';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';
import TreinoRealizadoDialog from './TreinoRealizadoDialog';
import DetalheTreinoDialog from './DetalheTreinoDialog';
import { PlanoSemanaPanel } from './PlanoSemanaPanel';
import { PlanosToolbar } from './PlanosToolbar';
import { SemanaTabs } from './SemanaTabs';
import { ordenarPlanosPorSemana, planoKey } from './planoSemanaUtils';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { GHOST_BTN_SX } from '../../../shared/components/actionButtonSx';
import { getSafeValue } from '../../../utils/safeValues';
import { content, semantic, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

interface PlanosDialogProps {
    open: boolean;
    onClose: () => void;
    atletaNome: string;
    atletaId: string;
    /**
     * Chamado após uma geração bem-sucedida. O dialog só recarrega a própria lista; quem o monta
     * pode ter estado derivado dos planos (ex.: badge de revisões pendentes) que ficaria defasado.
     */
    onPlanoGerado?: () => void;
}

const PlanosDialog: React.FC<PlanosDialogProps> = ({
    open,
    onClose,
    atletaNome,
    atletaId,
    onPlanoGerado,
}) => {
    const {
        planos,
        loading,
        error,
        fetchPlanosPorAtleta,
        deletePlano,
        clearPlanos
    } = usePlanoSemanal();

    // Geração de plano é assíncrona: o síncrono levava ~35-70s (cold-start) e estourava o
    // proxy_read_timeout de 60s do nginx -> 504. Reusa o fluxo de lote (lote de 1 + polling);
    // ver change gerar-plano-individual-assincrono.
    //
    // Fonte única de verdade: COM provider (roster novo), o estado vem do PlanGenerationStore e um
    // único poller (do provider) acompanha o job — o dialog só lê. SEM provider (tela legada
    // AtletasList) cai no `useBatchPlanGeneration` local. Ver change plano-em-geracao-no-roster.
    const {
        status: geracaoStatusLocal,
        loading: gerandoLocal,
        error: geracaoErrorLocal,
        gerarLote,
        reset: resetGeracao,
    } = useBatchPlanGeneration();

    const { iniciar, anexarJob, liberar, hasProvider } = usePlanGenerationActions();
    const provGen = useAtletaPlanGeneration(atletaId);

    const gerando = hasProvider ? provGen?.status === 'gerando' : gerandoLocal;

    const [modoGeracao, setModoGeracao] = useState<MetodoGeracaoPlano>('PROXIMA_SEMANA');

    // Semana em exibição (`planoKey`). Vazio = ainda não escolhida: cai no plano ativo, ou no primeiro.
    const [planoSelecionadoKey, setPlanoSelecionadoKey] = useState('');
    const [excluirOpen, setExcluirOpen] = useState(false);
    const [excluindo, setExcluindo] = useState(false);
    // Capturado ao ABRIR a confirmação, não lido de `planoSelecionado` ao confirmar: uma geração em
    // background pode recarregar a lista enquanto o dialog está aberto e, se o plano em exclusão
    // sair da janela de semanas retornada pelo backend, a seleção derivada cai para outro plano —
    // sem isso, "Confirmar" excluiria esse outro plano em vez do que o coach escolheu.
    const [excluirAlvoId, setExcluirAlvoId] = useState<string | null>(null);
    const [excluirErro, setExcluirErro] = useState<string | null>(null);
    // Erro visível das ações disparadas direto na toolbar/card (sem dialog de confirmação própria) —
    // antes só logavam no console e o treinador não tinha retorno de que a ação falhou.
    const [acaoErro, setAcaoErro] = useState<string | null>(null);

    // Estados para o modal de conclusão de treino. O plano do treino vai em estado próprio: antes
    // dividia o state com a seleção da semana, e fechar o modal zerava a seleção (e o "Excluir").
    const [conclusaoModalOpen, setConclusaoModalOpen] = useState(false);
    const [treinoSelecionado, setTreinoSelecionado] = useState<TreinoPlanejado | null>(null);
    const [planoConclusaoId, setPlanoConclusaoId] = useState<string>('');

    // Estados para o modal de detalhes do treino
    const [detalheModalOpen, setDetalheModalOpen] = useState(false);
    const [treinoDetalhe, setTreinoDetalhe] = useState<TreinoPlanejado | null>(null);

    // Carrega os planos quando o dialog abre e atletaId está disponível.
    // O PlanosDialog é UMA instância reusada para todos os atletas (AtletasList não usa key), e o
    // job de geração é assíncrono: sem resetar ao trocar de atleta ou fechar, uma conclusão do
    // atleta A cairia no contexto do atleta B (relist/alerta no atleta errado). resetGeracao para
    // o polling e zera o estado — o job segue no backend e o plano aparece ao reabrir aquele atleta.
    useEffect(() => {
        resetGeracao();
        if (open && atletaId) {
            fetchPlanosPorAtleta(atletaId);
        }
        if (!open) {
            clearPlanos();
        }
        // Nova abertura ou outro atleta: volta a mostrar o plano ativo em vez de uma semana antiga.
        setPlanoSelecionadoKey('');
    }, [open, atletaId, fetchPlanosPorAtleta, clearPlanos, resetGeracao]);

    // Dispara a geração de UM atleta pelo fluxo assíncrono (lote de 1). Bloqueia redisparo enquanto
    // um job está em andamento (o backend só deduplica dentro de um lote, não entre requisições).
    const dispararGeracao = async (modo: MetodoGeracaoPlano) => {
        if (!atletaId) {
            console.error('ID do atleta não fornecido');
            return;
        }
        if (gerando) return;
        // Reserva ANTES do POST: bloqueia um segundo disparo do mesmo atleta antes de o 202 chegar
        // (dois cliques rápidos criariam dois jobs). Sem provider, `iniciar` sempre libera.
        if (!iniciar(atletaId)) return;
        try {
            if (hasProvider) {
                // Com provider, o POST é feito aqui e o poller é do provider — o dialog não roda um
                // segundo polling. Fechar o dialog não interrompe o acompanhamento.
                const aceito = await BatchPlanService.gerarEmLote([atletaId], modo);
                anexarJob(atletaId, aceito.jobId);
            } else {
                // Legado (sem provider): o hook faz POST + polling local.
                await gerarLote([atletaId], modo);
            }
        } catch (err) {
            liberar(atletaId);
            console.error('Erro ao iniciar a geração do plano:', err);
        }
    };

    const handleGerarPlano = () => void dispararGeracao(modoGeracao);

    // Terminal COM provider: relista o plano do atleta quando o store marca concluído (a recarga do
    // roster/revisões é responsabilidade do provider, não do dialog).
    useEffect(() => {
        if (!hasProvider) return;
        if (provGen?.status === 'concluido' && atletaId) fetchPlanosPorAtleta(atletaId);
    }, [hasProvider, provGen?.status, atletaId, fetchPlanosPorAtleta]);

    // Terminal SEM provider (legado): sucesso relista o plano e avisa o pai.
    useEffect(() => {
        if (hasProvider) return;
        if (geracaoStatusLocal && isBatchJobTerminal(geracaoStatusLocal.status) && geracaoStatusLocal.gerados > 0) {
            if (atletaId) fetchPlanosPorAtleta(atletaId);
            onPlanoGerado?.();
            resetGeracao();
        }
    }, [hasProvider, geracaoStatusLocal, atletaId, fetchPlanosPorAtleta, onPlanoGerado, resetGeracao]);

    // Mensagem de falha: com provider vem do store (estado 'erro'); sem provider, do hook local
    // (erro de disparo ou terminal com erros — inclui "plano já existe"). Lote de 1: um erro basta.
    const erroDetalheLocal = geracaoStatusLocal?.errosDetalhes?.[0]?.motivo;
    const mensagemGeracao = hasProvider
        ? (provGen?.status === 'erro' ? (provGen.mensagem ?? 'Não foi possível gerar o plano. Tente novamente.') : null)
        : (geracaoErrorLocal ??
            (geracaoStatusLocal && geracaoStatusLocal.erros > 0 && geracaoStatusLocal.gerados === 0
                ? (erroDetalheLocal ?? 'Não foi possível gerar o plano. Tente novamente.')
                : null));

    const handleAbrirExclusao = () => {
        if (!planoSelecionado?.id) return;
        setExcluirAlvoId(planoSelecionado.id);
        setExcluirErro(null);
        setExcluirOpen(true);
    };

    const handleFecharExclusao = () => {
        setExcluirOpen(false);
        setExcluirAlvoId(null);
        setExcluirErro(null);
    };

    const handleConfirmarExclusao = async () => {
        const planoId = excluirAlvoId;
        if (!planoId) {
            console.error('ID do plano semanal não fornecido');
            return;
        }
        setExcluindo(true);
        setExcluirErro(null);
        try {
            // O hook recarrega a lista após excluir; a seleção derivada cai no plano ativo/primeiro.
            await deletePlano(planoId);
            setPlanoSelecionadoKey('');
            setExcluirOpen(false);
            setExcluirAlvoId(null);
        } catch (err) {
            console.error('Erro ao deletar plano semanal:', err);
            // Dialog permanece aberto mostrando o erro — fechar aqui faria o coach achar que excluiu.
            setExcluirErro('Não foi possível excluir o plano. Tente novamente.');
        } finally {
            setExcluindo(false);
        }
    };

    // Funções para o modal de conclusão
    const handleOpenConclusaoModal = (treino: TreinoPlanejado, planoSemanalId: string) => {
        setTreinoSelecionado(treino);
        setPlanoConclusaoId(planoSemanalId);
        setConclusaoModalOpen(true);
    };

    const handleCloseConclusaoModal = () => {
        setConclusaoModalOpen(false);
        setTreinoSelecionado(null);
        setPlanoConclusaoId('');
    };

    // Funções para o modal de detalhes
    const handleOpenDetalheModal = (treino: TreinoPlanejado) => {
        setTreinoDetalhe(treino);
        setDetalheModalOpen(true);
    };

    const handleCloseDetalheModal = () => {
        setDetalheModalOpen(false);
        setTreinoDetalhe(null);
    };

    const handleRecalcularMetricas = async () => {
        if (!atletaId) return;
        setAcaoErro(null);
        try {
            await AtletasService.recalcularMetricas(atletaId);
        } catch (err) {
            console.error('Erro ao recalcular métricas:', err);
            setAcaoErro('Não foi possível recalcular as métricas. Tente novamente.');
        }
    };

    const handleSuccess = async () => {
        // Recarregar os dados do plano
        if (atletaId) {
            await fetchPlanosPorAtleta(atletaId);
        }
    };

    const handleMarcarPerdido = async (treinoId: string) => {
        setAcaoErro(null);
        try {
            await TreinoService.marcarComoPerdido(treinoId);
            if (atletaId) {
                await fetchPlanosPorAtleta(atletaId);
            }
        } catch (err) {
            console.error('Erro ao marcar treino como perdido:', err);
            setAcaoErro('Não foi possível marcar o treino como perdido. Tente novamente.');
        }
    };

    // Cada semana é uma aba: o plano atual e as últimas concluídas (o backend limita a 4), da mais recente
    // para a mais antiga. "Gerar plano" depende de qualquer plano ATIVO.
    const planosOrdenados = ordenarPlanosPorSemana(planos);
    const planoAtivoIndex = planosOrdenados.findIndex(p => getSafeValue(p.status) === 'ATIVO');
    const temPlanoAtivo = planoAtivoIndex >= 0;

    // Seleção derivada: sobrevive a exclusão e a recarga da lista (chave que sumiu → ativo/primeiro).
    // Índice e plano saem do mesmo findIndex — sem um indexOf extra para redescobrir a posição.
    const planoSelecionadoIndexPorKey = planosOrdenados.findIndex((p, i) => planoKey(p, i) === planoSelecionadoKey);
    const planoSelecionadoIndex = planoSelecionadoIndexPorKey >= 0
        ? planoSelecionadoIndexPorKey
        : planoAtivoIndex >= 0
            ? planoAtivoIndex
            : planosOrdenados.length > 0 ? 0 : -1;
    const planoSelecionado = planoSelecionadoIndex >= 0 ? planosOrdenados[planoSelecionadoIndex] : null;
    const planoSelecionadoKeyEfetiva = planoSelecionado
        ? planoKey(planoSelecionado, planoSelecionadoIndex)
        : '';

    const recarregar = () => {
        if (atletaId) void fetchPlanosPorAtleta(atletaId);
    };

    const planosChips = (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
            <Chip
                label={`${planos.length} ${planos.length === 1 ? 'plano' : 'planos'}`}
                size="small"
                sx={{ bgcolor: content.cardBg, color: surface[200], fontWeight: 700, border: `1px solid ${content.cardBorder}` }}
            />
            {temPlanoAtivo && (
                <Chip
                    label="Plano ativo"
                    size="small"
                    sx={{
                        bgcolor: `${semantic.info[500]}1F`,
                        color: semantic.info[500],
                        border: `1px solid ${semantic.info[500]}4D`,
                        fontWeight: 700,
                    }}
                />
            )}
        </Box>
    );

    const alertSx = (cor: string) => ({
        bgcolor: `${cor}10`,
        border: `1px solid ${cor}33`,
        color: surface[50],
    });

    return (
        <>
        <CoachDialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            chip={planosChips}
            title={`Planos semanais de ${atletaNome}`}
            subtitle="Volume, progresso e treinos de cada semana."
            contentSx={{ p: 0, background: elevation.base }}
            actions={
                <Button onClick={onClose} size="small" sx={{ ...GHOST_BTN_SX, minHeight: 32 }}>
                    Fechar
                </Button>
            }
        >
            <PlanosToolbar
                modoGeracao={modoGeracao}
                onModoChange={setModoGeracao}
                loading={loading}
                gerando={gerando}
                temPlanoAtivo={temPlanoAtivo}
                podeExcluir={!!planoSelecionado?.id}
                onRecalcular={handleRecalcularMetricas}
                onExcluir={handleAbrirExclusao}
                onGerar={handleGerarPlano}
            />

            {planosOrdenados.length > 1 && (
                <SemanaTabs planos={planosOrdenados} value={planoSelecionadoKeyEfetiva} onChange={setPlanoSelecionadoKey} />
            )}

            <Box sx={{ px: { xs: 2, md: 2.5 }, py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {gerando && (
                    <Alert
                        severity="info"
                        icon={<CircularProgress size={18} />}
                        sx={alertSx(semantic.info[500])}
                    >
                        Gerando o plano com IA — isto pode levar cerca de um minuto. Você pode
                        fechar e voltar depois.
                    </Alert>
                )}

                {mensagemGeracao && (
                    <Alert severity="error" onClose={resetGeracao} sx={alertSx(semantic.danger[500])}>
                        {mensagemGeracao}
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={alertSx(semantic.danger[500])}>
                        {error.message}
                    </Alert>
                )}

                {acaoErro && (
                    <Alert severity="error" onClose={() => setAcaoErro(null)} sx={alertSx(semantic.danger[500])}>
                        {acaoErro}
                    </Alert>
                )}

                {loading && (
                    <Box role="status" aria-live="polite" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Typography sx={{ fontSize: '0.8125rem', color: surface[400] }}>
                            Carregando planos semanais…
                        </Typography>
                        <Skeleton variant="rounded" height={64} />
                        <Skeleton variant="rounded" height={96} />
                        <Skeleton variant="rounded" height={160} />
                    </Box>
                )}

                {!loading && !error && planos.length === 0 && (
                    <Box sx={{ py: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: surface[50] }}>
                            Nenhum plano semanal encontrado
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', color: surface[400], lineHeight: 1.5, maxWidth: 520 }}>
                            Use “Gerar plano” para criar o primeiro plano semanal deste atleta.
                        </Typography>
                    </Box>
                )}

                {!loading && !error && planoSelecionado && (
                    <PlanoSemanaPanel
                        plano={planoSelecionado}
                        gerando={gerando}
                        onEncerrado={recarregar}
                        onGerarProximaSemana={() => void dispararGeracao('PROXIMA_SEMANA')}
                        onDetalhes={handleOpenDetalheModal}
                        onMarcarRealizado={handleOpenConclusaoModal}
                        onMarcarPerdido={(treinoId) => void handleMarcarPerdido(treinoId)}
                        onRpeSalvo={recarregar}
                    />
                )}
            </Box>
        </CoachDialog>

        <ConfirmDialog
            open={excluirOpen}
            severity="danger"
            title="Excluir plano semanal?"
            message="O plano da semana selecionada e os treinos planejados dele serão removidos. Essa ação não pode ser desfeita."
            confirmLabel="Excluir plano"
            loading={excluindo}
            errorMessage={excluirErro}
            onClose={handleFecharExclusao}
            onConfirm={handleConfirmarExclusao}
        />

        <TreinoRealizadoDialog
            open={conclusaoModalOpen}
            onClose={handleCloseConclusaoModal}
            treino={treinoSelecionado}
            atletaId={atletaId}
            planoSemanalId={planoConclusaoId}
            onSuccess={handleSuccess}
        />

        <DetalheTreinoDialog
            open={detalheModalOpen}
            onClose={handleCloseDetalheModal}
            treino={treinoDetalhe}
        />
        </>
    );
};

export default PlanosDialog;
