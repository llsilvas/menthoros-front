/* Landing copy centralizado — edite a mensagem aqui, sem tocar nos componentes. */

export const nav = {
  links: [
    { label: "Plataforma", id: "how" },
    { label: "Diferencial", id: "delta" },
    { label: "Para treinadores", id: "fit" },
    { label: "Preços", id: "precos" },
  ],
  login: "Entrar",
  cta: "Solicitar acesso",
};

export const hero = {
  eyebrow: "Inteligência de performance",
  titleLine1: "A IA propõe.",
  titleLine2Pre: "O treinador ",
  titleAccent: "decide.",
  sub: "Feito para assessorias de endurance: a IA lê o treino de cada atleta e propõe ajustes. Você decide o que muda, sem perder tempo com planilha.",
  cta: "Solicitar acesso",
  scarcity: "10 vagas do programa fundador · 60 dias grátis, sem cartão",
  // RF-01: indicação curta de continuidade paga, com link para a seção de preços — sem sugerir
  // ativação imediata ao clicar em "Solicitar acesso" (o clique continua indo para o formulário).
  continuityHint: "Depois do teste, planos a partir de R$ 99/mês.",
  proofLabel: "Construído sobre a ciência do treino",
};

// RF-02: bloco dedicado à oferta fundadora — substitui a comparação de planos como elemento
// principal da seção de preços. Texto baseado nas condições já publicadas (não depende de
// D-01/D-02/D-04 — ver design.md da change landing-oferta-fundadora-clareza).
export const founderOffer = {
  badge: "Programa fundador · 10 vagas",
  trialLine: "Experimente o Menthoros por 60 dias grátis, sem cartão.",
  // "durante o teste" fica deliberadamente sem número — a capacidade dos 60 dias depende de D-02,
  // não é a mesma coisa que o limite do Basic (que só vale depois).
  afterTrialPre: "Após o teste, continue no Basic por ",
  afterTrialPrice: "R$ 99/mês",
  afterTrialPost: ", com 1 técnico e até 20 atletas.",
  continuityNote: "Para continuar, será necessário cadastrar um cartão e contratar o plano. Sem a contratação, o acesso será encerrado ao fim dos 60 dias.",
  cta: "Solicitar acesso",
};

// `\n` nos títulos marca quebra autoral. O SectionHeading só a aplica acima de
// 900px — em coluna estreita um <br> fixo cria linha órfã de duas palavras.
export const pain = {
  eyebrow: "A rotina de quem acompanha muitos atletas",
  title: "Você perde mais tempo lendo\nplanilha do que treinando atleta.",
  items: [
    { t: "Horas na planilha", b: "Cada atleta exige abrir, cruzar e interpretar dado na mão. Não escala." },
    { t: "O atleta some quando sua atenção cai", b: "Sem priorização, quem precisa de você passa despercebido até virar lesão." },
    { t: "Decisão no escuro", b: "Ajustar carga no feeling funciona até a operação crescer. Aí o custo aparece." },
  ],
};

export const how = {
  eyebrow: "Como funciona",
  title: "O loop fechado,\nem três passos.",
  loopLabel: "A decisão do treinador retroalimenta o modelo",
  steps: [
    { n: "01", t: "Conecte e colete", b: "Os dados de treino entram automaticamente do Garmin, a integração ativa nesta primeira turma. Outras marcas entram por demanda dos parceiros fundadores." },
    { n: "02", t: "A IA analisa", b: "Modelos transformam carga, fadiga e prontidão em sinais claros: quem precisa de atenção e o porquê." },
    { n: "03", t: "Você decide", b: "A IA propõe os ajustes. Você aplica sua experiência e conduz cada atleta. Nada vai ao atleta sem o seu aval." },
  ],
};

export const delta = {
  eyebrow: "O delta Menthoros",
  title: "A IA não substitui você.\nEla aprende com a sua decisão.",
  sub: "Toda proposta da IA passa por você. A diferença entre o que ela sugeriu e o que você decidiu é o que torna o sistema melhor a cada semana.",
  context: "HUGO SILVA · SEM. 14 · CARGA INTERNA",
  proposed: "Reduzir o volume em 15% e manter um estímulo aeróbico de Z2.",
  decided: "Reduziu 10% e manteve o treino-chave: o atleta respondeu bem ao último bloco.",
  feedback: "Esse delta de 5% e a escolha de preservar o treino-chave voltam para o modelo. Na semana 15, a proposta já nasce mais perto da sua leitura.",
};

