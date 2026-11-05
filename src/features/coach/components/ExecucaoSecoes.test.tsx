import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { TreinoRealizadoDetalhe } from '../../../types/TreinoRealizado';
import { buildExecucaoFromDetalhe } from '../adapters/treinoRealizadoDetalheAdapters';
import { ExecucaoDadosRelogio } from './ExecucaoDadosRelogio';
import { ExecucaoEtapas } from './ExecucaoEtapas';
import { ExecucaoZonas } from './ExecucaoZonas';

const DETALHE: TreinoRealizadoDetalhe = {
    id: 'tr-1',
    duracaoMin: '01:00:00',
    distanciaKm: 10,
    fcMedia: 150,
    tempoEmZonas: {
        fonte: 'FIT_RECORDS',
        zonas: [
            { zona: 'Z1', bpmMin: 93, bpmMax: 111, segundos: 0 },
            { zona: 'Z2', bpmMin: 112, bpmMax: 129, segundos: 1800 },
            { zona: 'Z3', bpmMin: 130, bpmMax: 148, segundos: 1200 },
            { zona: 'Z4', bpmMin: 149, bpmMax: 166, segundos: 600 },
            { zona: 'Z5', bpmMin: 167, segundos: 0 },
        ],
    },
    etapasRealizadas: [
        { ordem: 1, duracao: '06:00', distanciaKm: 1, fcMedia: 140 },
        { ordem: 2, duracao: '06:00', distanciaKm: 1, fcMedia: 145 },
    ],
};
const zonasCom = (zonaAlvo?: string) => buildExecucaoFromDetalhe(DETALHE, { zonaAlvo }).zonas;
const alvos = () => Array.from(document.querySelectorAll('[data-alvo]')).map((el) => el.textContent?.slice(0, 2));

describe('ExecucaoZonas', () => {
    it('alvo único: destaca a zona e mostra o percentual no alvo', () => {
        render(<ExecucaoZonas zonas={zonasCom('Z2')} />);
        expect(screen.getByText('50% no alvo')).toBeInTheDocument();
        expect(alvos()).toEqual(['Z2']);
    });

    it('alvo em faixa: destaca todas as zonas do intervalo e soma', () => {
        render(<ExecucaoZonas zonas={zonasCom('z2-z3')} />);
        expect(screen.getByText('83% no alvo')).toBeInTheDocument();
        expect(alvos().sort()).toEqual(['Z2', 'Z3']);
    });

    it('sem alvo reconhecido: nenhum destaque, sem percentual', () => {
        render(<ExecucaoZonas zonas={zonasCom('Z6')} />);
        expect(screen.queryByText(/no alvo/)).not.toBeInTheDocument();
        expect(alvos()).toEqual([]);
    });

    it('legenda com limites e zona do topo sem teto; faixa descrita para leitor de tela', () => {
        render(<ExecucaoZonas zonas={zonasCom('Z2')} />);
        expect(screen.getByText(/≥ 167 bpm/)).toBeInTheDocument();
        expect(screen.getByRole('img', { name: /Z2 50%/ })).toBeInTheDocument();
    });

    it('sem tempoEmZonas: texto de indisponível', () => {
        render(<ExecucaoZonas zonas={null} />);
        expect(screen.getByText('Tempo em zonas indisponível para este treino')).toBeInTheDocument();
    });
});

describe('ExecucaoEtapas', () => {
    it('lista as voltas com cabeçalho fixo e Total da sessão', () => {
        const { etapas, total } = buildExecucaoFromDetalhe(DETALHE, {});
        render(<ExecucaoEtapas etapas={etapas} total={total} />);

        expect(screen.getAllByRole('row')).toHaveLength(4); // cabeçalho + 2 voltas + Total
        expect(screen.getByRole('columnheader', { name: 'Ritmo' })).toHaveStyle({ position: 'sticky' });
        // Total da sessão (10 km), não a soma das voltas (2 km)
        expect(screen.getByTestId('execucao-etapas-total')).toHaveTextContent('10,00 km');
    });

    it('sem voltas: estado vazio', () => {
        render(<ExecucaoEtapas etapas={[]} total={null} />);
        expect(screen.getByText('Sem voltas registradas para este treino')).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
});

describe('ExecucaoDadosRelogio', () => {
    it('fechado por padrão; aberto mostra grupos e "--" nos ausentes', async () => {
        const { grupos } = buildExecucaoFromDetalhe({ id: 'x', fcMedia: 150 }, {});
        render(<ExecucaoDadosRelogio grupos={grupos} />);

        const resumo = screen.getByRole('button', { name: 'Todos os dados do relógio' });
        expect(resumo).toHaveAttribute('aria-expanded', 'false');

        await userEvent.click(resumo);

        expect(resumo).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Percepção do atleta')).toBeVisible();
        expect(screen.getByText('150 bpm')).toBeVisible();
        expect(screen.getAllByText('--').length).toBeGreaterThan(5);
    });
});
