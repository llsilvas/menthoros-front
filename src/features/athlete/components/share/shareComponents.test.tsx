import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GarminAttribution } from './GarminAttribution';
import { ShareSignature } from './ShareSignature';
import { ShareCardFrame } from './ShareCardFrame';
import { ShareFormatPicker, ShareModelPicker, ShareOptionSwitch } from './ShareControls';
import { SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH } from './shareCardStyle';

describe('GarminAttribution', () => {
  it('mostra o rótulo do modelo (CA4)', () => {
    render(<GarminAttribution attribution={{ label: 'GARMIN FORERUNNER 265', derived: false }} />);
    expect(screen.getByText('GARMIN FORERUNNER 265')).toBeInTheDocument();
    expect(screen.queryByText('Inclui dados de dispositivo Garmin')).not.toBeInTheDocument();
  });

  it('agregado mostra a frase de dado derivado (CA5)', () => {
    render(<GarminAttribution attribution={{ label: 'GARMIN', derived: true }} />);
    expect(screen.getByText('Inclui dados de dispositivo Garmin')).toBeInTheDocument();
  });

  it('sem fonte Garmin não renderiza nada (CA4)', () => {
    const { container } = render(<GarminAttribution attribution={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('ShareSignature', () => {
  const sig = { sigla: 'PF', nome: 'Assessoria Pace Forte' };

  it('visível: sigla e nome da assessoria (CA3)', () => {
    render(<ShareSignature signature={sig} visible />);
    expect(screen.getByText('PF')).toBeInTheDocument();
    expect(screen.getByText('Assessoria Pace Forte')).toBeInTheDocument();
  });

  it('desligada ou sem assessoria: nada (CA3)', () => {
    const { container, rerender } = render(<ShareSignature signature={sig} visible={false} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<ShareSignature signature={null} visible />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('ShareCardFrame', () => {
  it('tem o tamanho do formato e aria-label (CA9)', () => {
    render(<ShareCardFrame format="feed" ariaLabel="Card de parciais">conteúdo</ShareCardFrame>);
    const card = screen.getByRole('img', { name: 'Card de parciais' });
    expect(card).toHaveStyle({ width: `${SHARE_CARD_WIDTH}px`, height: `${SHARE_CARD_HEIGHT.feed}px` });
    expect(card).toHaveTextContent('menthoros');
  });
});

describe('controles (CA9)', () => {
  it('modelo é radiogroup e troca de valor', async () => {
    const onChange = vi.fn();
    render(<ShareModelPicker models={['plano', 'semana']} value="plano" onChange={onChange} />);
    const group = screen.getByRole('radiogroup', { name: 'Modelo' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Plano × realizado' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('radio', { name: 'Semana' }));
    expect(onChange).toHaveBeenCalledWith('semana');
  });

  it('formato é radiogroup com os três formatos', () => {
    render(<ShareFormatPicker value="story" onChange={() => {}} />);
    expect(screen.getByRole('radiogroup', { name: 'Formato' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('chave é switch com rótulo acessível', async () => {
    const onChange = vi.fn();
    render(<ShareOptionSwitch label="Mostrar assessoria" checked onChange={onChange} />);
    const sw = screen.getByRole('switch', { name: 'Mostrar assessoria' });
    expect(sw).toBeChecked();
    await userEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
