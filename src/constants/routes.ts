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

    // Athlete shell (refine-athlete-shell-ux)
    ATHLETE_HOME:         '/athlete/home',
    ATHLETE_PLAN:         '/athlete/plan',
    ATHLETE_PROGRESS:     '/athlete/progress',
    ATHLETE_COACH:        '/athlete/coach',
    ATHLETE_PROFILE:      '/athlete/profile',
    ATHLETE_TRAINING_LOG: '/athlete/training/log',
} as const;

export type CoachRoute =
    | '/coach/inbox'
    | '/coach/athletes'
    | '/coach/calendar'
    | '/coach/insights';

export type AthleteRoute =
    | '/athlete/home'
    | '/athlete/plan'
    | '/athlete/progress'
    | '/athlete/coach'
    | '/athlete/profile'
    | '/athlete/training/log';
