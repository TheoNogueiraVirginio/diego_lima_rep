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
        e.EventPreventDefault();

        moduloId = modulo
}
)});