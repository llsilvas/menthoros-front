import type { DispositivoMarca } from '../../types/Onboarding';

export type ModoPush = 'NATIVO' | 'VIA_APP_PARCEIRO' | 'SEM_PUSH' | 'NAO_VERIFICADO';
export type ModoIngestao = 'NATIVO' | 'VIA_APP_PARCEIRO' | 'NAO_VERIFICADO';
export type Posicionamento = 'SUPORTADO' | 'COMPATIVEL_VIA_APP' | 'NAO_COBERTO';

export interface ParceiroApp {
    nome: string;
    url: string;
}

export interface WatchCompatibility {
    marca: DispositivoMarca;
    posicionamento: Posicionamento;
    push: ModoPush;
    ingestao: ModoIngestao;
    /** Passo a passo para o atleta, PT-BR. */
    passos: string[];
    /** Limitações que o atleta precisa saber antes de depender do canal. */
    avisos?: string[];
    appParceiro?: ParceiroApp[];
    /** Condicional de propósito: o sistema não sabe se o atleta ligou o upload (C3), então nunca afirma chegada. */
    resumoParaCoach: string;
    /** 'YYYY-MM' — mostrado no guia; revisado pelo item recorrente do Kanban. */
    verificadoEm: string;
    fontes: string[];
}

export const ROTULO_POSICIONAMENTO: Record<Posicionamento, string> = {
    SUPORTADO: 'Suportado',
    COMPATIVEL_VIA_APP: 'Compatível via app parceiro',
    NAO_COBERTO: 'Ainda não coberto',
};

const INTERVALS_ICU = 'https://www.intervals.icu/';

/**
 * Matriz de compatibilidade por marca — conteúdo estático, ordenado pela prioridade do founder
 * (a ordem é conteúdo, por isso array e não Record). Fatia atual: Garmin e Apple Watch; as demais
 * marcas caem no fallback `NAO_COBERTO` até a entrada própria existir.
 */
export const WATCH_COMPATIBILITY: readonly WatchCompatibility[] = [
    {
        marca: 'GARMIN',
        posicionamento: 'SUPORTADO',
        push: 'NATIVO',
        ingestao: 'NATIVO',
        passos: [
            'No intervals.icu, abra Settings → Connections e conecte o Garmin.',
            'Marque a opção "Upload planned workouts".',
            'Volte ao Menthoros e conecte sua conta do intervals.icu.',
        ],
        resumoParaCoach:
            'Treinos aprovados vão ao intervals.icu e chegam ao relógio se o atleta ligou a conexão Garmin e o upload de treinos planejados (não verificado automaticamente).',
        verificadoEm: '2026-10',
        fontes: ['Gate de validação ponta a ponta de 2026-07-14', INTERVALS_ICU],
    },
    {
        marca: 'APPLE',
        posicionamento: 'COMPATIVEL_VIA_APP',
        push: 'VIA_APP_PARCEIRO',
        ingestao: 'VIA_APP_PARCEIRO',
        passos: [
            'Instale no iPhone o app Intervals.icu Companion (ou o Watchletic).',
            'No app, ligue o Apple Health e conecte à sua conta do intervals.icu.',
            'Volte ao Menthoros e conecte sua conta do intervals.icu.',
            'Abra o app no iPhone para trazer os treinos planejados ao relógio.',
        ],
        avisos: [
            'O Intervals.icu não envia treino direto ao Apple Watch: o caminho passa por um app de terceiro, que o Menthoros não controla.',
            'O envio ao app Treino do relógio pode ser manual, e treinos de natação chegam sem estrutura.',
            'O Watchletic é pago.',
        ],
        appParceiro: [
            {
                nome: 'Intervals.icu Companion',
                url: 'https://apps.apple.com/us/app/intervals-icu-companion/id6739638454',
            },
            {
                nome: 'Watchletic',
                url: 'https://forum.intervals.icu/t/intervals-icu-on-apple-watch-with-watchletic/52551',
            },
        ],
        resumoParaCoach:
            'Treinos aprovados vão ao intervals.icu; chegam ao Apple Watch só via app parceiro no iPhone do atleta, e o envio pode ser manual (não verificado automaticamente).',
        verificadoEm: '2026-10',
        fontes: [
            'Levantamento de expansão de relógios (2026-10-15), seção 2',
            'https://forum.intervals.icu/t/intervals-companion-v3-updates-for-apple-health-and-workout-syncing/124208',
        ],
    },
];

const NAO_COBERTO = (marca: DispositivoMarca): WatchCompatibility => ({
    marca,
    posicionamento: 'NAO_COBERTO',
    push: 'NAO_VERIFICADO',
    ingestao: 'NAO_VERIFICADO',
    passos: [
        'No intervals.icu, abra Settings → Connections e procure a marca do seu relógio.',
        'Se houver conexão, ligue-a; depois conecte sua conta do intervals.icu ao Menthoros.',
        'Avise seu treinador qual relógio você usa.',
    ],
    resumoParaCoach:
        'Marca ainda não coberta pelo guia: não afirmamos que os treinos chegam ao relógio.',
    verificadoEm: '2026-10',
    fontes: [INTERVALS_ICU],
});

export function compatibilidadeDe(marca: DispositivoMarca): WatchCompatibility {
    return WATCH_COMPATIBILITY.find((c) => c.marca === marca) ?? NAO_COBERTO(marca);
}
