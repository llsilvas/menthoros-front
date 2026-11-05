import type { ConexaoCanalDto } from '../../../types/AtletaPerfilCoach';
import type { WatchChannel } from '../components/TreinoEditDialog';

/**
 * Canal que recebe o treino editado (coach-editar-treino-aprovado, D6): só conexão ativa. Revogada
 * conta como relógio para travar o treino de hoje, mas isso o backend já resolve em `editable`.
 */
export function buildWatchChannelFromConexao(conexao: ConexaoCanalDto | null | undefined): WatchChannel | null {
    if (!conexao?.ativo) return null;
    const plataforma = conexao.plataforma?.value;
    return plataforma === 'GARMIN' || plataforma === 'INTERVALS_ICU' ? plataforma : null;
}
