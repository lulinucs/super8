document.addEventListener('DOMContentLoaded', function () {
    fetchTeams();

    function fetchTeams() {
        fetch('http://lulinucs.duckdns.org:3001/teams')
            .then(response => response.json())
            .then(data => {
                const teamsContainer = document.getElementById('teamsContainer');
                teamsContainer.innerHTML = ''; // Limpa os cards antes de adicionar novos dados
                data.forEach(team => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    card.innerHTML = `
                        <div class="card-header">${team.nome}</div>
                        <div class="card-content">
                            <p>Jogador 1: ${team.jogador1}</p>
                            <p>Jogador 2: ${team.jogador2}</p>
                            <p>Jogador 3: ${team.jogador3}</p>
                        </div>
                        <div class="card-actions">
                            <button onclick="editTeam('${team._id}')"><i class="fas fa-edit"></i></button>
                            <button onclick="deleteTeam('${team._id}')"><i class="fas fa-trash"></i></button>
                        </div>
                    `;
                    teamsContainer.appendChild(card);
                });
            })
            .catch(error => console.error('Erro ao carregar times:', error));
    }

    window.editTeam = function(teamId) {
        fetch(`http://lulinucs.duckdns.org:3001/teams/${teamId}`)
            .then(response => response.json())
            .then(team => {
                document.getElementById('nome').value = team.nome || '';
                document.getElementById('jogador1').value = team.jogador1 || '';
                document.getElementById('jogador2').value = team.jogador2 || '';
                document.getElementById('jogador3').value = team.jogador3 || '';
                
                document.getElementById('editForm').onsubmit = function (event) {
                    event.preventDefault();
                    updateTeam(teamId);
                };

                document.getElementById('editModal').style.display = 'block';
            })
            .catch(error => console.error('Erro ao carregar time:', error));
    }

    function updateTeam(teamId) {
        const updatedTeam = {
            nome: document.getElementById('nome').value,
            jogador1: document.getElementById('jogador1').value,
            jogador2: document.getElementById('jogador2').value,
            jogador3: document.getElementById('jogador3').value
        };

        fetch(`http://lulinucs.duckdns.org:3001/update-team/${teamId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedTeam)
        })
        .then(response => {
            if (response.ok) {
                closeModal();
                fetchTeams();
            } else {
                console.error('Erro ao atualizar time');
            }
        })
        .catch(error => console.error('Erro:', error));
    }

    window.deleteTeam = function(teamId) {
        if (confirm('Você tem certeza que deseja excluir este time?')) {
            fetch(`http://lulinucs.duckdns.org:3001/delete-team/${teamId}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (response.ok) {
                    fetchTeams();
                } else {
                    console.error('Erro ao excluir time');
                }
            })
            .catch(error => console.error('Erro:', error));
        }
    }

    document.querySelector('.close').onclick = function() {
        closeModal();
    }

    function closeModal() {
        document.getElementById('editModal').style.display = 'none';
    }
});
