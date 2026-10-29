import { describe, expect, it } from 'vitest';
import { DISPOSITIVO_MARCA_LABELS, labelDispositivoMarca, type DispositivoMarca } from '../../types/Onboarding';
import { compatibilidadeDe, matrizCompatibilidade } from './watchCompatibility';

// Flag desligada: a matriz de hoje (CA11). Os casos do canal direto estão no describe de baixo.
const WATCH_COMPATIBILITY = matrizCompatibilidade(false);

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

describe('canal Garmin direto (garminHabilitado)', () => {
    const direto = () => compatibilidadeDe('GARMIN', true);

    it('com a flag ligada, GARMIN é "Em validação" com critério de promoção explícito', () => {
        expect(direto().posicionamento).toBe('EM_VALIDACAO');
        expect(direto().criterioPromocao).toMatch(/canal direto/);
    });

    it('com a flag ligada, a entrada GARMIN não menciona o intervals.icu em lugar nenhum', () => {
        expect(JSON.stringify(direto()).toLowerCase()).not.toContain('intervals');
    });

    it('com a flag ligada, os passos descrevem autorizar o Menthoros na conta Garmin', () => {
        expect(direto().passos.join(' ')).toMatch(/Conectar Garmin/);
        expect(direto().passos.join(' ')).toMatch(/Autorize o Menthoros/);
    });

    it('o resumo para o treinador não afirma chegada automática ao relógio', () => {
        const semNegacao = direto().resumoParaCoach.replace('não verificado automaticamente', '');
        expect(semNegacao).not.toMatch(/automaticamente/);
    });

    it('só a entrada GARMIN muda entre as flags; a ordem e as demais marcas ficam iguais', () => {
        const off = matrizCompatibilidade(false);
        const on = matrizCompatibilidade(true);
        expect(on.map((c) => c.marca)).toEqual(off.map((c) => c.marca));
        expect(on.filter((c, i) => c !== off[i]).map((c) => c.marca)).toEqual(['GARMIN']);
    });

    it('com a flag desligada, GARMIN segue SUPORTADO via intervals.icu (inalterado)', () => {
        const item = compatibilidadeDe('GARMIN', false);
        expect(item.posicionamento).toBe('SUPORTADO');
        expect(item.passos.join(' ')).toContain('intervals.icu');
    });
});
