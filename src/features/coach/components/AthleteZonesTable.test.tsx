import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AthleteZonesTable } from './AthleteZonesTable';
import type { AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';

const HOJE = new Date('2026-10-27T12:00:00');

function zonas(over: Partial<AthleteTrainingZonesDto> = {}): AthleteTrainingZonesDto {
    return {
        modelo: 'LTHR_FRIEL',
        ancoras: {
            paceLimiarMinKm: 5,
            dataUltimoTestePace: '2026-09-12',
            fcLimiar: 168,
            dataUltimoTesteFc: '2026-09-12',
            fcLimiarEstimada: false,
        },
        ajusteFadiga: { segundosPorKm: 0 },
        fcMaxima: { bpm: 185, estimada: false },
        disponibilidade: { pace: true, fc: true },
        zonas: [
            { numero: 1, nome: 'Recuperação', pace: { minSegKm: 345, maxSegKm: 375 }, fc: { min: 126, max: 143 } },
            { numero: 2, nome: 'Aeróbico', pace: { minSegKm: 315, maxSegKm: 345 }, fc: { min: 143, max: 150 } },
            { numero: 3, nome: 'Tempo', pace: { minSegKm: 300, maxSegKm: 315 }, fc: { min: 150, max: 158 } },
            { numero: 4, nome: 'Limiar', pace: { minSegKm: 285, maxSegKm: 300 }, fc: { min: 158, max: 168 } },
            { numero: 5, nome: 'VO2max', pace: { minSegKm: 270, maxSegKm: 285 }, fc: { min: 168, max: 178 } },
            { numero: 6, nome: 'Sprint', pace: { minSegKm: 246, maxSegKm: 270 }, motivoFc: 'FC_NAO_ESTABILIZA' },
        ],
        ...over,
    };
}

const renderTabela = (z: AthleteTrainingZonesDto | null, extra: { loading?: boolean; error?: Error | null; nome?: string } = {}) =>
    render(<AthleteZonesTable zones={z} loading={extra.loading ?? false} error={extra.error ?? null} nomeAtleta={extra.nome} hoje={HOJE} defaultExpanded />);

describe('AthleteZonesTable', () => {
    it('está recolhida por padrão, com o título visível', () => {
        render(<AthleteZonesTable zones={zonas()} loading={false} error={null} hoje={HOJE} />);

        expect(screen.getByRole('button', { name: /zonas do atleta/i })).toHaveAttribute('aria-expanded', 'false');
    });

    it('o título leva o primeiro nome do atleta, sem presumir gênero ("de", não "da"/"do")', () => {
        renderTabela(zonas(), { nome: 'Mariana Costa' });

        expect(screen.getByRole('button', { name: /zonas de mariana/i })).toBeInTheDocument();
    });

    it('com a tabela recolhida, o cabeçalho já mostra o ajuste de fadiga e a idade do limiar', () => {
        render(
            <AthleteZonesTable
                zones={zonas({ ajusteFadiga: { segundosPorKm: 7, tsbProntidao: -12 } })}
                loading={false}
                error={null}
                nomeAtleta="Mariana Costa"
                hoje={HOJE}
            />,
        );

        const cabecalho = screen.getByRole('button', { name: /zonas de mariana/i });
        expect(cabecalho).toHaveAttribute('aria-expanded', 'false');
        expect(cabecalho).toHaveTextContent('Ajuste por fadiga +7 s/km');
        expect(cabecalho).toHaveTextContent('Limiar medido em 12 set · 45 dias');
    });

    it('colunas com unidade no cabeçalho e células sem unidade, com travessão espaçado', () => {
        renderTabela(zonas());

        expect(screen.getByRole('columnheader', { name: 'Pace (min/km)' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'FC (bpm)' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /RPE \(referência\)/ })).toBeInTheDocument();
        const z2 = screen.getByRole('row', { name: /Z2/ });
        expect(within(z2).getByText('5:15 – 5:45')).toBeInTheDocument();
        expect(within(z2).getByText('143 – 150')).toBeInTheDocument();
        const z6 = screen.getByRole('row', { name: /Z6/ });
        expect(within(z6).getByText('4:06 – 4:30')).toBeInTheDocument();
        expect(within(z6).getByText(/usar pace/i)).toBeInTheDocument();
    });

    it('RPE típico e uso típico seguem o protótipo', () => {
        renderTabela(zonas());

        const z1 = screen.getByRole('row', { name: /Z1/ });
        expect(within(z1).getByText('1–2')).toBeInTheDocument();
        expect(within(z1).getByText('Rodagem leve, trote')).toBeInTheDocument();
        expect(within(screen.getByRole('row', { name: /Z5/ })).getByText('Tiros de 3 a 5 min')).toBeInTheDocument();
    });

    it('rodapé de âncoras, sem link de cadastro', () => {
        renderTabela(zonas());

        expect(screen.getByText(/Âncoras: pace de limiar 5:00\/km · LTHR 168 bpm · modelo LTHR \(Friel\)/)).toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('chip de fadiga aparece só com ajuste > 0', () => {
        const { unmount } = renderTabela(zonas({ ajusteFadiga: { segundosPorKm: 7, tsbProntidao: -12 } }));
        expect(screen.getByText('Ajuste por fadiga +7 s/km')).toBeInTheDocument();
        unmount();

        renderTabela(zonas());
        expect(screen.queryByText(/fadiga/i)).not.toBeInTheDocument();
    });

    it('limiar com mais de 90 dias avisa; recente só informa a idade', () => {
        const velha = zonas();
        velha.ancoras.dataUltimoTestePace = '2026-06-01';
        velha.ancoras.dataUltimoTesteFc = '2026-06-01';
        const { unmount } = renderTabela(velha);
        expect(screen.getByText('Limiar medido em 1 jun · 148 dias')).toBeInTheDocument();
        expect(screen.getByText(/refaça o teste/i)).toBeInTheDocument();
        unmount();

        renderTabela(zonas());
        expect(screen.getByText('Limiar medido em 12 set · 45 dias')).toBeInTheDocument();
        expect(screen.queryByText(/refaça o teste/i)).not.toBeInTheDocument();
    });

    it('FC de limiar estimada ganha o selo "estimada"', () => {
        const z = zonas();
        z.ancoras.fcLimiarEstimada = true;
        renderTabela(z);

        expect(screen.getByText('estimada')).toBeInTheDocument();
    });

    it('sem pace de limiar: coluna indisponível, sem link, FC continua', () => {
        const z = zonas({ disponibilidade: { pace: false, fc: true, motivoPace: 'SEM_PACE_LIMIAR' } });
        z.ancoras.paceLimiarMinKm = undefined;
        z.zonas = z.zonas.map((zona) => ({ ...zona, pace: undefined }));
        renderTabela(z);

        expect(screen.getByText(/pace indisponível — cadastre o pace de limiar/i)).toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
        expect(within(screen.getByRole('row', { name: /Z2/ })).getByText('143 – 150')).toBeInTheDocument();
    });

    it('RPE típico é referência genérica com explicação', () => {
        renderTabela(zonas());

        expect(screen.getAllByLabelText(/escala genérica, não medida do atleta/i).length).toBe(6);
    });

    it('loading mostra skeleton acessível', () => {
        renderTabela(null, { loading: true });

        expect(screen.getByRole('status', { name: /carregando zonas/i })).toBeInTheDocument();
    });

    it('erro é anunciado e não esconde o título', () => {
        renderTabela(null, { error: new Error('falhou') });

        expect(screen.getByRole('alert')).toHaveTextContent(/não foi possível carregar as zonas/i);
    });

    it('sem dados e sem erro não renderiza a tabela', () => {
        renderTabela(null);

        expect(screen.queryByRole('button', { name: /zonas do atleta/i })).not.toBeInTheDocument();
    });
});
