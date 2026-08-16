import { semantic, surface } from '../../../theme/tokens';
import type { CoachAtletaStatus } from '../../../types/Coach';
import type { AttentionInfo } from '../adapters/coachInboxAdapters';
import type { PlanoReviewStatus } from '../../../types/PlanoReview';


export function statusPalette(status: CoachAtletaStatus): { bg: string; fg: string; border: string } {
  if (status === 'active') {
    return { bg: `${semantic.success[500]}1A`, fg: semantic.success[500], border: `${semantic.success[500]}44` };
  }
  if (status === 'warning') {
    return { bg: `${semantic.warning[500]}1A`, fg: semantic.warning[500], border: `${semantic.warning[500]}44` };
  }
  if (status === 'danger') {
    return { bg: `${semantic.danger[500]}1A`, fg: semantic.danger[500], border: `${semantic.danger[500]}44` };
  }
  return { bg: `${surface[500]}1A`, fg: surface[300], border: `${surface[500]}44` };
}

export function statusLabel(status: CoachAtletaStatus): string {
  if (status === 'active') return 'Ativo';
  if (status === 'warning') return 'Atenção';
  if (status === 'danger') return 'Alerta';
  return 'Pausado';
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

export function formatKm(value: number): string {
  return `${value} km`;
}

export function formatDashboardDate(dateIso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' }).format(new Date(`${dateIso}T12:00:00`));
}

export function formatWorkoutTypeLabel(tipoTreino?: string): string {
  if (!tipoTreino) return 'Treino';
  return tipoTreino
    .toLowerCase()
    .replaceAll('_', ' ')
    .split(' ')
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : part))
    .join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Ação primária do painel (refine-inbox-visual-hierarchy, tasks 1.2 e 1.3)
// ─────────────────────────────────────────────────────────────────────────────

export type PrimaryActionKind = 'aprovar-plano' | 'contatar-atleta' | 'abrir-plano';

export interface PrimaryAction {
  kind: PrimaryActionKind;
  label: string;
  /** `false` = navegação; renderiza como secundária e **não** usa o accent. */
  primary: boolean;
}

export interface PrimaryActionInput {
  planReviewStatus: PlanoReviewStatus | null;
  planId: string | null;
  attention: AttentionInfo | null;
}

/**
 * Motivos que se resolvem **conversando** com o atleta. Sobrecarga e zonas vencidas se resolvem
 * ajustando o plano — mandar o coach conversar nesses casos gasta a ação primária com a coisa
 * errada.
 */
const MOTIVOS_DE_ENGAJAMENTO: ReadonlySet<AttentionInfo['reason']> = new Set(['INATIVIDADE', 'ADERENCIA']);

/**
 * Qual ação o painel oferece — **nunca** "nenhuma".
 *
 * O defeito que isto corrige: a tela renderizava "Aprovar plano" em cinza, desabilitado, como
 * estado default. Um botão morto ocupa o lugar da ação que existe. Aqui, quando aprovar não se
 * aplica, a ação **troca**; ela nunca apaga.
 *
 * Precedência: plano aguardando revisão → sinal de engajamento → abrir plano (navegação).
 * Sugestão pendente e prova próxima ficaram fora desta change (Q10), e caem no default.
 */
export function resolvePrimaryAction({ planReviewStatus, planId, attention }: PrimaryActionInput): PrimaryAction {
  if (planId && planReviewStatus === 'AGUARDANDO_REVISAO') {
    return { kind: 'aprovar-plano', label: 'Aprovar plano', primary: true };
  }
  if (attention && MOTIVOS_DE_ENGAJAMENTO.has(attention.reason)) {
    return { kind: 'contatar-atleta', label: 'Contatar atleta', primary: true };
  }
  return { kind: 'abrir-plano', label: 'Abrir plano', primary: false };
}

export type ActionAvailability = 'ready' | 'loading' | 'stale' | 'forbidden' | 'error';

/**
 * Se a ação está clicável **agora** — separado de qual ação é, de propósito.
 *
 * A regra "sem botão desabilitado" vale para *aplicabilidade* (ação que não cabe troca por outra),
 * nunca para *disponibilidade*: mutação em voo, plano já processado por outra sessão e falta de
 * permissão continuam produzindo estado explícito. Sem essa separação, ou some o feedback de
 * operação, ou volta o botão morto.
 */
export function resolveActionAvailability(
  { acting, lastErrorStatus }: { acting: boolean; lastErrorStatus: number | null },
): ActionAvailability {
  if (acting) return 'loading';
  if (lastErrorStatus === 403) return 'forbidden';
  if (lastErrorStatus === 409 || lastErrorStatus === 422) return 'stale';
  if (lastErrorStatus != null) return 'error';
  return 'ready';
}

/**
 * Rótulo curto do motivo de atenção — o mesmo mapa estava copiado em três componentes
 * (`QueueRow`, `AttentionOnlyRow`, `CoachAttentionQueuePage`). Três cópias de um enum-para-texto
 * não permanecem iguais: basta o backend ganhar um motivo novo para uma delas passar a exibir
 * `undefined` enquanto as outras funcionam.
 */
export const REASON_LABEL: Record<AttentionInfo['reason'], string> = {
  FADIGA: 'Fadiga',
  SOBRECARGA: 'Sobrecarga',
  SEM_PLANO: 'Sem plano',
  ADERENCIA: 'Aderência',
  INATIVIDADE: 'Inatividade',
  ZONAS_VENCIDAS: 'Zonas vencidas',
};

const MOTIVO_TEXTO: Record<AttentionInfo['reason'], string> = {
  FADIGA: 'sinais de fadiga acumulada',
  SOBRECARGA: 'carga acima do previsto',
  SEM_PLANO: 'ausência de plano ativo',
  ADERENCIA: 'queda na aderência ao plano',
  INATIVIDADE: 'ausência de treinos registrados',
  ZONAS_VENCIDAS: 'zonas de treino desatualizadas',
};

/**
 * Rascunho de contato, pronto para colar.
 *
 * O botão "Contatar atleta" disparava um toast dizendo "Mensagem preparada para o atleta" — e nada
 * era preparado nem enviado. Como o DTO do atleta não expõe telefone nem e-mail, não há deep-link
 * possível hoje; o que dá para entregar é o texto pronto, com o que o coach diria.
 */
export function montarRascunhoContato(nome: string, attention: AttentionInfo | null): string {
  const abertura = `Oi, ${nome}! Tudo bem?`;

  if (!attention) {
    return `${abertura}\n\nPassando para saber como está a rotina de treinos. Me conta como você está se sentindo?`;
  }

  const desde = attention.recencyDays != null ? ` (há ${attention.recencyDays} dias)` : '';
  return [
    abertura,
    '',
    `Olhando seus últimos registros, notei ${MOTIVO_TEXTO[attention.reason]}${desde}.`,
    `Sugestão: ${attention.suggestedAction}`,
    '',
    'Me conta como você está se sentindo para ajustarmos o plano juntos.',
  ].join('\n');
}
