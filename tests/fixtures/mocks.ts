export const MOCK_ATLETAS = [
  {
    id: 'atleta-1-uuid',
    nome: 'Ana Corredora',
    email: 'ana@teste.com',
    nivelExperiencia: 'INTERMEDIARIO',
    ativo: 'ATIVO',
    temLesao: false,
    pesoKg: 58.5,
    diasDisponiveis: ['SEGUNDA', 'QUARTA', 'SEXTA'],
    provas: [],
  },
  {
    id: 'atleta-2-uuid',
    nome: 'Bruno Maratonista',
    email: 'bruno@teste.com',
    nivelExperiencia: 'AVANCADO',
    ativo: 'ATIVO',
    temLesao: true,
    pesoKg: 72.0,
    diasDisponiveis: ['TERCA', 'QUINTA'],
    provas: [],
  },
  {
    id: 'atleta-3-uuid',
    nome: 'Carla Iniciante',
    email: 'carla@teste.com',
    nivelExperiencia: 'INICIANTE',
    ativo: 'ATIVO',
    temLesao: false,
    pesoKg: 65.0,
    diasDisponiveis: [],
    provas: [],
  },
]

export const MOCK_KEYCLOAK_TOKEN_RESPONSE = {
  access_token: 'mock-access-token-from-keycloak',
  token_type: 'Bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh-token',
  scope: 'openid profile email',
}
