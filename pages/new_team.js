document.getElementById('teamForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const nome = document.getElementById('nome').value;
    const jogador1 = document.getElementById('jogador1').value;
    const jogador2 = document.getElementById('jogador2').value;
    const jogador3 = document.getElementById('jogador3').value;

    const response = await fetch('http://lulinucs.duckdns.org:3001/create-team', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nome: nome,
            jogador1: jogador1,
            jogador2: jogador2,
            jogador3: jogador3
        })
    });

    const result = await response.json();
    const message = response.ok ? `Time criado com sucesso! ID: ${result.id}` : `Erro: ${result.detail}`;
    document.getElementById('responseMessage').textContent = message;
});
