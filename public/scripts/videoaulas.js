document.addEventListener('DOMContentLoaded', () => {
        const nomeSalvo = localStorage.getItem('nomeAluno');
        
        // 2. Busca o elemento HTML onde vou escrever
        const elementoNome = document.getElementById('nome-aluno');

        if (nomeSalvo && elementoNome) {
            const primeiroNome = nomeSalvo.split(' ')[0].toLowerCase();
            const primeiroNomeOrganizado = primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1);
            
            elementoNome.textContent = primeiroNomeOrganizado;

            //FAZER TROÇO DO NOME COMPOSTO DEPOIS
        }
    });


const modulos = document.querySelectorAll('.modulo');

modulos.forEach(modulo => {
    modulo.addEventListener('click', (e) => {
        e.preventDefault();

        // Pega o valor do atributo 'data-id' (1, 2, 3 ou 4)
        const moduloId = modulo.getAttribute('data-id');

        console.log(`Redirecionando para o Módulo ${moduloId}...`);
        
        // Redirecionar para o primeiro assunto do módulo (x.1)
        window.location.href = `assistir.html?id=${moduloId}.1`;
})});