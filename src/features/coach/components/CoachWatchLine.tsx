import { useState } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogContent, DialogTitle, Typography } from '@mui/material';
import { DISPOSITIVO_MARCA_LABELS, type DispositivoMarca } from '../../../types/Onboarding';
import type { AtletaPerfilCoachDto } from '../../../types/AtletaPerfilCoach';
import { semantic, surface } from '../../../theme/tokens';
import { WatchConnectionGuide } from '../../athlete/components/WatchConnectionGuide';
import { ROTULO_POSICIONAMENTO, compatibilidadeDe } from '../../athlete/watchCompatibility';

export interface CoachWatchLineProps {
    relogio?: AtletaPerfilCoachDto['relogio'];
    /** `avisos` do perfil: "relogio" quer dizer que a consulta falhou, o que não é "não informado". */
    avisos?: string[] | null;
    /** Canal de conexão mais recente do perfil agregado (garmin-connection, D7); ausente = nunca conectou. */
    conexaoCanal?: AtletaPerfilCoachDto['conexaoCanal'];
}

const NOME_CANAL: Record<string, string> = {
    GARMIN: 'Garmin (canal direto)',
    INTERVALS_ICU: 'intervals.icu',
};

/** Estado da conexão para o treinador: distingue "revogada" (com motivo) de "nunca conectou". */
function descreverCanal(conexao: AtletaPerfilCoachDto['conexaoCanal']): string {
    if (!conexao) return 'Canal: sem canal conectado';
    const nome = NOME_CANAL[conexao.plataforma.value] ?? conexao.plataforma.label;
    if (!conexao.ativo) {
        return `Canal: ${nome} · conexão revogada${conexao.lastSyncError ? ` (${conexao.lastSyncError})` : ''}`;
    }
    const sim = (v: boolean) => (v ? 'sim' : 'não');
    return `Canal: ${nome} · conexão ativa · envio de treinos: ${sim(conexao.workoutImport)} · leitura de atividades: ${sim(conexao.activityExport)}`;
}

/** Posicionamentos em que o treino não chega direto ao relógio: viram Alert, não texto corrido. */
const COM_ALERTA = new Set(['COMPATIVEL_VIA_APP', 'PARCIAL_POR_MODELO', 'SO_TREINO_REALIZADO']);

/**
 * Linha "Relógio" do cabeçalho do atleta para o treinador. A frase é condicional de propósito: a
 * marca é a do onboarding, não confirmada, e o sistema não sabe se o atleta ligou o upload.
 */
export function CoachWatchLine({ relogio, avisos, conexaoCanal }: CoachWatchLineProps) {
    const [guiaAberto, setGuiaAberto] = useState(false);

    if (!relogio) {
        const falhou = avisos?.includes('relogio');
        return (
            <Typography variant="caption" sx={{ color: surface[500] }}>
                {falhou ? 'Relógio indisponível' : 'Relógio não informado'}
            </Typography>
        );
    }

    const marca = relogio.marca as DispositivoMarca;
    const nomeMarca = DISPOSITIVO_MARCA_LABELS[marca] ?? relogio.marca;
    const compat = compatibilidadeDe(marca);
    const cor = compat.posicionamento === 'SUPORTADO' ? semantic.success[500] : semantic.info[500];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" sx={{ color: surface[300] }}>
                    Relógio: {nomeMarca}
                    {relogio.modelo ? ` · ${relogio.modelo}` : ''} (informado no onboarding, não confirmado)
                </Typography>
                <Chip
                    label={ROTULO_POSICIONAMENTO[compat.posicionamento]}
                    size="small"
                    sx={{ height: 20, fontSize: '0.68rem', color: cor, bgcolor: `${cor}1F`, border: `1px solid ${cor}4D` }}
                />
                <Button size="small" onClick={() => setGuiaAberto(true)} sx={{ color: surface[400], minWidth: 0 }}>
                    O que pedir ao atleta
                </Button>
            </Box>

            <Typography variant="caption" sx={{ color: surface[300] }}>
                {descreverCanal(conexaoCanal)}
            </Typography>

            {COM_ALERTA.has(compat.posicionamento) ? (
                <Alert severity="info" sx={{ fontSize: '0.8rem', py: 0 }}>
                    {compat.resumoParaCoach}
                </Alert>
            ) : (
                <Typography variant="caption" sx={{ color: surface[400] }}>
                    {compat.resumoParaCoach}
                </Typography>
            )}

            <Dialog open={guiaAberto} onClose={() => setGuiaAberto(false)} fullWidth maxWidth="sm">
                <DialogTitle>O que pedir ao atleta — {nomeMarca}</DialogTitle>
                <DialogContent>
                    <WatchConnectionGuide marcaAtual={marca} conectado={false} modoLeitura />
                </DialogContent>
            </Dialog>
        </Box>
    );
}

export default CoachWatchLine;
