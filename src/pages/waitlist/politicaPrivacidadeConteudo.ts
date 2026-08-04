/**
 * Conteúdo textual da Política de Privacidade da plataforma Menthoros.
 *
 * Separado da página porque é texto jurídico revisado fora do time de front: manter aqui isola a
 * revisão de conteúdo do componente de renderização, que não muda a cada bump da política.
 *
 * Fonte: "Politica de Privacidade" (versão de 2 de agosto de 2026). Ao alterar o texto, atualize
 * também `POLITICA_ATUALIZADA_EM` e siga o procedimento de bump descrito em `PrivacidadePage.tsx`.
 */

/** E-mail de contato/encarregado (DPO). Canal oficial confirmado (2026-07-31). */
export const CONTATO_EMAIL = 'contato@menthoros.com';

/**
 * Data de vigência desta política, em `YYYY-MM-DD`.
 *
 * ATENÇÃO: precisa corresponder a `app.lgpd.policy-version` no backend. É essa propriedade que
 * carimba a versão no registro de consentimento — se as duas divergirem, o sistema grava que o
 * coach aceitou uma versão diferente da que leu aqui.
 */
export const POLITICA_VERSAO = '2026-08-03';

/** Mesma data de `POLITICA_VERSAO`, por extenso para exibição. */
export const POLITICA_ATUALIZADA_EM = '3 de agosto de 2026';

export interface Tabela {
  /** Rótulo acessível da tabela — vira `aria-label`. */
  descricao: string;
  colunas: string[];
  linhas: string[][];
}

/** Bloco de conteúdo dentro de uma seção. Um bloco carrega ao menos um dos campos opcionais. */
export interface Bloco {
  /** Título da subseção (ex.: "2.1 Dados fornecidos diretamente pelo usuário"). */
  subtitulo?: string;
  paragrafos?: string[];
  itens?: string[];
  tabela?: Tabela;
}

export interface Secao {
  titulo: string;
  blocos: Bloco[];
}

export const POLITICA_INTRODUCAO: string[] = [
  'Esta Política de Privacidade descreve como a Menthoros coleta, utiliza, armazena, compartilha e protege os dados pessoais dos usuários da plataforma digital Menthoros, destinada à gestão e ao desenvolvimento de treinamentos esportivos para corrida de rua e modalidades de endurance.',
  'Esta Política aplica-se a todos os usuários da Plataforma — atletas, treinadores, profissionais de educação física e assessorias esportivas — e deve ser lida em conjunto com o Termo de Uso da Plataforma.',
  'Esta Política foi elaborada em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais — LGPD), a Lei nº 12.965/2014 (Marco Civil da Internet) e demais normas aplicáveis.',
];

