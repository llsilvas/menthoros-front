/**
 * Media queries do shell do coach que não cabem nos breakpoints de LARGURA do MUI.
 *
 * `TELA_BAIXA`: altura de viewport até 800px — o notebook de 1366×768 e o Full HD com escala de
 * 125–150% (altura CSS de 720px ou menos). Nessa altura cada linha de "chrome" (título, descrição,
 * padding de faixa) é uma linha a menos de conteúdo rolável. Use para ENXUGAR espaçamento e
 * remover texto de apresentação; não para reduzir fonte abaixo do mínimo legível (11px, ver e2e
 * do inbox).
 */
export const TELA_BAIXA = '@media (max-height: 800px)';
