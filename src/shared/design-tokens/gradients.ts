// Gradientes contextuais por tipo de treino (para TodayHeroCard)
// Todos são linear-gradient de 135deg, dark-first
export const workoutGradients = {
  easy_run:   'linear-gradient(135deg, #0A1628 0%, #0D2040 60%, #0F2850 100%)',   // navy + azul sutil
  long_run:   'linear-gradient(135deg, #0A1628 0%, #1A1040 60%, #22104A 100%)',   // navy + violeta
  tempo:      'linear-gradient(135deg, #0A1628 0%, #201000 60%, #2A1800 100%)',   // navy + âmbar escuro
  intervals:  'linear-gradient(135deg, #0A1628 0%, #200010 60%, #2A0010 100%)',   // navy + magenta escuro
  recovery:   'linear-gradient(135deg, #0A1628 0%, #081820 60%, #0A2028 100%)',   // navy + teal muito sutil
  rest:       'linear-gradient(135deg, #0A1628 0%, #0E1B30 100%)',                // navy → panel (flat)
  strength:   'linear-gradient(135deg, #0A1628 0%, #180A28 60%, #200A30 100%)',   // navy + roxo escuro
  crosstrain: 'linear-gradient(135deg, #0A1628 0%, #081C24 60%, #0A2030 100%)',   // navy + teal
} as const;

export type WorkoutType = keyof typeof workoutGradients;

// Ajuste de luminosidade por período do dia (aplicado como overlay)
export const timeOfDayOverlay = {
  morning:   'rgba(255, 220, 150, 0.04)',  // warm leve
  afternoon: 'rgba(0, 0, 0, 0)',            // neutro
  evening:   'rgba(150, 100, 200, 0.03)',  // purple sutil
  night:     'rgba(0, 0, 20, 0.08)',       // mais escuro
} as const;

export type TimeOfDay = keyof typeof timeOfDayOverlay;
