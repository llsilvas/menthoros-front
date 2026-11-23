/** Estado de navegação para reabrir o inbox num atleta e numa aba (ex.: volta do ajuste da temporada). */
export interface InboxReturnState {
    atletaId?: string;
    tab?: 'diagnosis' | 'season' | 'plan' | 'races';
}
