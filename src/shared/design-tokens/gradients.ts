// Período do dia — usado pela saudação da Home do atleta (`timeOfDayNow`).
// Os gradientes por tipo de treino e o overlay por período saíram com a reescrita do hero
// (`athlete-home-restructure`): o card passou a usar `elevation`/`surface`.
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
