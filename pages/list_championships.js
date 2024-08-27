document.addEventListener('DOMContentLoaded', function () {
    fetchTeamsAndChampionships();

    function fetchTeamsAndChampionships() {
        console.log('Fetching teams and championships...');
        fetch('http://lulinucs.duckdns.org:3001/teams')
            .then(response => response.json())
            .then(teams => {
                console.log('Teams:', teams);
                const teamsMap = teams.reduce((map, team) => {
                    map[team._id] = team.nome;
                    return map;
                }, {});
    
                fetch('http://lulinucs.duckdns.org:3001/championships')
                    .then(response => response.json())
                    .then(data => {
                        console.log('Championships:', data);
                        const championshipsList = document.getElementById('championshipsList');
                        championshipsList.innerHTML = '';
                        data.forEach(championship => {
                            const card = document.createElement('div');
                            card.className = 'championship-card';
                            card.innerHTML = `
                            <h2>${championship.nome}</h2>
                            <p><strong>Quantidade de Equipes:</strong> ${championship.equipes.length}</p>
                            <div class="team-list">
                                <strong>Equipes:</strong>
                                <ul>
                                    ${championship.equipes.map(equipeId => `<li>${teamsMap[equipeId]}</li>`).join('')}
                                </ul>
                            </div>
                            <div class="phases-section">
                                <strong>Fases:</strong>
                                ${
                                    championship.fases && championship.fases.length > 0 
                                        ? `
                                            <p>Fase de Grupos</p>
                                            <button class="view-group-stage-btn" onclick="viewGroupStage('${championship._id}')">Ver Fase de Grupos</button>
                                        ` 
                                        : `<button class="add-phase-btn" onclick="addGroupStage('${championship._id}')">Adicionar Fase de Grupos</button>`
                                }
                                
                            </div>
                        `;
                            championshipsList.appendChild(card);
                        });
                    })
                    .catch(error => console.error('Erro ao carregar campeonatos:', error));
            })
            .catch(error => console.error('Erro ao carregar times:', error));
    }

    window.addGroupStage = function(championshipId) {
        fetch('http://lulinucs.duckdns.org:3001/add-group-stage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ championship_id: championshipId })
        })
        .then(response => {
            if (response.ok) {
                alert('Fase de Grupos adicionada com sucesso!');
                fetchTeamsAndChampionships(); // Atualiza a lista de campeonatos
            } else {
                return response.text().then(text => {
                    console.error('Erro ao adicionar fase:', text);
                });
            }
        })
        .catch(error => console.error('Erro:', error));
    };

    window.addDoubleElimination = function(championshipId) {
        console.log('Championship ID:', championshipId); // Adicione esta linha para verificar o valor do ID
        fetch('http://lulinucs.duckdns.org:3001/add-double-elimination', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ championship_id: championshipId })
        })
        .then(response => {
            if (response.ok) {
                alert('Fase Double-Elimination adicionada com sucesso!');
                fetchTeamsAndChampionships(); // Atualiza a lista de campeonatos
            } else {
                return response.text().then(text => {
                    console.error('Erro ao adicionar fase Double-Elimination:', text);
                });
            }
        })
        .catch(error => console.error('Erro:', error));
    };

    window.viewGroupStage = function(championshipId) {
        const url = `group-fase-champ.html?id=${championshipId}`;
        window.location.href = url;
    };
});
