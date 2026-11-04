import { Chip, Tooltip } from '@mui/material';
import { semantic, surface } from '../../../theme/tokens';
import { buildSyncReasonFromStatus } from '../adapters/syncReason';

export interface SyncStatusChipProps {
    statusSincronizacao?: string;
    /** Atleta tem canal de treinos conectado (Garmin ou intervals.icu). */
    atletaConectado?: boolean;
    /** Motivo vindo do backend (ERRO_VALIDACAO e SINCRONIZADO_PARCIAL). */
    syncError?: string | null;
}

const STATUS_SUCESSO = new Set(['SINCRONIZADO', 'SINCRONIZADO_PARCIAL']);

interface ChipVisual {
    label: string;
    color: string;
    tooltip: string;
}

function tooltipDoMotivo(statusSincronizacao: string, syncError?: string | null): string | null {
    const reason = buildSyncReasonFromStatus(statusSincronizacao, syncError);
    if (!reason) return null;
    return [reason.motivo, reason.detalhe, reason.acao].filter(Boolean).join(' — ');
}

function resolveVisual(statusSincronizacao?: string, atletaConectado?: boolean, syncError?: string | null): ChipVisual {
    // Precedência: atleta não conectado vence qualquer status de sincronização.
    if (atletaConectado === false) {
        return {
            label: 'Não conectado',
            color: surface[500],
            tooltip: 'Atleta sem canal conectado',
        };
    }

    if (statusSincronizacao && STATUS_SUCESSO.has(statusSincronizacao)) {
        return {
            label: 'No relógio',
            color: semantic.success[500],
            tooltip: tooltipDoMotivo(statusSincronizacao, syncError) ?? 'Enviado ao relógio',
        };
    }

    if (statusSincronizacao?.startsWith('ERRO_')) {
        return {
            label: 'Erro no envio',
            color: semantic.warning[500],
            tooltip: tooltipDoMotivo(statusSincronizacao, syncError) ?? 'Erro no envio ao relógio',
        };
    }

    return {
        label: 'Envio pendente',
        color: semantic.info[500],
        tooltip: 'Aguardando envio ao relógio',
    };
}

/** Chip compacto com o status de envio do treino ao relógio (Garmin ou intervals.icu). */
export function SyncStatusChip({ statusSincronizacao, atletaConectado, syncError }: SyncStatusChipProps) {
    // Dado antigo (perfil sem os campos novos do backend) — não renderiza nada.
    if (statusSincronizacao === undefined && atletaConectado === undefined) {
        return null;
    }

    const { label, color, tooltip } = resolveVisual(statusSincronizacao, atletaConectado, syncError);

    return (
        <Tooltip title={tooltip} enterDelay={0}>
            <Chip
                label={label}
                size="small"
                sx={{
                    height: 18,
                    fontSize: '0.62rem',
                    fontWeight: 600,
                    color,
                    bgcolor: `${color}1F`,
                    border: `1px solid ${color}4D`,
                    flexShrink: 0,
                    '& .MuiChip-label': { px: 0.6 },
                }}
            />
        </Tooltip>
    );
}
