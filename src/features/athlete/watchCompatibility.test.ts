import { describe, expect, it } from 'vitest';
import { DISPOSITIVO_MARCA_LABELS, labelDispositivoMarca, type DispositivoMarca } from '../../types/Onboarding';
import { WATCH_COMPATIBILITY, compatibilidadeDe } from './watchCompatibility';

const ORDEM_DO_FOUNDER: DispositivoMarca[] = ['GARMIN', 'APPLE', 'AMAZFIT', 'COROS', 'SAMSUNG', 'POLAR', 'SUUNTO', 'OUTRO'];

const porMarca = (marca: DispositivoMarca) => WATCH_COMPATIBILITY.find((c) => c.marca === marca)!;

describe('WATCH_COMPATIBILITY', () => {
    it('tem uma entrada por valor de DispositivoMarca, na ordem de prioridade do founder', () => {
        expect(WATCH_COMPATIBILITY.map((c) => c.marca)).toEqual(ORDEM_DO_FOUNDER);
        expect(Object.keys(DISPOSITIVO_MARCA_LABELS)).toEqual(ORDEM_DO_FOUNDER);
    });

    it('Apple e Samsung são compatíveis só via app parceiro', () => {
        for (const marca of ['APPLE', 'SAMSUNG'] as const) {
            const item = porMarca(marca);
            expect(item.posicionamento).toBe('COMPATIVEL_VIA_APP');
            expect(item.appParceiro?.length).toBeGreaterThan(0);
        }
    });

    it('Polar não tem push', () => {
        expect(porMarca('POLAR').push).toBe('SEM_PUSH');
        expect(porMarca('POLAR').posicionamento).toBe('SO_TREINO_REALIZADO');
    });

    it('Amazfit cita os dois modelos com push e a ausência de laps', () => {
        const texto = porMarca('AMAZFIT').avisos!.join(' ');
        expect(texto).toContain('T-Rex 3 Pro');
        expect(texto).toContain('Balance 2');
        expect(texto).toMatch(/laps/);
    });

    it('só o Garmin é SUPORTADO e a COROS tem critério de promoção', () => {
        expect(WATCH_COMPATIBILITY.filter((c) => c.posicionamento === 'SUPORTADO').map((c) => c.marca)).toEqual(['GARMIN']);
        expect(porMarca('COROS').posicionamento).toBe('EM_VALIDACAO');
        expect(porMarca('COROS').criterioPromocao).toBeTruthy();
    });

    it('Suunto e Outro são "ainda não coberto", e Outro cita o Xiaomi', () => {
        expect(porMarca('SUUNTO').posicionamento).toBe('NAO_COBERTO');
        expect(porMarca('OUTRO').posicionamento).toBe('NAO_COBERTO');
        expect(porMarca('OUTRO').avisos!.join(' ')).toContain('Xiaomi');
    });

    it('nenhum resumo para o treinador afirma chegada automática ao relógio', () => {
        for (const item of WATCH_COMPATIBILITY) {
            const semNegacao = item.resumoParaCoach.replace('não verificado automaticamente', '');
            expect(semNegacao, item.marca).not.toMatch(/automaticamente/);
        }
    });

    it('toda entrada tem passos, fontes e data de verificação', () => {
        for (const item of WATCH_COMPATIBILITY) {
            expect(item.passos.length, item.marca).toBeGreaterThan(0);
            expect(item.fontes.length, item.marca).toBeGreaterThan(0);
            expect(item.verificadoEm, item.marca).toMatch(/^\d{4}-\d{2}$/);
        }
    });
});

describe('compatibilidadeDe', () => {
    it('marca desconhecida cai em NAO_COBERTO com o valor cru', () => {
        const item = compatibilidadeDe('HUAWEI' as DispositivoMarca);
        expect(item.posicionamento).toBe('NAO_COBERTO');
        expect(item.marca).toBe('HUAWEI');
    });
});

describe('labelDispositivoMarca', () => {
    it('devolve o rótulo da marca conhecida e o valor cru da desconhecida', () => {
        expect(labelDispositivoMarca('SAMSUNG')).toBe('Samsung Galaxy Watch');
        expect(labelDispositivoMarca('HUAWEI')).toBe('HUAWEI');
    });
});
