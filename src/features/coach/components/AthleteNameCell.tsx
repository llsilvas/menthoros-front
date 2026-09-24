import { Box, CircularProgress, Typography } from '@mui/material';
import { primary, semantic, surface } from '../../../theme/tokens';
import { CoachAthleteAvatar } from './CoachAthleteAvatar';
import { useAtletaPlanGeneration } from '../context/planGenerationContext';

interface AthleteNameCellProps {
    id: string;
    name: string;
    /** Há SugestaoCoach PENDING para este atleta — mesmo ponto visual do calendário (add-pending-suggestion-badge). */
    temSugestaoPendente?: boolean;
}

/**
 * Célula do atleta no roster: nome + sinal de "plano em geração" (change
 * plano-em-geracao-no-roster, design Opção B "linha viva") + sinal de sugestão pendente
 * (add-pending-suggestion-badge, design D5 — reaproveita o ponto já usado em
 * `CoachCalendarPage.tsx`, "Pending suggestion dot", em vez de uma convenção visual nova).
 *
 * Lê o estado por atletaId com assinatura seletiva (`useAtletaPlanGeneration`): só a linha em
 * geração re-renderiza a cada tick do polling; as demais linhas não são afetadas.
 */
export function AthleteNameCell({ id, name, temSugestaoPendente }: AthleteNameCellProps) {
    const gen = useAtletaPlanGeneration(id);
    const gerando = gen?.status === 'gerando';
    const concluido = gen?.status === 'concluido';
    const erro = gen?.status === 'erro';
    const accent = gerando ? primary[500] : concluido ? semantic.success[500] : erro ? semantic.danger[500] : undefined;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                height: '100%',
                width: '100%',
                position: 'relative',
                ...(accent
                    ? {
                          pl: 1.25,
                          backgroundColor: `${accent}0F`, // tint sutil (~6%)
                          '&::before': {
                              content: '""',
                              position: 'absolute',
                              left: 0,
                              top: 6,
                              bottom: 6,
                              width: 3,
                              borderRadius: 1,
                              backgroundColor: accent, // faixa "viva" na borda esquerda
                          },
                      }
                    : {}),
            }}
        >
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <CoachAthleteAvatar athlete={{ id, name }} size="xs" status="none" />
                {temSugestaoPendente ? (
                    <Box
                        title="Sugestão pendente"
                        sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: 5,
                            height: 5,
                            borderRadius: '50%',
                            backgroundColor: primary[500],
                        }}
                    />
                ) : null}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: surface[50] }} noWrap>
                    {name}
                </Typography>
                {gerando && (
                    <Typography sx={{ fontSize: '0.66rem', color: primary[500], lineHeight: 1.2 }}>Gerando plano…</Typography>
                )}
                {concluido && (
                    <Typography sx={{ fontSize: '0.66rem', color: semantic.success[500], lineHeight: 1.2 }}>
                        Plano gerado agora
                    </Typography>
                )}
                {erro && (
                    <Typography sx={{ fontSize: '0.66rem', color: semantic.danger[500], lineHeight: 1.2 }} title={gen?.mensagem}>
                        Falha ao gerar
                    </Typography>
                )}
            </Box>
            {gerando && <CircularProgress size={13} sx={{ color: primary[500], ml: 0.5, flexShrink: 0 }} />}
        </Box>
    );
}

export default AthleteNameCell;
