import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { alpha } from '@mui/material/styles';
import AssessmentInfoCard from './AssessmentInfoCard';
import { primary } from '../../../theme/tokens';

vi.mock('../../../hooks/useUserInfo', () => ({
    useUserInfo: () => ({
        name: 'Leandro Silva',
        email: 'leandro@example.com',
        roles: ['treinador'],
        organizationName: 'Assessoria X',
    }),
}));

describe('AssessmentInfoCard', () => {
    it('Chip de papel usa uma cor de fundo válida (bug F4: bgcolor era a string "33")', () => {
        render(<AssessmentInfoCard />);

        const chip = screen.getByText('Treinador').closest('.MuiChip-root') as HTMLElement;
        expect(chip).toBeInTheDocument();

        const bg = getComputedStyle(chip).backgroundColor;
        expect(bg).not.toBe('');
        expect(bg).not.toBe('33');
        // mesma cor que o componente usa: alpha(primary[500], 0.2) — nunca a string literal inválida
        expect(bg).toBe(alpha(primary[500], 0.2));
    });

    it('mostra o rótulo do papel traduzido', () => {
        render(<AssessmentInfoCard />);
        expect(screen.getByText('Treinador')).toBeInTheDocument();
    });
});
