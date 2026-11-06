import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { EtapasEditor } from './EtapasEditor';
import { emptyStep, type EtapaItem } from './etapaItem';

function Harness({ inicial }: { inicial: EtapaItem[] }) {
    const [itens, setItens] = useState(inicial);
    return <EtapasEditor itens={itens} onChange={fn => setItens(fn)} />;
}

describe('EtapasEditor — descrição para o atleta', () => {
    // O estado do editor passava por `trim()` a cada tecla: o espaço final sumia
    // antes da letra seguinte, e "800m forte" virava "800mforte".
    it('aceita espaços durante a digitação', async () => {
        const user = userEvent.setup();
        render(<Harness inicial={[emptyStep()]} />);

        await user.click(screen.getByRole('button', { name: /mais detalhes/i }));
        const campo = screen.getByLabelText('Descrição para o atleta');
        await user.type(campo, '800m forte, trote entre os tiros');

        expect(campo).toHaveValue('800m forte, trote entre os tiros');
    });
});

describe('EtapasEditor — duração em m:ss', () => {
    it('normaliza no blur: 4 vira 4:00 e 4:7 vira 4:07', async () => {
        const user = userEvent.setup();
        render(<Harness inicial={[emptyStep()]} />);
        const campo = screen.getByLabelText('Duração (m:ss)');

        await user.type(campo, '4');
        await user.tab();
        expect(campo).toHaveValue('4:00');

        await user.clear(campo);
        await user.type(campo, '4:7');
        await user.tab();
        expect(campo).toHaveValue('4:07');
    });

    it('texto inválido mostra o erro e não é normalizado', async () => {
        const user = userEvent.setup();
        render(<Harness inicial={[emptyStep()]} />);
        const campo = screen.getByLabelText('Duração (m:ss)');

        await user.type(campo, 'abc');
        await user.tab();
        expect(campo).toHaveValue('abc');
        expect(campo).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText('use m:ss, ex.: 4:10')).toBeInTheDocument();
    });

    it('duração derivada mostra a indicação visual', () => {
        render(<Harness inicial={[{ ...emptyStep(), distanciaKm: '1', ritmoAlvo: '4:10/km', duracao: '4:10', duracaoAuto: true }]} />);
        expect(screen.getByLabelText('Duração (m:ss)')).toHaveValue('4:10');
        expect(screen.getByText('calculado de distância × pace')).toBeInTheDocument();
    });
});

