export const ROUTES = {
    // Shell legado (mantido durante transição)
    HOME: '/',
    ATLETAS: '/atletas',
    PLANOS: '/planos',
    TREINOS: '/treinos',
    RECONCILIACAO: '/reconciliacao',
    LOGIN: '/auth/login',
    REGISTRO: '/auth/registro',

    // Coach shell (standardize-coach-shell-ux)
    COACH_INBOX:    '/coach/inbox',
    COACH_ATHLETES: '/coach/athletes',
    COACH_CALENDAR: '/coach/calendar',
    COACH_INSIGHTS: '/coach/insights',
} as const;

export type CoachRoute =
    | '/coach/inbox'
    | '/coach/athletes'
    | '/coach/calendar'
    | '/coach/insights';
