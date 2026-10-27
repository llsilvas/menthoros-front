import type { DispositivoMarca } from '../../types/Onboarding';
import { runtimeConfig } from '../../config/env';

export type ModoPush =
    | 'NATIVO'
    | 'NATIVO_JANELA_7_DIAS'
    | 'PARCIAL_POR_MODELO'
    | 'VIA_APP_PARCEIRO'
    | 'SEM_PUSH'
    | 'NAO_VERIFICADO';
export type ModoIngestao = 'NATIVO' | 'VIA_APP_PARCEIRO' | 'NAO_VERIFICADO';
export type Posicionamento =
    | 'SUPORTADO'
    | 'EM_VALIDACAO'
    | 'COMPATIVEL_VIA_APP'
    | 'PARCIAL_POR_MODELO'
    | 'SO_TREINO_REALIZADO'
    | 'NAO_COBERTO';

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
    /** Só em `EM_VALIDACAO`: o que precisa acontecer para a marca virar `SUPORTADO`. */
    criterioPromocao?: string;
    /** Página do intervals.icu para o que muda rápido (janela de dias, modelos). */
    docOficialUrl?: string;
    /** 'YYYY-MM' — mostrado no guia; revisado pelo item recorrente do Kanban. */
    verificadoEm: string;
    fontes: string[];
}

export const ROTULO_POSICIONAMENTO: Record<Posicionamento, string> = {
    SUPORTADO: 'Suportado',
    EM_VALIDACAO: 'Em validação',
    COMPATIVEL_VIA_APP: 'Compatível via app parceiro',
    PARCIAL_POR_MODELO: 'Depende do modelo',
    SO_TREINO_REALIZADO: 'Só treino realizado',
    NAO_COBERTO: 'Ainda não coberto',
};

const INTERVALS_ICU = 'https://www.intervals.icu/';

/**
 * Garmin pelo intervals.icu (a entrada de antes do canal direto). Continua sendo a exposta enquanto
 * `garminHabilitado` está desligada, para a UI não mudar um byte com a flag off (CA11).
 */
const GARMIN_VIA_INTERVALS: WatchCompatibility = {
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
};

/**
 * Garmin pelo canal direto (ADR-0013): conexão na conta Garmin do atleta, sem o intervals.icu.
 * Fica "Em validação": o gate de 2026-07-14 foi feito via intervals.icu e não vale para este canal.
 */
const GARMIN_DIRETO: WatchCompatibility = {
    marca: 'GARMIN',
    posicionamento: 'EM_VALIDACAO',
    push: 'NATIVO',
    ingestao: 'NATIVO',
    passos: [
        'No Menthoros, toque em "Conectar Garmin" e entre na sua conta Garmin.',
        'Autorize o Menthoros a enviar treinos ao seu relógio e a ler as suas atividades.',
        'Mantenha o relógio sincronizado com o app Garmin Connect para receber os treinos planejados.',
    ],
    avisos: [
        'Se você não autorizar o envio de treinos, o treino planejado não chega ao relógio.',
    ],
    resumoParaCoach:
        'O atleta conecta a conta Garmin direto ao Menthoros; o treino só chega ao relógio se ele autorizou o envio de treinos e sincronizou o relógio (não verificado automaticamente).',
    criterioPromocao: 'Gate com atleta real pelo canal direto (o gate anterior foi feito por outro caminho e não vale aqui).',
    verificadoEm: '2026-10',
    fontes: ['ADR-0013', 'Garmin Connect Developer Program'],
};

/**
 * Matriz de compatibilidade por marca — conteúdo estático, ordenado pela prioridade do founder
 * (a ordem é conteúdo, por isso array e não Record). Uma entrada por `DispositivoMarca`; marca que
 * o backend devolva e este bundle não conheça cai no fallback `NAO_COBERTO`.
 */
