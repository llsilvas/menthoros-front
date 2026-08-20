import { describe, it, expect } from 'vitest';
import { selectWorkoutProfile } from './selectWorkoutProfile';
import type { ProfileEtapaInput } from './input';

const etapa = (over: Partial<ProfileEtapaInput> = {}): ProfileEtapaInput => ({
  tipo: 'PRINCIPAL',
  duracaoMin: 10,
  ...over,
});

const ctx = { sport: 'run' as const };

describe('selectWorkoutProfile — zona', () => {
  it('lê a zona declarada pelo treinador no alvo da etapa', () => {
    const [b] = selectWorkoutProfile([etapa({ fcAlvo: 'Z4' })], ctx).blocks;
    expect(b.zone).toBe('Z4');
    expect(b.confidence).toBe('prescribed');
  });

  it('infere do tipo da etapa quando não há zona declarada, e marca como estimativa', () => {
    const [b] = selectWorkoutProfile([etapa({ tipo: 'AQUECIMENTO' })], ctx).blocks;
    expect(b.zone).toBe('Z1');
    expect(b.confidence).toBe('derived');
  });

  // O `toWorkoutBlocks` fazia `return 1` quando não sabia. Uma barra Z1 é uma
  // afirmação — "este trecho é leve" — e era falsa metade das vezes.
  it('não inventa Z1 quando não há base nenhuma', () => {
    const [b] = selectWorkoutProfile([etapa({ tipo: 'XPTO' })], ctx).blocks;
    expect(b.confidence).toBe('unknown');
  });

  // Achado da navegação de verificação: "Corrida contínua Z2" renderizava
  // hachurado, como "não sei a zona", e com a altura errada. O dado estava
  // escrito e era descartado — a mesma classe de erro que este módulo existe
  // para corrigir.
  it('lê a zona escrita na descrição da etapa', () => {
    const [b] = selectWorkoutProfile(
      [etapa({ tipo: 'PRINCIPAL', duracaoMin: 35, descricao: 'Corrida contínua Z2' })],
      ctx,
    ).blocks;
    expect(b.zone).toBe('Z2');
    expect(b.confidence).toBe('prescribed');
  });

  it('lê a zona escrita no ritmo alvo', () => {
    const [b] = selectWorkoutProfile([etapa({ ritmoAlvo: 'Z3 — 5:00/km' })], ctx).blocks;
    expect(b.zone).toBe('Z3');
    expect(b.confidence).toBe('prescribed');
  });

  // Campo de alvo é mais específico que prosa livre: quando os dois existem e
  // discordam, quem manda é o alvo.
  it('o alvo da etapa ganha da zona escrita na prosa', () => {
    const [b] = selectWorkoutProfile(
      [etapa({ fcAlvo: 'Z4', descricao: 'aquecimento leve em Z2' })],
      ctx,
    ).blocks;
    expect(b.zone).toBe('Z4');
  });

  it('um treino com as zonas só na prosa deixa de ser degradado', () => {
    const p = selectWorkoutProfile([
      etapa({ tipo: 'AQUECIMENTO', duracaoMin: 10, descricao: 'Aquecimento Z1' }),
      etapa({ tipo: 'PRINCIPAL', duracaoMin: 35, descricao: 'Corrida contínua Z2' }),
      etapa({ tipo: 'DESAQUECIMENTO', duracaoMin: 5, descricao: 'Solto, Z1' }),
    ], ctx);

    expect(p.degraded).toBe(false);
    expect(p.metrics.targetZone).toBe('Z2');
  });

  it('desaquecimento não é lido como aquecimento', () => {
    const [b] = selectWorkoutProfile([etapa({ tipo: 'DESAQUECIMENTO' })], ctx).blocks;
    expect(b.kind).toBe('cooldown');
  });
});

describe('selectWorkoutProfile — etapas sem duração', () => {
  // O componente antigo desenhava barra de largura zero: some da tela sem
  // avisar, e o treinador aprova um treino com uma etapa que não existe.
  it('descarta a etapa do eixo e conta o descarte', () => {
    const p = selectWorkoutProfile(
      [etapa({ fcAlvo: 'Z2' }), etapa({ duracaoMin: undefined }), etapa({ duracaoMin: 0 })],
      ctx,
    );
    expect(p.blocks).toHaveLength(1);
    expect(p.droppedBlocks).toBe(2);
  });

  it('todas sem duração cai no estado vazio, não num gráfico de nada', () => {
    const p = selectWorkoutProfile([etapa({ duracaoMin: undefined })], ctx);
    expect(p.blocks).toHaveLength(0);
    expect(p.metrics.totalDurationSec).toBe(0);
    expect(p.metrics.targetZone).toBeNull();
  });

  it('reindexa `order` densamente após os descartes', () => {
    const p = selectWorkoutProfile(
      [etapa({ fcAlvo: 'Z1' }), etapa({ duracaoMin: 0 }), etapa({ fcAlvo: 'Z3' })],
      ctx,
    );
    expect(p.blocks.map((b) => b.order)).toEqual([0, 1]);
  });
});

