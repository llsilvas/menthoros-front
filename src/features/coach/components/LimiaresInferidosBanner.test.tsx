import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LimiaresInferidosBanner } from './LimiaresInferidosBanner';
import type { LimiareisInferidosDto } from '../../../types/AtletaPerfilCoach';

describe('LimiaresInferidosBanner', () => {
    it('não renderiza quando limiareisInferidos é null', () => {
        const { container } = render(<LimiaresInferidosBanner limiareisInferidos={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('não renderiza quando limiareisInferidos é undefined', () => {
        const { container } = render(<LimiaresInferidosBanner />);
        expect(container.firstChild).toBeNull();
    });

    it('não renderiza quando ambos os campos estão ausentes', () => {
        const dados: LimiareisInferidosDto = { dataInferenciaLimiar: '2026-06-22' };
        const { container } = render(<LimiaresInferidosBanner limiareisInferidos={dados} />);
        expect(container.firstChild).toBeNull();
    });

    it('renderiza FC limiar quando apenas fcLimiarEstimado está presente', () => {
        const dados: LimiareisInferidosDto = {
            fcLimiarEstimado: 163,
            confiancaInferenciaFc: 'ALTA',
        };
        render(<LimiaresInferidosBanner limiareisInferidos={dados} />);

        expect(screen.getByText(/FC limiar estimado: 163 bpm/)).toBeInTheDocument();
        expect(screen.getByText(/\(ALTA\)/)).toBeInTheDocument();
        expect(screen.queryByText(/Pace limiar/)).toBeNull();
    });

    it('renderiza pace limiar quando apenas paceLimiarEstimadoFormatado está presente', () => {
        const dados: LimiareisInferidosDto = {
            paceLimiarEstimadoFormatado: '4:45/km',
            confiancaInferenciaPace: 'MEDIA',
        };
        render(<LimiaresInferidosBanner limiareisInferidos={dados} />);

        expect(screen.getByText(/Pace limiar estimado: 4:45\/km/)).toBeInTheDocument();
        expect(screen.getByText(/\(MEDIA\)/)).toBeInTheDocument();
        expect(screen.queryByText(/FC limiar/)).toBeNull();
    });

    it('renderiza FC e pace quando ambos estão presentes', () => {
        const dados: LimiareisInferidosDto = {
            fcLimiarEstimado: 163,
            confiancaInferenciaFc: 'ALTA',
            paceLimiarEstimadoFormatado: '4:45/km',
            confiancaInferenciaPace: 'MEDIA',
        };
        render(<LimiaresInferidosBanner limiareisInferidos={dados} />);

        expect(screen.getByText(/FC limiar estimado: 163 bpm/)).toBeInTheDocument();
        expect(screen.getByText(/Pace limiar estimado: 4:45\/km/)).toBeInTheDocument();
    });

    it('exibe texto fixo de recomendação de teste formal', () => {
        const dados: LimiareisInferidosDto = { fcLimiarEstimado: 163 };
        render(<LimiaresInferidosBanner limiareisInferidos={dados} />);

        expect(
            screen.getByText(/Limiares estimados por inferência — recomende um teste formal ao atleta\./),
        ).toBeInTheDocument();
    });

    it('exibe aviso adicional quando confiancaInferenciaFc é BAIXA', () => {
        const dados: LimiareisInferidosDto = {
            fcLimiarEstimado: 160,
            confiancaInferenciaFc: 'BAIXA',
        };
        render(<LimiaresInferidosBanner limiareisInferidos={dados} />);

        expect(
            screen.getByText(/Poucos dados — revise as prescrições de intensidade\./),
        ).toBeInTheDocument();
    });

    it('exibe aviso adicional quando confiancaInferenciaPace é BAIXA', () => {
        const dados: LimiareisInferidosDto = {
            paceLimiarEstimadoFormatado: '5:10/km',
            confiancaInferenciaPace: 'BAIXA',
        };
        render(<LimiaresInferidosBanner limiareisInferidos={dados} />);

        expect(
            screen.getByText(/Poucos dados — revise as prescrições de intensidade\./),
        ).toBeInTheDocument();
    });

    it('não exibe aviso de BAIXA quando confiança é ALTA', () => {
        const dados: LimiareisInferidosDto = {
            fcLimiarEstimado: 168,
            confiancaInferenciaFc: 'ALTA',
        };
        render(<LimiaresInferidosBanner limiareisInferidos={dados} />);

        expect(screen.queryByText(/Poucos dados/)).toBeNull();
    });
});
