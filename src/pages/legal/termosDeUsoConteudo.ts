/**
 * Conteúdo textual dos Termos de Uso da plataforma Menthoros.
 *
 * ⚠️ RASCUNHO — PENDENTE DE REVISÃO JURÍDICA (gate 5.1 da change `add-coach-lgpd-consent`).
 * Este texto foi redigido para destravar o fluxo de consentimento, que exigia aceite de um documento
 * inexistente. Ele NÃO substitui revisão por advogado, e o enforcement de consentimento não deve ir
 * para `on` antes dessa revisão.
 *
 * Mesma estrutura de `politicaPrivacidadeConteudo.ts` de propósito: os dois documentos são
 * renderizados pelo mesmo componente (`DocumentoLegal`).
 */

import type { Secao } from '../waitlist/politicaPrivacidadeConteudo';

/**
 * Data de vigência destes Termos, em `YYYY-MM-DD`.
 *
 * ATENÇÃO: precisa corresponder a `app.lgpd.terms-version` no backend. É essa propriedade que
 * carimba a versão no registro de consentimento — se as duas divergirem, o sistema grava que o
 * coach aceitou uma versão diferente da que leu aqui.
 */
export const TERMOS_VERSAO = '2026-08-03';

/** Mesma data de `TERMOS_VERSAO`, por extenso para exibição. */
export const TERMOS_ATUALIZADOS_EM = '3 de agosto de 2026';

export const TERMOS_INTRODUCAO: string[] = [
  'Estes Termos de Uso regulam o acesso e a utilização da plataforma Menthoros pelo treinador e pela assessoria esportiva contratante. Ao criar uma conta ou utilizar a plataforma, o usuário declara que leu, compreendeu e concorda com as condições abaixo.',
  'A Menthoros é uma ferramenta de apoio à decisão do treinador. Ela não substitui o julgamento profissional de quem prescreve o treino, nem constitui aconselhamento médico.',
];

