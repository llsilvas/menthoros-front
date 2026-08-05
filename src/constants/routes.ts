export const ROUTES = {
    // `/` é a landing pública (marketing). A home autenticada legada vive em `/inicio`.
    HOME: '/',
    INICIO: '/inicio',
    ATLETAS: '/atletas',
    PLANOS: '/planos',
    TREINOS: '/treinos',
    RECONCILIACAO: '/reconciliacao',
    LOGIN: '/auth/login',
    REGISTRO: '/auth/registro',
    WAITLIST: '/waitlist',
    PRIVACIDADE: '/privacidade',
    TERMOS: '/termos',

    // Coach shell (standardize-coach-shell-ux)
    COACH_INBOX:    '/coach/inbox',
    COACH_SETTINGS: '/coach/settings',
    COACH_ATHLETES: '/coach/athletes',
    COACH_CALENDAR: '/coach/calendar',
    COACH_INSIGHTS: '/coach/insights',
    COACH_PLAN_REVIEW: '/coach/planos/revisao',

    // Athlete shell (refine-athlete-shell-ux)
    ATHLETE_HOME:         '/athlete/home',
    ATHLETE_PLAN:         '/athlete/plan',
    ATHLETE_PROGRESS:     '/athlete/progress',
    ATHLETE_COACH:        '/athlete/coach',
    ATHLETE_PROFILE:      '/athlete/profile',
    ATHLETE_TRAINING_LOG: '/athlete/training/log',
    ATHLETE_ONBOARDING:   '/athlete/onboarding',
} as const;

export type CoachRoute =
    | '/coach/inbox'
    | '/coach/settings'
    | '/coach/athletes'
    | '/coach/calendar'
    | '/coach/insights'
    | '/coach/planos/revisao';

export type AthleteRoute =
    | '/athlete/home'
    | '/athlete/plan'
    | '/athlete/progress'
    | '/athlete/coach'
    | '/athlete/profile'
    | '/athlete/training/log'
    | '/athlete/onboarding';
