import { Chip, Tooltip } from '@mui/material';
import { semantic, surface } from '../../../theme/tokens';

export interface SyncStatusChipProps {
    statusSincronizacao?: string;
    atletaConectado?: boolean;
}

const STATUS_SUCESSO = new Set(['SINCRONIZADO', 'SINCRONIZADO_PARCIAL']);

/** Nomes legíveis para os status ERRO_* — usados no tooltip do chip. */
const ERRO_TOOLTIP: Record<string, string> = {
    ERRO_TEMPORARIO: 'Erro temporário no envio ao intervals.icu',
    ERRO_AUTENTICACAO: 'Erro de autenticação com o intervals.icu',
    ERRO_VALIDACAO: 'Erro de validação do treino no intervals.icu',
    ERRO_LIMITE_RATE: 'Limite de requisições do intervals.icu excedido',
    ERRO_PERMANENTE: 'Erro permanente no envio ao intervals.icu',
};

interface ChipVisual {
    label: string;
    color: string;
    tooltip: string;
}

function resolveVisual(statusSincronizacao?: string, atletaConectado?: boolean): ChipVisual {
    // Precedência: atleta não conectado vence qualquer status de sincronização.
    if (atletaConectado === false) {
        return {
            label: 'Não conectado',
            color: surface[500],
            tooltip: 'Atleta não conectou o intervals.icu',
        };
    }

    if (statusSincronizacao && STATUS_SUCESSO.has(statusSincronizacao)) {
        return {
            label: 'No relógio',
            color: semantic.success[500],
            tooltip: 'Enviado ao intervals.icu/Garmin',
        };
    }

    if (statusSincronizacao?.startsWith('ERRO_')) {
        return {
            label: 'Erro no envio',
            color: semantic.warning[500],
            tooltip: ERRO_TOOLTIP[statusSincronizacao] ?? 'Erro no envio ao intervals.icu',
        };
    }

    return {
        label: 'Envio pendente',
        color: semantic.info[500],
        tooltip: 'Aguardando envio ao relógio',
    };
}

/** Chip compacto com o status de sincronização do treino com o intervals.icu/Garmin. */
export function SyncStatusChip({ statusSincronizacao, atletaConectado }: SyncStatusChipProps) {
    // Dado antigo (perfil sem os campos novos do backend) — não renderiza nada.
    if (statusSincronizacao === undefined && atletaConectado === undefined) {
        return null;
    }

    const { label, color, tooltip } = resolveVisual(statusSincronizacao, atletaConectado);

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
                    '& .MuiChip-label': { px: 0.6 },
                }}
            />
        </Tooltip>
    );
}
