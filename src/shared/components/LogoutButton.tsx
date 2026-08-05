import { useState } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { ConfirmDialog } from './ConfirmDialog';
import { useAuth } from '../../context/auth/useAuth';
import { sidebar } from '../../theme/tokens';

interface LogoutButtonProps {
  /** Quando `true`, mostra só o ícone (sidebar recolhida). O rótulo vira tooltip. */
  colapsado?: boolean;
}

/**
 * Ação de sair, compartilhada pelos dois shells (coach e atleta).
 *
 * ## Por que existe
 *
 * Até 2026-08-04 **não havia logout na aplicação** — `logout()` não era chamado em lugar nenhum.
 * Isso era tolerável no mecanismo antigo, em que o token expirava em 5 minutos e o app o descartava:
 * o usuário saía sozinho. Com Authorization Code + PKCE e a restauração automática de sessão, a
 * sessão no Keycloak dura 30 min de inatividade e é **restaurada silenciosamente** a cada
 * carregamento — sem este botão, não existe forma de sair, e num computador compartilhado o próximo
 * usuário entra na conta do anterior.
 *
 * ## Por que confirma
 *
 * Sair é disruptivo e fica ao lado de itens de navegação, onde o clique errado é fácil. A
 * confirmação é a guideline de severidade **alta** para ação disruptiva — e aqui ela custa pouco,
 * porque sair não é uma ação frequente.
 *
 * ## Por que encerra a sessão no provedor
 *
 * O logout é RP-initiated (ver `AuthProvider`). Um logout apenas local seria **desfeito no próximo
 * carregamento** pela restauração automática: o usuário clicaria em "Sair" e continuaria dentro.
 */
export function LogoutButton({ colapsado = false }: LogoutButtonProps) {
  const { logout } = useAuth();
  const [confirmando, setConfirmando] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState('');

  const executarLogout = async () => {
    setSaindo(true);
    setErro('');
    try {
      await logout();
      // Em caso de sucesso a página navega para o Keycloak; nada além disto executa.
    } catch {
      // Falhou o redirect de logout. O diálogo permanece ABERTO de propósito: fechá-lo faria
      // parecer que a saída ocorreu, enquanto o usuário segue autenticado — falha silenciosa no
      // exato ponto em que ele quer ter certeza de que saiu. Reabilita para nova tentativa.
      setSaindo(false);
      setErro('Não foi possível sair agora. Tente novamente.');
    }
  };

  const rotulo = 'Sair';

  return (
    <>
      {colapsado ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.75 }}>
          <Tooltip title={rotulo} placement="right">
            {/* IconButton tem 40px de área por padrão; o padding leva ao mínimo de 44px de alvo. */}
            <IconButton
              onClick={() => setConfirmando(true)}
              aria-label={rotulo}
              sx={{
                color: sidebar.text,
                p: 1.25,
                '&:hover': { color: sidebar.textHover, bgcolor: sidebar.hoverBg },
                transition: 'color 200ms, background-color 200ms',
              }}
            >
              <LogoutIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <Box
          component="button"
          onClick={() => setConfirmando(true)}
          aria-label={rotulo}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            width: '100%',
            minHeight: 44,
            px: 1,
            py: 0.75,
            border: 'none',
            borderRadius: 1,
            bgcolor: 'transparent',
            color: sidebar.text,
            cursor: 'pointer',
            font: 'inherit',
            textAlign: 'left',
            transition: 'color 200ms, background-color 200ms',
            '&:hover': { color: sidebar.textHover, bgcolor: sidebar.hoverBg },
            // Foco visível: o item fica no rodapé, alcançado por teclado depois da navegação.
            '&:focus-visible': { outline: `2px solid ${sidebar.textHover}`, outlineOffset: 2 },
          }}
        >
          <LogoutIcon sx={{ fontSize: 20, flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1 }}>
            {rotulo}
          </Typography>
        </Box>
      )}

      <ConfirmDialog
        open={confirmando}
        title="Sair da conta"
        message={erro || 'Você será desconectado e precisará entrar novamente para acessar seus dados.'}
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        loading={saindo}
        onClose={() => {
          setConfirmando(false);
          setErro('');
        }}
        onConfirm={executarLogout}
      />
    </>
  );
}
