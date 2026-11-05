/**
 * Texto da atribuição exigida pela licença do Garmin (D6). O `deviceName` chega inconsistente
 * ("Garmin Fenix 8", "Forerunner 910XT", "unknown"): a normalização é só de exibição.
 */
export function rotuloGarmin(deviceName?: string | null): string {
    const nome = deviceName?.trim();
    if (!nome || nome.toLowerCase() === 'unknown') return 'Garmin';
    return nome.toLowerCase().startsWith('garmin') ? nome : `Garmin ${nome}`;
}
