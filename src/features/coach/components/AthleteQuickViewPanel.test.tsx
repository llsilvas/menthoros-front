import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AthleteQuickViewPanel, type AthleteQuickViewSnapshot } from './AthleteQuickViewPanel';
import { useAthletePmc } from '../../../hooks/useAthletePmc';
import type { PMCDataPoint } from '../../athlete/components/PMCChart';

vi.mock('../../../hooks/useAthletePmc');
// PMCChart usa recharts (ResponsiveContainer colapsa em jsdom) — stub para isolar o painel.
vi.mock('../../athlete/components/PMCChart', () => ({
    PMCChart: () => <div>stub-pmc-chart</div>,
    default: () => <div>stub-pmc-chart</div>,
}));

const SNAPSHOT: AthleteQuickViewSnapshot = {
    id: 'a1',
    name: 'Ana Silva',
    phase: 'BASE',
    status: 'active',
    ctl: 52,
    atl: 60,
    tsb: -8,
    weeklyVolume: 32,
};

const SERIE: PMCDataPoint[] = [
    { date: new Date('2026-06-17'), ctl: 52, atl: 60, tsb: -8, tss: 85 },
];

function mockPmc(over: Partial<ReturnType<typeof useAthletePmc>> = {}) {
    vi.mocked(useAthletePmc).mockReturnValue({
        data: SERIE,
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue(undefined),
        ...over,
    });
}

describe('AthleteQuickViewPanel', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renderiza o snapshot do roster (nome, CTL, ATL, TSB, volume) via props', () => {
        mockPmc();
        render(<AthleteQuickViewPanel snapshot={SNAPSHOT} onVerPerfilCompleto={vi.fn()} />);

        expect(screen.getByText('Ana Silva')).toBeInTheDocument();
        expect(screen.getByText('52')).toBeInTheDocument();   // CTL
        expect(screen.getByText('60')).toBeInTheDocument();   // ATL
        expect(screen.getByText('-8')).toBeInTheDocument();   // TSB
        expect(screen.getByText(/32\s*km/)).toBeInTheDocument(); // volume semanal
    });

    it('rotula a forma via formVariantLabel a partir do TSB (sem assertir limiar)', () => {
        mockPmc();
        render(<AthleteQuickViewPanel snapshot={SNAPSHOT} onVerPerfilCompleto={vi.fn()} />);
        // TSB -8 → faixa estável (label vem do mapa canônico, não recalculado no componente)
        expect(screen.getByText('Estável')).toBeInTheDocument();
    });

    it('exibe estado de carregamento enquanto a série não chegou', () => {
        mockPmc({ data: [], isLoading: true });
        render(<AthleteQuickViewPanel snapshot={SNAPSHOT} onVerPerfilCompleto={vi.fn()} />);

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        // snapshot continua visível mesmo carregando
        expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    });

    it('exibe erro com ação de tentar novamente que chama refetch', () => {
        const refetch = vi.fn().mockResolvedValue(undefined);
        mockPmc({ data: [], error: new Error('boom'), refetch });
        render(<AthleteQuickViewPanel snapshot={SNAPSHOT} onVerPerfilCompleto={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));
        expect(refetch).toHaveBeenCalled();
    });

    it('exibe estado vazio quando o atleta não tem PMC', () => {
        mockPmc({ data: [] });
        render(<AthleteQuickViewPanel snapshot={SNAPSHOT} onVerPerfilCompleto={vi.fn()} />);

        expect(screen.getByText(/sem hist[oó]rico de pmc/i)).toBeInTheDocument();
        expect(screen.queryByText('stub-pmc-chart')).not.toBeInTheDocument();
    });

    it('renderiza o PMCChart quando há série', () => {
        mockPmc();
        render(<AthleteQuickViewPanel snapshot={SNAPSHOT} onVerPerfilCompleto={vi.fn()} />);
        expect(screen.getByText('stub-pmc-chart')).toBeInTheDocument();
    });

    it('aciona onVerPerfilCompleto no CTA "Ver perfil completo"', () => {
        mockPmc();
        const onVer = vi.fn();
        render(<AthleteQuickViewPanel snapshot={SNAPSHOT} onVerPerfilCompleto={onVer} />);

        fireEvent.click(screen.getByRole('button', { name: /ver perfil completo/i }));
        expect(onVer).toHaveBeenCalledTimes(1);
    });
});
