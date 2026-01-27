document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const idCombinado = params.get('id') || '1.1';

    // Parsear ID combinado (ex: "1.2" -> modulo=1, assunto=2)
    const [moduloNum, assuntoNum] = idCombinado.split('.').map(Number);
    
    const data = window.cursoData;
    const mod = data && data[moduloNum];
    const assunto = mod && mod.aulas && mod.aulas[assuntoNum - 1];

    console.log('ID:', idCombinado, 'Módulo:', moduloNum, 'Assunto:', assuntoNum, 'Dados:', assunto);
    
    const tituloPrincipal = document.querySelector('.assuntoSimulado');

    if (tituloPrincipal) {
        const textoAssunto = assunto ? assunto.titulo : 'Assunto não encontrado';
        tituloPrincipal.innerText = textoAssunto;
    }
});