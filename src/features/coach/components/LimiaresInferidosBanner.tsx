import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import type { LimiareisInferidosDto } from '../../../types/AtletaPerfilCoach';

interface Props {
    limiareisInferidos?: LimiareisInferidosDto | null;
}

export function LimiaresInferidosBanner({ limiareisInferidos }: Props) {
    if (!limiareisInferidos) return null;

    const { fcLimiarEstimado, paceLimiarEstimadoFormatado, confiancaInferenciaFc, confiancaInferenciaPace } =
        limiareisInferidos;

    if (!fcLimiarEstimado && !paceLimiarEstimadoFormatado) return null;

    const temConfiancaBaixa =
        confiancaInferenciaFc === 'BAIXA' || confiancaInferenciaPace === 'BAIXA';

    return (
        <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={500} gutterBottom>
                Limiares estimados por inferência — recomende um teste formal ao atleta.
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {fcLimiarEstimado && (
                    <li>
                        FC limiar estimado: {fcLimiarEstimado} bpm
                        {confiancaInferenciaFc && ` (${confiancaInferenciaFc})`}
                    </li>
                )}
                {paceLimiarEstimadoFormatado && (
                    <li>
                        Pace limiar estimado: {paceLimiarEstimadoFormatado}
                        {confiancaInferenciaPace && ` (${confiancaInferenciaPace})`}
                    </li>
                )}
            </Box>
            {temConfiancaBaixa && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <WarningAmberIcon fontSize="small" color="warning" />
                    <Typography variant="caption">
                        Poucos dados — revise as prescrições de intensidade.
                    </Typography>
                </Box>
            )}
        </Alert>
    );
}