export const TERMOS_SECOES: Secao[] = [
  {
    titulo: '1. Definições',
    blocos: [
      {
        itens: [
          '"Plataforma": o sistema web Menthoros, incluindo aplicação, API e integrações.',
          '"Assessoria": pessoa física ou jurídica que contrata a Plataforma e sob a qual são cadastrados treinadores e atletas.',
          '"Treinador" ou "Coach": usuário responsável por prescrever, revisar e aprovar treinos dentro da Plataforma.',
          '"Atleta": pessoa cujos dados de treino são registrados e acompanhados pelo Treinador na Plataforma.',
          '"Conteúdo do Usuário": dados inseridos ou importados pelo usuário, incluindo dados de treino, provas, métricas fisiológicas e anotações.',
        ],
      },
    ],
  },
  {
    titulo: '2. Objeto e natureza do serviço',
    blocos: [
      {
        paragrafos: [
          'A Plataforma oferece organização de atletas, planejamento e revisão de treinos, acompanhamento de carga e métricas, integrações com serviços de terceiros e recursos de inteligência artificial que propõem sugestões ao Treinador.',
          'Toda sugestão gerada por inteligência artificial é uma proposta submetida ao Treinador, que decide por aprová-la, editá-la ou rejeitá-la. A Plataforma não entrega automaticamente ao Atleta conteúdo gerado por IA sem ação do Treinador.',
        ],
      },
    ],
  },
  {
    titulo: '3. Cadastro, conta e credenciais',
    blocos: [
      {
        paragrafos: [
          'O acesso exige cadastro com dados verdadeiros e atualizados. O usuário é responsável pela guarda de suas credenciais e por toda atividade realizada em sua conta.',
          'A autenticação é realizada por provedor de identidade, e o usuário deve comunicar imediatamente qualquer uso não autorizado de sua conta.',
        ],
      },
      {
        subtitulo: '3.1 Cadastro de atletas pelo Treinador',
        paragrafos: [
          'Ao cadastrar um Atleta ou importar seus dados, o Treinador declara possuir base legal e autorização para tratar aqueles dados, nos termos da Política de Privacidade e da legislação aplicável.',
        ],
      },
    ],
  },
  {
    titulo: '4. Uso aceitável',
    blocos: [
      {
        paragrafos: ['É vedado ao usuário:'],
        itens: [
          'utilizar a Plataforma para finalidade ilícita ou que viole direito de terceiro;',
          'tentar obter acesso não autorizado a contas, dados de outra assessoria ou à infraestrutura da Plataforma;',
          'realizar engenharia reversa, extração massiva automatizada de dados ou revenda do serviço sem autorização escrita;',
          'inserir dados de terceiro sem base legal para tanto;',
          'sobrecarregar deliberadamente a Plataforma ou suas integrações.',
        ],
      },
    ],
  },
  {
    titulo: '5. Saúde, segurança e limites da prescrição',
    blocos: [
      {
        paragrafos: [
          'A Plataforma não presta serviço médico, não realiza diagnóstico e não substitui avaliação de profissional de saúde. As sugestões de treino, estimativas de carga, projeções de desempenho e indicadores de prontidão são estimativas estatísticas, sujeitas a erro.',
          'A responsabilidade pela prescrição de treino e pela adequação do plano à condição de saúde do Atleta é exclusivamente do Treinador e da Assessoria.',
          'O Atleta deve interromper a atividade e buscar orientação médica diante de qualquer sintoma anormal, independentemente do que a Plataforma indicar.',
        ],
      },
    ],
  },
  {
    titulo: '6. Planos, cobrança e cancelamento',
    blocos: [
      {
        paragrafos: [
          'A contratação observa o plano escolhido pela Assessoria, com seus limites de atletas e recursos. A cobrança é processada por provedor de pagamento terceirizado.',
          'O não pagamento pode acarretar suspensão do acesso após o período de carência informado. A suspensão preserva os dados pelo prazo previsto na Política de Privacidade.',
          'O cancelamento pode ser solicitado a qualquer tempo e produz efeitos ao fim do ciclo vigente, sem devolução proporcional de valores já pagos, salvo determinação legal em contrário.',
        ],
      },
    ],
  },
  {
    titulo: '7. Propriedade intelectual e Conteúdo do Usuário',
    blocos: [
      {
        paragrafos: [
          'A Plataforma, sua marca, código, interface e modelos são de titularidade da Menthoros. Estes Termos não transferem qualquer direito de propriedade intelectual ao usuário.',
          'O Conteúdo do Usuário permanece de titularidade de quem o inseriu. O usuário concede à Menthoros licença limitada para armazenar e processar esse conteúdo com a finalidade exclusiva de prestar o serviço, conforme a Política de Privacidade.',
        ],
      },
    ],
  },
  {
    titulo: '8. Integrações com serviços de terceiros',
    blocos: [
      {
        paragrafos: [
          'A Plataforma pode integrar-se a serviços de terceiros para importação de atividades e envio de treinos a dispositivos. A conexão depende de autorização do usuário e está sujeita aos termos do respectivo serviço.',
          'A Menthoros não responde por indisponibilidade, alteração de API, limite de requisições ou descontinuação desses serviços.',
        ],
      },
    ],
  },
  {
    titulo: '9. Disponibilidade e suporte',
    blocos: [
      {
        paragrafos: [
          'A Menthoros empreende esforços razoáveis para manter a Plataforma disponível, mas não garante operação ininterrupta ou livre de falhas. Manutenções programadas serão comunicadas quando viável.',
          'O suporte é prestado pelos canais oficiais divulgados na Plataforma.',
        ],
      },
    ],
  },
  {
    titulo: '10. Limitação de responsabilidade',
    blocos: [
      {
        paragrafos: [
          'Na máxima extensão permitida pela legislação aplicável, a Menthoros não responde por danos indiretos, lucros cessantes, perda de oportunidade ou danos decorrentes de decisão de treino tomada pelo Treinador.',
          'Nenhuma disposição destes Termos afasta direitos assegurados ao consumidor pela legislação brasileira.',
        ],
      },
    ],
  },
  {
    titulo: '11. Suspensão e rescisão',
    blocos: [
      {
        paragrafos: [
          'A Menthoros pode suspender ou encerrar o acesso em caso de violação destes Termos, uso fraudulento, ordem judicial ou inadimplência, mediante comunicação quando cabível.',
          'Encerrada a relação, aplica-se à retenção e à eliminação de dados o disposto na Política de Privacidade.',
        ],
      },
    ],
  },
  {
    titulo: '12. Alterações destes Termos',
    blocos: [
      {
        paragrafos: [
          'Estes Termos podem ser alterados a qualquer tempo. Alterações materiais serão comunicadas e um novo aceite poderá ser exigido para a continuidade do uso.',
          'A data de vigência da versão em vigor consta no topo desta página.',
        ],
      },
    ],
  },
  {
    titulo: '13. Legislação aplicável e foro',
    blocos: [
      {
        paragrafos: [
          'Estes Termos são regidos pela legislação brasileira. Fica eleito o foro do domicílio do usuário para dirimir controvérsias decorrentes deste instrumento, quando aplicável a legislação consumerista.',
        ],
      },
    ],
  },
];
