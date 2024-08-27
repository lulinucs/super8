document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const championshipId = urlParams.get('id');

    if (!championshipId) {
        document.getElementById('championship-name').textContent = 'ID do campeonato não fornecido.';
        return;
    }

    let championship;

    try {
        // Fetch dos times
        const teamsResponse = await fetch('http://lulinucs.duckdns.org:3001/teams');
        if (!teamsResponse.ok) {
            throw new Error(`HTTP error! status: ${teamsResponse.status}`);
        }
        const teamsData = await teamsResponse.json();
        const teamNames = {};
        teamsData.forEach(team => {
            teamNames[team._id] = team.nome;
        });

        // Fetch do campeonato
        const championshipResponse = await fetch(`http://lulinucs.duckdns.org:3001/championships/${championshipId}`);
        if (!championshipResponse.ok) {
            throw new Error(`HTTP error! status: ${championshipResponse.status}`);
        }
        championship = await championshipResponse.json();

        console.log('Dados do campeonato:', championship); // Verifique o conteúdo de championship

        if (!championship) {
            document.getElementById('championship-name').textContent = 'Campeonato não encontrado.';
            return;
        }

        document.getElementById('championship-name').textContent = championship.nome;

        const fasesContainer = document.getElementById('fases-container');
        fasesContainer.innerHTML = ''; // Limpe o container antes de adicionar novas fases

        championship.fases.forEach(fase => {
            const faseDiv = document.createElement('div');
            faseDiv.classList.add('fase');

            const faseTitle = document.createElement('h2');
            faseTitle.textContent = fase.nome;
            faseDiv.appendChild(faseTitle);

            fase.matches.forEach(match => {
                const matchDiv = document.createElement('div');
                matchDiv.classList.add('match');

                const team1Name = teamNames[match.team1] || 'Desconhecido';
                const team2Name = teamNames[match.team2] || 'Desconhecido';

                matchDiv.innerHTML = `
                    ${team1Name} <input type="number" min="0" id="score1-${match.team1}-${match.team2}" value="${match.score1 ?? ''}" /> x 
                    <input type="number" min="0" id="score2-${match.team1}-${match.team2}" value="${match.score2 ?? ''}" /> 
                    ${team2Name}
                `;

                faseDiv.appendChild(matchDiv);
            });

            fasesContainer.appendChild(faseDiv);
        });

        // Função para calcular a classificação
        function calculateClassification(pontuation) {
            return Object.keys(pontuation).map(teamId => {
                const { p, v, d, e, gp, gc } = pontuation[teamId];
                return {
                    id: teamId,
                    name: teamNames[teamId],
                    points: p,
                    wins: v,
                    goalDifference: gp - gc
                };
            }).sort((a, b) => {
                // Ordenar por pontos, vitórias e saldo de gols
                return b.points - a.points || b.wins - a.wins || b.goalDifference - a.goalDifference;
            });
        }

        // Atualizar a tabela de classificação
        function updateClassificationTable() {
            const classificationBody = document.getElementById('classification-body');
            const pontuation = championship.fases[0].pontuation; // Considera apenas a primeira fase

            const classification = calculateClassification(pontuation);

            classificationBody.innerHTML = ''; // Limpe a tabela antes de adicionar novas linhas

            classification.forEach((team, index) => {
                const teamCard = document.createElement('div');
                teamCard.classList.add('team-card');

                teamCard.innerHTML = `
                    <div class="position">${index + 1}</div>
                    <div class="name">${team.name}</div>
                    <div class="stats">${team.points}</div>
                    <div class="stats">${team.wins}</div>
                    <div class="stats">${team.goalDifference}</div>
                `;

                classificationBody.appendChild(teamCard);
            });
        }

        updateClassificationTable(); // Atualiza a tabela de classificação ao carregar a página

        // Remover event listener existente para evitar múltiplas adições
        const saveButton = document.getElementById('save-results-button');
        saveButton.removeEventListener('click', handleSaveResults); // Garante que não há múltiplos ouvintes
        saveButton.addEventListener('click', handleSaveResults);

    } catch (error) {
        console.error('Erro ao carregar os dados:', error);
        document.getElementById('championship-name').textContent = 'Erro ao carregar o campeonato.';
    }

    // Função para salvar os resultados
    async function handleSaveResults() {
        try {
            const updatedResults = [];

            championship.fases.forEach(fase => {
                fase.matches.forEach(match => {
                    const score1 = parseInt(document.getElementById(`score1-${match.team1}-${match.team2}`).value, 10);
                    const score2 = parseInt(document.getElementById(`score2-${match.team1}-${match.team2}`).value, 10);

                    updatedResults.push({
                        team1: match.team1,
                        team2: match.team2,
                        score1: isNaN(score1) ? null : score1,
                        score2: isNaN(score2) ? null : score2
                    });
                });
            });

            const response = await fetch('http://lulinucs.duckdns.org:3001/update-group-stage-results', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    championship_id: championshipId,
                    results: updatedResults
                })
            });

            if (response.ok) {
                alert('Resultados salvos com sucesso!');
                // Atualizar a página após salvar
                location.reload();
            } else {
                alert('Erro ao salvar os resultados.');
            }
        } catch (error) {
            console.error('Erro ao salvar os resultados:', error);
            alert('Erro ao salvar os resultados.');
        }
    }
});
