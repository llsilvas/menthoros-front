import { describe, it, expect } from 'vitest';
import {
  getSafeValue,
  getSafeNumber,
  getSafeBoolean,
  getSafeLabel,
  getSafeColor,
} from './safeValues';

describe('safeValues', () => {
  describe('getSafeValue', () => {
    it('retorna string vazia para null/undefined', () => {
      expect(getSafeValue(null)).toBe('');
      expect(getSafeValue(undefined)).toBe('');
    });
    it('extrai value de objeto enum', () => {
      expect(getSafeValue({ value: 'AVANCADO', label: 'Avançado' })).toBe('AVANCADO');
    });
    it('retorna o próprio primitivo', () => {
      expect(getSafeValue(42)).toBe(42);
    });
  });

  describe('getSafeNumber', () => {
    it('converte string numérica', () => {
      expect(getSafeNumber('3.5')).toBe(3.5);
    });
    it('retorna 0 para valor não numérico', () => {
      expect(getSafeNumber(null)).toBe(0);
      expect(getSafeNumber('abc')).toBe(0);
    });
  });

  describe('getSafeBoolean', () => {
    it('mapeia boolean, string e objeto', () => {
      expect(getSafeBoolean(true)).toBe(true);
      expect(getSafeBoolean('true')).toBe(true);
      expect(getSafeBoolean({ value: true })).toBe(true);
      expect(getSafeBoolean('nao')).toBe(false);
    });
  });

  describe('getSafeLabel', () => {
    it('prefere label do objeto e normaliza primitivos', () => {
      expect(getSafeLabel({ value: 'Z2', label: 'Zona 2' })).toBe('Zona 2');
      expect(getSafeLabel(null)).toBe('');
      expect(getSafeLabel(7)).toBe('7');
    });
  });

  describe('getSafeColor', () => {
    it('usa color do objeto ou o fallback', () => {
      expect(getSafeColor({ color: '#ffffff' })).toBe('#ffffff');
      expect(getSafeColor(null, '#000000')).toBe('#000000');
    });
  });
});