export const capabilities = {
  eyebrow: "Visão clara, decisões melhores",
  title: "Interpretação, não só\nexibição de métricas.",
  sub: "Não basta mostrar pace, FC e TSS. O Menthoros traduz o sinal em leitura prática e mostra o porquê de cada recomendação.",
  bullets: [
    "Prioriza quem mais precisa, primeiro",
    "Antecipa riscos e previne lesões",
    "Explica cada sugestão, sem caixa-preta",
    "Evolui mais atletas, com menos tempo",
  ],
};

export const fit = {
  eyebrow: "É para você?",
  title: "Feito para assessorias\nque levam a sério.",
  yes: {
    head: "É PRA VOCÊ SE…",
    items: [
      "Você acompanha vários atletas e o tempo é o gargalo",
      "Quer escalar sem perder a qualidade do acompanhamento",
      "Valoriza decisão baseada em dado, mas quer manter o controle",
    ],
  },
  no: {
    head: "TALVEZ AINDA NÃO SE…",
    items: [
      "Você busca um app de treino para uso pessoal de atleta",
      "Prefere um gerador automático que decide sozinho por você",
      "Não tem interesse em acompanhar dados dos atletas",
    ],
  },
};

export const trust = {
  founderLabel: "QUEM CONSTRÓI",
  founderBio: "Leandro, engenheiro e corredor. O Menthoros nasce de quem vive, na prática, a rotina técnica de uma assessoria de endurance.",
  title: "Profundidade técnica\nde verdade.",
  body: "CTL, ATL, TSB, aerobic decoupling, polarização de carga: o Menthoros é construído sobre a ciência do treino, não sobre buzzword. E os dados são seus, cada assessoria isolada, o treinador no controle do que o atleta vê.",
  chips: ["TSS", "CTL/ATL/TSB", "Decoupling", "Dados isolados por assessoria"],
};

export const pricing = {
  eyebrow: "Planos e preços",
  title: "Preço claro,\nsem letra miúda.",
  // RF-03: a tabela deixa de ser o elemento principal — o bloco founderOffer (acima) já conta a
  // história do fundador. Este subtítulo introduz só os planos previstos para depois do programa.
  plansHeading: "Planos previstos para o lançamento geral",
  plans: [
    // "GRATUITO — R$ 0/mês" foi removido (CA-01): sugeria plano gratuito permanente. O teste de
    // 60 dias pertence à oferta fundadora (founderOffer), nunca à tabela de planos.
    { nome: "BASIC", atletas: "≤20", tecnicos: "1", preco: "R$ 99", destaque: true, status: "Onde o teste termina" },
    { nome: "PRO", atletas: "≤50", tecnicos: "2", preco: "R$ 199", destaque: false, status: "Disponível no lançamento geral" },
    { nome: "ENTERPRISE", atletas: "≤100", tecnicos: "5", preco: "R$ 349", destaque: false, status: "Disponível no lançamento geral" },
    { nome: "SCALE", atletas: "100+", tecnicos: "Ilimitado", preco: "R$ 599", destaque: false, status: "Disponível no lançamento geral" },
  ],
};

export const faq = {
  eyebrow: "Perguntas frequentes",
  title: "O que os treinadores\nperguntam.",
  items: [
    { q: "A IA vai substituir o treinador?", a: "Pelo contrário: o Menthoros faz o trabalho pesado de ler os dados e propõe ajustes, mas a decisão é 100% sua. Nada chega ao atleta sem o seu aval. A ideia é devolver seu tempo, não tomar seu lugar." },
    { q: "Preciso que meus atletas tenham um relógio específico?", a: "Nesta primeira turma, sim: o Menthoros lê os dados direto do Garmin. Se os atletas da sua assessoria usam outra marca, me conta na conversa de acesso. A próxima integração é priorizada pela demanda dos parceiros fundadores." },
    { q: "Quanto custa?", a: "As 10 vagas do programa fundador entram com 60 dias grátis, sem cartão. Depois do teste, você cadastra o cartão e segue no plano Basic: R$ 99/mês, 1 técnico e até 20 atletas. Não cadastrou até lá? Perde o acesso." },
    { q: "Existe um plano gratuito permanente?", a: "Não. O acesso gratuito vale somente durante os 60 dias de teste. Depois desse período, é necessário contratar um plano pago para continuar usando o Menthoros." },
    { q: "Serve para uma assessoria pequena?", a: "Serve, e às vezes encaixa até melhor. Quando você cuida de tudo, o gargalo é tempo. É exatamente onde o Menthoros ajuda, automatizando a análise para você focar na decisão." },
  ],
};

export const finalCta = {
  titlePre: "Pronto para ",
  titleAccent: "escalar",
  titlePost: " sua assessoria?",
  sub: "Você seria uma das 10 assessorias fundadoras a usar o Menthoros em produção real. Seu retorno molda as próximas versões antes de qualquer lançamento aberto.",
};