const MARCAS: readonly WatchCompatibility[] = [
    GARMIN_VIA_INTERVALS,
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
    {
        marca: 'AMAZFIT',
        posicionamento: 'PARCIAL_POR_MODELO',
        push: 'PARCIAL_POR_MODELO',
        ingestao: 'NATIVO',
        passos: [
            'No app Zepp, conecte o Intervals.icu à sua conta.',
            'Volte ao Menthoros e conecte sua conta do intervals.icu.',
            'No T-Rex 3 Pro e no Balance 2, os próximos treinos sobem ao relógio. Nos demais modelos, importe o arquivo .fit do treino no Zepp.',
        ],
        avisos: [
            'Só o T-Rex 3 Pro e o Balance 2 recebem os próximos 7 treinos sem ação sua; nos outros modelos o treino vai ao relógio por importação manual do .fit.',
            'O Zepp não devolve as voltas (laps) dos treinos intervalados: a atividade chega sem as etapas.',
        ],
        resumoParaCoach:
            'Treinos aprovados vão ao intervals.icu; o envio ao relógio depende do modelo (T-Rex 3 Pro e Balance 2; nos demais o atleta importa o .fit à mão), e a atividade volta sem laps (não verificado automaticamente).',
        docOficialUrl: 'https://forum.intervals.icu/t/amazfit-zepp-support-available/107652?page=10',
        verificadoEm: '2026-10',
        fontes: [
            'Levantamento de expansão de relógios (2026-10-15), seção 2',
            'https://forum.intervals.icu/t/amazfit-zepp-support-available/107652?page=10',
            'https://stas.run/en/guides/connect-amazfit-to-intervals-icu',
        ],
    },
    {
        marca: 'COROS',
        posicionamento: 'EM_VALIDACAO',
        push: 'NATIVO_JANELA_7_DIAS',
        ingestao: 'NATIVO',
        passos: [
            'No intervals.icu, abra Settings → Connections e conecte a COROS.',
            'No app COROS, adicione ao calendário o plano "Intervals.icu Training Plan".',
            'Volte ao Menthoros e conecte sua conta do intervals.icu.',
        ],
        avisos: [
            'Só os próximos 7 dias aparecem no relógio.',
            'A COROS aceita um único tipo de alvo por treino (pace ou frequência cardíaca).',
            'Apagar um treino no Menthoros não o remove do calendário da COROS.',
        ],
        resumoParaCoach:
            'Treinos aprovados vão ao intervals.icu; chegam ao relógio COROS dos próximos 7 dias se o atleta conectou a COROS e adicionou o plano ao calendário (não verificado automaticamente). Marca em validação.',
        criterioPromocao:
            'Gate manual com atleta real: treino estruturado no calendário COROS, alvo único por treino e atividade de volta com laps.',
        docOficialUrl: 'https://forum.intervals.icu/t/coros-support-added/37006',
        verificadoEm: '2026-10',
        fontes: [
            'Levantamento de expansão de relógios (2026-10-15), seção 2',
            'https://forum.intervals.icu/t/coros-support-added/37006',
            'https://forum.intervals.icu/t/coros-and-structured-workouts/16859?page=4',
        ],
    },
    {
        marca: 'SAMSUNG',
        posicionamento: 'COMPATIVEL_VIA_APP',
        push: 'VIA_APP_PARCEIRO',
        ingestao: 'VIA_APP_PARCEIRO',
        passos: [
            'No Android, instale o Health Sync e ligue a leitura do Samsung Health para o intervals.icu.',
            'No relógio, instale o Watchletic para Wear OS e conecte-o à sua conta do intervals.icu.',
            'Volte ao Menthoros e conecte sua conta do intervals.icu.',
        ],
        avisos: [
            'O caminho passa por apps de terceiros, que o Menthoros não controla.',
            'O Samsung Health não repassa HRV; o sono é repassado.',
            'O Watchletic é pago.',
        ],
        appParceiro: [
            {
                nome: 'Health Sync',
                url: 'https://forum.intervals.icu/t/health-sync-now-supports-intervals-icu/92287',
            },
            {
                nome: 'Watchletic para Wear OS',
                url: 'https://www.watchletic.com/wear-os',
            },
        ],
        resumoParaCoach:
            'Treinos aprovados vão ao intervals.icu; chegam ao Galaxy Watch só via apps parceiros no celular e no relógio do atleta (não verificado automaticamente).',
        verificadoEm: '2026-10',
        fontes: [
            'Levantamento de expansão de relógios (2026-10-15), seção 2',
            'https://forum.intervals.icu/t/intervals-icu-on-wear-os-with-watchletic/130881',
            'https://forum.intervals.icu/t/not-getting-hrv-and-sleepdata-from-samsung-health/109911',
        ],
    },
    {
        marca: 'POLAR',
        posicionamento: 'SO_TREINO_REALIZADO',
        push: 'SEM_PUSH',
        ingestao: 'NATIVO',
        passos: [
            'No intervals.icu, abra Settings → Connections e conecte a Polar.',
            'Volte ao Menthoros e conecte sua conta do intervals.icu.',
            'Monte o alvo do treino à mão no Polar Flow, olhando o treino no Menthoros.',
        ],
        avisos: [
            'A conexão com a Polar só traz seus treinos realizados. O treino planejado não chega ao relógio.',
        ],
        resumoParaCoach:
            'A Polar só envia treinos realizados ao intervals.icu: o treino planejado não chega ao relógio, e o atleta monta o alvo no Polar Flow.',
        verificadoEm: '2026-10',
        fontes: [
            'Levantamento de expansão de relógios (2026-10-15), seção 2',
            'https://forum.intervals.icu/t/load-the-programmed-training-in-polar-flow/6064',
        ],
    },
    naoCoberto('SUUNTO'),
    {
        ...naoCoberto('OUTRO'),
        avisos: ['Relógios como o Xiaomi não têm passo a passo aqui. Veja se a sua marca aparece na lista de Settings → Connections.'],
    },
];

function naoCoberto(marca: DispositivoMarca): WatchCompatibility {
    return {
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
    };
}

/**
 * A matriz que a UI mostra: com o canal Garmin direto habilitado, a entrada GARMIN é a do canal
 * direto; sem ele, é a via intervals.icu de sempre. O resto da matriz é igual nos dois casos.
 */
export function matrizCompatibilidade(garminHabilitado: boolean = runtimeConfig.garminHabilitado): readonly WatchCompatibility[] {
    return garminHabilitado ? MARCAS.map((c) => (c.marca === 'GARMIN' ? GARMIN_DIRETO : c)) : MARCAS;
}

export function compatibilidadeDe(
    marca: DispositivoMarca,
    garminHabilitado: boolean | undefined = runtimeConfig.garminHabilitado,
): WatchCompatibility {
    return matrizCompatibilidade(garminHabilitado).find((c) => c.marca === marca) ?? naoCoberto(marca);
}
