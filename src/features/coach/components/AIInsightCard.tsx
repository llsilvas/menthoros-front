import { Box, Chip, Typography } from '@mui/material';
import type { CoachAttentionItem } from '../../../types/Coach';
import { REASON_LABEL } from './coachInboxHelpers';
import { content, semantic, surface } from '../../../theme/tokens';

export interface AIInsightCardProps {
  item: CoachAttentionItem;
  /** Dias sem treinar (inatividade) ou idade do alerta; `null` quando não há dado. */
  recencyDays: number | null;
}

const SEVERIDADE = {
  CRITICA: { rotulo: 'Alerta', cor: semantic.danger[500] },
  ALTA: { rotulo: 'Alerta', cor: semantic.danger[500] },
  MEDIA: { rotulo: 'Atenção', cor: semantic.warning[500] },
} as const;

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography
        sx={{ fontSize: '0.6875rem', color: surface[500], textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.25 }}
      >
        {titulo}
      </Typography>
      {children}
    </Box>
  );
}

/**
 * Insight da IA em quatro seções fixas: **ocorrência → por que importa → evidência → ação**.
 *
 * O que havia antes era `notes` — um texto livre concatenado dos avisos do perfil — seguido de uma
 * lista de ações. O DTO da fila de atenção já trazia `primaryReason`, `evidence`, `explanation`
 * (com `rationale` e `sourceRules`) e `suggestedAction`, e **nada disso era renderizado de forma
 * estruturada**: a informação existia e chegava amassada num parágrafo.
 *
 * A estrutura importa porque o coach precisa julgar a recomendação, não obedecê-la. Separar o dado
 * que a sustenta (evidência) do raciocínio (por que importa) é o que permite discordar dela — que é
 * a tese do produto: a IA propõe, o treinador decide.
 */
export function AIInsightCard({ item, recencyDays }: AIInsightCardProps) {
  const severidade = SEVERIDADE[item.severity];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Secao titulo="Ocorrência">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            label={severidade.rotulo}
            sx={{
              bgcolor: `${severidade.cor}1F`,
              color: severidade.cor,
              border: `1px solid ${severidade.cor}55`,
              fontWeight: 700,
              fontSize: '0.6875rem',
            }}
          />
          <Typography sx={{ fontSize: '0.9rem', color: surface[50], fontWeight: 700 }}>
            {REASON_LABEL[item.primaryReason]}
            {recencyDays != null ? ` · ${recencyDays}d` : ''}
          </Typography>
        </Box>
      </Secao>

      {item.explanation?.rationale ? (
        <Secao titulo="Por que importa">
          <Typography sx={{ fontSize: '0.875rem', color: surface[100], lineHeight: 1.45 }}>
            {item.explanation.rationale}
          </Typography>
        </Secao>
      ) : null}

      {item.evidence.length > 0 ? (
        <Secao titulo="Evidência">
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {item.evidence.map((e) => (
              <Box
                key={`${e.label}-${e.value}`}
                sx={{ px: 1, py: 0.5, borderRadius: 1, border: `1px solid ${content.cardBorder}`, bgcolor: `${surface[0]}08` }}
              >
                <Typography sx={{ fontSize: '0.6875rem', color: surface[400] }}>{e.label}</Typography>
                <Typography sx={{ fontSize: '0.875rem', color: surface[50], fontWeight: 700 }}>{e.value}</Typography>
              </Box>
            ))}
          </Box>
          {item.explanation?.sourceRules?.length ? (
            // Quais regras dispararam. Sem isso, discordar do insight vira palpite contra caixa-preta.
            <Typography sx={{ fontSize: '0.6875rem', color: surface[500], mt: 0.75 }}>
              Regras: {item.explanation.sourceRules.join(', ')}
            </Typography>
          ) : null}
        </Secao>
      ) : null}

      <Secao titulo="Ação sugerida">
        <Typography sx={{ fontSize: '0.875rem', color: surface[100], lineHeight: 1.45 }}>
          {item.suggestedAction}
        </Typography>
      </Secao>
    </Box>
  );
}

export default AIInsightCard;
