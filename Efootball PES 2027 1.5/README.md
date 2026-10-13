# eFootball PES 2027 — Projeto 1.5

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
