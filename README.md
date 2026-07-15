# Canal de Integridade SYMA — protótipo local

Interface demonstrativa para receber relatos internos, incluindo uma área administrativa local para triagem e registro do tratamento.

## Executar localmente

No diretório do projeto:

```powershell
node server.js
```

Acesse:

- Canal do colaborador: `http://localhost:4173`
- Área administrativa: `http://localhost:4173/admin.html`

Na demonstração, entre com `admin` e `syma.local`.

## O que a área administrativa permite

- visualizar a fila de relatos do mesmo navegador;
- filtrar por situação;
- consultar os detalhes necessários à triagem;
- atualizar a situação: Recebido, Em análise, Encaminhado ou Concluído;
- registrar uma nota interna no histórico do relato.

## Limites desta versão

Os relatos e a sessão administrativa são guardados somente no `localStorage`/`sessionStorage` do navegador. A senha de demonstração está no código e não há controle real de acesso, criptografia, banco de dados, comunicação segura ou auditoria inviolável. **Não use esta versão para relatos reais.**

Para publicar em `ouvidoria.syma.com.br`, a implantação deve incluir ao menos:

- backend com banco de dados criptografado e backup controlado;
- contas individuais, MFA, acesso por papel e segregação de funções;
- chaves de acompanhamento armazenadas com hash, nunca em texto simples;
- trilha de auditoria imutável e política de retenção/descarte conforme LGPD;
- comunicação segura entre relator e equipe autorizada, sem expor identificação em relato anônimo;
- fluxo formal de conflito de interesse, triagem, investigação, encaminhamento e não retaliação;
- governança validada por Jurídico/LGPD, RH e SST/SESMT.

O canal apoia a identificação de tendências e a prevenção de riscos psicossociais. Dados agregados podem subsidiar o PGR; dados individuais não devem ser usados como mecanismo de vigilância ou retaliação.
