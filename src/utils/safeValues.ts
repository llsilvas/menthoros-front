/**
 * Utilitarios para extrair valores seguros de objetos enum do backend.
 *
 * O backend retorna campos que podem ser strings/numeros simples ou
 * objetos com { value, label, description?, color? }. Estas funcoes
 * normalizam o acesso independentemente do formato recebido.
 */

export const getSafeValue = (value: any): string | number => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
        return value.value || value.label || value.toString();
    }
    return value;
};

export const getSafeNumber = (value: any): number => {
    const safeValue = getSafeValue(value);
    return typeof safeValue === 'number' ? safeValue : parseFloat(safeValue as string) || 0;
};

export const getSafeBoolean = (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    if (typeof value === 'object' && value !== null) {
        return value.value === true || value.value === 'true';
    }
    return false;
};

export const getSafeLabel = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
        return value.label || value.value || value.toString();
    }
    return String(value);
};

export const getSafeColor = (value: any, fallback: string = '#666666'): string => {
    if (value && typeof value === 'object' && value.color) {
        return value.color;
    }
    return fallback;
};
