# Projeto Super8

Este é um projeto simples de gestão de campeonatos de bike polo, desenvolvido para uma liga local em comemoração aos 8 anos do Bike Polo Floripa. O objetivo é fornecer uma solução para o gerenciamento de times e campeonatos, com um foco especial na fase de grupos.

Atualmente, o projeto está em estágio de desenvolvimento, abrangendo apenas a fase de grupos dos campeonatos. Futuramente, planejamos adicionar funcionalidades para fases de mata-mata simples ou double-elimination para uma experiência de torneio mais completa.

## Tecnologias Utilizadas

- **FastAPI**: Framework moderno e rápido para a construção da API, oferecendo uma maneira eficiente de gerenciar as operações de backend.
- **MongoDB**: Banco de dados NoSQL utilizado para o armazenamento dos dados dos times e campeonatos, permitindo flexibilidade e escalabilidade.
- **HTML/CSS/JS**: Tecnologias de front-end utilizadas para criar uma interface de usuário simples e interativa.

## Funcionalidades

### API

- **Equipes (Teams)**:
  - `POST /create-team`: Adiciona um novo time ao sistema.
  - `GET /teams`: Lista todos os times registrados na liga.
  - `GET /teams/{team_id}`: Obtém detalhes de um time específico usando seu ID.
  - `PUT /update-team/{team_id}`: Atualiza as informações de um time existente.
  - `DELETE /delete-team/{team_id}`: Remove um time do sistema.

- **Campeonatos (Championships)**:
  - `POST /new-champ`: Cria um novo campeonato com as informações fornecidas.
  - `GET /championships`: Lista todos os campeonatos registrados.
  - `GET /championships/{championship_id}`: Obtém detalhes de um campeonato específico usando seu ID.
  - `POST /add-group-stage`: Adiciona a fase de grupos a um campeonato existente.
  - `PUT /update-group-stage-results`: Atualiza os resultados da fase de grupos de um campeonato.
  - `POST /add-double-elimination`: Futuramente, adicionará a fase de Double Elimination a um campeonato (em desenvolvimento).

### Interface de Usuário

A interface do projeto é projetada para ser simples e utiliza apenas HTML, CSS e JavaScript vanilla. O arquivo `index.html` atua como um ponto de entrada, renderizando as páginas específicas do projeto, que estão organizadas na pasta `pages`. As principais páginas incluem:

- **new_team**:
  - `new_team.html`: Formulário para adicionar um novo time.
  - `new_team.css`: Estilos específicos para a página de novo time.
  - `new_team.js`: Lógica para adicionar um novo time.

- **new_champ**:
  - `new_champ.html`: Formulário para criar um novo campeonato.
  - `new_champ.css`: Estilos específicos para a página de novo campeonato.
  - `new_champ.js`: Lógica para criar um novo campeonato.

- **list_teams**:
  - `list_teams.html`: Página para listar todos os times.
  - `list_teams.css`: Estilos específicos para a página de lista de times.
  - `list_teams.js`: Lógica para exibir a lista de times.

- **list_championships**:
  - `list_championships.html`: Página para listar todos os campeonatos.
  - `list_championships.css`: Estilos específicos para a página de lista de campeonatos.
  - `list_championships.js`: Lógica para exibir a lista de campeonatos.

- **group-fase-champ**:
  - `group-fase-champ.html`: Página para visualizar e gerenciar a fase de grupos de um campeonato.
  - `group-fase-champ.css`: Estilos específicos para a página da fase de grupos.
  - `group-fase-champ.js`: Lógica para gerenciar a fase de grupos.

## Deploy

O projeto está atualmente em produção. No entanto, como o servidor é gratuito, pode haver períodos de inatividade. http://lulinucs.duckdns.org/super8/
=======
# super8
Super8 é um projeto de gerenciamento de campeonatos de bike polo, criado para a liga local em comemoração aos 8 anos do Bike Polo Floripa. Desenvolvido com FastAPI para a API e HTML/CSS/JS para a interface, o projeto gerencia times e campeonatos, com foco na fase de grupos e futura inclusão de fases de mata-mata.
>>>>>>> 436b2c66b6bc3eb2c12db7a829345bcb19a1e090