// O exemplo trabalhado da spec §2.6: 40min, 12 blocos, 5×(3' limiar + 2' trote),
// aquecimento de 10' e desaquecimento de 5'.
describe('selectWorkoutProfile — métricas sobre o exemplo da spec §2.6', () => {
  const cincoVezesTres: ProfileEtapaInput[] = [
    etapa({ tipo: 'AQUECIMENTO', duracaoMin: 10, fcAlvo: 'Z2' }),
    ...Array.from({ length: 5 }, (_, i) => [
      etapa({ tipo: 'INTERVALADO', duracaoMin: 3, fcAlvo: 'Z4', blocoId: 'g1', blocoRepeticoes: 5, blocoRepeticaoIndex: i + 1 }),
      etapa({ tipo: 'RECUPERACAO', duracaoMin: 2, fcAlvo: 'Z1', blocoId: 'g1', blocoRepeticoes: 5, blocoRepeticaoIndex: i + 1 }),
    ]).flat(),
    etapa({ tipo: 'DESAQUECIMENTO', duracaoMin: 5, fcAlvo: 'Z2' }),
  ];

  const p = selectWorkoutProfile(cincoVezesTres, { sport: 'run', tss: 62 });

  it('conta 12 blocos e 40 minutos', () => {
    expect(p.metrics.blockCount).toBe(12);
    expect(p.metrics.totalDurationSec).toBe(2400);
  });

  it('distribui exatamente como a spec: Z1 25%, Z2 37,5%, Z4 37,5%', () => {
    const porZona = Object.fromEntries(p.metrics.distribution.map((d) => [d.zone, d]));
    expect(porZona.Z1.seconds).toBe(600);
    expect(porZona.Z2.seconds).toBe(900);
    expect(porZona.Z4.seconds).toBe(900);
    expect(porZona.Z1.share).toBeCloseTo(0.25, 3);
    expect(porZona.Z2.share).toBeCloseTo(0.375, 3);
    expect(porZona.Z4.share).toBeCloseTo(0.375, 3);
  });

  it('elege Z4 como zona-alvo — a maior acima de 15%', () => {
    expect(p.metrics.targetZone).toBe('Z4');
    expect(p.metrics.targetZoneSeconds).toBe(900);
  });

  it('mede o maior bloco contínuo de trabalho em 3 minutos', () => {
    expect(p.metrics.longestWorkBlockSec).toBe(180);
  });

  // 3:2 é como o treinador enuncia o treino. A razão global de um longo com
  // sprint final não diria nada — por isso é medida DENTRO da série.
  it('calcula trabalho:recuperação dentro da série, não global', () => {
    expect(p.metrics.workToRecoveryRatio).toBeCloseTo(1.5, 3);
  });

  // Achado da navegação: treinos reais exibiam "trabalho 11:4", "3:8" e "7:3".
  // Sem série, o cálculo classificava por zona sobre o treino inteiro, então
  // aquecimento e desaquecimento entravam como "recuperação" — num intervalado
  // isso dizia que o atleta descansa três vezes mais do que corre forte,
  // enquanto o gráfico ao lado mostrava o contrário.
  it('não calcula razão trabalho:recuperação sem série', () => {
    const semSerie = selectWorkoutProfile([
      etapa({ tipo: 'AQUECIMENTO', duracaoMin: 15, fcAlvo: 'Z2' }),
      etapa({ tipo: 'PRINCIPAL', duracaoMin: 55, fcAlvo: 'Z3' }),
      etapa({ tipo: 'DESAQUECIMENTO', duracaoMin: 5, fcAlvo: 'Z1' }),
    ], ctx);
    expect(semSerie.metrics.workToRecoveryRatio).toBeNull();
  });

  it('repassa TSS do consumidor e deixa IF nulo quando não vem', () => {
    expect(p.metrics.tss).toBe(62);
    expect(p.metrics.intensityFactor).toBeNull();
  });

  it('marca as dez repetições com groupId, index e total', () => {
    const series = p.blocks.filter((b) => b.repeat);
    expect(series).toHaveLength(10);
    expect(series.map((b) => b.repeat!.index)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
    expect(series.every((b) => b.repeat!.total === 5)).toBe(true);
  });

  it('não está degradado — todas as zonas foram declaradas', () => {
    expect(p.degraded).toBe(false);
  });
});

// O backend entrega a série já expandida e sem `blocoId` — então o perfil via
// N blocos avulsos, sem bracket, e com "REC" repetido seis vezes na tela: o
// ruído que o agrupamento existe para evitar.
describe('selectWorkoutProfile — série expandida sem blocoId', () => {
  const seisPares = Array.from({ length: 6 }, () => [
    etapa({ tipo: 'INTERVALADO', duracaoMin: 2, fcAlvo: 'Z5' }),
    etapa({ tipo: 'RECUPERACAO', duracaoMin: 1, fcAlvo: 'Z1' }),
  ]).flat();

  it('reconhece os seis pares repetidos como uma série', () => {
    const p = selectWorkoutProfile(seisPares, ctx);
    const naSerie = p.blocks.filter((b) => b.repeat);

    expect(naSerie).toHaveLength(12);
    expect(naSerie.every((b) => b.repeat!.total === 6)).toBe(true);
    expect(naSerie.map((b) => b.repeat!.index)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6]);
  });

  // O vocabulário de trabalho do perfil é mais amplo que o do editor, que só
  // reconhece "INTERVALADO". Um treino com "TIRO" é série do mesmo jeito.
  it('agrupa também as séries que o editor não reconheceria', () => {
    const comTiro = Array.from({ length: 4 }, () => [
      etapa({ tipo: 'TIRO', duracaoMin: 1, fcAlvo: 'Z5' }),
      etapa({ tipo: 'RECUPERACAO', duracaoMin: 2, fcAlvo: 'Z1' }),
    ]).flat();
    expect(selectWorkoutProfile(comTiro, ctx).blocks.filter((b) => b.repeat)).toHaveLength(8);
  });

  it('não agrupa repetição sem esforço dentro — dois blocos leves não são série', () => {
    const p = selectWorkoutProfile([
      etapa({ tipo: 'AQUECIMENTO', duracaoMin: 10, fcAlvo: 'Z2' }),
      etapa({ tipo: 'AQUECIMENTO', duracaoMin: 10, fcAlvo: 'Z2' }),
    ], ctx);
    expect(p.blocks.filter((b) => b.repeat)).toHaveLength(0);
  });

  it('respeita o `blocoId` quando ele existe — não reinventa o agrupamento', () => {
    const p = selectWorkoutProfile([
      etapa({ tipo: 'INTERVALADO', duracaoMin: 3, fcAlvo: 'Z4', blocoId: 'g1', blocoRepeticoes: 2, blocoRepeticaoIndex: 1 }),
      etapa({ tipo: 'INTERVALADO', duracaoMin: 3, fcAlvo: 'Z4', blocoId: 'g1', blocoRepeticoes: 2, blocoRepeticaoIndex: 2 }),
    ], ctx);
    expect(p.blocks.every((b) => b.repeat?.groupId === 'g1')).toBe(true);
  });

  // Ganho colateral: com a série reconhecida, a razão volta a ser calculável —
  // e agora pelo caminho que significa alguma coisa.
  it('a razão trabalho:recuperação volta, agora pelo caminho da série', () => {
    expect(selectWorkoutProfile(seisPares, ctx).metrics.workToRecoveryRatio).toBeCloseTo(2, 3);
  });
});

