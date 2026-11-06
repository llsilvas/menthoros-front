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
