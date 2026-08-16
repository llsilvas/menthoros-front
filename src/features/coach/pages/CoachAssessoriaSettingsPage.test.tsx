import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createHashRouter, Outlet, RouterProvider } from 'react-router';
import CoachAssessoriaSettingsPage from './CoachAssessoriaSettingsPage';
import { AssessoriaSettingsService } from '../../../api/services/AssessoriaSettingsService';
import type { AssessoriaMe } from '../../../types/AssessoriaSettings';

const mockRefetchCurrentUser = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../api/services/AssessoriaSettingsService');

const ASSESSORIA: AssessoriaMe = {
    id: 'a1',
    nome: 'Corridas Serra',
    temLogo: false,
    logoUrl: null,
    plano: 'BASIC',
    uso: { atletas: 7, maxAtletas: 10, tecnicos: 1, maxTecnicos: 1 },
    version: 3,
};

/** Erro no formato do cliente gerado, que expõe `status`. */
function apiError(status: number) {
    return Object.assign(new Error(`HTTP ${status}`), { status });
}

const montar = () => {
    // Hash router de propósito: o app real roteia por hash (ver CLAUDE.md do módulo).
    // A página passou a consumir `refetchCurrentUser` do layout: a logo enviada aqui aparece na
    // sidebar, que lê o `me`. Sem o contexto, o `useOutletContext` devolve `null` e a página quebra.
    const router = createHashRouter([{
      path: '/',
      element: <Outlet context={{ refetchCurrentUser: mockRefetchCurrentUser }} />,
      children: [{ index: true, element: <CoachAssessoriaSettingsPage /> }],
    }]);
    render(<RouterProvider router={router} />);
};

const arquivoPng = (nome = 'logo.png', tamanho = 1024) => {
    const arquivo = new File(['x'.repeat(tamanho)], nome, { type: 'image/png' });
    Object.defineProperty(arquivo, 'size', { value: tamanho });
    return arquivo;
};

describe('CoachAssessoriaSettingsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(AssessoriaSettingsService.buscarMinhaAssessoria)
            .mockResolvedValue(structuredClone(ASSESSORIA));
    });

    describe('carga inicial', () => {
        it('exibe nome, plano e uso do plano', async () => {
            montar();

            expect(await screen.findByDisplayValue('Corridas Serra')).toBeInTheDocument();
            expect(screen.getByText('BASIC')).toBeInTheDocument();
            expect(screen.getByText('7 de 10')).toBeInTheDocument();
            expect(screen.getByText('1 de 1')).toBeInTheDocument();
        });

        it('oferece recarregar quando a carga falha', async () => {
            vi.mocked(AssessoriaSettingsService.buscarMinhaAssessoria)
                .mockRejectedValueOnce(new Error('rede caiu'));
            montar();

            expect(await screen.findByRole('button', { name: /tentar de novo/i })).toBeInTheDocument();
        });

        /** Cores saíram do escopo (D3): um seletor aqui prometeria o que o tema não cumpre. */
        it('não oferece seletor de cor', async () => {
            montar();
            await screen.findByDisplayValue('Corridas Serra');

            expect(screen.queryByLabelText(/cor/i)).not.toBeInTheDocument();
        });
    });

    describe('salvar o nome', () => {
        it('só habilita salvar quando há alteração', async () => {
            montar();
            await screen.findByDisplayValue('Corridas Serra');

            expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();

            await userEvent.type(screen.getByLabelText(/nome da assessoria/i), ' Pro');

            expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
            expect(screen.getByText(/alterações não salvas/i)).toBeInTheDocument();
        });

        it('envia o nome com a versão lida no GET', async () => {
            vi.mocked(AssessoriaSettingsService.atualizar)
                .mockResolvedValue({ ...ASSESSORIA, nome: 'Corridas Serra Pro', version: 4 });
            montar();
            await screen.findByDisplayValue('Corridas Serra');

            await userEvent.type(screen.getByLabelText(/nome da assessoria/i), ' Pro');
            await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

            await waitFor(() => expect(AssessoriaSettingsService.atualizar)
                .toHaveBeenCalledWith({ nome: 'Corridas Serra Pro', version: 3 }));
        });

        /**
         * O erro que este teste protege: usar a versão antiga na segunda escrita faria o cliente
         * receber 409 por culpa própria, e o 409 deixaria de significar "outra pessoa alterou".
         */
        it('a segunda escrita usa a versão devolvida pela primeira', async () => {
            vi.mocked(AssessoriaSettingsService.atualizar)
                .mockResolvedValueOnce({ ...ASSESSORIA, nome: 'Um', version: 4 })
                .mockResolvedValueOnce({ ...ASSESSORIA, nome: 'Dois', version: 5 });
            montar();
            const campo = await screen.findByLabelText(/nome da assessoria/i);

            await userEvent.clear(campo);
            await userEvent.type(campo, 'Um');
            await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
            await waitFor(() => expect(AssessoriaSettingsService.atualizar).toHaveBeenCalledTimes(1));

            await userEvent.clear(campo);
            await userEvent.type(campo, 'Dois');
            await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

            await waitFor(() => expect(AssessoriaSettingsService.atualizar)
                .toHaveBeenLastCalledWith({ nome: 'Dois', version: 4 }));
        });

        it('nome em branco não chega ao servidor', async () => {
            montar();
            const campo = await screen.findByLabelText(/nome da assessoria/i);

            await userEvent.clear(campo);
            await userEvent.type(campo, '   ');
            await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

            expect(await screen.findByText(/informe o nome/i)).toBeInTheDocument();
            expect(AssessoriaSettingsService.atualizar).not.toHaveBeenCalled();
        });
    });

    describe('conflito de edição', () => {
        it('409 mostra recarregar e preserva o que foi digitado', async () => {
            vi.mocked(AssessoriaSettingsService.atualizar).mockRejectedValue(apiError(409));
            montar();
            await screen.findByDisplayValue('Corridas Serra');

            await userEvent.type(screen.getByLabelText(/nome da assessoria/i), ' Pro');
            await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

            expect(await screen.findByRole('button', { name: /recarregar/i })).toBeInTheDocument();
            expect(screen.getByText(/alterou a assessoria/i)).toBeInTheDocument();
            // O rascunho continua no campo: descartá-lo puniria quem só perdeu a corrida.
            expect(screen.getByDisplayValue('Corridas Serra Pro')).toBeInTheDocument();
        });
    });

    describe('logo', () => {
        it('envia a imagem escolhida com a versão atual', async () => {
            vi.mocked(AssessoriaSettingsService.enviarLogo)
                .mockResolvedValue({ ...ASSESSORIA, temLogo: true, logoUrl: '/api/v1/assessorias/me/logo', version: 4 });
            montar();
            await screen.findByDisplayValue('Corridas Serra');

            await userEvent.upload(screen.getByLabelText(/selecionar imagem da logo/i), arquivoPng());

            await waitFor(() => expect(AssessoriaSettingsService.enviarLogo)
                .toHaveBeenCalledWith(expect.any(File), 3));
        });

        /**
         * O bug que a change corrige tinha duas metades: o `me` não expunha a logo, e nada avisava a
         * shell quando ela mudava. Sem revalidar, a logo nova só apareceria na sidebar no próximo
         * reload — que é exatamente como o coach percebeu o problema ("enviei e não apareceu").
         */
        it('revalida o `me` após enviar a logo, para a sidebar acompanhar', async () => {
            vi.mocked(AssessoriaSettingsService.enviarLogo)
                .mockResolvedValue({ ...ASSESSORIA, temLogo: true, logoUrl: '/api/v1/assessorias/me/logo', version: 4 });
            montar();
            await screen.findByDisplayValue('Corridas Serra');

            await userEvent.upload(screen.getByLabelText(/selecionar imagem da logo/i), arquivoPng());

            await waitFor(() => expect(mockRefetchCurrentUser).toHaveBeenCalled());
        });

        it('revalida o `me` após remover a logo', async () => {
            vi.mocked(AssessoriaSettingsService.buscarMinhaAssessoria)
                .mockResolvedValue({ ...ASSESSORIA, temLogo: true, logoUrl: '/api/v1/assessorias/me/logo' });
            // `removerLogo` devolve void: quem recarrega o estado é o hook.
            vi.mocked(AssessoriaSettingsService.removerLogo).mockResolvedValue(undefined);
            montar();
            await screen.findByDisplayValue('Corridas Serra');

            await userEvent.click(screen.getByRole('button', { name: /^remover$/i }));

            await waitFor(() => expect(mockRefetchCurrentUser).toHaveBeenCalled());
        });

        it('arquivo acima de 2 MB é barrado antes do envio', async () => {
            montar();
            await screen.findByDisplayValue('Corridas Serra');

            await userEvent.upload(
                screen.getByLabelText(/selecionar imagem da logo/i),
                arquivoPng('gigante.png', 3 * 1024 * 1024),
            );

            expect(await screen.findByText(/no máximo 2 MB/i)).toBeInTheDocument();
            expect(AssessoriaSettingsService.enviarLogo).not.toHaveBeenCalled();
        });

        it('tipo não aceito é barrado antes do envio', async () => {
            montar();
            await screen.findByDisplayValue('Corridas Serra');

            const pdf = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
            await userEvent.upload(screen.getByLabelText(/selecionar imagem da logo/i), pdf);

            expect(await screen.findByText(/PNG ou JPEG/i)).toBeInTheDocument();
            expect(AssessoriaSettingsService.enviarLogo).not.toHaveBeenCalled();
        });

        it('sem logo, não há botão de remover', async () => {
            montar();
            await screen.findByDisplayValue('Corridas Serra');

            expect(screen.queryByRole('button', { name: /remover/i })).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: /enviar logo/i })).toBeInTheDocument();
        });

        it('com logo, oferece trocar e remover', async () => {
            vi.mocked(AssessoriaSettingsService.buscarMinhaAssessoria).mockResolvedValue({
                ...ASSESSORIA, temLogo: true, logoUrl: '/api/v1/assessorias/me/logo',
            });
            vi.mocked(AssessoriaSettingsService.removerLogo).mockResolvedValue(undefined);
            montar();
            await screen.findByDisplayValue('Corridas Serra');

            expect(screen.getByRole('button', { name: /trocar logo/i })).toBeInTheDocument();
            await userEvent.click(screen.getByRole('button', { name: /remover/i }));

            await waitFor(() => expect(AssessoriaSettingsService.removerLogo).toHaveBeenCalledWith(3));
        });

        it('falha no upload mantém a logo anterior visível', async () => {
            vi.mocked(AssessoriaSettingsService.buscarMinhaAssessoria).mockResolvedValue({
                ...ASSESSORIA, temLogo: true, logoUrl: '/api/v1/assessorias/me/logo',
            });
            vi.mocked(AssessoriaSettingsService.enviarLogo).mockRejectedValue(apiError(422));
            montar();
            await screen.findByDisplayValue('Corridas Serra');

            await userEvent.upload(screen.getByLabelText(/selecionar imagem da logo/i), arquivoPng());

            expect(await screen.findByText(/não foi possível salvar/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /trocar logo/i })).toBeInTheDocument();
        });
    });

    describe('navegação', () => {
        it('o link de volta usa a forma hash', async () => {
            montar();
            await screen.findByDisplayValue('Corridas Serra');

            expect(screen.getByRole('link', { name: /configurações/i }))
                .toHaveAttribute('href', '#/coach/settings');
        });
    });
});