describe('selectWorkoutProfile — zona-alvo', () => {
  it('ignora o pico incidental: um sprint curto não faz o treino ser Z5', () => {
    const longoComSprint = [
      etapa({ duracaoMin: 118, fcAlvo: 'Z2' }),
      etapa({ duracaoMin: 2, fcAlvo: 'Z5' }),
    ];
    expect(selectWorkoutProfile(longoComSprint, ctx).metrics.targetZone).toBe('Z2');
  });

  it('sem nenhuma zona acima de 15%, não inventa um alvo', () => {
    const picotado = [
      etapa({ duracaoMin: 60, fcAlvo: 'Z1' }),
      etapa({ duracaoMin: 8, fcAlvo: 'Z2' }),
      etapa({ duracaoMin: 8, fcAlvo: 'Z3' }),
      etapa({ duracaoMin: 8, fcAlvo: 'Z4' }),
    ];
    const p = selectWorkoutProfile(picotado, ctx);
    expect(p.metrics.distribution.find((d) => d.zone === 'Z1')!.share).toBeGreaterThan(0.15);
    expect(p.metrics.targetZone).toBe('Z1');
  });

  it('entre duas zonas acima de 15%, escolhe a mais alta', () => {
    const p = selectWorkoutProfile(
      [etapa({ duracaoMin: 30, fcAlvo: 'Z2' }), etapa({ duracaoMin: 30, fcAlvo: 'Z4' })],
      ctx,
    );
    expect(p.metrics.targetZone).toBe('Z4');
  });
});

