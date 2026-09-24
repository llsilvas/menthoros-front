import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AthleteNameCell } from './AthleteNameCell';
import { useAtletaPlanGeneration } from '../context/planGenerationContext';
import type { PlanGenerationEntry } from '../context/planGenerationStore';

vi.mock('../context/planGenerationContext', () => ({
    useAtletaPlanGeneration: vi.fn(),
}));

const mockGen = (entry: PlanGenerationEntry | undefined) => {
    vi.mocked(useAtletaPlanGeneration).mockReturnValue(entry);
};

describe('AthleteNameCell — sinal de plano em geração', () => {
    it('sem geração: mostra só o nome', () => {
        mockGen(undefined);
        render(<AthleteNameCell id="a1" name="Ana Corredora" hasPendingSuggestion={false} />);
        expect(screen.getByText('Ana Corredora')).toBeInTheDocument();
        expect(screen.queryByText(/gerando plano/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/plano gerado agora/i)).not.toBeInTheDocument();
    });

    it('gerando: mostra "Gerando plano…" e o spinner', () => {
        mockGen({ atletaId: 'a1', jobId: 'job-1', status: 'gerando' });
        render(<AthleteNameCell id="a1" name="Ana Corredora" hasPendingSuggestion={false} />);
        expect(screen.getByText(/gerando plano…/i)).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('concluido: mostra "Plano gerado agora"', () => {
        mockGen({ atletaId: 'a1', jobId: 'job-1', status: 'concluido', terminalEm: Date.now() });
        render(<AthleteNameCell id="a1" name="Ana Corredora" hasPendingSuggestion={false} />);
        expect(screen.getByText(/plano gerado agora/i)).toBeInTheDocument();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('erro: mostra "Falha ao gerar" com o motivo no title', () => {
        mockGen({ atletaId: 'a1', jobId: 'job-1', status: 'erro', mensagem: 'Já existe plano para a semana.', terminalEm: Date.now() });
        render(<AthleteNameCell id="a1" name="Ana Corredora" hasPendingSuggestion={false} />);
        const falha = screen.getByText(/falha ao gerar/i);
        expect(falha).toBeInTheDocument();
        expect(falha).toHaveAttribute('title', 'Já existe plano para a semana.');
    });
});

describe('AthleteNameCell — sinal de sugestão pendente (add-pending-suggestion-badge)', () => {
    it('hasPendingSuggestion=false: não mostra indicador', () => {
        mockGen(undefined);
        render(<AthleteNameCell id="a1" name="Ana Corredora" hasPendingSuggestion={false} />);
        expect(screen.queryByRole('img', { name: /sugestão pendente/i })).not.toBeInTheDocument();
    });

    it('hasPendingSuggestion=true: mostra o indicador — mesmo componente compartilhado com o calendário (PendingSuggestionDot)', () => {
        mockGen(undefined);
        render(<AthleteNameCell id="a1" name="Ana Corredora" hasPendingSuggestion />);
        expect(screen.getByRole('img', { name: /sugestão pendente/i })).toBeInTheDocument();
    });

    it('coexiste com o indicador de plano em geração sem sobrepor', () => {
        mockGen({ atletaId: 'a1', jobId: 'job-1', status: 'gerando' });
        render(<AthleteNameCell id="a1" name="Ana Corredora" hasPendingSuggestion />);
        expect(screen.getByText(/gerando plano…/i)).toBeInTheDocument();
        expect(screen.getByRole('img', { name: /sugestão pendente/i })).toBeInTheDocument();
    });
});
