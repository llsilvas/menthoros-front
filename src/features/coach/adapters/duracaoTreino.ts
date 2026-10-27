/**
 * Duração de treino planejado em minutos, a partir do que o backend entrega: ISO-8601
 * (`PT90M`, `PT1H30M`) ou o legado `HH:MM:SS` / `MM:SS` (mapper `durationToString`).
 * Devolve `null` para ausente, ilegível ou zero — o card mostra "—" nesses casos.
 */
export function duracaoEmMinutos(valor: string | null | undefined): number | null {
    if (!valor) return null;
    const iso = valor.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (iso) {
        const total = parseInt(iso[1] ?? '0', 10) * 60 + parseInt(iso[2] ?? '0', 10);
        return total > 0 ? total : null;
    }
    const hms = valor.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
    if (hms) {
        const total = parseInt(hms[1] ?? '0', 10) * 60 + parseInt(hms[2], 10);
        return total > 0 ? total : null;
    }
    return null;
}
