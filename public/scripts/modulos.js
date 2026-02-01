document.addEventListener('DOMContentLoaded', () => {
    const nomeSalvo = localStorage.getItem('nomeAluno');
    const elementoNome = document.getElementById('nome-aluno');

    if (nomeSalvo && elementoNome) {
        const primeiroNome = nomeSalvo.split(' ')[0].toLowerCase();
        const primeiroNomeOrganizado = primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1);
        elementoNome.textContent = primeiroNomeOrganizado;
    }

    const modulos = document.querySelectorAll('.modulo');

    modulos.forEach(modulo => {
        modulo.addEventListener('click', (e) => {
            e.preventDefault();
            const moduloId = modulo.getAttribute('data-id');
            // Redirecionar para a página de materiais do módulo
            window.location.href = `materiais.html?id=${moduloId}`;
        });
    });

});