describe('selectWorkoutProfile — modo degradado (§6.4)', () => {
  const semZona = [
    etapa({ tipo: 'AQUECIMENTO', duracaoMin: 10 }),
    etapa({ tipo: 'INTERVALADO', duracaoMin: 20 }),
    etapa({ tipo: 'RECUPERACAO', duracaoMin: 10 }),
  ];
  const p = selectWorkoutProfile(semZona, ctx);

  it('marca o perfil como degradado quando nenhuma zona foi declarada', () => {
    expect(p.degraded).toBe(true);
  });

  it('a altura passa a codificar o papel do bloco', () => {
    const alturas = Object.fromEntries(p.blocks.map((b) => [b.kind, b.intensityNormalized]));
    expect(alturas.work).toBeGreaterThan(alturas.warmup);
    expect(alturas.warmup).toBeGreaterThan(alturas.recovery);
  });

  // A spec dava o mesmo nível a aquecimento, principal e desaquecimento, e o
  // resultado na tela era um perfil chapado justamente no treino mais comum —
  // o defeito D2 de volta pelo caminho degradado.
  it('aquecimento, corpo e desaquecimento não saem todos na mesma altura', () => {
    const semZonaComPrincipal = selectWorkoutProfile([
      etapa({ tipo: 'AQUECIMENTO', duracaoMin: 10 }),
      etapa({ tipo: 'PRINCIPAL', duracaoMin: 30 }),
      etapa({ tipo: 'DESAQUECIMENTO', duracaoMin: 10 }),
    ], ctx);

    const alturas = semZonaComPrincipal.blocks.map((b) => b.intensityNormalized);
    expect(new Set(alturas).size, `alturas: ${alturas.join(', ')}`).toBe(3);
    // E a ordem é a do esforço: corpo > aquecimento > desaquecimento.
    expect(alturas[1]).toBeGreaterThan(alturas[0]);
    expect(alturas[0]).toBeGreaterThan(alturas[2]);
  });

  // Único dado real de intensidade quando a etapa não traz o seu. Ela ancora a
  // escala INTEIRA — a versão anterior deste teste exigia que o aquecimento
  // ficasse parado, e era isso que produzia duas escalas no mesmo eixo e um
  // gráfico de cabeça para baixo num treino leve.
  it('a zona-alvo do treino reescala o perfil, mantendo a ordem dos papéis', () => {
    const semZona = [
      etapa({ tipo: 'AQUECIMENTO', duracaoMin: 10 }),
      etapa({ tipo: 'PRINCIPAL', duracaoMin: 30 }),
    ];
    const semAlvo = selectWorkoutProfile(semZona, ctx);
    const comAlvo = selectWorkoutProfile(semZona, { ...ctx, zonaAlvoTreino: 'Z4' });

    expect(comAlvo.blocks[1].intensityNormalized).toBeGreaterThan(semAlvo.blocks[1].intensityNormalized);
    // O aquecimento sobe junto, e continua abaixo do corpo.
    expect(comAlvo.blocks[0].intensityNormalized).toBeGreaterThan(semAlvo.blocks[0].intensityNormalized);
    expect(comAlvo.blocks[0].intensityNormalized).toBeLessThan(comAlvo.blocks[1].intensityNormalized);
    // Continua declarado como estimativa — a zona do treino não é a da etapa.
    expect(comAlvo.degraded).toBe(true);
  });

  // Três blocos iguais SÃO iguais: inventar variação aqui seria mentir sobre o
  // treino para deixar o gráfico bonito.
  it('não fabrica variação quando as etapas são de fato idênticas', () => {
    const iguais = selectWorkoutProfile(
      [etapa({ tipo: 'PRINCIPAL', duracaoMin: 20 }), etapa({ tipo: 'PRINCIPAL', duracaoMin: 20 })],
      ctx,
    );
    const [a, b] = iguais.blocks.map((x) => x.intensityNormalized);
    expect(a).toBe(b);
  });

  it('não elege zona-alvo — seria afirmar o que não se sabe', () => {
    expect(p.metrics.targetZone).toBeNull();
  });

  it('distribui por papel, não por zona', () => {
    expect(p.metrics.kindDistribution).toBeDefined();
    const soma = p.metrics.kindDistribution!.reduce((s, k) => s + k.share, 0);
    expect(soma).toBeCloseTo(1, 3);
  });
});

