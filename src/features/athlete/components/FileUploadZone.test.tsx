import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FileUploadZone } from './FileUploadZone';

function fitFile(name = 'treino.fit') {
  return new File(['dados'], name, { type: 'application/octet-stream' });
}

describe('FileUploadZone', () => {
  it('renderiza o texto de instrução', () => {
    render(<FileUploadZone onFileSelected={vi.fn()} />);
    expect(screen.getByText(/arraste um arquivo \.fit/i)).toBeInTheDocument();
  });

  it('chama onFileSelected ao selecionar um .fit via input', async () => {
    const onFileSelected = vi.fn();
    render(<FileUploadZone onFileSelected={onFileSelected} />);
    const user = userEvent.setup();
    const input = screen.getByLabelText(/selecionar arquivo \.fit/i).querySelector('input')!;

    await user.upload(input, fitFile());

    expect(onFileSelected).toHaveBeenCalledOnce();
    expect(onFileSelected.mock.calls[0][0].name).toBe('treino.fit');
  });

  it('ignora arquivo com extensão não suportada', async () => {
    const onFileSelected = vi.fn();
    render(<FileUploadZone onFileSelected={onFileSelected} />);
    const user = userEvent.setup();
    const input = screen.getByLabelText(/selecionar arquivo \.fit/i).querySelector('input')!;

    await user.upload(input, fitFile('foto.jpg'));

    expect(onFileSelected).not.toHaveBeenCalled();
  });

  it('aceita drop de um .fit válido', () => {
    const onFileSelected = vi.fn();
    render(<FileUploadZone onFileSelected={onFileSelected} />);
    const zone = screen.getByLabelText(/selecionar arquivo \.fit/i);

    fireEvent.drop(zone, { dataTransfer: { files: [fitFile()] } });

    expect(onFileSelected).toHaveBeenCalledOnce();
  });

  it('não chama onFileSelected quando disabled', async () => {
    const onFileSelected = vi.fn();
    render(<FileUploadZone onFileSelected={onFileSelected} disabled />);
    const zone = screen.getByLabelText(/selecionar arquivo \.fit/i);

    fireEvent.drop(zone, { dataTransfer: { files: [fitFile()] } });

    expect(onFileSelected).not.toHaveBeenCalled();
  });
});
