/**
 * Rótulos humanos dos enums de treino e de etapa, para o card do plano e o editor.
 *
 * Até aqui o card do plano escrevia o enum cru ("REGENERATIVO", "TEMPO_RUN") e o editor oferecia
 * `RECUPERACAO`/`DESAQUECIMENTO` em caixa alta sem acento como opções de um select — o treinador lê
 * o nome do banco de dados. Os valores continuam sendo os enums do backend; só o texto muda.
 */

export const TIPOS_TREINO = [
    { value: 'FACIL',        label: 'Fácil'        },
    { value: 'CONTINUO',     label: 'Contínuo'     },
    { value: 'LONGO',        label: 'Longo'        },
    { value: 'TEMPO_RUN',    label: 'Tempo Run'    },
    { value: 'INTERVALADO',  label: 'Intervalado'  },
    { value: 'FARTLEK',      label: 'Fartlek'      },
    { value: 'REGENERATIVO', label: 'Regenerativo' },
    { value: 'TIRO',         label: 'Tiro'         },
    { value: 'SUBIDA',       label: 'Subida'       },
    { value: 'PROVA',        label: 'Prova'        },
] as const;

/** Rótulo do tipo de treino; enum desconhecido volta como veio (o backend pode ganhar tipos antes do front). */
export function tipoTreinoLabel(tipo: string | undefined): string {
    if (!tipo) return 'Treino';
    return TIPOS_TREINO.find((t) => t.value === tipo.toUpperCase())?.label ?? tipo;
}

export const TIPOS_ETAPA = ['AQUECIMENTO', 'PRINCIPAL', 'INTERVALADO', 'RECUPERACAO', 'DESAQUECIMENTO'] as const;

export const TIPO_ETAPA_LABEL: Record<(typeof TIPOS_ETAPA)[number], string> = {
    AQUECIMENTO:    'Aquecimento',
    PRINCIPAL:      'Principal',
    INTERVALADO:    'Tiro / esforço',
    RECUPERACAO:    'Recuperação',
    DESAQUECIMENTO: 'Volta à calma',
};

export function tipoEtapaLabel(tipo: string | undefined): string {
    if (!tipo) return 'Etapa';
    return TIPO_ETAPA_LABEL[tipo.toUpperCase() as keyof typeof TIPO_ETAPA_LABEL] ?? tipo;
}

/** "Ter 20/10" a partir do dia da semana e da data do plano. */
export function rotuloDiaComData(dia: string, data: Date | undefined): string {
    const nome = { SEGUNDA: 'Seg', TERCA: 'Ter', QUARTA: 'Qua', QUINTA: 'Qui', SEXTA: 'Sex', SABADO: 'Sáb', DOMINGO: 'Dom' }[dia.toUpperCase()]
        ?? dia.slice(0, 3);
    if (!data) return nome;
    return `${nome} ${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`;
}