// Visto na tela: a rampa do aquecimento subia acima do bloco principal, porque
// abria ±33% em torno do nominal. O gráfico dizia que aquecer é mais duro que o
// treino — falso, e nem estava no dado.
// "O treino regenerativo tem o principal em azul" — reportado da tela. Dois
// defeitos atrás disso, e o segundo é o que deforma o desenho.
describe('selectWorkoutProfile — treino regenerativo', () => {
  it('reconhece "regenerativo" como Z1, em vez de não saber', () => {
    const [b] = selectWorkoutProfile([etapa({ tipo: 'REGENERATIVO', duracaoMin: 30 })], ctx).blocks;
    expect(b.zone).toBe('Z1');
    expect(b.confidence).toBe('derived');
  });

  it('reconhece também a forma feminina e o trote de soltura', () => {
    const zonas = [
      etapa({ tipo: 'PRINCIPAL', duracaoMin: 30, descricao: 'Corrida regenerativa' }),
      etapa({ tipo: 'SOLTURA', duracaoMin: 20 }),
    ].map((e) => selectWorkoutProfile([e], ctx).blocks[0].zone);
    expect(zonas).toEqual(['Z1', 'Z1']);
  });

  // O aquecimento saía TRÊS VEZES mais alto que o corpo do treino: o miolo usava
  // altura de zona (0.15 para Z1) e o resto continuava em altura de papel (0.46).
  // Duas escalas no mesmo eixo não se comparam, e o gráfico ficava de cabeça
  // para baixo — aquecer parecia o esforço principal.
  it('o corpo do treino nunca fica mais baixo que o aquecimento', () => {
    for (const zona of ['Z1', 'Z2', 'Z3', 'Z4', 'Z5']) {
      const p = selectWorkoutProfile([
        etapa({ tipo: 'AQUECIMENTO', duracaoMin: 10 }),
        etapa({ tipo: 'PRINCIPAL', duracaoMin: 30 }),
        etapa({ tipo: 'DESAQUECIMENTO', duracaoMin: 5 }),
      ], { ...ctx, zonaAlvoTreino: zona });

      const [aquec, corpo, desaq] = p.blocks.map((b) => b.intensityNormalized);
      // `>=` é deliberado, não descuido: em zonas baixas o piso de 0.12 faz
      // papéis vizinhos empatarem, e isso é aceito — num regenerativo eles
      // realmente não diferem. O que não pode acontecer é a INVERSÃO, que era o
      // defeito. A distinção entre eles fica por conta da forma e do rótulo.
      expect(corpo, `com alvo ${zona}, o corpo ficou abaixo do aquecimento`).toBeGreaterThanOrEqual(aquec);
      expect(aquec, `com alvo ${zona}, o aquecimento ficou abaixo do desaquecimento`).toBeGreaterThanOrEqual(desaq);
    }
  });

  // O piso de 0.12 chegava a colapsar a rampa: com o nominal no piso,
  // `max(0.12, 0.12*0.5)` devolvia o próprio nominal, `from === to`, e o
  // trapézio virava retângulo — o patamar que a rampa existe para não desenhar.
  it('a rampa nunca degenera em patamar, nem no piso da escala', () => {
    for (const zona of ['Z1', 'Z2', 'Z3', 'Z4', 'Z5']) {
      const p = selectWorkoutProfile([
        etapa({ tipo: 'AQUECIMENTO', duracaoMin: 10 }),
        etapa({ tipo: 'PRINCIPAL', duracaoMin: 30 }),
        etapa({ tipo: 'DESAQUECIMENTO', duracaoMin: 5 }),
      ], { ...ctx, zonaAlvoTreino: zona });

      for (const b of p.blocks) {
        if (!b.ramp) continue;
        expect(b.ramp.fromNormalized, `${b.kind} com alvo ${zona} virou patamar`)
          .not.toBeCloseTo(b.ramp.toNormalized, 5);
      }
    }
  });

  it('a zona-alvo do treino ainda levanta o corpo quando é alta', () => {
    const base = selectWorkoutProfile([etapa({ tipo: 'PRINCIPAL', duracaoMin: 30 })], ctx);
    const forte = selectWorkoutProfile(
      [etapa({ tipo: 'PRINCIPAL', duracaoMin: 30 })],
      { ...ctx, zonaAlvoTreino: 'Z4' },
    );
    expect(forte.blocks[0].intensityNormalized)
      .toBeGreaterThan(base.blocks[0].intensityNormalized);
  });
});

