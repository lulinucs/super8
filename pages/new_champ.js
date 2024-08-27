document.addEventListener('DOMContentLoaded', function () {
    fetchTeams();

    function fetchTeams() {
        fetch('http://lulinucs.duckdns.org:3001/teams')
            .then(response => response.json())
            .then(data => {
                const teamsList = document.getElementById('teamsList');
                teamsList.innerHTML = ''; // Limpa a lista antes de adicionar novas opções
                data.forEach(team => {
                    const label = document.createElement('label');
                    label.innerHTML = `
                        <input type="checkbox" name="equipes" value="${team._id}">
                        ${team.nome}
                    `;
                    teamsList.appendChild(label);
                });
            })
            .catch(error => console.error('Erro ao carregar equipes:', error));
    }

    document.getElementById('championshipForm').onsubmit = function (event) {
        event.preventDefault();
        const nome = document.getElementById('nome').value;
        const equipes = Array.from(document.querySelectorAll('input[name="equipes"]:checked')).map(el => el.value);

        const newChampionship = {
            nome: nome,
            equipes: equipes,
            fases: []  // Inicialmente vazio
        };

        fetch('http://lulinucs.duckdns.org:3001/new-champ', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newChampionship)
        })
        .then(response => response.json())
        .then(data => {
            alert('Campeonato cadastrado com sucesso!');
            document.getElementById('championshipForm').reset();
        })
        .catch(error => console.error('Erro ao cadastrar campeonato:', error));
    }
});
