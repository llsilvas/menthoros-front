/**
 * Utilitarios para extrair valores seguros de objetos enum do backend.
 *
 * O backend retorna campos que podem ser strings/numeros simples ou
 * objetos com { value, label, description?, color? }. Estas funcoes
 * normalizam o acesso independentemente do formato recebido.
 */

export const getSafeValue = (value: unknown): string | number => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') {
        return value;
    }
    if (typeof value === 'object') {
        const candidate = value as { value?: unknown; label?: unknown; toString?: () => string };
        return (
            (typeof candidate.value === 'string' || typeof candidate.value === 'number' ? candidate.value : undefined) ??
            (typeof candidate.label === 'string' || typeof candidate.label === 'number' ? candidate.label : undefined) ??
            String(value)
        );
    }
    return String(value);
};

export const getSafeNumber = (value: unknown): number => {
    const safeValue = getSafeValue(value);
    return typeof safeValue === 'number' ? safeValue : parseFloat(safeValue as string) || 0;
};

export const getSafeBoolean = (value: unknown): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    if (typeof value === 'object' && value !== null) {
        const candidate = value as { value?: unknown };
        return candidate.value === true || candidate.value === 'true';
    }
    return false;
};

export const getSafeLabel = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
        const candidate = value as { label?: unknown; value?: unknown };
        return String(candidate.label ?? candidate.value ?? value);
    }
    return String(value);
};

export const getSafeColor = (value: unknown, fallback: string = '#666666'): string => {
    if (value && typeof value === 'object') {
        const candidate = value as { color?: unknown };
        if (candidate.color) {
            return String(candidate.color);
        }
    }
    return fallback;
};
