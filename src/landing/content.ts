/* Landing copy centralizado — edite a mensagem aqui, sem tocar nos componentes. */

export const nav = {
  links: [
    { label: "Plataforma", id: "how" },
    { label: "Diferencial", id: "delta" },
    { label: "Para treinadores", id: "fit" },
  ],
  login: "Entrar",
  cta: "Solicitar acesso",
};

export const hero = {
  eyebrow: "Inteligência de performance",
  titleLine1: "A IA propõe.",
  titleLine2Pre: "O treinador ",
  titleAccent: "decide.",
  sub: "Inteligência que amplia sua visão, devolve tempo e eleva o desempenho de cada atleta — sem nunca tirar você do comando.",
  cta: "Solicitar acesso",
  scarcity: "10 vagas do programa fundador · 60 dias grátis, sem cartão",
  proofLabel: "Construído sobre a ciência do treino",
};

// `\n` nos títulos marca quebra autoral. O SectionHeading só a aplica acima de
// 900px — em coluna estreita um <br> fixo cria linha órfã de duas palavras.
export const pain = {
  eyebrow: "A rotina de quem acompanha muitos atletas",
  title: "Você perde mais tempo lendo\nplanilha do que treinando atleta.",
  items: [
    { t: "Horas na planilha", b: "Cada atleta exige abrir, cruzar e interpretar dado na mão. Não escala." },
    { t: "O atleta some quando sua atenção cai", b: "Sem priorização, quem precisa de você passa despercebido até virar lesão." },
    { t: "Decisão no escuro", b: "Ajustar carga no feeling funciona até a operação crescer — aí o custo aparece." },
  ],
};

export const how = {
  eyebrow: "Como funciona",
  title: "O loop fechado,\nem três passos.",
  loopLabel: "A decisão do treinador retroalimenta o modelo",
  steps: [
    { n: "01", t: "Conecte e colete", b: "Os dados de treino entram automaticamente do Garmin — a integração ativa nesta primeira turma. Outras marcas entram por demanda dos parceiros fundadores." },
    { n: "02", t: "A IA analisa", b: "Modelos transformam carga, fadiga e prontidão em sinais claros: quem precisa de atenção e o porquê." },
    { n: "03", t: "Você decide", b: "A IA propõe os ajustes. Você aplica sua experiência e conduz cada atleta. Nada vai ao atleta sem o seu aval." },
  ],
};

export const delta = {
  eyebrow: "O delta Menthoros",
  title: "A IA não substitui você.\nEla aprende com a sua decisão.",
  sub: "Toda proposta da IA passa por você. A diferença entre o que ela sugeriu e o que você decidiu é o que torna o sistema melhor a cada semana — esse é o diferencial que ninguém mais entrega.",
  context: "HUGO SILVA · SEM. 14 · CARGA INTERNA",
  proposed: "Reduzir o volume em 15% e manter um estímulo aeróbico de Z2.",
  decided: "Reduziu 10% e manteve o treino-chave — o atleta respondeu bem ao último bloco.",
  feedback: "Esse delta de 5% e a escolha de preservar o treino-chave voltam para o modelo. Na semana 15, a proposta já nasce mais perto da sua leitura.",
};

export const capabilities = {
  eyebrow: "Visão clara, decisões melhores",
  title: "Interpretação, não só\nexibição de métricas.",
  sub: "Não basta mostrar pace, FC e TSS. O Menthoros traduz o sinal em leitura prática — e mostra o porquê de cada recomendação.",
  bullets: [
    "Prioriza quem mais precisa, primeiro",
    "Antecipa riscos e previne lesões",
    "Explica cada sugestão — sem caixa-preta",
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
  body: "CTL, ATL, TSB, aerobic decoupling, polarização de carga — o Menthoros é construído sobre a ciência do treino, não sobre buzzword. E os dados são seus: cada assessoria isolada, o treinador no controle do que o atleta vê.",
  chips: ["TSS", "CTL/ATL/TSB", "Decoupling", "Dados isolados por assessoria"],
};

export const pricing = {
  eyebrow: "Planos e preços",
  title: "Preço claro,\nsem letra miúda.",
  intro: "Estes são os planos a partir do lançamento geral. As 10 vagas do programa fundador não escolhem entre eles — pulam direto para o Basic no dia 61 do trial.",
  trialNote: "60 dias grátis, sem cartão — no dia 61 vira Basic se você cadastrar o cartão.",
  plans: [
    { nome: "GRATUITO", atletas: "≤10", tecnicos: "1", preco: "R$ 0", destaque: false },
    { nome: "BASIC", atletas: "≤20", tecnicos: "1", preco: "R$ 99", destaque: true },
    { nome: "PRO", atletas: "≤50", tecnicos: "2", preco: "R$ 199", destaque: false },
    { nome: "ENTERPRISE", atletas: "≤100", tecnicos: "5", preco: "R$ 349", destaque: false },
    { nome: "SCALE", atletas: "100+", tecnicos: "Ilimitado", preco: "R$ 599", destaque: false },
  ],
};

export const faq = {
  eyebrow: "Perguntas frequentes",
  title: "O que os treinadores\nperguntam.",
  items: [
    { q: "A IA vai substituir o treinador?", a: "Não — o contrário. O Menthoros faz o trabalho pesado de ler os dados e propõe ajustes, mas a decisão é 100% sua. Nada chega ao atleta sem o seu aval. A ideia é devolver seu tempo, não tomar seu lugar." },
    { q: "Preciso que meus atletas tenham um relógio específico?", a: "Nesta primeira turma, sim: o Menthoros lê os dados direto do Garmin. Se os atletas da sua assessoria usam outra marca, me conta na conversa de acesso — a próxima integração é priorizada pela demanda dos parceiros fundadores." },
    { q: "Quanto custa?", a: "Estamos fechando os planos para o lançamento. As assessorias da turma fundadora entram com condição especial — solicite acesso e a gente conversa sobre o seu porte." },
    { q: "Serve para uma assessoria pequena?", a: "Serve, e às vezes encaixa até melhor. Quando você cuida de tudo, o gargalo é tempo — exatamente onde o Menthoros ajuda, automatizando a análise para você focar na decisão." },
  ],
};

export const finalCta = {
  titlePre: "Pronto para ",
  titleAccent: "elevar",
  titlePost: " sua assessoria?",
  sub: "Entre na turma fundadora e veja como a IA transforma seu tempo em impacto real para seus atletas.",
};
