document.addEventListener('DOMContentLoaded', () => {
        const nomeSalvo = localStorage.getItem('nomeAluno');
        
        // 2. Busca o elemento HTML onde vamos escrever
        const elementoNome = document.getElementById('nome-aluno');

        if (nomeSalvo && elementoNome) {
            const primeiroNome = nomeSalvo.split(' ')[0].toLowerCase();
            const primeiroNomeOrganizado = primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1);
            
            elementoNome.textContent = primeiroNomeOrganizado;

            //FAZER TROÇO DO NOME COMPOSTO DEPOIS
        }
});



document.addEventListener('DOMContentLoaded', () => {
});
    // Accordion removed: subjects should display without toggling.
});


document.addEventListener('DOMContentLoaded', () => {
    const botoes = document.querySelectorAll('.btn-fazer-simulado');

    botoes.forEach(botao => {
        botao.addEventListener('click', () => {
            const idSimulado = botao.getAttribute('data-id');
            
            window.location.href = `questoes.html?id=${idSimulado}`;
    })});
});