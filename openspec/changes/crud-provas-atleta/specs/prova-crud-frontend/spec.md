## Capability: prova-crud-frontend

CRUD de provas de atleta via interface React, consumindo os endpoints REST do backend (`/atleta/{atletaId}/provas`).

---

### Requirement: Listar provas de um atleta

O sistema SHALL exibir todas as provas de um atleta em um dialog modal, ordenadas por data ascendente (conforme retornado pelo backend).

#### Scenario: Abertura do dialog com provas existentes
- **WHEN** o usuário clica no botão "Provas" na linha de um atleta em `AtletasList`
- **THEN** o `ProvasDialog` SHALL abrir e exibir as provas em um `DataGrid` compacto
- **AND** cada linha SHALL mostrar: nome da prova, data, tipo, distância e status

#### Scenario: Atleta sem provas
- **WHEN** o backend retorna lista vazia para o atleta
- **THEN** o `ProvasDialog` SHALL exibir estado vazio com mensagem "Nenhuma prova cadastrada" e ícone ilustrativo, consistente com o padrão de `PlanosDialog`

#### Scenario: Erro ao carregar provas
- **WHEN** a requisição GET falha (ex: rede, 404, 500)
- **THEN** o `ProvasDialog` SHALL exibir um `Alert` com `severity="error"` e a mensagem do erro

---

### Requirement: Criar prova de atleta

O sistema SHALL permitir o cadastro de uma nova prova via formulário no `ProvaFormDialog`.

#### Scenario: Abrir formulário de criação
- **WHEN** o usuário clica em "Nova Prova" dentro do `ProvasDialog`
- **THEN** o `ProvaFormDialog` SHALL abrir em modo criação com todos os campos vazios/defaults

#### Scenario: Submissão com dados válidos
- **WHEN** o usuário preenche `nomeProva`, `dataProva` e submete
- **THEN** o sistema SHALL chamar `POST /atleta/{atletaId}/provas`
- **AND** em caso de sucesso (HTTP 201), SHALL fechar o formulário e recarregar a lista de provas

#### Scenario: Campos obrigatórios ausentes
- **WHEN** o usuário submete o formulário sem `nomeProva` ou `dataProva`
- **THEN** o sistema SHALL exibir mensagens de erro inline abaixo dos campos (`helperText`)
- **AND** NÃO SHALL enviar requisição ao backend

#### Scenario: Erro do backend (400 ou 409)
- **WHEN** o backend retorna erro de validação ou conflito
- **THEN** o `ProvaFormDialog` SHALL exibir um `Alert` com `severity="error"` dentro do dialog

---

### Requirement: Editar prova de atleta

O sistema SHALL permitir a atualização dos dados de uma prova existente.

#### Scenario: Abrir formulário de edição
- **WHEN** o usuário clica no ícone de edição na linha de uma prova no `DataGrid`
- **THEN** o `ProvaFormDialog` SHALL abrir em modo edição com os campos pré-preenchidos com os valores atuais da prova

#### Scenario: Submissão com dados válidos
- **WHEN** o usuário altera campos e confirma
- **THEN** o sistema SHALL chamar `PUT /atleta/{atletaId}/provas/{provaId}`
- **AND** em caso de sucesso (HTTP 200), SHALL fechar o formulário e recarregar a lista

#### Scenario: Prova não encontrada (404)
- **WHEN** o backend retorna HTTP 404
- **THEN** o `ProvaFormDialog` SHALL exibir mensagem de erro e manter o dialog aberto

---

### Requirement: Deletar prova de atleta

O sistema SHALL permitir a remoção permanente de uma prova após confirmação do usuário.

#### Scenario: Confirmação e deleção bem-sucedida
- **WHEN** o usuário clica no ícone de exclusão na linha de uma prova
- **THEN** o sistema SHALL exibir um `window.confirm` com a mensagem "Tem certeza que deseja excluir esta prova?"
- **AND** se confirmado, SHALL chamar `DELETE /atleta/{atletaId}/provas/{provaId}`
- **AND** em caso de sucesso (HTTP 204), SHALL remover a linha da lista sem recarregar a página

#### Scenario: Usuário cancela a confirmação
- **WHEN** o usuário clica "Cancelar" no diálogo de confirmação
- **THEN** o sistema SHALL NÃO enviar requisição ao backend e manter a lista inalterada

#### Scenario: Erro ao deletar
- **WHEN** o backend retorna HTTP 404 ou 500
- **THEN** o `ProvasDialog` SHALL exibir um `Alert` com `severity="error"`

---

### Requirement: Formulário de prova

O `ProvaFormDialog` SHALL conter os seguintes campos:

| Campo         | Tipo                  | Obrigatório | Valores possíveis                                                                 |
|---------------|-----------------------|-------------|-----------------------------------------------------------------------------------|
| `nomeProva`   | TextField text        | Sim         | Livre                                                                             |
| `dataProva`   | TextField date        | Sim         | Data no formato `YYYY-MM-DD`                                                       |
| `tipoProva`   | TextField select      | Não         | CORRIDA_RUA, CORRIDA_TRILHA, CORRIDA_PISTA, CICLISMO, NATACAO, DUATHLON, TRIATHLON |
| `distancia`   | TextField select      | Não         | CINCO_KM, DEZ_KM, QUINZE_KM, VINTE_KM, MEIA_MARATONA, MARATONA, ULTRAMARATONA    |
| `provaStatus` | TextField select      | Não         | INSCRITA, CONFIRMADA, REALIZADA, CANCELADA                                         |

Labels amigáveis SHALL ser exibidas nos selects (ex: "MEIA_MARATONA" → "Meia Maratona", "CINCO_KM" → "5 km").

---

### Requirement: Integração com AtletasList

O sistema SHALL adicionar um botão de ação "Provas" na coluna de ações do `DataGrid` de atletas.

#### Scenario: Botão visível e funcional
- **WHEN** `AtletasList` renderiza a coluna de ações
- **THEN** SHALL exibir um `GridActionsCellItem` com `EmojiEventsIcon` e label "Provas"
- **AND** ao clicar SHALL abrir o `ProvasDialog` para o atleta da linha correspondente

#### Scenario: Comportamento independente dos outros botões
- **WHEN** o usuário abre o dialog de Provas
- **THEN** os dialogs de Atleta e de Planos NÃO SHALL ser afetados

---

### Requirement: Design e consistência visual

#### Scenario: Aparência do ProvasDialog
- **WHEN** o `ProvasDialog` é exibido
- **THEN** SHALL usar `maxWidth="md" fullWidth`
- **AND** o `DialogTitle` SHALL exibir "Provas de {atletaNome}" com botão "Nova Prova" alinhado à direita
- **AND** o `DataGrid` interno SHALL ter `density="compact"` e `rowHeight={44}`

#### Scenario: Aparência do ProvaFormDialog
- **WHEN** o `ProvaFormDialog` é exibido
- **THEN** SHALL usar `maxWidth="sm" fullWidth`
- **AND** todos os `TextField` SHALL ter `size="small"`
- **AND** o título SHALL ser "Nova Prova" ou "Editar Prova" conforme o modo

#### Scenario: Estado de loading
- **WHEN** uma requisição está em andamento
- **THEN** os botões de ação SHALL ser desabilitados (`disabled={loading}`)
- **AND** o texto do botão de submit SHALL exibir "Salvando..." durante a operação