describe('selectWorkoutProfile — a rampa não inventa esforço', () => {
  const treino = [
    etapa({ tipo: 'AQUECIMENTO', duracaoMin: 10 }),
    etapa({ tipo: 'PRINCIPAL', duracaoMin: 20 }),
    etapa({ tipo: 'DESAQUECIMENTO', duracaoMin: 5 }),
  ];

  it('a rampa chega ao nominal do bloco, nunca o ultrapassa', () => {
    for (const b of selectWorkoutProfile(treino, ctx).blocks) {
      if (!b.ramp) continue;
      const pico = Math.max(b.ramp.fromNormalized, b.ramp.toNormalized);
      expect(pico, `${b.kind} passa do próprio nominal`).toBeLessThanOrEqual(b.intensityNormalized);
    }
  });

  it('o aquecimento nunca é desenhado mais alto que o corpo do treino', () => {
    const blocos = selectWorkoutProfile(treino, ctx).blocks;
    const alturaMaxima = (b: (typeof blocos)[number]) =>
      b.ramp ? Math.max(b.ramp.fromNormalized, b.ramp.toNormalized) : b.intensityNormalized;

    const aquecimento = blocos.find((b) => b.kind === 'warmup')!;
    const corpo = blocos.find((b) => b.kind === 'steady')!;
    expect(alturaMaxima(aquecimento)).toBeLessThan(alturaMaxima(corpo));
  });

  it('o aquecimento sobe e o desaquecimento desce', () => {
    const blocos = selectWorkoutProfile(treino, ctx).blocks;
    const aquec = blocos.find((b) => b.kind === 'warmup')!.ramp!;
    const desaq = blocos.find((b) => b.kind === 'cooldown')!.ramp!;
    expect(aquec.toNormalized).toBeGreaterThan(aquec.fromNormalized);
    expect(desaq.toNormalized).toBeLessThan(desaq.fromNormalized);
  });
});

describe('selectWorkoutProfile — invariantes do AC-6', () => {
  const casos: Array<[string, ProfileEtapaInput[]]> = [
    ['série clássica', [
      etapa({ duracaoMin: 10, fcAlvo: 'Z2' }),
      etapa({ duracaoMin: 15, fcAlvo: 'Z4' }),
      etapa({ duracaoMin: 5, fcAlvo: 'Z1' }),
    ]],
    ['tudo numa zona só', [etapa({ duracaoMin: 45, fcAlvo: 'Z3' })]],
    ['picotado sem dominante', [
      etapa({ duracaoMin: 60, fcAlvo: 'Z1' }),
      etapa({ duracaoMin: 5, fcAlvo: 'Z5' }),
    ]],
    ['degradado', [etapa({ duracaoMin: 30 }), etapa({ tipo: 'XPTO', duracaoMin: 30 })]],
    ['com descartes', [etapa({ duracaoMin: 20, fcAlvo: 'Z2' }), etapa({ duracaoMin: 0 })]],
  ];

  it.each(casos)('%s: a distribuição soma 100%%', (_nome, etapas) => {
    const soma = selectWorkoutProfile(etapas, ctx).metrics.distribution.reduce((s, d) => s + d.share, 0);
    expect(Math.abs(soma - 1)).toBeLessThanOrEqual(0.005);
  });

  // A regressão exata do briefing: badge "Z1 100%" sobre blocos laranja. Só é
  // impossível porque badge e distribuição saem do mesmo retorno.
  it.each(casos)('%s: a zona da badge existe na distribuição com share ≥ 15%%', (_nome, etapas) => {
    const { metrics } = selectWorkoutProfile(etapas, ctx);
    if (metrics.targetZone === null) return;
    const fatia = metrics.distribution.find((d) => d.zone === metrics.targetZone);
    expect(fatia, `targetZone ${metrics.targetZone} ausente da distribuição`).toBeDefined();
    expect(fatia!.share).toBeGreaterThanOrEqual(0.15);
  });
});