export const POLITICA_SECOES: Secao[] = [
  {
    titulo: '1. Quem trata os seus dados',
    blocos: [
      {
        paragrafos: [
          'A assessoria esportiva que utiliza o Menthoros é a controladora primária dos dados dos atletas. A Menthoros atua primariamente como operadora, processando os dados conforme as instruções da assessoria e para viabilizar o funcionamento da plataforma.',
          'Em determinados tratamentos — especialmente os relacionados à infraestrutura de inteligência artificial, segurança da plataforma e escolha de subprocessadores — a Menthoros exerce poder de decisão sobre os meios de tratamento, podendo ser considerada co-controladora nos termos do Art. 42 da LGPD. Nesses casos, a responsabilidade é solidária entre a assessoria e a Menthoros.',
          `Encarregado de Proteção de Dados (DPO): Leandro Alves da Silva. Contato: ${CONTATO_EMAIL}.`,
        ],
      },
    ],
  },
  {
    titulo: '2. Dados pessoais coletados',
    blocos: [
      {
        paragrafos: [
          'A Menthoros coleta os dados estritamente necessários à prestação dos serviços, classificados conforme segue.',
        ],
      },
      {
        subtitulo: '2.1 Dados fornecidos diretamente pelo usuário',
        paragrafos: [
          'Dados cadastrais do atleta: nome completo, e-mail, data de nascimento, sexo.',
          'O campo sexo é tratado como dado sensível (Art. 5º, II, LGPD), pois é necessário para o cálculo preciso de zonas de frequência cardíaca, VO2max e outras métricas fisiológicas que utilizam fórmulas distintas por sexo. A revogação do consentimento para este campo implica na impossibilidade de calcular essas métricas com precisão.',
          'Dados físicos: peso corporal, altura, objetivo de treino.',
          'A combinação de peso e altura permite derivar o IMC, que pode ser considerado dado de saúde. O campo "objetivo" é texto livre — solicitamos que o usuário não inclua informações de saúde neste campo. Condições de saúde devem ser registradas exclusivamente no check-in de prontidão, que possui tratamento específico e consentimento explícito.',
          'Dados de saúde (sensíveis — Art. 11, LGPD): presença e descrição de lesões, histórico de lesões, qualidade do sono, nível de dor, nível de estresse, estado de humor, nível de energia e fadiga, frequência cardíaca (média, máxima e séries temporais batimento a batimento), dados de GPS e trajeto (localização — tratado como sensível conforme entendimento da ANPD).',
          'Dados de treino: distância percorrida, duração, ritmo (pace), potência (ciclismo), cadência, elevação ganha, tipo de treino, métricas de execução (TSS, IF, calorias), métricas de passada (GCT, oscilação vertical, equilíbrio).',
          'Dados do treinador e assessoria: nome completo, e-mail, avatar (foto de perfil), data do último acesso, papel (TECNICO/COACH), vínculo com a assessoria, razão social, CNPJ, endereço, telefone de contato.',
        ],
      },
      {
        subtitulo: '2.2 Dados recebidos de integrações com terceiros',
        paragrafos: [
          'Mediante autorização específica do usuário, a Plataforma poderá receber dados de dispositivos e aplicativos esportivos de terceiros (Strava, Garmin, Intervals.icu, Health Connect), incluindo atividades (corrida, ciclismo, natação), frequência cardíaca (séries temporais), dados de GPS (trajeto, coordenadas) e métricas de desempenho calculadas pelo dispositivo. Esses dados são tratados sob os mesmos padrões de segurança e finalidade aplicáveis aos demais dados esportivos.',
        ],
      },
      {
        subtitulo: '2.3 Dados coletados automaticamente',
        paragrafos: [
          'Endereço IP, identificadores de dispositivo, sistema operacional, tipo de navegador e dados de log de acesso. Cookies e tecnologias similares, conforme a Seção 8.',
        ],
      },
    ],
  },
  {
    titulo: '3. Finalidades do tratamento',
    blocos: [
      {
        paragrafos: ['Os dados pessoais coletados são utilizados exclusivamente para:'],
        itens: [
          'Criar, autenticar e gerenciar a conta do usuário na Plataforma',
          'Personalizar planos de treino com base no perfil, histórico e objetivos do atleta',
          'Calcular métricas de carga (TSS, CTL, ATL, TSB) para orientar a periodização',
          'Avaliar a prontidão do atleta e ajustar a prescrição conforme seu estado físico',
          'Permitir que o treinador acompanhe a evolução do atleta e faça ajustes',
          'Viabilizar a comunicação entre treinadores, assessorias e atletas',
          'Importar atividades de dispositivos e plataformas autorizadas pelo usuário',
          'Projetar desempenho em provas (tempo estimado, pace alvo)',
          'Gerar relatórios, gráficos e indicadores de performance',
          'Prevenir fraudes e garantir a segurança da Plataforma',
          'Cumprir obrigações legais e regulatórias',
          'Enviar comunicações operacionais e, mediante consentimento específico, comunicações de marketing',
        ],
      },
      {
        subtitulo: '3.1 Inteligência Artificial',
        paragrafos: [
          'O Menthoros utiliza inteligência artificial para duas finalidades distintas, ambas sob o princípio coach-in-the-loop: as sugestões geradas por IA são sempre revisadas pelo treinador antes de chegarem ao atleta.',
          'Geração de planos de treino (OpenAI — GPT-4o): são enviados ao modelo o perfil do atleta (idade, sexo, peso, nível de experiência), histórico de treinos e métricas de carga (TSS, CTL, ATL, TSB), zonas de treino e limiares fisiológicos, provas futuras e objetivos, e informações sobre lesões e histórico.',
          'Análise pós-treino (Anthropic — Claude): são enviados ao modelo os dados do treino realizado versus planejado, métricas de execução (pace, FC, potência, cadência) e frequência cardíaca média e máxima do treino.',
          'Tanto a OpenAI quanto a Anthropic não utilizam dados enviados via API para treinar seus modelos. Os dados são processados exclusivamente para gerar a resposta e descartados em até 30 dias (OpenAI) ou imediatamente (Anthropic). Ambos os provedores mantêm certificações de segurança compatíveis com a legislação brasileira (ISO 27001, SOC 2 Type II).',
          'Durante a fase atual de MVP, o processamento por IA utiliza contas de desenvolvedor. A Menthoros se compromete a formalizar Data Processing Agreements (DPAs) com ambos os provedores antes do lançamento comercial, incluindo cláusulas contratuais padrão (SCCs) para transferência internacional conforme o Art. 33 da LGPD.',
          'Sem o consentimento para IA, o Menthoros continua funcionando, mas os planos de treino são gerados manualmente pelo treinador e as análises pós-treino automáticas são desabilitadas.',
        ],
      },
    ],
  },
  {
    titulo: '4. Bases legais aplicáveis',
    blocos: [
      {
        tabela: {
          descricao: 'Bases legais por finalidade de tratamento',
          colunas: ['Finalidade', 'Base legal', 'Consentimento revogável?'],
          linhas: [
            [
              'Dados cadastrais (nome, e-mail, data nasc.)',
              'Execução de contrato (Art. 7º, V)',
              'Não — necessário ao funcionamento',
            ],
            [
              'Dados de treino (distância, pace, duração)',
              'Execução de contrato (Art. 7º, V)',
              'Não — necessário ao funcionamento',
            ],
            ['Sexo', 'Consentimento explícito (Art. 11, I)', 'Sim — com impacto em zonas de FC/VO2max'],
            [
              'Dados de saúde (lesões, check-in, FC, GPS)',
              'Consentimento explícito (Art. 11, I)',
              'Sim — funcionalidades relacionadas são desabilitadas',
            ],
            ['Geração de planos por IA (OpenAI)', 'Consentimento (Art. 7º, I)', 'Sim — planos passam a ser manuais'],
            [
              'Análise pós-treino por IA (Anthropic)',
              'Consentimento (Art. 7º, I)',
              'Sim — análises automáticas são desabilitadas',
            ],
            [
              'Integrações (Strava, Garmin, Intervals.icu, Health Connect)',
              'Consentimento — autorizado pelo usuário na plataforma de origem',
              'Sim — desconecte a integração',
            ],
            [
              'Convite de atleta (envio de e-mail)',
              'Legítimo interesse da assessoria (Art. 7º, IX)',
              'O convidado pode solicitar remoção',
            ],
            [
              'Dados do treinador (nome, e-mail, avatar, acesso)',
              'Execução de contrato (Art. 7º, V)',
              'Não — necessário ao funcionamento',
            ],
            [
              'Dados da assessoria (razão social, CNPJ, endereço, contato)',
              'Execução de contrato (Art. 7º, V)',
              'Não — necessário à prestação do serviço',
            ],
          ],
        },
        paragrafos: [
          'O titular pode revogar qualquer consentimento a qualquer momento em Configurações > Privacidade.',
        ],
      },
    ],
  },
  {
    titulo: '5. Dados pessoais sensíveis e de saúde',
    blocos: [
      {
        paragrafos: [
          'Em razão da natureza esportiva da Plataforma, são tratados dados sensíveis relativos à saúde e dados biométricos (frequência cardíaca e variáveis fisiológicas), os quais recebem tratamento reforçado e diferenciado, mediante consentimento específico e destacado, ou quando indispensável à tutela da saúde e da vida do titular, nos termos do Art. 11 da LGPD.',
          'É vedada a comunicação ou o uso compartilhado de dados de saúde com terceiros para obtenção de vantagem econômica, nos termos do Art. 11, § 4º, da LGPD, ressalvadas as hipóteses de prestação do próprio serviço, portabilidade autorizada pelo titular e cumprimento de obrigação legal.',
          'O acesso a dados sensíveis é restrito aos profissionais diretamente envolvidos na prestação do serviço ao respectivo titular, mediante controles de acesso reforçados e registro de auditoria (logs).',
        ],
      },
    ],
  },
  {
    titulo: '6. Compartilhamento de dados pessoais',
    blocos: [
      {
        subtitulo: '6.1 Com o treinador e a assessoria',
        paragrafos: [
          'Os dados do atleta são visíveis para o treinador vinculado e para a assessoria contratada. Cada assessoria acessa apenas os dados dos seus próprios atletas, mediante isolamento por tenant com coluna tenant_id em todas as tabelas, TenantInterceptor em camada de aplicação e testes automatizados de isolamento.',
        ],
      },
      {
        subtitulo: '6.2 Com provedores de infraestrutura e subprocessadores',
        tabela: {
          descricao: 'Provedores de infraestrutura e subprocessadores',
          colunas: ['Provedor', 'Serviço', 'Dados', 'País', 'DPA'],
          linhas: [
            [
              'AWS',
              'Hospedagem e banco de dados (PostgreSQL RDS)',
              'Todos os dados da plataforma',
              'Brasil (sa-east-1)',
              'A ser formalizado antes do lançamento',
            ],
            [
              'OpenAI',
              'Processamento de IA — geração de planos',
              'Perfil, histórico, métricas, provas, lesões',
              'EUA',
              'A ser formalizado antes do lançamento',
            ],
            [
              'Anthropic',
              'Processamento de IA — análise pós-treino',
              'Dados do treino, métricas, FC',
              'EUA',
              'A ser formalizado antes do lançamento',
            ],
            [
              'Keycloak',
              'Autenticação e gestão de organizações',
              'Nome, e-mail, grupo/tenant',
              'Brasil (self-hosted)',
              'N/A — infra própria',
            ],
            [
              'Cloudflare',
              'DNS e recebimento de e-mail',
              'E-mails recebidos no domínio',
              'Global (CDN)',
              'N/A — infra de domínio',
            ],
          ],
        },
      },
      {
        subtitulo: '6.3 Não comercializamos dados',
        paragrafos: [
          'A Menthoros não vende, aluga ou compartilha dados pessoais com terceiros para fins de marketing ou publicidade.',
        ],
      },
    ],
  },
  {
    titulo: '7. Transferência internacional',
    blocos: [
      {
        paragrafos: [
          'Os dados enviados à OpenAI e à Anthropic são processados em servidores nos Estados Unidos. Ambos os provedores mantêm certificações de segurança compatíveis com a legislação brasileira (ISO 27001, SOC 2 Type II) e não utilizam dados de API para treinamento de modelos — essa política se aplica tanto a contas empresariais quanto a contas de desenvolvedor.',
          'Antes do lançamento comercial, a Menthoros formalizará Data Processing Agreements (DPAs) incluindo Standard Contractual Clauses (SCCs) conforme o Art. 33, IX, da LGPD.',
        ],
      },
    ],
  },
  {
    titulo: '8. Cookies e tecnologias similares',
    blocos: [
      {
        paragrafos: [
          'A plataforma Menthoros utiliza apenas cookies estritamente necessários para autenticação e funcionamento da aplicação. Não utilizamos cookies de rastreamento, publicidade ou analytics de terceiros.',
          'O frontend não contém Google Analytics, Facebook Pixel, Hotjar, Sentry ou qualquer outro serviço de rastreamento. As fontes tipográficas são carregadas via Google Fonts (CSS API), que não utiliza cookies de tracking. O token de autenticação JWT é mantido no navegador do usuário durante a sessão e trafega exclusivamente no cabeçalho Authorization das requisições à API; não é utilizado cookie de rastreamento para autenticação.',
        ],
      },
    ],
  },
  {
    titulo: '9. Direitos do titular dos dados',
    blocos: [
      {
        paragrafos: ['Nos termos do Art. 18 da LGPD, o titular pode, a qualquer momento e gratuitamente:'],
        tabela: {
          descricao: 'Direitos do titular e como exercê-los',
          colunas: ['Direito', 'Como exercer', 'Prazo'],
          linhas: [
            ['Confirmação e acesso aos dados', 'Solicite por e-mail ou visualize no aplicativo', 'Até 15 dias'],
            ['Correção de dados incompletos ou desatualizados', 'Edite no seu perfil (self-service)', 'Imediato'],
            ['Anonimização, bloqueio ou eliminação', 'Solicite por e-mail', 'Até 15 dias'],
            ['Portabilidade para outro serviço', 'Solicite exportação em formato JSON/CSV', 'Até 15 dias'],
            [
              'Revogação do consentimento',
              'Configurações > Privacidade > Revogar consentimento',
              'Imediato; efeitos em até 24h',
            ],
            ['Informação sobre compartilhamento', 'Esta política, Seção 6; ou solicite ao DPO', 'Até 15 dias'],
          ],
        },
      },
      {
        paragrafos: [
          `As solicitações devem ser dirigidas ao DPO pelo e-mail ${CONTATO_EMAIL}. A Menthoros poderá solicitar informações adicionais para confirmação da identidade do titular.`,
        ],
      },
    ],
  },
  {
    titulo: '10. Retenção e eliminação dos dados',
    blocos: [
      {
        tabela: {
          descricao: 'Prazos de retenção por tipo de dado',
          colunas: ['Dado', 'Período de retenção', 'Justificativa'],
          linhas: [
            [
              'Dados de perfil e treino',
              'Enquanto o atleta estiver ativo + 30 dias após solicitação de exclusão',
              'Prazo para conclusão de processos de faturamento da assessoria e sincronização de backups',
            ],
            [
              'Dados de check-in',
              'Últimos 12 meses (rolagem automática)',
              'Janela clinicamente relevante para análise de tendência de carga e periodização; após 12 meses são anonimizados para fins estatísticos',
            ],
            [
              'Atividades importadas (Strava/Garmin/Intervals.icu)',
              'Enquanto a integração estiver ativa + 30 dias após desconexão',
              'Permite reimportação em caso de desconexão acidental',
            ],
            [
              'Dados do treinador e assessoria',
              'Enquanto a assessoria estiver ativa + 90 dias',
              'Prazo para encerramento contratual e exportação de dados pelo cliente B2B',
            ],
            [
              'Convites não aceitos',
              '7 dias após envio',
              'Legítimo interesse da assessoria; o convidado pode solicitar remoção imediata',
            ],
            [
              'Backups',
              '30 dias (retenção de backup)',
              'Criptografados (AES-256); sobrescritos no ciclo normal de rotação',
            ],
          ],
        },
      },
      {
        paragrafos: [
          'Exclusão em cascata: quando uma assessoria encerra a conta, todos os dados de atletas vinculados são excluídos ou anonimizados em até 30 dias. Atletas são notificados previamente e podem solicitar portabilidade dos seus dados antes da exclusão. Dados em backups são eliminados no ciclo normal de rotação (até 30 dias adicionais). Dados já enviados a OpenAI e Anthropic não são recuperáveis, mas os DPAs preveem que esses provedores não retêm os dados após o processamento.',
        ],
      },
    ],
  },
  {
    titulo: '11. Segurança da informação',
    blocos: [
      {
        paragrafos: [
          'A Menthoros adota medidas técnicas e administrativas de segurança compatíveis com as melhores práticas de mercado, incluindo:',
        ],
        itens: [
          'Criptografia em trânsito (TLS 1.3)',
          'Criptografia em repouso (AES-256)',
          'Isolamento de dados por assessoria (coluna tenant_id em todas as tabelas + TenantInterceptor)',
          'Autenticação via Keycloak (OAuth 2.0 / OpenID Connect)',
          'Tokens de acesso com expiração e refresh',
          'Controles de acesso baseados em privilégios mínimos',
          'Logs de acesso e monitoramento contínuo',
          'Backups criptografados com rotação de 30 dias',
        ],
      },
      {
        subtitulo: '11.1 Incidentes de segurança',
        paragrafos: [
          'Em caso de incidente de segurança que possa acarretar risco relevante aos titulares, a Menthoros comunicará os afetados e a Autoridade Nacional de Proteção de Dados (ANPD) nos termos do Art. 48 da LGPD, em prazo razoável conforme definido pela autoridade.',
        ],
      },
      {
        subtitulo: '11.2 RIPD (Relatório de Impacto à Proteção de Dados)',
        paragrafos: [
          'O Menthoros mantém Relatório de Impacto à Proteção de Dados Pessoais (RIPD) para os tratamentos de dados sensíveis em larga escala, conforme o Art. 38 da LGPD e a Resolução CD/ANPD nº 2/2022. Elaborado em 31 de julho de 2026. Disponível para consulta mediante solicitação ao DPO.',
        ],
      },
    ],
  },
  {
    titulo: '12. Idade mínima',
    blocos: [
      {
        paragrafos: [
          'A plataforma Menthoros é destinada a usuários com 18 anos ou mais. Para atletas entre 16 e 18 anos, o cadastro deve ser realizado pelo responsável legal, que fornecerá o consentimento parental conforme o Art. 14 da LGPD. Não realizamos tratamento de dados de crianças menores de 16 anos. A Menthoros poderá solicitar, a qualquer tempo, comprovação da autorização dos pais ou responsável legal, podendo suspender o cadastro na ausência de tal comprovação.',
        ],
      },
    ],
  },
  {
    titulo: '13. Alterações desta política',
    blocos: [
      {
        paragrafos: [
          'Esta Política poderá ser atualizada periodicamente para refletir mudanças legislativas, regulatórias ou nas práticas de tratamento de dados da Menthoros. Alterações significativas serão comunicadas por e-mail com pelo menos 15 dias de antecedência. A data de atualização no topo indica a versão vigente.',
        ],
      },
    ],
  },
  {
    titulo: '14. Legislação aplicável e foro',
    blocos: [
      {
        paragrafos: [
          'Esta Política é regida pela legislação brasileira, em especial pela Lei nº 13.709/2018 (LGPD) e pela Lei nº 12.965/2014 (Marco Civil da Internet). Fica eleito o foro da Comarca de São Paulo/SP para dirimir eventuais controvérsias, ressalvada a competência do foro de domicílio do usuário consumidor, quando aplicável.',
        ],
      },
    ],
  },
];
