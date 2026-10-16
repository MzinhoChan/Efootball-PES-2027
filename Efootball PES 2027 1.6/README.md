# eFootball PES 2027 — Projeto 1.6

Versão otimizada estruturalmente, mantendo as funcionalidades da versão original.

## Estrutura

- `efootball.py` — servidor Flask, autenticação Google e sincronização.
- `config.py` — configuração do Client ID Google.
- `index.html` — interface.
- `style.css` — estilos.
- `static/js/core.js` — estado global, autenticação, sincronização e navegação.
- `static/js/career.js` — gestão de carreiras, perfil, relacionamento, transferências e renderização principal.
- `static/js/features.js` — sistemas adicionais e dados de carreira.

Os três arquivos JavaScript são carregados nessa ordem para preservar as dependências existentes.

## Executar

```bash
pip install -r requirements.txt
python efootball.py
```

Abra `http://localhost:5000`.

Para login Google, configure `GOOGLE_CLIENT_ID` no ambiente ou em `config.py`.


## Become a Legend 1.5

Novos sistemas: rivalidades individuais, reputação por clube, torcida, coletivas de imprensa, agente/rumores e fases da carreira. Os dados são salvos junto da carreira existente e sincronizados com o sistema atual.


## Versão 1.5 — Moedas
- Real brasileiro (BRL / R$)
- Euro (EUR / €)
- Dólar americano (USD / US$)
- Seleção de moeda independente por carreira, disponível no Become a Legend e na Master Liga.
- A troca da moeda não converte automaticamente valores já cadastrados; apenas altera a unidade/símbolo usado na carreira.


## Versão 1.5 — Eventos Narrativos
- Sistema de eventos narrativos no Become a Legend.
- O jogador escolhe a categoria do evento.
- Cada notícia apresenta escolhas A/B/C com consequências diferentes.
- Relações separadas: Time, Técnico, Amigos, Namorada e Torcida.
- Consequências persistentes em moral, energia, fama e finanças.
- Histórico das decisões e resultados da carreira.


## Master Liga 1.5
A Master Liga agora possui 5 abas exclusivas: Visão Geral, Clube, Temporada, Objetivos e Títulos & História.


## Atualização interna 1.5 — desempenho e sistemas sociais
- Otimizado o agrupamento do elenco da Master Liga: os jogadores são classificados por posição em uma única passagem.
- Restauradas as cores por posição: goleiro amarelo; zagueiros e laterais azuis; meio-campistas verdes; atacantes e pontas vermelhos.
- Seletor de ligas com bandeiras por país e nomes atualizados, incluindo Meiji Yasuda J1 League; removida a Liga 3 de Portugal.
- Migração automática dos nomes antigos das Séries A e B para os nomes atuais, preservando a liga selecionada nas carreiras antigas.
- Novas interações com consequências persistentes para técnico, torcida, família/amigos e rotina pessoal.
- Cache dos arquivos estáticos atualizado para garantir que o navegador carregue os estilos e scripts revisados.
- Na versão 1.5, nenhuma seção ou dado de carreira foi removido.


## Atualização integrada do Rumo ao Estrelato — versão pública 1.5
- Adicionada Central Integrada da Carreira, com atalhos e indicadores de titularidade, técnico, agente, mídia, relacionamento e moradia.
- Novas decisões de titularidade e conversa com o técnico, com consequências para confiança, insatisfação, papel no elenco e busca por transferência.
- Publicações sociais com impactos em imprensa, popularidade, seguidores, torcida, técnico e, quando aplicável, relacionamento.
- Central de propostas de transferência do agente: cadastrar, aceitar ou recusar ofertas; uma aceitação confirmada registra a mudança no histórico e atualiza o salário quando informado.
- Gestão de moradia e estilo de vida com cidade, custo de aquisição, manutenção mensal e opção de morar junto com parceiro(a); pagamentos mensais são manuais e protegidos contra cobrança duplicada no mesmo dia.
- Reutiliza os dados existentes e mantém os módulos anteriores.


## Atualização 1.6 — Central integrada visível

- Versão pública atualizada para **1.6** no título da página e no menu principal.
- Central Integrada da Carreira movida para o topo da visão geral do Rumo ao Estrelato, para não ficar escondida entre os painéis existentes.
- Atalhos diretos para Titularidade & Técnico, Redes Sociais, Agente & Propostas, Moradia & Estilo de Vida e Relacionamento.
- Atualizados os parâmetros de cache dos arquivos CSS/JavaScript para evitar que o navegador continue carregando a versão antiga.
- Mantidos os dados e recursos existentes; esta atualização reorganiza o acesso e identifica a versão como 1.6.

**Onde encontrar:** abra Become a Legend / Rumo ao Estrelato e entre na visão geral. A primeira seção agora é “Central Integrada da Carreira”.


## Correção de layout 1.6.3
- Removido o painel estático duplicado do HTML. A central agora é gerada apenas pelo JavaScript na visão geral do Become a Legend.
- O contêiner de recursos ocupa a largura completa da aplicação e fica oculto fora da visão geral.
- Cache de CSS/JS atualizado para evitar reaproveitamento de arquivos antigos.
- Recomendado extrair em uma pasta nova antes de executar.
