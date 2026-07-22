# Ouvidoria SYMA

Aplicação web para recebimento, acompanhamento e tratamento administrativo de relatos internos.

Este repositório contém:

- portal público para envio de relatos;
- consulta de protocolo pelo relator;
- área administrativa para triagem e atualização do tratamento;
- APIs serverless para autenticação administrativa e gestão dos relatos;
- configuração de deploy para Vercel.

## Objetivo

O projeto foi estruturado como um canal digital de ouvidoria/integridade, com foco em:

- registro de relatos com opção de anonimato;
- geração de protocolo e chave de acompanhamento;
- consulta posterior do andamento do relato;
- triagem administrativa com histórico de tratamento;
- separação entre interface pública e interface administrativa.

## Arquitetura Atual

- Frontend estático em HTML, CSS e JavaScript puro.
- Backend em funções serverless Node.js dentro da pasta `api/`.
- Persistência externa via banco configurado por variáveis de ambiente.
- Deploy configurado para Vercel por meio de `vercel.json`.

## Estrutura do Projeto

```text
api/
  _lib.js
  admin/
    login/
      index.js
    reports/
      index.js
assets/
  app.js
  admin.js
  logo-syma-branco.png
admin.css
admin.html
index.html
styles.css
teste.html
vercel.json
README.md
```

## Funcionalidades

### Portal público

- envio de relato com categoria, área/local, descrição e consentimento;
- opção de relato anônimo;
- geração de protocolo e chave de acesso para acompanhamento;
- consulta do andamento do relato por protocolo e chave;
- exibição de histórico de atualizações disponíveis ao relator.

### Área administrativa

- autenticação administrativa via API;
- carregamento de fila de relatos;
- filtro por status;
- visualização de detalhes do relato;
- atualização de status;
- registro de nota interna no histórico.

## Fluxo Resumido

1. O usuário envia um relato pelo portal público.
2. A API registra os dados e retorna protocolo/chave.
3. O relator pode acompanhar o caso posteriormente.
4. A área administrativa autentica o operador.
5. O operador visualiza a fila, analisa o caso e registra atualizações.

## Endpoints

Os principais endpoints expostos pelo projeto são:

- `POST /api/admin/login`
- `GET /api/admin/reports`
- `POST /api/admin/reports`

Podem existir outros endpoints auxiliares para o fluxo público, conforme a implementação local vigente.

## Execução Local

Pré-requisitos:

- Node.js instalado;
- variáveis de ambiente configuradas fora do repositório;
- acesso ao serviço de persistência usado pelo projeto.

Para executar localmente:

```powershell
node server.js
```

Endereços locais usuais:

- portal público: `http://localhost:4173`
- área administrativa: `http://localhost:4173/admin`

## Deploy

O deploy está preparado para Vercel com:

- arquivos estáticos publicados diretamente;
- funções `api/**/*.js` executadas como serverless;
- roteamento definido em `vercel.json`.

Observação:

- a presença de `builds` em `vercel.json` faz com que a configuração de build do painel da Vercel não seja a fonte principal de comportamento;
- `.vercelignore` pode excluir arquivos locais que não precisam ser enviados no deploy.

## Variáveis de Ambiente

O projeto depende de variáveis de ambiente configuradas fora do código-fonte. Entre elas, podem existir:

- variáveis de conexão com o banco;
- segredo de sessão administrativa;
- credenciais administrativas de demonstração controlada.

Importante:

- não versionar valores reais;
- não registrar segredos em README, issues, commits ou capturas de tela;
- manter as credenciais somente no provedor de hospedagem ou em ambiente local seguro.

## Segurança e Boas Práticas

- Não armazenar segredos diretamente no repositório.
- Não usar este repositório como fonte de credenciais operacionais.
- Revisar permissões da área administrativa antes de uso produtivo.
- Habilitar autenticação forte e contas individuais em produção.
- Garantir trilha de auditoria, retenção e governança de dados adequadas.
- Validar aderência a LGPD, segurança da informação e processos internos antes de uso real.

## Limitações Conhecidas

- A qualidade do ambiente depende da configuração correta das variáveis de ambiente e do banco externo.
- Credenciais de demonstração e fluxos simplificados devem ser tratados apenas como apoio de desenvolvimento/teste.
- O uso produtivo requer endurecimento de segurança, observabilidade, backup, governança e revisão jurídica/processual.

## Arquivos Relevantes

- `index.html`: interface pública.
- `admin.html`: interface administrativa.
- `styles.css`: estilos da área pública.
- `admin.css`: estilos da área administrativa.
- `assets/app.js`: comportamento do portal público.
- `assets/admin.js`: comportamento do painel administrativo.
- `api/_lib.js`: utilitários de API, autenticação e acesso ao banco.
- `api/admin/login/index.js`: autenticação administrativa.
- `api/admin/reports/index.js`: leitura e atualização administrativa dos relatos.
- `vercel.json`: configuração de deploy e rotas.

## Manutenção

Ao evoluir este projeto, recomenda-se:

- revisar README sempre que houver mudança de arquitetura, fluxo ou deploy;
- manter segredos fora do versionamento;
- validar impacto de cada alteração no fluxo público e administrativo;
- revisar logs, mensagens de erro e documentação para evitar exposição acidental de dados sensíveis.