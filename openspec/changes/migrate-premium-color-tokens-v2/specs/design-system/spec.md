# Spec delta — design-system (color tokens)

## ADDED Requirements

### Requirement: Lime restrito a brand + ação primária
O token `primary` (lime `#BDDE5A`) SHALL ser usado apenas como cor de marca e de ação primária.
Lime SHALL NOT aparecer em mapas de `readiness`, `zone`, `trainingType` ou `trainingStage`.

#### Scenario: lime ausente de mapas de domínio
- **WHEN** o CI roda o grep negativo sobre `colors.ts`, `workoutColors.ts` e `tokens.ts`
- **THEN** não há ocorrência de `#BDDE5A`/`#D4FF3A`/`primary[` nas chaves de readiness, `zone.Z2`, trainingType ou trainingStage

#### Scenario: no máximo uma métrica-chave em lime por view
- **WHEN** uma view é revisada
- **THEN** lime aparece só em brand/ação e, no máximo, uma métrica-chave de destaque

### Requirement: Categórico separado de semântico
Tipos e etapas de treino SHALL consumir a paleta `categorical` dedicada. Nenhum valor
`categorical` SHALL compartilhar hex com `semantic`, exceto `categorical.injuryResponse`
(`#EF4444`), o único vermelho reservado.

#### Scenario: sem colisão de hex
- **WHEN** o teste de unidade compara os valores de `categorical` e `semantic`
- **THEN** a interseção é vazia, exceto `injuryResponse === semantic.danger`

### Requirement: Zonas mantêm rampa de calor, só Z2 muda
As zonas Z1, Z3, Z4, Z5 SHALL manter a rampa de calor convencional. Apenas `zone.Z2` SHALL
mudar de lime para verde (`#34D399`).

#### Scenario: Z2 não é lime
- **WHEN** o teste de unidade lê `zones.Z2.color`
- **THEN** o valor é `#34D399` e diferente de `primary[500]`

### Requirement: Componentes referenciam tokens, nunca hex cru
Componentes SHALL referenciar tokens semânticos/de papel. Literais de cor (`hex`/`rgba`) SHALL
existir apenas em `src/shared/design-tokens/**` e `src/theme/tokens.ts`.

#### Scenario: lint falha em hex cru
- **WHEN** um componente fora da allowlist contém um literal de cor
- **THEN** `npm run lint` falha pela regra `no-restricted-syntax`

### Requirement: info blue nunca em brand/hero
O token `info` (`#3B82F6`) MAY permanecer como token funcional de UI, mas SHALL NOT alcançar
superfícies de brand/hero.

#### Scenario: info ausente de hero
- **WHEN** o CI verifica hero/sidebar header
- **THEN** não há `#3B82F6`/`info` aplicado a essas superfícies

## MODIFIED Requirements

### Requirement: Readiness sem lime
A banda `readiness` 70–89 SHALL usar teal (`#2DD4BF`) em vez de lime. As chaves SHALL ser
`critical/caution/good/optimal`. Thresholds permanecem backend-owned; o front só renderiza a
banda resolvida.

#### Scenario: banda good é teal
- **WHEN** o teste lê `readiness.good`
- **THEN** o valor é `#2DD4BF` e diferente de `primary[500]`
